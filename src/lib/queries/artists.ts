import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import type { TagKind } from "@/lib/queries/tags";

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

/**
 * Catalogo publico con los tags ya resueltos.
 *
 * Se trae en un solo select anidado en vez de N+1: RLS sobre artist_tags ya
 * descarta las insignias reclamadas sin aprobar, asi que lo que llega aqui es
 * exactamente lo que el visitante puede ver.
 */
type MunicipalityRef = {
  code: string;
  name: string;
  department_code: string;
};

type TagRef = {
  id: string;
  kind: TagKind;
  name: string;
  slug: string;
  color: string | null;
};

/**
 * El generador de tipos de Supabase no infiere bien los select anidados con
 * alias, asi que se declara la forma de la fila a mano. Es una asercion de
 * forma sobre el resultado de una consulta, no un `any`: si el select y este
 * tipo se separan, el error aparece al usar el campo.
 */
type ArtistRowWithRelations = Tables<"artists"> & {
  municipality: MunicipalityRef | null;
  association: AssociationRef | null;
  artist_tags: { status: string; tags: TagRef | null }[] | null;
};

/** La asociacion que avala al artista. Null si no tiene ninguna. */
export type AssociationRef = {
  id: string;
  name: string;
  color: string | null;
};

export type ArtistWithTags = Tables<"artists"> & {
  municipality: MunicipalityRef | null;
  tags: TagRef[];
  association: AssociationRef | null;
};

export async function getApprovedArtistsWithTags(): Promise<ArtistWithTags[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artists")
    .select(
      "*, municipality:municipalities(code, name, department_code), association:associations(id, name, color), artist_tags(status, tags(id, kind, name, slug, color))",
    )
    .eq("status", "Aprobado")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as ArtistRowWithRelations[];

  /**
   * `gender` es privado: el artista lo declara para estadisticas, no para que
   * lo vea un visitante. Se descarta AQUI, en el servidor, y no en el
   * componente de la tarjeta: lo que llegue a este array acaba serializado en
   * el payload RSC que Next manda al navegador, asi que "no pintarlo" no lo
   * esconde -- se leeria abriendo el inspector.
   */
  // Sin 'badge': las insignias dejaron de ser tags. Ahora son asociaciones y
  // llegan por su propia relacion (artists.association_id), no por artist_tags.
  const PUBLIC_KINDS: TagKind[] = ["artist_type", "genre", "profession"];

  return rows.map(({ artist_tags, ...artist }) => ({
    ...artist,
    tags: (artist_tags ?? []).flatMap((row) =>
      row.tags && PUBLIC_KINDS.includes(row.tags.kind) ? [row.tags] : [],
    ),
  }));
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
