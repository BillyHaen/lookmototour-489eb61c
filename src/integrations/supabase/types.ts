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
      blog_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          excerpt: string
          id: string
          image_url: string | null
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          image_url?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          image_url?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_itineraries: {
        Row: {
          created_at: string
          date: string | null
          day_number: number
          description: string
          event_id: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          day_number?: number
          description?: string
          event_id: string
          id?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string | null
          day_number?: number
          description?: string
          event_id?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_itineraries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string
          email: string
          emergency_contact: string
          event_id: string
          id: string
          installment_amount: number
          motor_type: string
          name: string
          notes: string | null
          payment_status: string
          phone: string
          plate_number: string
          registration_type: string
          status: string
          towing_pergi: boolean
          towing_pulang: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          emergency_contact?: string
          event_id: string
          id?: string
          installment_amount?: number
          motor_type?: string
          name: string
          notes?: string | null
          payment_status?: string
          phone: string
          plate_number?: string
          registration_type?: string
          status?: string
          towing_pergi?: boolean
          towing_pulang?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          emergency_contact?: string
          event_id?: string
          id?: string
          installment_amount?: number
          motor_type?: string
          name?: string
          notes?: string | null
          payment_status?: string
          phone?: string
          plate_number?: string
          registration_type?: string
          status?: string
          towing_pergi?: boolean
          towing_pulang?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string
          created_at: string
          current_participants: number
          date: string
          deleted_at: string | null
          description: string
          difficulty: string
          distance: string | null
          end_date: string | null
          excludes: string[] | null
          force_full: boolean
          highlights: string[] | null
          id: string
          image_url: string | null
          includes: string[] | null
          insurance_description: string | null
          insurance_enabled: boolean
          location: string
          max_participants: number
          price: number
          price_couple: number
          price_sharing: number
          price_single: number
          requirements: string[] | null
          slug: string
          status: string
          title: string
          towing_description: string | null
          towing_enabled: boolean
          towing_pergi_price: number
          towing_pulang_price: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          current_participants?: number
          date: string
          deleted_at?: string | null
          description?: string
          difficulty?: string
          distance?: string | null
          end_date?: string | null
          excludes?: string[] | null
          force_full?: boolean
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          includes?: string[] | null
          insurance_description?: string | null
          insurance_enabled?: boolean
          location?: string
          max_participants?: number
          price?: number
          price_couple?: number
          price_sharing?: number
          price_single?: number
          requirements?: string[] | null
          slug?: string
          status?: string
          title: string
          towing_description?: string | null
          towing_enabled?: boolean
          towing_pergi_price?: number
          towing_pulang_price?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          current_participants?: number
          date?: string
          deleted_at?: string | null
          description?: string
          difficulty?: string
          distance?: string | null
          end_date?: string | null
          excludes?: string[] | null
          force_full?: boolean
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          includes?: string[] | null
          insurance_description?: string | null
          insurance_enabled?: boolean
          location?: string
          max_participants?: number
          price?: number
          price_couple?: number
          price_sharing?: number
          price_single?: number
          requirements?: string[] | null
          slug?: string
          status?: string
          title?: string
          towing_description?: string | null
          towing_enabled?: boolean
          towing_pergi_price?: number
          towing_pulang_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          stock: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price?: number
          stock?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          content: string
          created_at: string
          event_id: string
          id: string
          rating: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          event_id: string
          id?: string
          rating?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          event_id?: string
          id?: string
          rating?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trip_journal_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          journal_id: string
          sort_order: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          journal_id: string
          sort_order?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          journal_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "trip_journal_images_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "trip_journals"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_journal_participants: {
        Row: {
          created_at: string
          id: string
          journal_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          journal_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          journal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_journal_participants_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "trip_journals"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_journals: {
        Row: {
          author_id: string
          content: string
          created_at: string
          event_id: string | null
          id: string
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content?: string
          created_at?: string
          event_id?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          event_id?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_journals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_approved_testimonials_with_profiles: {
        Args: never
        Returns: {
          content: string
          created_at: string
          event_id: string
          event_title: string
          id: string
          rating: number
          status: string
          user_avatar_url: string
          user_id: string
          user_name: string
        }[]
      }
      get_public_profile: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          name: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
