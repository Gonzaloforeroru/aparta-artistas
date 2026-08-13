"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nanoid } from "nanoid";
import { uploadArtistPhoto, deleteArtistPhoto } from "@/lib/supabase/storage";
import type { ArtistStatus } from "@/lib/supabase/database.types";
import type { TagKind } from "@/lib/queries/tags";

// ═══════════════════════════════════════════
// ARTIST CRUD
// ═══════════════════════════════════════════

/**
 * Sincroniza artist_tags de tipo y género desde las columnas espejo del artista.
 *
 * El admin rellena `artists.type` y `artists.genre` como texto;
 * esta función busca el tag oficial correspondiente por slug y lo inserta
 * en `artist_tags` con `source: 'admin'`, `status: 'approved'`.
 *
 * Si el tag no existe en el catálogo, simplemente no se inserta.
 *
 * En modo update borra primero las etiquetas con `source = 'admin'` de
 * kinds `artist_type` y `genre`, sin tocar las de `source = 'self'`.
 */
async function syncAdminArtistTags(
  supabase: Awaited<ReturnType<typeof createClient>>,
  artistId: string,
  type: string | null,
  genre: string | null,
  isUpdate: boolean,
) {
  if (isUpdate) {
    const { data: existing } = await supabase
      .from("artist_tags")
      .select("tag_id, tags!inner(kind)")
      .eq("artist_id", artistId)
      .eq("source", "admin")
      .in("tags.kind", ["artist_type", "genre"]);

    if (existing?.length) {
      await supabase
        .from("artist_tags")
        .delete()
        .eq("artist_id", artistId)
        .eq("source", "admin")
        .in(
          "tag_id",
          existing.map((r) => r.tag_id),
        );
    }
  }

  const tagIds: string[] = [];

  for (const [value, kind] of [
    [type, "artist_type"],
    [genre, "genre"],
  ] as [string | null, string][]) {
    if (!value) continue;

    const { data: slugData } = await supabase.rpc("slugify", {
      p_text: value,
    });
    if (!slugData) continue;

    const { data: tag } = await supabase
      .from("tags")
      .select("id")
      .eq("kind", kind)
      .eq("slug", slugData as string)
      .single();

    if (tag) tagIds.push(tag.id);
  }

  if (tagIds.length > 0) {
    await supabase.from("artist_tags").upsert(
      tagIds.map((tagId) => ({
        artist_id: artistId,
        tag_id: tagId,
        source: "admin",
        status: "approved",
      })),
      { ignoreDuplicates: true },
    );
  }
}

export async function createArtist(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Handle photo upload
  const photoFile = formData.get("photo") as File | null;

  // Insert artist first (to get ID for photo path)
  // association_id: "none" o vacío => sin asociación; UUID válido => asignar
  const rawAssocCreate = formData.get("association_id") as string | null;
  const assocIdCreate =
    rawAssocCreate && rawAssocCreate !== "none" ? rawAssocCreate : null;

   const { data: artistData, error } = await supabase
     .from("artists")
     .insert({
       name: formData.get("name") as string,
       email: (formData.get("email") as string) || null,
       city: formData.get("city") as string,
       type: formData.get("type") as string,
       genre: formData.get("genre") as string,
       phone: formData.get("phone") as string,
       price: parseInt(formData.get("price") as string) || 0,
       duration: formData.get("duration") as string,
       status: (formData.get("status") as ArtistStatus) ?? "Aprobado",
       instagram: (formData.get("instagram") as string) || null,
       tiktok: (formData.get("tiktok") as string) || null,
       youtube: (formData.get("youtube") as string) || null,
       spotify: (formData.get("spotify") as string) || null,
       website: (formData.get("website") as string) || null,
       association_id: assocIdCreate,
       created_by: user?.id,
     })
     .select()
     .single();

  if (error) throw error;

  // Sincronizar artist_tags de tipo y género
  await syncAdminArtistTags(
    supabase,
    artistData.id,
    formData.get("type") as string | null,
    formData.get("genre") as string | null,
    false,
  );

  // Upload photo if provided
  if (photoFile && photoFile.size > 0) {
    const uploadedUrl = await uploadArtistPhoto(photoFile, artistData.id);
    if (uploadedUrl) {
      await supabase
        .from("artists")
        .update({ photo: uploadedUrl })
        .eq("id", artistData.id);
    }
  }

  revalidatePath("/admin/lista");
  revalidatePath("/catalogo");
}

export async function updateArtist(id: string, formData: FormData) {
  const supabase = await createClient();

  // Get current artist to preserve existing photo
  const { data: currentArtist } = await supabase
    .from("artists")
    .select("photo")
    .eq("id", id)
    .single();

  // Handle photo deletion
  const shouldDeletePhoto = formData.get("deletePhoto") === "true";
  const photoFile = formData.get("photo") as File | null;
  let photoUrl: string | null = currentArtist?.photo ?? null;

  if (shouldDeletePhoto) {
    // Delete photo permanently from storage
    if (currentArtist?.photo) {
      await deleteArtistPhoto(currentArtist.photo);
    }
    photoUrl = null;
  } else if (photoFile && photoFile.size > 0) {
    // Upload new photo if provided
    if (currentArtist?.photo) {
      await deleteArtistPhoto(currentArtist.photo);
    }
    const uploadedUrl = await uploadArtistPhoto(photoFile, id);
    if (uploadedUrl) {
      photoUrl = uploadedUrl;
    }
  }

  // association_id: "none" o vacío => quitar asociación; UUID válido => asignar
  const rawAssociation = formData.get("association_id") as string | null;
  const associationId =
    rawAssociation && rawAssociation !== "none" ? rawAssociation : null;

   const { error } = await supabase
     .from("artists")
     .update({
       name: formData.get("name") as string,
       email: (formData.get("email") as string) || null,
       city: formData.get("city") as string,
       type: formData.get("type") as string,
       genre: formData.get("genre") as string,
       phone: formData.get("phone") as string,
       price: parseInt(formData.get("price") as string) || 0,
       duration: formData.get("duration") as string,
       status: formData.get("status") as ArtistStatus,
       instagram: (formData.get("instagram") as string) || null,
       tiktok: (formData.get("tiktok") as string) || null,
       youtube: (formData.get("youtube") as string) || null,
       spotify: (formData.get("spotify") as string) || null,
       website: (formData.get("website") as string) || null,
       photo: photoUrl,
       association_id: associationId,
     })
           .eq("id", id);

  if (error) throw error;

  // Sincronizar artist_tags de tipo y género
  await syncAdminArtistTags(
    supabase,
    id,
    formData.get("type") as string | null,
    formData.get("genre") as string | null,
    true,
  );

  revalidatePath("/admin/lista");
  revalidatePath("/catalogo");
}

export async function removeArtistPhoto(id: string) {
  const supabase = await createClient();

  const { data: artist } = await supabase
    .from("artists")
    .select("photo")
    .eq("id", id)
    .single();

  if (artist?.photo) {
    await deleteArtistPhoto(artist.photo);
  }

  const { error } = await supabase
    .from("artists")
    .update({ photo: null })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/lista");
  revalidatePath("/catalogo");
}

export async function deleteArtist(id: string) {
  const supabase = await createClient();

  // Get artist photo before deleting
  const { data: artist } = await supabase
    .from("artists")
    .select("photo")
    .eq("id", id)
    .single();

  // Delete photo from storage if exists
  if (artist?.photo) {
    await deleteArtistPhoto(artist.photo);
  }

  // Hard delete: permanently remove from database
  const { error } = await supabase
    .from("artists")
    .delete()
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/lista");
  revalidatePath("/catalogo");
}

export async function toggleArtistActive(id: string, active: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("artists")
    .update({ active })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/lista");
}

export async function approveArtist(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("artists")
    .update({
      status: "Aprobado" as ArtistStatus,
      approved_by: user?.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/aprobaciones");
  revalidatePath("/admin/lista");
  revalidatePath("/catalogo");
}

export async function rejectArtist(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("artists")
    .update({
      status: "Rechazado" as ArtistStatus,
      approved_by: user?.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/aprobaciones");
  revalidatePath("/admin/lista");
}

/**
 * Asigna o quita la asociación de un artista.
 *
 * Se usa desde la tabla de artistas en /admin/lista como acción rápida, sin
 * navegar al formulario completo de edición.
 */
export async function updateArtistAssociation(
  artistId: string,
  associationId: string | null,
): Promise<AssociationActionResult> {
  const { supabase, denied } = await requireAssociationAdmin();
  if (denied) return { success: false, error: denied };

  const { error } = await supabase
    .from("artists")
    .update({ association_id: associationId })
    .eq("id", artistId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/lista");
  revalidatePath("/catalogo");
  return { success: true };
}

// ═══════════════════════════════════════════
// INVITATIONS
// ═══════════════════════════════════════════

export async function createInvitation(input: {
  kind: "personal" | "campaign";
  label?: string;
  associationId?: string | null;
  days: number;
  maxUses?: number | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const token = nanoid(21);
  const expiresAt = new Date(
    Date.now() + input.days * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase.from("invitations").insert({
    token,
    kind: input.kind,
    label: input.label || null,
    email: input.label || null,
    association_id: input.associationId || null,
    max_uses: input.kind === "campaign" ? (input.maxUses ?? null) : 1,
    expires_at: expiresAt,
    created_by: user.id,
  });

  if (error) throw error;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const link = `${baseUrl}/registro/${token}`;

  revalidatePath("/admin/invitaciones");
  return { token, link };
}

export async function getInvitations() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invitations")
    .select("*, associations(id, name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// ═══════════════════════════════════════════
// CSV IMPORT
// ═══════════════════════════════════════════

interface ArtistImportRow {
  name: string;
  email: string;
  city: string;
  // text desde 20260811230000: el CSV puede traer cualquier formato o genero
  // del catalogo, no solo los del enum viejo.
  type: string;
  genre: string;
  phone: string;
  price: number;
  duration: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  spotify?: string;
  website?: string;
}

export async function importArtists(rows: ArtistImportRow[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const insertData = rows.map((row) => ({
    ...row,
    status: "Aprobado" as ArtistStatus,
    active: true,
    created_by: user?.id,
  }));

  const { data, error } = await supabase
    .from("artists")
    .insert(insertData)
    .select();

  if (error) throw error;

  // Sincronizar artist_tags de tipo y género para cada artista importado
  for (const artist of data) {
    await syncAdminArtistTags(
      supabase,
      artist.id,
      artist.type,
      artist.genre,
      false,
    );
  }

  revalidatePath("/admin/lista");
  revalidatePath("/admin/metricas");
  revalidatePath("/catalogo");

  return { count: data.length };
}

// ═══════════════════════════════════════════
// ARTIST REGISTRATION (anon — via token)
// ═══════════════════════════════════════════

export async function registerArtistWithToken(token: string, formData: FormData) {
  // Use admin client to bypass RLS (anon users can't insert directly due to policy issues)
  const supabase = createAdminClient();

  // Redeem token atomically via RPC — this is the ONLY correct way to consume
  // a use. It validates, increments uses_count, and returns association_id in a
  // single transaction so there is no race condition on multi-use tokens.
  const { data: redeemResult, error: redeemError } = await supabase.rpc(
    "redeem_invitation",
    { p_token: token },
  );

  if (redeemError) throw new Error("Error al canjear la invitación");

  const row = Array.isArray(redeemResult) ? redeemResult[0] : redeemResult;

  if (!row?.ok) {
    const messages: Record<string, string> = {
      not_found: "El enlace de invitación no existe.",
      expired: "El enlace de invitación ha caducado.",
      already_used: "Este enlace de invitación ya fue utilizado.",
      exhausted: "Este enlace de invitación ha agotado su cupo.",
    };
    throw new Error(messages[row?.reason] ?? "Token inválido o expirado");
  }

  // Handle photo upload
  const photoFile = formData.get("photo") as File | null;

  // Insert artist with association_id from the redeemed invitation
  const { data: artistData, error: artistError } = await supabase
    .from("artists")
    .insert({
      name: formData.get("name") as string,
      city: formData.get("city") as string,
      type: formData.get("type") as string,
      genre: formData.get("genre") as string,
      phone: formData.get("phone") as string,
      price: parseInt(formData.get("price") as string) || 0,
      duration: formData.get("duration") as string,
      status: "Pendiente" as ArtistStatus,
      invitation_token: token,
      association_id: row.association_id || null,
      instagram: (formData.get("instagram") as string) || null,
      tiktok: (formData.get("tiktok") as string) || null,
      youtube: (formData.get("youtube") as string) || null,
      spotify: (formData.get("spotify") as string) || null,
      website: (formData.get("website") as string) || null,
    })
    .select()
    .single();

  if (artistError) throw artistError;

  // Sincronizar artist_tags de tipo y género
  await syncAdminArtistTags(
    supabase,
    artistData.id,
    formData.get("type") as string | null,
    formData.get("genre") as string | null,
    false,
  );

  // Upload photo if provided
  if (photoFile && photoFile.size > 0) {
    const uploadedUrl = await uploadArtistPhoto(photoFile, artistData.id);
    if (uploadedUrl) {
      await supabase
        .from("artists")
        .update({ photo: uploadedUrl })
        .eq("id", artistData.id);
    }
  }

  revalidatePath("/admin/aprobaciones");
  revalidatePath("/admin/invitaciones");
}

// ═══════════════════════════════════════════
// TAG MANAGEMENT
// ═══════════════════════════════════════════

export type TagActionResult = { success: true } | { success: false; error: string };

/** Verifica que el usuario actual es admin. Uso interno. */
async function requireTagAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, userId: "", denied: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin")
    return { supabase, userId: user.id, denied: "Acceso denegado" };

  return { supabase, userId: user.id, denied: null };
}

/**
 * Un tag cambiado no solo afecta al catalogo publico: los dos formularios del
 * artista pintan sus selectores desde getOfficialTags(), asi que si no se
 * revalidan siguen ofreciendo un tag ya archivado (o escondiendo uno recien
 * aprobado) hasta que caduque su cache.
 */
function revalidateTagPaths() {
  revalidatePath("/admin/tags");
  revalidatePath("/catalogo");
  revalidatePath("/artista/completar");
  revalidatePath("/artista/editar");
}

export async function approveTag(tagId: string): Promise<TagActionResult> {
  const { supabase, denied } = await requireTagAdmin();
  if (denied) return { success: false, error: denied };

  const { error } = await supabase
    .from("tags")
    .update({ is_official: true })
    .eq("id", tagId);

  if (error) return { success: false, error: error.message };
  revalidateTagPaths();
  return { success: true };
}

/**
 * Rechazar = archivar, no borrar.
 *
 * `artist_tags.tag_id` es ON DELETE CASCADE: un DELETE se llevaria por delante
 * el tag de todos los artistas que ya lo usan, en silencio y sin vuelta atras.
 * Se conserva is_official = false y se marca archived_at, con lo que el tag
 * desaparece del catalogo publico y de la cola (getPendingTags filtra por
 * archived_at is null), pero la decision es reversible con unarchiveTag.
 */
export async function rejectTag(tagId: string): Promise<TagActionResult> {
  const { supabase, denied } = await requireTagAdmin();
  if (denied) return { success: false, error: denied };

  const { error } = await supabase
    .from("tags")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", tagId);

  if (error) return { success: false, error: error.message };
  revalidateTagPaths();
  return { success: true };
}

/**
 * Alta de tag por el admin. Siempre `is_official: true`.
 *
 * No tiene sentido que el admin cree algo pendiente de su propia aprobacion.
 * Las propuestas de artistas entran por la RPC propose_tag(), nunca por aqui.
 *
 * El slug lo calcula la funcion slugify() de la base y no una copia en TS para
 * que sea identico al que genera propose_tag(): dos implementaciones distintas
 * acabarian creando duplicados que el UNIQUE (kind, slug) no llega a detectar.
 */
export async function createTag(input: {
  kind: TagKind;
  name: string;
  color?: string | null;
  sortOrder?: number;
}): Promise<TagActionResult> {
  const { supabase, userId, denied } = await requireTagAdmin();
  if (denied) return { success: false, error: denied };

  const trimmed = input.name.trim();
  // El CHECK tags_name_check exige entre 2 y 40 caracteres. Se valida aqui para
  // devolver algo legible en vez de un 23514 crudo de Postgres.
  if (trimmed.length < 2 || trimmed.length > 40)
    return { success: false, error: "El nombre debe tener entre 2 y 40 caracteres." };

  const { data: slugData, error: slugError } = await supabase.rpc("slugify", {
    p_text: trimmed,
  });
  if (slugError || !slugData)
    return {
      success: false,
      error: slugError?.message ?? `"${trimmed}" no produce un identificador valido.`,
    };

  const { error } = await supabase.from("tags").insert({
    kind: input.kind,
    name: trimmed,
    slug: slugData as string,
    color: input.color ?? null,
    sort_order: input.sortOrder ?? 0,
    is_official: true,
    created_by: userId,
  });

  if (error) {
    // 23505 = UNIQUE (kind, slug). Es el caso corriente (el admin teclea algo
    // que ya existe, o una variante que slugify normaliza al mismo slug), no un
    // fallo del sistema, y merece un mensaje que se entienda.
    if (error.code === "23505")
      return { success: false, error: `Ya existe un tag "${trimmed}" en esa categoria.` };
    return { success: false, error: error.message };
  }

  revalidateTagPaths();
  return { success: true };
}

/**
 * Renombra un tag SIN tocar su slug.
 *
 * El slug es identidad publica, no decoracion: `catalogo-content.tsx` lo mete
 * en la query string al filtrar (`?type=<slug>&genre=<slug>`). Regenerarlo al
 * renombrar romperia en silencio cualquier enlace de catalogo compartido o
 * guardado, y ademas podria chocar con el UNIQUE (kind, slug) de otro tag.
 * Se acepta que el slug quede "desfasado" respecto al nombre: es el precio de
 * que los enlaces sigan funcionando.
 */
export async function renameTag(
  tagId: string,
  name: string,
): Promise<TagActionResult> {
  const { supabase, denied } = await requireTagAdmin();
  if (denied) return { success: false, error: denied };

  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 40)
    return { success: false, error: "El nombre debe tener entre 2 y 40 caracteres." };

  const { error } = await supabase
    .from("tags")
    .update({ name: trimmed })
    .eq("id", tagId);

  if (error) return { success: false, error: error.message };
  revalidateTagPaths();
  return { success: true };
}

export async function updateTagPresentation(
  tagId: string,
  input: { color?: string | null; sortOrder?: number },
): Promise<TagActionResult> {
  const { supabase, denied } = await requireTagAdmin();
  if (denied) return { success: false, error: denied };

  const update: Record<string, string | number | null> = {};
  if (input.color !== undefined) update.color = input.color ?? null;
  if (input.sortOrder !== undefined) update.sort_order = input.sortOrder;

  if (Object.keys(update).length === 0) return { success: true };

  const { error } = await supabase
    .from("tags")
    .update(update)
    .eq("id", tagId);

  if (error) return { success: false, error: error.message };
  revalidateTagPaths();
  return { success: true };
}

/**
 * Archiva un tag: sale del catalogo publico y de los formularios, pero sus
 * asociaciones en artist_tags sobreviven intactas.
 *
 * Archivar es reversible con unarchiveTag, a diferencia de borrar: el CASCADE
 * de artist_tags.tag_id se llevaria el tag de todos los artistas que lo usan.
 */
export async function archiveTag(tagId: string): Promise<TagActionResult> {
  const { supabase, denied } = await requireTagAdmin();
  if (denied) return { success: false, error: denied };

  const { error } = await supabase
    .from("tags")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", tagId);

  if (error) return { success: false, error: error.message };
  revalidateTagPaths();
  return { success: true };
}

export async function unarchiveTag(tagId: string): Promise<TagActionResult> {
  const { supabase, denied } = await requireTagAdmin();
  if (denied) return { success: false, error: denied };

  const { error } = await supabase
    .from("tags")
    .update({ archived_at: null })
    .eq("id", tagId);

  if (error) return { success: false, error: error.message };
  revalidateTagPaths();
  return { success: true };
}

// ═══════════════════════════════════════════
// ASSOCIATION MANAGEMENT
// ═══════════════════════════════════════════

export type AssociationActionResult =
  | { success: true }
  | { success: false; error: string };

/** Reutiliza el mismo guard de admin que los tags. */
async function requireAssociationAdmin() {
  return requireTagAdmin();
}

function revalidateAssociationPaths() {
  revalidatePath("/admin/asociaciones");
  revalidatePath("/catalogo");
}

export async function createAssociation(input: {
  name: string;
  shortName?: string | null;
  color?: string | null;
}): Promise<AssociationActionResult> {
  const { supabase, userId, denied } = await requireAssociationAdmin();
  if (denied) return { success: false, error: denied };

  const trimmed = input.name.trim();
  if (trimmed.length < 2 || trimmed.length > 100)
    return { success: false, error: "El nombre debe tener entre 2 y 100 caracteres." };

  // Sigla: recortar espacios; si queda vacío guardar null.
  // El CHECK de la base exige entre 1 y 12 caracteres si no es null.
  const shortName = input.shortName?.trim() || null;
  if (shortName && shortName.length > 12)
    return { success: false, error: "La sigla no puede tener más de 12 caracteres." };

  const { data: slugData, error: slugError } = await supabase.rpc("slugify", {
    p_text: trimmed,
  });
  if (slugError || !slugData)
    return {
      success: false,
      error: slugError?.message ?? `"${trimmed}" no produce un identificador válido.`,
    };

  const { error } = await supabase.from("associations").insert({
    name: trimmed,
    slug: slugData as string,
    short_name: shortName,
    color: input.color ?? null,
    created_by: userId,
  });

  if (error) {
    if (error.code === "23505")
      return { success: false, error: `Ya existe una asociación "${trimmed}".` };
    return { success: false, error: error.message };
  }

  revalidateAssociationPaths();
  return { success: true };
}

/**
 * Renombra una asociación SIN tocar su slug (mismo razonamiento que renameTag).
 */
export async function renameAssociation(
  id: string,
  name: string,
): Promise<AssociationActionResult> {
  const { supabase, denied } = await requireAssociationAdmin();
  if (denied) return { success: false, error: denied };

  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 100)
    return { success: false, error: "El nombre debe tener entre 2 y 100 caracteres." };

  const { error } = await supabase
    .from("associations")
    .update({ name: trimmed })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidateAssociationPaths();
  return { success: true };
}

export async function updateAssociationPresentation(
  id: string,
  input: { shortName?: string | null; color?: string | null  },
): Promise<AssociationActionResult> {
  const { supabase, denied } = await requireAssociationAdmin();
  if (denied) return { success: false, error: denied };

  const update: Record<string, string | null> = {};

  if (input.shortName !== undefined) {
    const sn = input.shortName?.trim() || null;
    if (sn && sn.length > 12)
      return { success: false, error: "La sigla no puede tener más de 12 caracteres." };
    update.short_name = sn;
  }
  if (input.color !== undefined) update.color = input.color ?? null;

  if (Object.keys(update).length === 0) return { success: true };

  const { error } = await supabase
    .from("associations")
    .update(update)
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidateAssociationPaths();
  return { success: true };
}

export async function toggleAssociationActive(
  id: string,
  active: boolean,
): Promise<AssociationActionResult> {
  const { supabase, denied } = await requireAssociationAdmin();
  if (denied) return { success: false, error: denied };

  const { error } = await supabase
    .from("associations")
    .update({ active })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidateAssociationPaths();
  return { success: true };
}

/**
 * Borra una asociación SOLO si no tiene artistas ligados.
 *
 * `artists.association_id` es ON DELETE SET NULL: un borrado a secas dejaría a
 * esos artistas sin insignia en silencio y sin forma de saber a quién
 * pertenecían. Se comprueba primero y se rechaza con mensaje legible.
 */
export async function deleteAssociation(
  id: string,
): Promise<AssociationActionResult> {
  const { supabase, denied } = await requireAssociationAdmin();
  if (denied) return { success: false, error: denied };

  // Contar artistas ligados a esta asociación
  const { count, error: countError } = await supabase
    .from("artists")
    .select("id", { count: "exact", head: true })
    .eq("association_id", id);

  if (countError) return { success: false, error: countError.message };

  if (count && count > 0) {
    const noun = count === 1 ? "artista ligado" : "artistas ligados";
    return {
      success: false,
      error: `No se puede borrar: tiene ${count} ${noun}. Quítasela primero o desactívala.`,
    };
  }

  const { error } = await supabase
    .from("associations")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidateAssociationPaths();
  return { success: true };
}

