import { createClient } from "@/lib/supabase/server";

export type TagKind =
  | "artist_type"
  | "genre"
  | "profession"
  | "gender";

export type Tag = {
  id: string;
  kind: TagKind;
  name: string;
  slug: string;
  color: string | null;
};

/** Tag propuesto por un artista, a la espera de que el admin decida. */
export type PendingTag = Tag & {
  createdAt: string;
  /**
   * Nombre del artista que lo propuso. null si su ficha ya no existe o si lo
   * creo alguien sin ficha de artista (p. ej. el propio admin).
   */
  proposedBy: string | null;
  /** Cuantos artistas lo usan ya. Es el dato que decide si vale la pena. */
  usageCount: number;
};

/** Fila del catalogo en el panel de admin: incluye lo que el publico no ve. */
export type CatalogTag = Tag & {
  isOfficial: boolean;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  usageCount: number;
};

// -- Tipos de fila cruda (evitan `as any` al desestructurar embebidos) --------

type PendingTagRow = {
  id: string;
  kind: string;
  name: string;
  slug: string;
  color: string | null;
  created_at: string;
  created_by: string | null;
  artist_tags: { count: number }[];
};

type CatalogTagRow = {
  id: string;
  kind: string;
  name: string;
  slug: string;
  color: string | null;
  is_official: boolean;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  artist_tags: { count: number }[];
};

// ═══════════════════════════════════════════
// CONSULTAS PUBLICAS
// ═══════════════════════════════════════════

/**
 * Tags visibles para elegir/filtrar.
 *
 * RLS ya filtra lo no oficial, pero se pide is_official explicitamente para que
 * la consulta signifique lo mismo cuando la ejecuta un admin (que si ve las
 * propuestas pendientes y si no, se le colarian en los filtros publicos).
 *
 * Se excluyen tambien los tags archivados para que nunca aparezcan en
 * selects de formularios ni filtros del catalogo.
 */
export async function getOfficialTags(kinds?: TagKind[]): Promise<Tag[]> {
  const supabase = await createClient();
  let query = supabase
    .from("tags")
    .select("id, kind, name, slug, color")
    .eq("is_official", true)
    .is("archived_at", null)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (kinds?.length) query = query.in("kind", kinds);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Tag[];
}

/** Agrupa por kind para no repetir el mismo filter() en cada componente. */
export async function getOfficialTagsByKind(
  kinds?: TagKind[],
): Promise<Record<TagKind, Tag[]>> {
  const tags = await getOfficialTags(kinds);
  const grouped = {
    artist_type: [],
    genre: [],
    profession: [],
    gender: [],
  } as Record<TagKind, Tag[]>;

  for (const tag of tags) grouped[tag.kind].push(tag);
  return grouped;
}

/**
 * Tags de un artista concreto, para pintar su formulario.
 *
 * Incluye status porque una insignia reclamada pero aun no aprobada debe verse
 * como "pendiente" en su propio perfil, aunque no salga en el catalogo.
 *
 * Se excluyen tags archivados: si el admin archivo un tag, el artista deja de
 * verlo en su formulario.
 */
export async function getArtistTags(artistId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artist_tags")
    .select("tag_id, source, status, tags!inner(id, kind, name, slug, color)")
    .eq("artist_id", artistId)
    .is("tags.archived_at", null);

  if (error) throw error;
  return (data ?? []).flatMap((row) =>
    row.tags ? [{ ...(row.tags as unknown as Tag), status: row.status, source: row.source }] : [],
  );
}

// ═══════════════════════════════════════════
// ADMIN — /admin/tags
//
// Todo lo de aqui abajo depende de las policies `admin_all_tags` /
// `admin_all_artist_tags`: sin rol admin, RLS devuelve listas vacias en vez de
// error. Es silencioso a proposito (no filtra informacion), pero significa que
// una pagina vacia puede ser "no hay nada" o "no eres admin".
//
// El conteo de uso se pide como agregado embebido `artist_tags(count)`: lo
// resuelve Postgres de una sola pasada. La alternativa (traerse artist_tags y
// contar en JS) obliga a descargar una tabla que crece con cada artista por
// cada tag suyo.
// ═══════════════════════════════════════════

const PAGE_SIZE = 1000;

/**
 * Resuelve `tags.created_by` (un auth.users.id) a un nombre legible.
 *
 * Se pasa por `artists` y no por `profiles` porque `profiles` solo tiene la
 * policy `select_own_profile`: ni siquiera el admin puede leer la fila de otro.
 *
 * Deliberadamente NO se usa el admin client para sacar el email de auth.users:
 * escalar a service_role en una ruta de solo lectura de un panel es un riesgo
 * que no compensa, y ademas obliga a una llamada HTTP por proponente. Saber
 * *que artista* propuso el tag es mas accionable que su correo, porque es lo
 * que el admin puede ir a mirar.
 */
async function resolveProposers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userIds: string[],
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  if (!userIds.length) return names;

  const { data, error } = await supabase
    .from("artists")
    .select("user_id, name")
    .in("user_id", userIds);

  if (error) throw error;
  for (const row of data ?? []) {
    if (row.user_id) names.set(row.user_id, row.name);
  }
  return names;
}

/**
 * Cola de aprobacion: tags propuestos que siguen sin decidir.
 *
 * Se excluyen los archivados porque rechazar = archivar (ver `rejectTag`): un
 * tag rechazado conserva is_official = false, y sin este filtro volveria a
 * aparecer en la cola para siempre.
 */
export async function getPendingTags(): Promise<PendingTag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tags")
    .select(
      "id, kind, name, slug, color, created_at, created_by, artist_tags(count)",
    )
    .eq("is_official", false)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data?.length) return [];

  const rows = data as unknown as PendingTagRow[];
  const proposers = await resolveProposers(supabase, [
    ...new Set(rows.flatMap((r) => (r.created_by ? [r.created_by] : []))),
  ]);

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind as TagKind,
    name: row.name,
    slug: row.slug,
    color: row.color,
    createdAt: row.created_at,
    proposedBy: row.created_by ? (proposers.get(row.created_by) ?? null) : null,
    usageCount: row.artist_tags?.[0]?.count ?? 0,
  }));
}

/**
 * Catalogo completo para administrar.
 *
 * `includeArchived` va en false por defecto para que la vista normal muestre
 * solo lo vivo; la UI lo activa para poder restaurar lo archivado.
 *
 * Se pagina por la misma razon que en `getMunicipalities`: PostgREST corta en
 * max_rows (1000) y devuelve una lista incompleta SIN error. Hoy son 307 tags,
 * pero el catalogo solo crece.
 */
export async function getTagCatalog(options?: {
  kind?: TagKind;
  search?: string;
  includeArchived?: boolean;
}): Promise<CatalogTag[]> {
  const supabase = await createClient();
  const rows: CatalogTagRow[] = [];

  // `%` y `_` son comodines de LIKE y `,` `.` `(` `)` separan filtros en la
  // sintaxis de PostgREST: sin escaparlos, buscar "100%" o "a,b" devuelve
  // resultados absurdos o rompe la query entera.
  const term = options?.search?.trim().replace(/[%_,.()\\]/g, "\\$&");

  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase
      .from("tags")
      .select(
        "id, kind, name, slug, color, is_official, sort_order, archived_at, created_at, artist_tags(count)",
      )
      .order("kind", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (options?.kind) query = query.eq("kind", options.kind);
    if (!options?.includeArchived) query = query.is("archived_at", null);
    if (term) query = query.ilike("name", `%${term}%`);

    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) break;

    rows.push(...(data as unknown as CatalogTagRow[]));
    if (data.length < PAGE_SIZE) break;
  }

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind as TagKind,
    name: row.name,
    slug: row.slug,
    color: row.color,
    isOfficial: row.is_official,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    usageCount: row.artist_tags?.[0]?.count ?? 0,
  }));
}
