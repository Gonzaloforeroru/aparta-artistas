import type { Tables } from "@/lib/supabase/database.types";

type Artist = Tables<"artists">;

/**
 * Check if an artist profile has all required fields filled.
 * This is a pure function — NOT a server action.
 * Required: name, city, type, genre, phone, price (>0), duration.
 */
export function isProfileComplete(artist: Artist): boolean {
  if (!artist.name || artist.name.trim() === "") return false;
  if (!artist.city || artist.city.trim() === "") return false;
  if (!artist.type || artist.type.trim() === "") return false;
  if (!artist.genre || artist.genre.trim() === "") return false;
  if (!artist.phone || artist.phone.trim() === "") return false;
  if (!artist.duration || artist.duration.trim() === "") return false;
  if (artist.price == null || artist.price <= 0) return false;

  return true;
}
