import { createClient } from "@/lib/supabase/server";

export type Association = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  logoUrl: string | null;
  active: boolean;
  createdAt: string;
  artistCount: number;
};

type AssociationRow = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  logo_url: string | null;
  active: boolean;
  created_at: string;
  artists: { count: number }[];
};

/**
 * Todas las asociaciones, ordenadas por nombre, con el nº de artistas que
 * tienen esa asociación asignada (agregado embebido `artists(count)`).
 */
export async function getAssociations(): Promise<Association[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("associations")
    .select("id, name, slug, color, logo_url, active, created_at, artists(count)")
    .order("name", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as unknown as AssociationRow[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    color: row.color,
    logoUrl: row.logo_url,
    active: row.active,
    createdAt: row.created_at,
    artistCount: row.artists?.[0]?.count ?? 0,
  }));
}
