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

export async function createArtist(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Handle photo upload
  const photoFile = formData.get("photo") as File | null;

  // Insert artist first (to get ID for photo path)
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
       created_by: user?.id,
     })
     .select()
     .single();

  if (error) throw error;

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
     })
     .eq("id", id);

  if (error) throw error;
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

// ═══════════════════════════════════════════
// INVITATIONS
// ═══════════════════════════════════════════

export async function createInvitation(nota?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const token = nanoid(21);

  const { error } = await supabase.from("invitations").insert({
    token,
    email: nota || null,
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
    .select("*")
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

  // Validate token
  const { data: invitation } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!invitation) {
    throw new Error("Token inválido o expirado");
  }

  // Handle photo upload
  const photoFile = formData.get("photo") as File | null;

  // Insert artist first (to get ID for photo path)
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
      instagram: (formData.get("instagram") as string) || null,
      tiktok: (formData.get("tiktok") as string) || null,
      youtube: (formData.get("youtube") as string) || null,
      spotify: (formData.get("spotify") as string) || null,
      website: (formData.get("website") as string) || null,
    })
    .select()
    .single();

  if (artistError) throw artistError;

  // Upload photo if provided
  if (photoFile && photoFile.size > 0) {
    const uploadedUrl = await uploadArtistPhoto(photoFile, artistData.id);
    if (uploadedUrl) {
      // Update artist with photo URL
      await supabase
        .from("artists")
        .update({ photo: uploadedUrl })
        .eq("id", artistData.id);
    }
  }

  // Mark token as used
  const { error: tokenError } = await supabase
    .from("invitations")
    .update({ used_at: new Date().toISOString() })
    .eq("token", token);

  if (tokenError) throw tokenError;

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
 * Verifica una insignia reclamada por un artista.
 *
 * Hacen falta las dos claves porque artist_tags no tiene id propio: su PK es
 * (artist_id, tag_id).
 */
export async function approveBadgeClaim(
  artistId: string,
  tagId: string,
): Promise<TagActionResult> {
  const { supabase, denied } = await requireTagAdmin();
  if (denied) return { success: false, error: denied };

  const { error } = await supabase
    .from("artist_tags")
    .update({ status: "approved" })
    .eq("artist_id", artistId)
    .eq("tag_id", tagId);

  if (error) return { success: false, error: error.message };
  revalidateTagPaths();
  return { success: true };
}

/**
 * Marca la reclamacion como 'rejected' en vez de borrar la fila: asi el artista
 * no puede volver a reclamar la misma insignia en bucle y queda rastro de la
 * decision. El CHECK artist_tags_status_check ya contempla este valor.
 */
export async function rejectBadgeClaim(
  artistId: string,
  tagId: string,
): Promise<TagActionResult> {
  const { supabase, denied } = await requireTagAdmin();
  if (denied) return { success: false, error: denied };

  const { error } = await supabase
    .from("artist_tags")
    .update({ status: "rejected" })
    .eq("artist_id", artistId)
    .eq("tag_id", tagId);

  if (error) return { success: false, error: error.message };
  revalidateTagPaths();
  return { success: true };
}

/**
 * Alta de tag por el admin. Siempre `is_official: true`.
 *
 * No es una preferencia: el CHECK `tags_badge_always_official` prohibe una
 * insignia no oficial, y para el resto de kinds no tiene sentido que el admin
 * cree algo pendiente de su propia aprobacion. Las propuestas de artistas
 * entran por la RPC propose_tag(), nunca por aqui.
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
 * Vale igual para insignias: `archived_at` es independiente de `is_official`,
 * asi que archivar un badge no choca con el CHECK tags_badge_always_official
 * (que solo prohibe is_official = false cuando kind = 'badge').
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

