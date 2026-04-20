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
      achievements: {
        Row: {
          code: string
          criteria_type: string
          description: string
          icon: string
          name: string
          sort_order: number
          threshold: number
        }
        Insert: {
          code: string
          criteria_type: string
          description?: string
          icon?: string
          name: string
          sort_order?: number
          threshold: number
        }
        Update: {
          code?: string
          criteria_type?: string
          description?: string
          icon?: string
          name?: string
          sort_order?: number
          threshold?: number
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          error_message: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          status: string
          table_name: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          status?: string
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          status?: string
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
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
      blog_post_categories: {
        Row: {
          category_id: string
          post_id: string
        }
        Insert: {
          category_id: string
          post_id: string
        }
        Update: {
          category_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
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
          gallery: Json
          id: string
          image_url: string | null
          published_at: string | null
          scheduled_at: string | null
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
          gallery?: Json
          id?: string
          image_url?: string | null
          published_at?: string | null
          scheduled_at?: string | null
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
          gallery?: Json
          id?: string
          image_url?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_template_overrides: {
        Row: {
          body_html: string
          body_text: string | null
          created_at: string
          id: string
          is_active: boolean
          subject: string
          template_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body_html?: string
          body_text?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          subject?: string
          template_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body_html?: string
          body_text?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          subject?: string
          template_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      endorsements: {
        Row: {
          content: string
          created_at: string
          from_user_id: string
          id: string
          rating: number
          to_user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          from_user_id: string
          id?: string
          rating: number
          to_user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          from_user_id?: string
          id?: string
          rating?: number
          to_user_id?: string
        }
        Relationships: []
      }
      event_interests: {
        Row: {
          created_at: string
          event_id: string
          id: string
          name: string
          phone: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          name?: string
          phone?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          name?: string
          phone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_interests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
          about_destination: string | null
          category: string
          created_at: string
          cta_primary_label: string | null
          current_participants: number
          date: string
          deleted_at: string | null
          description: string
          difficulty: string
          distance: string | null
          end_date: string | null
          excludes: string[] | null
          experience_section: string | null
          faq: Json
          fatigue_level: number
          force_full: boolean
          gallery: Json
          hero_subheadline: string | null
          highlights: string[] | null
          id: string
          image_url: string | null
          includes: string[] | null
          insurance_description: string | null
          insurance_enabled: boolean
          internal_link_blog_tag: string | null
          itinerary: Json
          location: string
          max_participants: number
          meta_description: string | null
          meta_title: string | null
          motor_types: string[]
          opening_hook: string | null
          price: number
          price_couple: number
          price_sharing: number
          price_single: number
          requirements: string[] | null
          rider_level: string
          riding_hours_per_day: number
          road_condition: number
          route_data: Json | null
          slug: string
          status: string
          target_audience: string | null
          tentative_month: string | null
          title: string
          touring_style: string
          towing_description: string | null
          towing_enabled: boolean
          towing_pergi_price: number
          towing_pulang_price: number
          trust_section: string | null
          updated_at: string
          why_join: string | null
        }
        Insert: {
          about_destination?: string | null
          category?: string
          created_at?: string
          cta_primary_label?: string | null
          current_participants?: number
          date: string
          deleted_at?: string | null
          description?: string
          difficulty?: string
          distance?: string | null
          end_date?: string | null
          excludes?: string[] | null
          experience_section?: string | null
          faq?: Json
          fatigue_level?: number
          force_full?: boolean
          gallery?: Json
          hero_subheadline?: string | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          includes?: string[] | null
          insurance_description?: string | null
          insurance_enabled?: boolean
          internal_link_blog_tag?: string | null
          itinerary?: Json
          location?: string
          max_participants?: number
          meta_description?: string | null
          meta_title?: string | null
          motor_types?: string[]
          opening_hook?: string | null
          price?: number
          price_couple?: number
          price_sharing?: number
          price_single?: number
          requirements?: string[] | null
          rider_level?: string
          riding_hours_per_day?: number
          road_condition?: number
          route_data?: Json | null
          slug?: string
          status?: string
          target_audience?: string | null
          tentative_month?: string | null
          title: string
          touring_style?: string
          towing_description?: string | null
          towing_enabled?: boolean
          towing_pergi_price?: number
          towing_pulang_price?: number
          trust_section?: string | null
          updated_at?: string
          why_join?: string | null
        }
        Update: {
          about_destination?: string | null
          category?: string
          created_at?: string
          cta_primary_label?: string | null
          current_participants?: number
          date?: string
          deleted_at?: string | null
          description?: string
          difficulty?: string
          distance?: string | null
          end_date?: string | null
          excludes?: string[] | null
          experience_section?: string | null
          faq?: Json
          fatigue_level?: number
          force_full?: boolean
          gallery?: Json
          hero_subheadline?: string | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          includes?: string[] | null
          insurance_description?: string | null
          insurance_enabled?: boolean
          internal_link_blog_tag?: string | null
          itinerary?: Json
          location?: string
          max_participants?: number
          meta_description?: string | null
          meta_title?: string | null
          motor_types?: string[]
          opening_hook?: string | null
          price?: number
          price_couple?: number
          price_sharing?: number
          price_single?: number
          requirements?: string[] | null
          rider_level?: string
          riding_hours_per_day?: number
          road_condition?: number
          route_data?: Json | null
          slug?: string
          status?: string
          target_audience?: string | null
          tentative_month?: string | null
          title?: string
          touring_style?: string
          towing_description?: string | null
          towing_enabled?: boolean
          towing_pergi_price?: number
          towing_pulang_price?: number
          trust_section?: string | null
          updated_at?: string
          why_join?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: []
      }
      garage_bikes: {
        Row: {
          brand: string
          created_at: string
          description: string | null
          id: string
          model: string
          photo_url: string | null
          updated_at: string
          user_id: string
          year: number | null
        }
        Insert: {
          brand?: string
          created_at?: string
          description?: string | null
          id?: string
          model?: string
          photo_url?: string | null
          updated_at?: string
          user_id: string
          year?: number | null
        }
        Update: {
          brand?: string
          created_at?: string
          description?: string | null
          id?: string
          model?: string
          photo_url?: string | null
          updated_at?: string
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
      garage_gear: {
        Row: {
          brand: string
          category: string
          created_at: string
          id: string
          name: string
          photo_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string
          category?: string
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string
          category?: string
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gear_rentals: {
        Row: {
          created_at: string
          daily_price: number
          deposit_amount: number
          end_date: string
          event_id: string | null
          id: string
          pickup_notes: string | null
          product_id: string
          qty: number
          registration_id: string | null
          return_notes: string | null
          start_date: string
          status: Database["public"]["Enums"]["gear_rental_status"]
          total_days: number
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_price?: number
          deposit_amount?: number
          end_date: string
          event_id?: string | null
          id?: string
          pickup_notes?: string | null
          product_id: string
          qty?: number
          registration_id?: string | null
          return_notes?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["gear_rental_status"]
          total_days?: number
          total_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_price?: number
          deposit_amount?: number
          end_date?: string
          event_id?: string | null
          id?: string
          pickup_notes?: string | null
          product_id?: string
          qty?: number
          registration_id?: string | null
          return_notes?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["gear_rental_status"]
          total_days?: number
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gear_rentals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gear_rentals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gear_rentals_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      media_library: {
        Row: {
          bucket: string
          created_at: string
          file_name: string
          file_type: string
          file_url: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          uploaded_by: string
        }
        Insert: {
          bucket: string
          created_at?: string
          file_name: string
          file_type: string
          file_url: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by: string
        }
        Update: {
          bucket?: string
          created_at?: string
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      product_recommendations_log: {
        Row: {
          computed_at: string
          event_id: string | null
          id: string
          product_id: string
          reason: Json
          score: number
          user_id: string
        }
        Insert: {
          computed_at?: string
          event_id?: string | null
          id?: string
          product_id: string
          reason?: Json
          score?: number
          user_id: string
        }
        Update: {
          computed_at?: string
          event_id?: string | null
          id?: string
          product_id?: string
          reason?: Json
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_recommendations_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recommendations_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          daily_rent_price: number
          description: string
          gear_type: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_purchasable: boolean
          is_rentable: boolean
          min_difficulty: number
          motor_brands: string[]
          name: string
          price: number
          rent_deposit: number
          sold_count: number
          stock: number
          suitable_motor_types: string[]
          suitable_trip_styles: string[]
          total_inventory: number
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          daily_rent_price?: number
          description?: string
          gear_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_purchasable?: boolean
          is_rentable?: boolean
          min_difficulty?: number
          motor_brands?: string[]
          name: string
          price?: number
          rent_deposit?: number
          sold_count?: number
          stock?: number
          suitable_motor_types?: string[]
          suitable_trip_styles?: string[]
          total_inventory?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          daily_rent_price?: number
          description?: string
          gear_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_purchasable?: boolean
          is_rentable?: boolean
          min_difficulty?: number
          motor_brands?: string[]
          name?: string
          price?: number
          rent_deposit?: number
          sold_count?: number
          stock?: number
          suitable_motor_types?: string[]
          suitable_trip_styles?: string[]
          total_inventory?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string
          id: string
          location: string | null
          name: string
          override_total_km: number | null
          override_total_trips: number | null
          override_trust_score: number | null
          override_updated_at: string | null
          override_updated_by: string | null
          phone: string | null
          riding_style: string | null
          total_km: number
          total_trips: number
          trust_score: number
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          override_total_km?: number | null
          override_total_trips?: number | null
          override_trust_score?: number | null
          override_updated_at?: string | null
          override_updated_by?: string | null
          phone?: string | null
          riding_style?: string | null
          total_km?: number
          total_trips?: number
          trust_score?: number
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          override_total_km?: number | null
          override_total_trips?: number | null
          override_trust_score?: number | null
          override_updated_at?: string | null
          override_updated_by?: string | null
          phone?: string | null
          riding_style?: string | null
          total_km?: number
          total_trips?: number
          trust_score?: number
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      share_counts: {
        Row: {
          content_id: string
          content_type: string
          count: number
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          content_id: string
          content_type: string
          count?: number
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          count?: number
          created_at?: string
          id?: string
          updated_at?: string
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
      sponsor_ai_config: {
        Row: {
          id: number
          updated_at: string
          use_ai_rerank: boolean
          weight_behavior: number
          weight_performance: number
          weight_priority: number
          weight_relevance: number
          weight_trip_context: number
        }
        Insert: {
          id?: number
          updated_at?: string
          use_ai_rerank?: boolean
          weight_behavior?: number
          weight_performance?: number
          weight_priority?: number
          weight_relevance?: number
          weight_trip_context?: number
        }
        Update: {
          id?: number
          updated_at?: string
          use_ai_rerank?: boolean
          weight_behavior?: number
          weight_performance?: number
          weight_priority?: number
          weight_relevance?: number
          weight_trip_context?: number
        }
        Relationships: []
      }
      sponsor_benefit_claims: {
        Row: {
          benefit_id: string
          claim_code: string
          created_at: string
          event_id: string | null
          id: string
          status: Database["public"]["Enums"]["sponsor_claim_status"]
          user_id: string
        }
        Insert: {
          benefit_id: string
          claim_code: string
          created_at?: string
          event_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["sponsor_claim_status"]
          user_id: string
        }
        Update: {
          benefit_id?: string
          claim_code?: string
          created_at?: string
          event_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["sponsor_claim_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_benefit_claims_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "sponsor_benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_benefit_claims_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_benefits: {
        Row: {
          applicable_trips: string[]
          claimed_count: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          quota: number | null
          sponsor_id: string
          terms: string | null
          title: string
          type: Database["public"]["Enums"]["sponsor_benefit_type"]
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          applicable_trips?: string[]
          claimed_count?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          quota?: number | null
          sponsor_id: string
          terms?: string | null
          title: string
          type?: Database["public"]["Enums"]["sponsor_benefit_type"]
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          applicable_trips?: string[]
          claimed_count?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          quota?: number | null
          sponsor_id?: string
          terms?: string | null
          title?: string
          type?: Database["public"]["Enums"]["sponsor_benefit_type"]
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_benefits_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_blacklist: {
        Row: {
          created_at: string
          id: string
          segment: string
          sponsor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          segment: string
          sponsor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          segment?: string
          sponsor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_blacklist_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_boosts: {
        Row: {
          boost_multiplier: number
          created_at: string
          expires_at: string | null
          id: string
          sponsor_id: string
        }
        Insert: {
          boost_multiplier?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          sponsor_id: string
        }
        Update: {
          boost_multiplier?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          sponsor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_boosts_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_events: {
        Row: {
          created_at: string
          event_id: string | null
          event_type: Database["public"]["Enums"]["sponsor_event_type"]
          id: string
          metadata: Json | null
          revenue_amount: number
          sponsor_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          event_type: Database["public"]["Enums"]["sponsor_event_type"]
          id?: string
          metadata?: Json | null
          revenue_amount?: number
          sponsor_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          event_type?: Database["public"]["Enums"]["sponsor_event_type"]
          id?: string
          metadata?: Json | null
          revenue_amount?: number
          sponsor_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_events_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_media: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          sponsor_id: string
          title: string | null
          type: Database["public"]["Enums"]["sponsor_media_type"]
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number
          sponsor_id: string
          title?: string | null
          type?: Database["public"]["Enums"]["sponsor_media_type"]
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          sponsor_id?: string
          title?: string | null
          type?: Database["public"]["Enums"]["sponsor_media_type"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_media_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_packages: {
        Row: {
          base_price: number
          cost_per_click: number
          cost_per_conversion: number
          cost_per_lead: number
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          package_type: Database["public"]["Enums"]["sponsor_package_type"]
          sponsor_id: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          base_price?: number
          cost_per_click?: number
          cost_per_conversion?: number
          cost_per_lead?: number
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          package_type?: Database["public"]["Enums"]["sponsor_package_type"]
          sponsor_id: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          cost_per_click?: number
          cost_per_conversion?: number
          cost_per_lead?: number
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          package_type?: Database["public"]["Enums"]["sponsor_package_type"]
          sponsor_id?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_packages_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_performance_daily: {
        Row: {
          clicks: number
          conversions: number
          date: string
          impressions: number
          leads: number
          revenue: number
          sponsor_id: string
        }
        Insert: {
          clicks?: number
          conversions?: number
          date: string
          impressions?: number
          leads?: number
          revenue?: number
          sponsor_id: string
        }
        Update: {
          clicks?: number
          conversions?: number
          date?: string
          impressions?: number
          leads?: number
          revenue?: number
          sponsor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_performance_daily_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_trip_relations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          priority: number
          sponsor_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          priority?: number
          sponsor_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          priority?: number
          sponsor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_trip_relations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_trip_relations_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_user_scores: {
        Row: {
          computed_at: string
          reason: Json
          score: number
          sponsor_id: string
          user_id: string
        }
        Insert: {
          computed_at?: string
          reason?: Json
          score?: number
          sponsor_id: string
          user_id: string
        }
        Update: {
          computed_at?: string
          reason?: Json
          score?: number
          sponsor_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_user_scores_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          category: Database["public"]["Enums"]["sponsor_category"]
          created_at: string
          description: string | null
          hero_image_url: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          status: Database["public"]["Enums"]["sponsor_status"]
          tagline: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["sponsor_category"]
          created_at?: string
          description?: string | null
          hero_image_url?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          status?: Database["public"]["Enums"]["sponsor_status"]
          tagline?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["sponsor_category"]
          created_at?: string
          description?: string | null
          hero_image_url?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["sponsor_status"]
          tagline?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      tracking_recipients: {
        Row: {
          access_token: string
          created_at: string
          id: string
          last_accessed_at: string | null
          name: string
          phone: string
          session_id: string
        }
        Insert: {
          access_token?: string
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          name?: string
          phone?: string
          session_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          name?: string
          phone?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_recipients_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tracking_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          event_id: string
          expires_at: string
          google_maps_url: string
          id: string
          notes: string | null
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          event_id: string
          expires_at: string
          google_maps_url?: string
          id?: string
          notes?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          event_id?: string
          expires_at?: string
          google_maps_url?: string
          id?: string
          notes?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
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
          scheduled_at: string | null
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
          scheduled_at?: string | null
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
          scheduled_at?: string | null
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
      user_achievements: {
        Row: {
          achievement_code: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_code: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_code?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_code_fkey"
            columns: ["achievement_code"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["code"]
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
      vendors: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_revoke_achievement: {
        Args: { _code: string; _user_id: string }
        Returns: undefined
      }
      admin_set_rider_overrides: {
        Args: {
          _achievement_codes: string[]
          _km: number
          _trips: number
          _trust_score: number
          _user_id: string
        }
        Returns: undefined
      }
      claim_sponsor_benefit: {
        Args: { _benefit_id: string; _event_id?: string }
        Returns: {
          claim_code: string
          claim_id: string
        }[]
      }
      create_registration_with_rentals: {
        Args: { _event_id: string; _payload: Json; _rentals?: Json }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      difficulty_to_int: { Args: { _d: string }; Returns: number }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_unique_username: { Args: { _seed: string }; Returns: string }
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
      get_event_interest_counts: {
        Args: never
        Returns: {
          event_id: string
          interest_count: number
        }[]
      }
      get_product_availability: {
        Args: { _end_date?: string; _product_id: string; _start_date?: string }
        Returns: {
          available_to_buy: number
          available_to_rent: number
          currently_rented: number
          sold: number
          total_inventory: number
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
      get_rider_public_profile: {
        Args: { _username: string }
        Returns: {
          avatar_url: string
          banner_url: string
          bio: string
          follower_count: number
          following_count: number
          location: string
          member_since: string
          name: string
          riding_style: string
          total_km: number
          total_trips: number
          trust_score: number
          user_id: string
          username: string
        }[]
      }
      get_sponsor_performance: {
        Args: { _end?: string; _sponsor_id: string; _start?: string }
        Returns: {
          clicks: number
          conversion_rate: number
          conversions: number
          date: string
          estimated_payout: number
          impressions: number
          leads: number
          revenue: number
          total_clicks: number
          total_conversions: number
          total_impressions: number
          total_leads: number
          total_revenue: number
        }[]
      }
      get_tracking_by_token: {
        Args: { _token: string }
        Returns: {
          ended_at: string
          event_date: string
          event_end_date: string
          event_location: string
          event_title: string
          expires_at: string
          google_maps_url: string
          notes: string
          participant_name: string
          participant_phone: string
          recipient_name: string
          session_id: string
          started_at: string
          status: string
        }[]
      }
      get_user_stats: {
        Args: never
        Returns: {
          total_km: number
          total_payments: number
          total_trips: number
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
      increment_share_count: {
        Args: { _content_id: string; _content_type: string }
        Returns: number
      }
      is_confirmed_participant: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      recalc_rider_stats: { Args: { _user_id: string }; Returns: undefined }
      recommend_rental_gear: {
        Args: { _event_id: string; _motor_brand?: string; _motor_type?: string }
        Returns: {
          available_qty: number
          daily_rent_price: number
          description: string
          gear_type: string
          image_url: string
          name: string
          product_id: string
          reason: Json
          rent_deposit: number
          score: number
          subtotal: number
          trip_days: number
          vendor_id: string
          vendor_logo_url: string
          vendor_name: string
        }[]
      }
      slugify: { Args: { _input: string }; Returns: string }
      track_sponsor_event: {
        Args: {
          _event_id?: string
          _event_type: Database["public"]["Enums"]["sponsor_event_type"]
          _metadata?: Json
          _revenue?: number
          _sponsor_id: string
        }
        Returns: string
      }
      user_has_active_tracking: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "vendor"
      gear_rental_status:
        | "pending"
        | "confirmed"
        | "picked_up"
        | "returned"
        | "cancelled"
      sponsor_benefit_type:
        | "discount"
        | "free_item"
        | "experience"
        | "test_ride"
      sponsor_category:
        | "dealer"
        | "gear"
        | "accessories"
        | "apparel"
        | "service"
        | "other"
      sponsor_claim_status: "pending" | "claimed" | "used"
      sponsor_event_type: "impression" | "click" | "lead" | "conversion"
      sponsor_media_type: "banner" | "campaign" | "video"
      sponsor_package_type: "bronze" | "silver" | "gold" | "custom"
      sponsor_status: "active" | "inactive"
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
      app_role: ["admin", "user", "vendor"],
      gear_rental_status: [
        "pending",
        "confirmed",
        "picked_up",
        "returned",
        "cancelled",
      ],
      sponsor_benefit_type: [
        "discount",
        "free_item",
        "experience",
        "test_ride",
      ],
      sponsor_category: [
        "dealer",
        "gear",
        "accessories",
        "apparel",
        "service",
        "other",
      ],
      sponsor_claim_status: ["pending", "claimed", "used"],
      sponsor_event_type: ["impression", "click", "lead", "conversion"],
      sponsor_media_type: ["banner", "campaign", "video"],
      sponsor_package_type: ["bronze", "silver", "gold", "custom"],
      sponsor_status: ["active", "inactive"],
    },
  },
} as const
