/**
 * Formato contratable. Responde a "que te llega", no a "que sabe hacer".
 *
 * Antes habia seis (Cantante, DJ, Banda, Mariachi, Grupo Musical, Solista) y
 * llegaron a ser 110. La mayoria no eran formatos sino generos: "Mariachi" o
 * "Papayera" existian a la vez en los dos ejes. Y varios eran sinonimos
 * ("Grupo Musical", "Conjunto", "Ensamble"), lo que partia los filtros sin
 * avisar: quien buscaba por uno no encontraba a los marcados con otro.
 *
 * Un mariachi es ahora Agrupación + genero Mariachi. Nada deja de ser
 * buscable, solo deja de estar duplicado.
 */
export type ArtistType = "Solista" | "Agrupación" | "DJ";
export type ArtistStatus = "Aprobado" | "Pendiente" | "Rechazado";
export type Genre = "Vallenato" | "Salsa" | "Electrónica" | "Pop" | "Rock" | "Reggaeton" | "Tropical" | "Cumbia" | "Bachata";

export const cities = ["Bogotá", "Medellín", "Cali", "Barranquilla", "Bucaramanga", "Cartagena", "Pereira"];
export const artistTypes: ArtistType[] = ["Solista", "Agrupación", "DJ"];
export const genres: Genre[] = ["Vallenato", "Salsa", "Electrónica", "Pop", "Rock", "Reggaeton", "Tropical", "Cumbia", "Bachata"];

export const DURATION_OPTIONS = ["1 hora", "2 horas", "3 horas", "4 horas", "5+ horas"] as const;

export const COST_SLIDER_CONFIG = {
  min: 0,
  max: 10_000_000,
  step: 100_000,
} as const;

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);
}
