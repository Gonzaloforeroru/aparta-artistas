export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      artists: {
        Row: {
          active: boolean
          approved_at: string | null
          approved_by: string | null
          city: string
          created_at: string
          created_by: string | null
          duration: string
          email: string | null
          genre: Database["public"]["Enums"]["genre"]
          id: string
          instagram: string | null
          invitation_token: string | null
          name: string
          phone: string
          photo: string | null
          price: number
          spotify: string | null
          status: Database["public"]["Enums"]["artist_status"]
          tiktok: string | null
          type: Database["public"]["Enums"]["artist_type"]
          updated_at: string
          user_id: string | null
          youtube: string | null
        }
        Insert: {
          active?: boolean
          approved_at?: string | null
          approved_by?: string | null
          city: string
          created_at?: string
          created_by?: string | null
          duration: string
          email?: string | null
          genre: Database["public"]["Enums"]["genre"]
          id?: string
          instagram?: string | null
          invitation_token?: string | null
          name: string
          phone: string
          photo?: string | null
          price: number
          spotify?: string | null
          status?: Database["public"]["Enums"]["artist_status"]
          tiktok?: string | null
          type: Database["public"]["Enums"]["artist_type"]
          updated_at?: string
          user_id?: string | null
          youtube?: string | null
        }
        Update: {
          active?: boolean
          approved_at?: string | null
          approved_by?: string | null
          city?: string
          created_at?: string
          created_by?: string | null
          duration?: string
          email?: string | null
          genre?: Database["public"]["Enums"]["genre"]
          id?: string
          instagram?: string | null
          invitation_token?: string | null
          name?: string
          phone?: string
          photo?: string | null
          price?: number
          spotify?: string | null
          status?: Database["public"]["Enums"]["artist_status"]
          tiktok?: string | null
          type?: Database["public"]["Enums"]["artist_type"]
          updated_at?: string
          user_id?: string | null
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artists_invitation_token_fkey"
            columns: ["invitation_token"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["token"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          created_by: string
          email: string | null
          expires_at: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          email?: string | null
          expires_at?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string | null
          expires_at?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      artist_status: "Pendiente" | "Aprobado" | "Rechazado"
      artist_type:
        | "Cantante"
        | "DJ"
        | "Banda"
        | "Mariachi"
        | "Grupo Musical"
        | "Solista"
      genre:
        | "Vallenato"
        | "Salsa"
        | "Electrónica"
        | "Pop"
        | "Rock"
        | "Reggaeton"
        | "Tropical"
        | "Cumbia"
        | "Bachata"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// Convenience type aliases for enum types used across the app
export type ArtistType = Database["public"]["Enums"]["artist_type"]
export type Genre = Database["public"]["Enums"]["genre"]
export type ArtistStatus = Database["public"]["Enums"]["artist_status"]

export const Constants = {
  public: {
    Enums: {
      artist_status: ["Pendiente", "Aprobado", "Rechazado"],
      artist_type: [
        "Cantante",
        "DJ",
        "Banda",
        "Mariachi",
        "Grupo Musical",
        "Solista",
      ],
      genre: [
        "Vallenato",
        "Salsa",
        "Electrónica",
        "Pop",
        "Rock",
        "Reggaeton",
        "Tropical",
        "Cumbia",
        "Bachata",
      ],
    },
  },
} as const
