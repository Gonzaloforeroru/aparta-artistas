import { createClient } from "@/lib/supabase/server";

export type Department = { code: string; name: string };
export type Municipality = {
  code: string;
  department_code: string;
  name: string;
  kind: string;
};

export async function getDepartments(): Promise<Department[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("code, name")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * PostgREST corta en `max_rows` (1000 en config.toml) y Colombia tiene 1122
 * municipios, asi que una sola peticion devuelve una lista incompleta EN
 * SILENCIO: no hay error, simplemente faltan municipios y el artista no
 * encuentra el suyo. Por eso se pagina explicitamente.
 */
const PAGE_SIZE = 1000;

export async function getMunicipalities(
  departmentCode?: string,
): Promise<Municipality[]> {
  const supabase = await createClient();
  const all: Municipality[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase
      .from("municipalities")
      .select("code, department_code, name, kind")
      .order("name", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (departmentCode) query = query.eq("department_code", departmentCode);

    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) break;

    all.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  return all;
}

/**
 * Los 1122 municipios de una vez.
 *
 * Son ~40 KB y no cambian nunca, asi que se mandan completos al cliente y la
 * cascada departamento->municipio filtra en memoria. Evita un round-trip por
 * cada cambio de departamento, que es lo que haria el selector inutilizable.
 */
export async function getPlacesForCascade() {
  const [departments, municipalities] = await Promise.all([
    getDepartments(),
    getMunicipalities(),
  ]);
  return { departments, municipalities };
}
