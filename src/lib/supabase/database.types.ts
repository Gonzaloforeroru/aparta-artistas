export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      artist_tags: {
        Row: {
          artist_id: string
          created_at: string
          source: string
          status: string
          tag_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          source?: string
          status?: string
          tag_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          source?: string
          status?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_tags_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          active: boolean
          approved_at: string | null
          approved_by: string | null
          association_id: string | null
          city: string
          created_at: string
          created_by: string | null
          duration: string
          email: string | null
          genre: string
          id: string
          instagram: string | null
          invitation_token: string | null
          municipality_code: string | null
          name: string
          phone: string
          photo: string | null
          price: number
          spotify: string | null
          status: Database["public"]["Enums"]["artist_status"]
          tiktok: string | null
          type: string
          updated_at: string
          user_id: string | null
          website: string | null
          youtube: string | null
        }
        Insert: {
          active?: boolean
          approved_at?: string | null
          approved_by?: string | null
          association_id?: string | null
          city: string
          created_at?: string
          created_by?: string | null
          duration: string
          email?: string | null
          genre: string
          id?: string
          instagram?: string | null
          invitation_token?: string | null
          municipality_code?: string | null
          name: string
          phone: string
          photo?: string | null
          price: number
          spotify?: string | null
          status?: Database["public"]["Enums"]["artist_status"]
          tiktok?: string | null
          type: string
          updated_at?: string
          user_id?: string | null
          website?: string | null
          youtube?: string | null
        }
        Update: {
          active?: boolean
          approved_at?: string | null
          approved_by?: string | null
          association_id?: string | null
          city?: string
          created_at?: string
          created_by?: string | null
          duration?: string
          email?: string | null
          genre?: string
          id?: string
          instagram?: string | null
          invitation_token?: string | null
          municipality_code?: string | null
          name?: string
          phone?: string
          photo?: string | null
          price?: number
          spotify?: string | null
          status?: Database["public"]["Enums"]["artist_status"]
          tiktok?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
          website?: string | null
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artists_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artists_invitation_token_fkey"
            columns: ["invitation_token"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["token"]
          },
          {
            foreignKeyName: "artists_municipality_code_fkey"
            columns: ["municipality_code"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["code"]
          },
        ]
      }
      associations: {
        Row: {
          active: boolean
          color: string | null
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          color?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string
          name: string
        }
        Insert: {
          code: string
          name: string
        }
        Update: {
          code?: string
          name?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          association_id: string | null
          created_at: string
          created_by: string
          email: string | null
          expires_at: string
          kind: string
          label: string | null
          max_uses: number | null
          token: string
          used_at: string | null
          uses_count: number
        }
        Insert: {
          association_id?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          expires_at?: string
          kind?: string
          label?: string | null
          max_uses?: number | null
          token: string
          used_at?: string | null
          uses_count?: number
        }
        Update: {
          association_id?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          expires_at?: string
          kind?: string
          label?: string | null
          max_uses?: number | null
          token?: string
          used_at?: string | null
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "invitations_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      municipalities: {
        Row: {
          code: string
          department_code: string
          kind: string
          name: string
        }
        Insert: {
          code: string
          department_code: string
          kind?: string
          name: string
        }
        Update: {
          code?: string
          department_code?: string
          kind?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "municipalities_department_code_fkey"
            columns: ["department_code"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["code"]
          },
        ]
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
      tags: {
        Row: {
          archived_at: string | null
          color: string | null
          created_at: string
          created_by: string | null
          id: string
          is_official: boolean
          kind: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_official?: boolean
          kind: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_official?: boolean
          kind?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_unconfirmed_users: { Args: never; Returns: undefined }
      propose_tag: {
        Args: { p_kind: string; p_name: string }
        Returns: {
          id: string
          is_official: boolean
          name: string
          slug: string
        }[]
      }
      redeem_invitation: {
        Args: { p_token: string }
        Returns: {
          association_id: string
          ok: boolean
          reason: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slugify: { Args: { p_text: string }; Returns: string }
      suggest_similar_tag: {
        Args: { p_kind: string; p_name: string }
        Returns: {
          id: string
          name: string
          similarity: number
          slug: string
        }[]
      }
      unaccent: { Args: { "": string }; Returns: string }
      validate_invitation: {
        Args: { p_token: string }
        Returns: {
          association_id: string
          association_name: string
          email: string
          kind: string
          label: string
          reason: string
          valid: boolean
        }[]
      }
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

export const Constants = {
  graphql_public: {
    Enums: {},
  },
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



export type ArtistType = Database["public"]["Enums"]["artist_type"]
export type Genre = Database["public"]["Enums"]["genre"]
export type ArtistStatus = Database["public"]["Enums"]["artist_status"]
