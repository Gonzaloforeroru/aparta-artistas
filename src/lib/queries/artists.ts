import { createClient } from "@/lib/supabase/server";

export async function getApprovedArtists() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .eq("status", "Aprobado")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAllArtists() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getPendingArtists() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .eq("status", "Pendiente")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getArtistById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function getArtistStats() {
  const supabase = await createClient();
  const { data: artists, error } = await supabase
    .from("artists")
    .select("*");

  if (error) throw error;

  const total = artists.length;
  const active = artists.filter((a) => a.active).length;
  const pending = artists.filter((a) => a.status === "Pendiente").length;
  const avgPrice =
    total > 0
      ? Math.round(artists.reduce((sum, a) => sum + a.price, 0) / total)
      : 0;

  return { total, active, pending, avgPrice, artists };
}

export async function getPendingCount() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("artists")
    .select("*", { count: "exact", head: true })
    .eq("status", "Pendiente");

  if (error) return 0;
  return count ?? 0;
}
