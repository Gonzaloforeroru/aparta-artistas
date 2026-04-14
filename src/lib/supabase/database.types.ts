/**
 * Manual type definitions matching the Supabase schema.
 * Regenerate with: node_modules\.bin\supabase gen types typescript --linked > src/lib/supabase/database-generated.types.ts
 * Then replace this file's Database type with the generated one.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ArtistType =
  | "Cantante"
  | "DJ"
  | "Banda"
  | "Mariachi"
  | "Grupo Musical"
  | "Solista";

export type Genre =
  | "Vallenato"
  | "Salsa"
  | "Electrónica"
  | "Pop"
  | "Rock"
  | "Reggaeton"
  | "Tropical"
  | "Cumbia"
  | "Bachata";

export type ArtistStatus = "Pendiente" | "Aprobado" | "Rechazado";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      artists: {
        Row: {
          id: string;
          name: string;
          city: string;
          type: ArtistType;
          genre: Genre;
          phone: string;
          price: number;
          duration: string;
          photo: string | null;
          instagram: string | null;
          tiktok: string | null;
          youtube: string | null;
          spotify: string | null;
          status: ArtistStatus;
          active: boolean;
          created_by: string | null;
          invitation_token: string | null;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          city: string;
          type: ArtistType;
          genre: Genre;
          phone: string;
          price: number;
          duration: string;
          photo?: string | null;
          instagram?: string | null;
          tiktok?: string | null;
          youtube?: string | null;
          spotify?: string | null;
          status?: ArtistStatus;
          active?: boolean;
          created_by?: string | null;
          invitation_token?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
        };
        Update: {
          name?: string;
          city?: string;
          type?: ArtistType;
          genre?: Genre;
          phone?: string;
          price?: number;
          duration?: string;
          photo?: string | null;
          instagram?: string | null;
          tiktok?: string | null;
          youtube?: string | null;
          spotify?: string | null;
          status?: ArtistStatus;
          active?: boolean;
          created_by?: string | null;
          invitation_token?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          updated_at?: string;
        };
      };
      invitations: {
        Row: {
          token: string;
          email: string | null;
          created_by: string;
          created_at: string;
          expires_at: string;
          used_at: string | null;
        };
        Insert: {
          token: string;
          email?: string | null;
          created_by: string;
          expires_at?: string;
        };
        Update: {
          used_at?: string | null;
        };
      };
    };
    Enums: {
      artist_type: ArtistType;
      genre: Genre;
      artist_status: ArtistStatus;
    };
  };
}

/** Helper: extract a table's Row type */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

/** Helper: extract an enum type */
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
