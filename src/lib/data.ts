export type ArtistType = "Cantante" | "DJ" | "Banda" | "Mariachi" | "Grupo Musical" | "Solista";
export type ArtistStatus = "Aprobado" | "Pendiente" | "Rechazado";
export type Genre = "Vallenato" | "Salsa" | "Electrónica" | "Pop" | "Rock" | "Reggaeton" | "Tropical" | "Cumbia" | "Bachata";

export const cities = ["Bogotá", "Medellín", "Cali", "Barranquilla", "Bucaramanga", "Cartagena", "Pereira"];
export const artistTypes: ArtistType[] = ["Cantante", "DJ", "Banda", "Mariachi", "Grupo Musical", "Solista"];
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
