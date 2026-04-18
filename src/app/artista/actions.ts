"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadArtistPhoto, deleteArtistPhoto } from "@/lib/supabase/storage";
import type { Tables } from "@/lib/supabase/database.types";
import type { ArtistType, Genre } from "@/lib/supabase/database.types";

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

  // Extract ONLY allowed fields from formData
  const { error: updateError } = await supabase
    .from("artists")
    .update({
      name: formData.get("name") as string,
      city: formData.get("city") as string,
      type: formData.get("type") as ArtistType,
      genre: formData.get("genre") as Genre,
      phone: formData.get("phone") as string,
      price: parseInt(formData.get("price") as string) || 0,
      duration: formData.get("duration") as string,
      instagram: (formData.get("instagram") as string) || null,
      tiktok: (formData.get("tiktok") as string) || null,
      youtube: (formData.get("youtube") as string) || null,
      spotify: (formData.get("spotify") as string) || null,
      photo: photoUrl,
    })
    .eq("user_id", user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath("/artista");
  return { success: true };
}


