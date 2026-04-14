import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "artist-photos";

/**
 * Upload an artist photo to Supabase Storage.
 * Uses admin client to bypass RLS (needed for anon token registration).
 * Returns the public URL on success, null on failure.
 */
export async function uploadArtistPhoto(
  file: File,
  artistId: string
): Promise<string | null> {
  // Use admin client to bypass RLS (artist registration is anon)
  const supabase = createAdminClient();

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${artistId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    console.error("[storage] Upload error:", error.message);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Get the public URL for an artist photo path.
 */
export function getPublicUrl(path: string): string {
  // Build URL without needing async client
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${baseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
}

/**
 * Delete an artist's photo from storage.
 * Returns true on success, false on failure.
 */
export async function deleteArtistPhoto(photoUrl: string): Promise<boolean> {
  if (!photoUrl) return false;

  const supabase = createAdminClient();
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  // Extract path from URL
  // URL format: https://xxx.supabase.co/storage/v1/object/public/artist-photos/{path}
  const path = photoUrl.replace(`${baseUrl}/storage/v1/object/public/${BUCKET}/`, "");

  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) {
    console.error("[storage] Delete error:", error.message);
    return false;
  }

  return true;
}
