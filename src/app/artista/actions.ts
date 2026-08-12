"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadArtistPhoto, deleteArtistPhoto } from "@/lib/supabase/storage";
import type { Tables } from "@/lib/supabase/database.types";

// ═══════════════════════════════════════════
// ARTIST PROFILE (self-service, respects RLS)
// ═══════════════════════════════════════════

export type Artist = Tables<"artists">;

/**
 * Fetch the current authenticated user's artist profile.
 * Returns the artist record or null if not found / not authenticated.
 */
export async function getMyArtistProfile(): Promise<Artist | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) return null;
  return data;
}

/**
 * Update the current authenticated user's artist profile.
 * Only allowed fields are extracted from formData — protected fields
 * (status, active, approved_by, approved_at, created_by, email, user_id) are ignored.
 */
export async function updateMyArtistProfile(
  formData: FormData
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  // Get current artist to check photo
  const { data: currentArtist, error: fetchError } = await supabase
    .from("artists")
    .select("id, photo")
    .eq("user_id", user.id)
    .single();

  if (fetchError || !currentArtist) {
    return { success: false, error: "Perfil de artista no encontrado" };
  }

  // Handle photo upload
  const photoFile = formData.get("photo") as File | null;
  let photoUrl: string | null = currentArtist.photo;

  if (photoFile && photoFile.size > 0) {
    // Delete old photo first to free storage space
    if (currentArtist.photo) {
      await deleteArtistPhoto(currentArtist.photo);
    }
    const uploadedUrl = await uploadArtistPhoto(photoFile, currentArtist.id);
    if (uploadedUrl) {
      photoUrl = uploadedUrl;
    }
  }

  /**
   * El municipio llega como codigo DANE desde un <input hidden>, asi que se
   * comprueba contra la tabla antes de guardarlo: el FK lo rechazaria igual,
   * pero con un mensaje de Postgres que no le dice nada al artista.
   *
   * El nombre se toma de la BD, no del formulario, para que artists.city no
   * pueda quedar diciendo algo distinto al codigo que tiene al lado.
   */
  const municipalityCode =
    (formData.get("municipality_code") as string) || null;
  let cityName = (formData.get("city") as string) || "";

  if (municipalityCode) {
    const { data: municipality } = await supabase
      .from("municipalities")
      .select("name")
      .eq("code", municipalityCode)
      .maybeSingle();

    if (!municipality) {
      return { success: false, error: "El municipio seleccionado no es válido" };
    }
    cityName = municipality.name;
  }

  /**
   * Los tags son ahora la unica fuente de verdad: el formulario ya no tiene los
   * desplegables de Profesion y Genero Musical, que preguntaban lo mismo por
   * segunda vez y podian acabar contradiciendo a los chips.
   *
   * `artists.type` y `artists.genre` siguen existiendo porque el catalogo, el
   * admin y la importacion CSV los leen, asi que se rellenan aqui a partir del
   * primer tag elegido de cada categoria. Son un espejo, no un dato que el
   * artista teclee.
   */
  const EDITABLE_KINDS = ["artist_type", "genre", "profession"] as const;

  const submittedIds = EDITABLE_KINDS.flatMap((kind) =>
    ((formData.get(`tags_${kind}`) as string) || "").split(",").filter(Boolean),
  );

  const { data: validTags } = await supabase
    .from("tags")
    .select("id, kind, name")
    .in("kind", [...EDITABLE_KINDS])
    .in(
      "id",
      submittedIds.length > 0
        ? submittedIds
        : ["00000000-0000-0000-0000-000000000000"],
    );

  const validIds = new Set((validTags ?? []).map((t) => t.id));

  /**
   * Espejo de artist_tags en las columnas viejas.
   *
   * Antes habia que filtrar el tag contra la lista del ENUM y, si no encajaba,
   * se conservaba el valor anterior: por eso un artista de Champeta seguia
   * figurando como "Vallenato" en el catalogo y en las metricas. Desde
   * 20260811230000 las columnas son `text`, asi que se copia el nombre del tag
   * tal cual y dejan de mentir.
   */
  const firstOfKind = (kind: string) =>
    (validTags ?? []).find((t) => t.kind === kind)?.name;

  const legacyType = firstOfKind("artist_type");
  const legacyGenre = firstOfKind("genre");

  // Extract ONLY allowed fields from formData
  const { error: updateError } = await supabase
    .from("artists")
    .update({
      name: formData.get("name") as string,
      city: cityName,
      municipality_code: municipalityCode,
      ...(legacyType ? { type: legacyType } : {}),
      ...(legacyGenre ? { genre: legacyGenre } : {}),
      phone: formData.get("phone") as string,
      price: parseInt(formData.get("price") as string) || 0,
      duration: formData.get("duration") as string,
      instagram: (formData.get("instagram") as string) || null,
      tiktok: (formData.get("tiktok") as string) || null,
      youtube: (formData.get("youtube") as string) || null,
      spotify: (formData.get("spotify") as string) || null,
      website: (formData.get("website") as string) || null,
      photo: photoUrl,
    })
    .eq("user_id", user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  /**
   * Sincroniza los tags elegidos.
   *
   * Solo se tocan los kinds editables por el artista: las insignias (`badge`)
   * las concede el admin y se reclaman aparte, asi que si alguien mete a mano
   * un id de badge en el formulario, el filtro por kind lo descarta antes de
   * llegar a la BD.
   *
   * Se borra y se inserta solo la diferencia, en vez de "delete all + insert":
   * asi no se pierde el created_at ni el source de lo que ya estaba.
   */
  const { data: currentRows } = await supabase
    .from("artist_tags")
    .select("tag_id, tags!inner(kind)")
    .eq("artist_id", currentArtist.id)
    .in("tags.kind", [...EDITABLE_KINDS]);

  const currentIds = new Set((currentRows ?? []).map((r) => r.tag_id));

  const toRemove = [...currentIds].filter((id) => !validIds.has(id));
  const toAdd = [...validIds].filter((id) => !currentIds.has(id));

  if (toRemove.length > 0) {
    await supabase
      .from("artist_tags")
      .delete()
      .eq("artist_id", currentArtist.id)
      .in("tag_id", toRemove);
  }

  if (toAdd.length > 0) {
    const { error: tagError } = await supabase.from("artist_tags").insert(
      toAdd.map((tagId) => ({
        artist_id: currentArtist.id,
        tag_id: tagId,
        source: "self",
        status: "approved",
      })),
    );
    if (tagError) {
      return { success: false, error: `No se pudieron guardar los tags: ${tagError.message}` };
    }
  }

  revalidatePath("/artista", "layout");
  return { success: true };
}


