export type ArtistType = "Cantante" | "DJ" | "Banda" | "Mariachi" | "Grupo Musical" | "Solista";
export type ArtistStatus = "Aprobado" | "Pendiente" | "Rechazado";
export type Genre = "Vallenato" | "Salsa" | "Electrónica" | "Pop" | "Rock" | "Reggaeton" | "Tropical" | "Cumbia" | "Bachata";

export interface Artist {
  id: string;
  name: string;
  city: string;
  type: ArtistType;
  genre: Genre;
  phone: string;
  price: number;
  duration: string;
  photo: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  spotify?: string;
  status: ArtistStatus;
  active: boolean;
  createdAt: string;
}

export const artists: Artist[] = [
  {
    id: "1",
    name: "Juan Pérez",
    city: "Bogotá",
    type: "Cantante",
    genre: "Vallenato",
    phone: "3101234567",
    price: 500000,
    duration: "2 horas",
    photo: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    instagram: "https://instagram.com/juanperez",
    spotify: "https://open.spotify.com/artist/juanperez",
    status: "Aprobado",
    active: true,
    createdAt: "2026-01-15",
  },
  {
    id: "2",
    name: "María López",
    city: "Medellín",
    type: "DJ",
    genre: "Electrónica",
    phone: "3009876543",
    price: 800000,
    duration: "3 horas",
    photo: "https://images.unsplash.com/photo-1516873240891-4bf014598ab4?w=400&h=400&fit=crop",
    instagram: "https://instagram.com/marialopez",
    tiktok: "https://tiktok.com/@marialopezdj",
    youtube: "https://youtube.com/@marialopezdj",
    status: "Aprobado",
    active: true,
    createdAt: "2026-01-20",
  },
  {
    id: "3",
    name: "Los Tropicales",
    city: "Cali",
    type: "Banda",
    genre: "Tropical",
    phone: "3205551234",
    price: 1200000,
    duration: "4 horas",
    photo: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&h=400&fit=crop",
    instagram: "https://instagram.com/lostropicales",
    youtube: "https://youtube.com/@lostropicales",
    spotify: "https://open.spotify.com/artist/lostropicales",
    status: "Pendiente",
    active: true,
    createdAt: "2026-02-10",
  },
  {
    id: "4",
    name: "Carlos Ruiz",
    city: "Barranquilla",
    type: "Solista",
    genre: "Pop",
    phone: "3117778899",
    price: 350000,
    duration: "1.5 horas",
    photo: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=400&fit=crop",
    tiktok: "https://tiktok.com/@carlosruiz",
    status: "Rechazado",
    active: false,
    createdAt: "2026-02-15",
  },
  {
    id: "5",
    name: "Mariachi Sol",
    city: "Bogotá",
    type: "Mariachi",
    genre: "Vallenato",
    phone: "3154443322",
    price: 900000,
    duration: "2 horas",
    photo: "https://images.unsplash.com/photo-1504704911898-68304a7d2807?w=400&h=400&fit=crop",
    instagram: "https://instagram.com/mariachisol",
    youtube: "https://youtube.com/@mariachisol",
    status: "Aprobado",
    active: true,
    createdAt: "2026-01-25",
  },
  {
    id: "6",
    name: "Sofía Martínez",
    city: "Medellín",
    type: "Cantante",
    genre: "Salsa",
    phone: "3006665544",
    price: 600000,
    duration: "2 horas",
    photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop",
    instagram: "https://instagram.com/sofiamartinez",
    spotify: "https://open.spotify.com/artist/sofiamartinez",
    tiktok: "https://tiktok.com/@sofiamartinez",
    status: "Aprobado",
    active: true,
    createdAt: "2026-02-01",
  },
  {
    id: "7",
    name: "DJ Andrés",
    city: "Cali",
    type: "DJ",
    genre: "Reggaeton",
    phone: "3182223344",
    price: 700000,
    duration: "3 horas",
    photo: "https://images.unsplash.com/photo-1571266028243-3716f02d4c11?w=400&h=400&fit=crop",
    instagram: "https://instagram.com/djandres",
    tiktok: "https://tiktok.com/@djandres",
    status: "Aprobado",
    active: false,
    createdAt: "2026-02-05",
  },
  {
    id: "8",
    name: "Cumbia Viva",
    city: "Barranquilla",
    type: "Grupo Musical",
    genre: "Cumbia",
    phone: "3009998877",
    price: 1500000,
    duration: "4 horas",
    photo: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&h=400&fit=crop",
    youtube: "https://youtube.com/@cumbiaviva",
    spotify: "https://open.spotify.com/artist/cumbiaviva",
    status: "Aprobado",
    active: true,
    createdAt: "2026-01-30",
  },
  {
    id: "9",
    name: "Valentina Ríos",
    city: "Bucaramanga",
    type: "Cantante",
    genre: "Bachata",
    phone: "3124445566",
    price: 450000,
    duration: "2 horas",
    photo: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=400&h=400&fit=crop",
    instagram: "https://instagram.com/valentinarios",
    status: "Pendiente",
    active: true,
    createdAt: "2026-03-01",
  },
  {
    id: "10",
    name: "Rock Andino",
    city: "Bogotá",
    type: "Banda",
    genre: "Rock",
    phone: "3167778800",
    price: 1100000,
    duration: "3 horas",
    photo: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=400&fit=crop",
    instagram: "https://instagram.com/rockandino",
    youtube: "https://youtube.com/@rockandino",
    spotify: "https://open.spotify.com/artist/rockandino",
    tiktok: "https://tiktok.com/@rockandino",
    status: "Pendiente",
    active: true,
    createdAt: "2026-03-10",
  },
];

export const cities = ["Bogotá", "Medellín", "Cali", "Barranquilla", "Bucaramanga", "Cartagena", "Pereira"];
export const artistTypes: ArtistType[] = ["Cantante", "DJ", "Banda", "Mariachi", "Grupo Musical", "Solista"];
export const genres: Genre[] = ["Vallenato", "Salsa", "Electrónica", "Pop", "Rock", "Reggaeton", "Tropical", "Cumbia", "Bachata"];

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);
}
