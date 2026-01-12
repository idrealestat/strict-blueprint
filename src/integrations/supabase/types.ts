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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      business_cards: {
        Row: {
          created_at: string
          data: Json
          email: string | null
          fal_license_number: string | null
          id: string
          national_id: string | null
          phone: string | null
          privacy_settings: Json | null
          publish_token_hash: string | null
          published: boolean
          slug: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          email?: string | null
          fal_license_number?: string | null
          id?: string
          national_id?: string | null
          phone?: string | null
          privacy_settings?: Json | null
          publish_token_hash?: string | null
          published?: boolean
          slug?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          email?: string | null
          fal_license_number?: string | null
          id?: string
          national_id?: string | null
          phone?: string | null
          privacy_settings?: Json | null
          publish_token_hash?: string | null
          published?: boolean
          slug?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_feature_rules: {
        Row: {
          account_type: string
          business_card_add_colleague_enabled: boolean | null
          created_at: string
          id: string
          left_slider_enabled: boolean | null
          notes: string | null
          offers_requests_enabled: boolean | null
          official_business_card_enabled: boolean | null
          publishing_enabled: boolean | null
          quick_calculator_enabled: boolean | null
          right_slider_mediation_course_enabled: boolean | null
          right_slider_owner_panel_enabled: boolean | null
          right_slider_team_management_enabled: boolean | null
          right_slider_workspace_enabled: boolean | null
          smart_paths_enabled: boolean | null
          spatial_intelligence_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          account_type: string
          business_card_add_colleague_enabled?: boolean | null
          created_at?: string
          id?: string
          left_slider_enabled?: boolean | null
          notes?: string | null
          offers_requests_enabled?: boolean | null
          official_business_card_enabled?: boolean | null
          publishing_enabled?: boolean | null
          quick_calculator_enabled?: boolean | null
          right_slider_mediation_course_enabled?: boolean | null
          right_slider_owner_panel_enabled?: boolean | null
          right_slider_team_management_enabled?: boolean | null
          right_slider_workspace_enabled?: boolean | null
          smart_paths_enabled?: boolean | null
          spatial_intelligence_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          account_type?: string
          business_card_add_colleague_enabled?: boolean | null
          created_at?: string
          id?: string
          left_slider_enabled?: boolean | null
          notes?: string | null
          offers_requests_enabled?: boolean | null
          official_business_card_enabled?: boolean | null
          publishing_enabled?: boolean | null
          quick_calculator_enabled?: boolean | null
          right_slider_mediation_course_enabled?: boolean | null
          right_slider_owner_panel_enabled?: boolean | null
          right_slider_team_management_enabled?: boolean | null
          right_slider_workspace_enabled?: boolean | null
          smart_paths_enabled?: boolean | null
          spatial_intelligence_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      calendar_appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          appointment_type: string
          created_at: string
          customer_name: string
          customer_phone: string | null
          duration: number | null
          id: string
          location: string | null
          notes: string | null
          property_id: string | null
          property_title: string | null
          reminder: boolean | null
          reminder_time: number | null
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          appointment_type?: string
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          duration?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          property_id?: string | null
          property_title?: string | null
          reminder?: boolean | null
          reminder_time?: number | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          appointment_type?: string
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          duration?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          property_id?: string | null
          property_title?: string | null
          reminder?: boolean | null
          reminder_time?: number | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      crm_custom_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_customers: {
        Row: {
          budget: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          last_contact: string | null
          location: string | null
          metadata: Json | null
          name: string
          next_follow_up: string | null
          notes: string | null
          phone: string | null
          priority: string | null
          property_type: string | null
          source: string | null
          status: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          budget?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contact?: string | null
          location?: string | null
          metadata?: Json | null
          name: string
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          priority?: string | null
          property_type?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          budget?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contact?: string | null
          location?: string | null
          metadata?: Json | null
          name?: string
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          priority?: string | null
          property_type?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      crm_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_blacklist: {
        Row: {
          category: string | null
          city: string | null
          company_name: string
          company_name_en: string | null
          confidence_level: number | null
          created_at: string
          domain: string | null
          domain_root: string | null
          id: string
          is_active: boolean | null
          source: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          city?: string | null
          company_name: string
          company_name_en?: string | null
          confidence_level?: number | null
          created_at?: string
          domain?: string | null
          domain_root?: string | null
          id?: string
          is_active?: boolean | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          city?: string | null
          company_name?: string
          company_name_en?: string | null
          confidence_level?: number | null
          created_at?: string
          domain?: string | null
          domain_root?: string | null
          id?: string
          is_active?: boolean | null
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      domain_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          request_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          request_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          request_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "domain_notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "domain_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_requests: {
        Row: {
          account_type: string | null
          admin_notes: string | null
          alternative_suggestions: string[] | null
          company_name: string | null
          created_at: string
          id: string
          matched_company: string | null
          notified_at: string | null
          official_domain_verified: boolean | null
          original_owner_claimed: boolean | null
          owner_type: string | null
          price: number | null
          price_enabled: boolean | null
          priority_level: number | null
          priority_revoked: boolean | null
          priority_revoked_at: string | null
          rejection_reason: string | null
          requested_title: string
          reviewed_at: string | null
          reviewed_by: string | null
          source: string | null
          status: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          account_type?: string | null
          admin_notes?: string | null
          alternative_suggestions?: string[] | null
          company_name?: string | null
          created_at?: string
          id?: string
          matched_company?: string | null
          notified_at?: string | null
          official_domain_verified?: boolean | null
          original_owner_claimed?: boolean | null
          owner_type?: string | null
          price?: number | null
          price_enabled?: boolean | null
          priority_level?: number | null
          priority_revoked?: boolean | null
          priority_revoked_at?: string | null
          rejection_reason?: string | null
          requested_title: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          account_type?: string | null
          admin_notes?: string | null
          alternative_suggestions?: string[] | null
          company_name?: string | null
          created_at?: string
          id?: string
          matched_company?: string | null
          notified_at?: string | null
          official_domain_verified?: boolean | null
          original_owner_claimed?: boolean | null
          owner_type?: string | null
          price?: number | null
          price_enabled?: boolean | null
          priority_level?: number | null
          priority_revoked?: boolean | null
          priority_revoked_at?: string | null
          rejection_reason?: string | null
          requested_title?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      domain_settings: {
        Row: {
          created_at: string
          default_price: number | null
          id: string
          pricing_enabled: boolean | null
          priority_warning_enabled: boolean | null
          priority_warning_message: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_price?: number | null
          id?: string
          pricing_enabled?: boolean | null
          priority_warning_enabled?: boolean | null
          priority_warning_message?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_price?: number | null
          id?: string
          pricing_enabled?: boolean | null
          priority_warning_enabled?: boolean | null
          priority_warning_message?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          actor_type: string
          browser: string | null
          channel: string
          created_at: string
          device: string | null
          entity_id: string | null
          entity_type: string | null
          event_name: string
          id: string
          ip_address: string | null
          metadata: Json | null
          os: string | null
          user_id: string | null
          viewer_id: string | null
        }
        Insert: {
          actor_type?: string
          browser?: string | null
          channel?: string
          created_at?: string
          device?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_name: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          os?: string | null
          user_id?: string | null
          viewer_id?: string | null
        }
        Update: {
          actor_type?: string
          browser?: string | null
          channel?: string
          created_at?: string
          device?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_name?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          os?: string | null
          user_id?: string | null
          viewer_id?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          business_card_add_colleague_enabled: boolean | null
          created_at: string
          id: string
          left_slider_enabled: boolean | null
          offers_requests_enabled: boolean | null
          official_business_card_enabled: boolean | null
          publishing_enabled: boolean | null
          quick_calculator_enabled: boolean | null
          right_slider_mediation_course_enabled: boolean | null
          right_slider_owner_panel_enabled: boolean | null
          right_slider_team_management_enabled: boolean | null
          right_slider_workspace_enabled: boolean | null
          smart_paths_enabled: boolean | null
          spatial_intelligence_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_card_add_colleague_enabled?: boolean | null
          created_at?: string
          id?: string
          left_slider_enabled?: boolean | null
          offers_requests_enabled?: boolean | null
          official_business_card_enabled?: boolean | null
          publishing_enabled?: boolean | null
          quick_calculator_enabled?: boolean | null
          right_slider_mediation_course_enabled?: boolean | null
          right_slider_owner_panel_enabled?: boolean | null
          right_slider_team_management_enabled?: boolean | null
          right_slider_workspace_enabled?: boolean | null
          smart_paths_enabled?: boolean | null
          spatial_intelligence_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_card_add_colleague_enabled?: boolean | null
          created_at?: string
          id?: string
          left_slider_enabled?: boolean | null
          offers_requests_enabled?: boolean | null
          official_business_card_enabled?: boolean | null
          publishing_enabled?: boolean | null
          quick_calculator_enabled?: boolean | null
          right_slider_mediation_course_enabled?: boolean | null
          right_slider_owner_panel_enabled?: boolean | null
          right_slider_team_management_enabled?: boolean | null
          right_slider_workspace_enabled?: boolean | null
          smart_paths_enabled?: boolean | null
          spatial_intelligence_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      forbidden_patterns: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          pattern: string
          pattern_type: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          pattern: string
          pattern_type?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          pattern?: string
          pattern_type?: string | null
        }
        Relationships: []
      }
      global_feature_defaults: {
        Row: {
          business_card_add_colleague_enabled: boolean | null
          created_at: string
          id: string
          left_slider_enabled: boolean | null
          offers_requests_enabled: boolean | null
          official_business_card_enabled: boolean | null
          publishing_enabled: boolean | null
          quick_calculator_enabled: boolean | null
          right_slider_mediation_course_enabled: boolean | null
          right_slider_owner_panel_enabled: boolean | null
          right_slider_team_management_enabled: boolean | null
          right_slider_workspace_enabled: boolean | null
          smart_paths_enabled: boolean | null
          spatial_intelligence_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          business_card_add_colleague_enabled?: boolean | null
          created_at?: string
          id?: string
          left_slider_enabled?: boolean | null
          offers_requests_enabled?: boolean | null
          official_business_card_enabled?: boolean | null
          publishing_enabled?: boolean | null
          quick_calculator_enabled?: boolean | null
          right_slider_mediation_course_enabled?: boolean | null
          right_slider_owner_panel_enabled?: boolean | null
          right_slider_team_management_enabled?: boolean | null
          right_slider_workspace_enabled?: boolean | null
          smart_paths_enabled?: boolean | null
          spatial_intelligence_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          business_card_add_colleague_enabled?: boolean | null
          created_at?: string
          id?: string
          left_slider_enabled?: boolean | null
          offers_requests_enabled?: boolean | null
          official_business_card_enabled?: boolean | null
          publishing_enabled?: boolean | null
          quick_calculator_enabled?: boolean | null
          right_slider_mediation_course_enabled?: boolean | null
          right_slider_owner_panel_enabled?: boolean | null
          right_slider_team_management_enabled?: boolean | null
          right_slider_workspace_enabled?: boolean | null
          smart_paths_enabled?: boolean | null
          spatial_intelligence_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      map_areas: {
        Row: {
          area_code: string | null
          area_type: string
          boundary_coordinates: Json
          center_latitude: number | null
          center_longitude: number | null
          created_at: string | null
          id: string
          name_ar: string
          name_en: string | null
          properties: Json | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          area_code?: string | null
          area_type?: string
          boundary_coordinates: Json
          center_latitude?: number | null
          center_longitude?: number | null
          created_at?: string | null
          id?: string
          name_ar: string
          name_en?: string | null
          properties?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          area_code?: string | null
          area_type?: string
          boundary_coordinates?: Json
          center_latitude?: number | null
          center_longitude?: number | null
          created_at?: string | null
          id?: string
          name_ar?: string
          name_en?: string | null
          properties?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      map_locations: {
        Row: {
          city: string | null
          created_at: string | null
          description: string | null
          district: string | null
          formatted_address: string | null
          id: string
          latitude: number
          location_code: string | null
          location_type: string
          longitude: number
          name_ar: string
          name_en: string | null
          phone: string | null
          properties: Json | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          description?: string | null
          district?: string | null
          formatted_address?: string | null
          id?: string
          latitude: number
          location_code?: string | null
          location_type?: string
          longitude: number
          name_ar: string
          name_en?: string | null
          phone?: string | null
          properties?: Json | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          description?: string | null
          district?: string | null
          formatted_address?: string | null
          id?: string
          latitude?: number
          location_code?: string | null
          location_type?: string
          longitude?: number
          name_ar?: string
          name_en?: string | null
          phone?: string | null
          properties?: Json | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      map_routes: {
        Row: {
          created_at: string | null
          description: string | null
          end_location_id: string | null
          estimated_duration: number | null
          id: string
          name_ar: string
          name_en: string | null
          path_coordinates: Json | null
          route_code: string | null
          route_type: string
          start_location_id: string | null
          status: string | null
          total_distance: number | null
          updated_at: string | null
          user_id: string | null
          waypoints: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_location_id?: string | null
          estimated_duration?: number | null
          id?: string
          name_ar: string
          name_en?: string | null
          path_coordinates?: Json | null
          route_code?: string | null
          route_type?: string
          start_location_id?: string | null
          status?: string | null
          total_distance?: number | null
          updated_at?: string | null
          user_id?: string | null
          waypoints?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_location_id?: string | null
          estimated_duration?: number | null
          id?: string
          name_ar?: string
          name_en?: string | null
          path_coordinates?: Json | null
          route_code?: string | null
          route_type?: string
          start_location_id?: string | null
          status?: string | null
          total_distance?: number | null
          updated_at?: string | null
          user_id?: string | null
          waypoints?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "map_routes_end_location_id_fkey"
            columns: ["end_location_id"]
            isOneToOne: false
            referencedRelation: "map_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_routes_start_location_id_fkey"
            columns: ["start_location_id"]
            isOneToOne: false
            referencedRelation: "map_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          category: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          priority: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          category?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          priority?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          category?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          priority?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      offer_views_log: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          offer_id: string
          offer_title: string | null
          os: string | null
          referrer: string | null
          session_id: string | null
          user_id: string
          view_duration: number | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          offer_id: string
          offer_title?: string | null
          os?: string | null
          referrer?: string | null
          session_id?: string | null
          user_id: string
          view_duration?: number | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          offer_id?: string
          offer_title?: string | null
          os?: string | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string
          view_duration?: number | null
        }
        Relationships: []
      }
      platform_listings: {
        Row: {
          ac_units: string | null
          ad_license: string | null
          age: number | null
          area: number | null
          balconies: string | null
          bathrooms: number | null
          bedrooms: number | null
          broker_phone: string | null
          category: string | null
          city: string
          corner_type: string | null
          councils: string | null
          created_at: string
          curtains: string | null
          custom_hashtags: string[] | null
          deed_date: string | null
          deed_number: string | null
          deleted_at: string | null
          description: string | null
          direction: string | null
          district: string
          entrances: string | null
          extra_kitchen_appliances: string | null
          features: string[] | null
          floor_number: string | null
          floors: string | null
          furnishing: string | null
          has_extra_kitchen: boolean | null
          has_laundry_room: boolean | null
          hashtags: string[] | null
          id: string
          image: string | null
          images: string[] | null
          is_hidden: boolean | null
          is_pinned: boolean | null
          lat: number | null
          living_rooms: string | null
          lng: number | null
          owner_name: string | null
          owner_phone: string | null
          payment_option: string | null
          payment_prices: Json | null
          price: number
          property_type: string
          purpose: string | null
          slug: string
          smart_path: string | null
          status: string
          street: string | null
          street_width: string | null
          title: string
          tour_3d_url: string | null
          updated_at: string
          user_id: string | null
          video_url: string | null
          views: number | null
          warehouses: string | null
          warranties: Json | null
        }
        Insert: {
          ac_units?: string | null
          ad_license?: string | null
          age?: number | null
          area?: number | null
          balconies?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          broker_phone?: string | null
          category?: string | null
          city: string
          corner_type?: string | null
          councils?: string | null
          created_at?: string
          curtains?: string | null
          custom_hashtags?: string[] | null
          deed_date?: string | null
          deed_number?: string | null
          deleted_at?: string | null
          description?: string | null
          direction?: string | null
          district: string
          entrances?: string | null
          extra_kitchen_appliances?: string | null
          features?: string[] | null
          floor_number?: string | null
          floors?: string | null
          furnishing?: string | null
          has_extra_kitchen?: boolean | null
          has_laundry_room?: boolean | null
          hashtags?: string[] | null
          id?: string
          image?: string | null
          images?: string[] | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          lat?: number | null
          living_rooms?: string | null
          lng?: number | null
          owner_name?: string | null
          owner_phone?: string | null
          payment_option?: string | null
          payment_prices?: Json | null
          price?: number
          property_type?: string
          purpose?: string | null
          slug: string
          smart_path?: string | null
          status?: string
          street?: string | null
          street_width?: string | null
          title: string
          tour_3d_url?: string | null
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
          views?: number | null
          warehouses?: string | null
          warranties?: Json | null
        }
        Update: {
          ac_units?: string | null
          ad_license?: string | null
          age?: number | null
          area?: number | null
          balconies?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          broker_phone?: string | null
          category?: string | null
          city?: string
          corner_type?: string | null
          councils?: string | null
          created_at?: string
          curtains?: string | null
          custom_hashtags?: string[] | null
          deed_date?: string | null
          deed_number?: string | null
          deleted_at?: string | null
          description?: string | null
          direction?: string | null
          district?: string
          entrances?: string | null
          extra_kitchen_appliances?: string | null
          features?: string[] | null
          floor_number?: string | null
          floors?: string | null
          furnishing?: string | null
          has_extra_kitchen?: boolean | null
          has_laundry_room?: boolean | null
          hashtags?: string[] | null
          id?: string
          image?: string | null
          images?: string[] | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          lat?: number | null
          living_rooms?: string | null
          lng?: number | null
          owner_name?: string | null
          owner_phone?: string | null
          payment_option?: string | null
          payment_prices?: Json | null
          price?: number
          property_type?: string
          purpose?: string | null
          slug?: string
          smart_path?: string | null
          status?: string
          street?: string | null
          street_width?: string | null
          title?: string
          tour_3d_url?: string | null
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
          views?: number | null
          warehouses?: string | null
          warranties?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          birth_date: string | null
          commercial_reg_expiry: string | null
          commercial_reg_number: string | null
          company_name: string | null
          created_at: string
          email_verified: boolean | null
          fal_license_expiry: string | null
          fal_license_number: string | null
          full_name: string | null
          id: string
          license_number: string | null
          national_id: string | null
          office_address: string | null
          office_lat: number | null
          office_lng: number | null
          phone: string | null
          phone_verified: boolean | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          commercial_reg_expiry?: string | null
          commercial_reg_number?: string | null
          company_name?: string | null
          created_at?: string
          email_verified?: boolean | null
          fal_license_expiry?: string | null
          fal_license_number?: string | null
          full_name?: string | null
          id?: string
          license_number?: string | null
          national_id?: string | null
          office_address?: string | null
          office_lat?: number | null
          office_lng?: number | null
          phone?: string | null
          phone_verified?: boolean | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          commercial_reg_expiry?: string | null
          commercial_reg_number?: string | null
          company_name?: string | null
          created_at?: string
          email_verified?: boolean | null
          fal_license_expiry?: string | null
          fal_license_number?: string | null
          full_name?: string | null
          id?: string
          license_number?: string | null
          national_id?: string | null
          office_address?: string | null
          office_lat?: number | null
          office_lng?: number | null
          phone?: string | null
          phone_verified?: boolean | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      received_documents: {
        Row: {
          city: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          data: Json | null
          district: string | null
          document_type: string
          id: string
          is_read: boolean | null
          notes: string | null
          property_type: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          data?: Json | null
          district?: string | null
          document_type: string
          id?: string
          is_read?: boolean | null
          notes?: string | null
          property_type?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          data?: Json | null
          district?: string | null
          document_type?: string
          id?: string
          is_read?: boolean | null
          notes?: string | null
          property_type?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_messages: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message: string
          message_type: string
          phone: string
          scheduled_time: string
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message: string
          message_type?: string
          phone: string
          scheduled_time: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string
          message_type?: string
          phone?: string
          scheduled_time?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      settings_change_log: {
        Row: {
          change_type: string
          changed_by_user_id: string
          created_at: string
          feature_key: string
          id: string
          new_value: boolean
          notes: string | null
          old_value: boolean | null
          target_account_type: string | null
          target_user_id: string | null
        }
        Insert: {
          change_type: string
          changed_by_user_id: string
          created_at?: string
          feature_key: string
          id?: string
          new_value: boolean
          notes?: string | null
          old_value?: boolean | null
          target_account_type?: string | null
          target_user_id?: string | null
        }
        Update: {
          change_type?: string
          changed_by_user_id?: string
          created_at?: string
          feature_key?: string
          id?: string
          new_value?: boolean
          notes?: string | null
          old_value?: boolean | null
          target_account_type?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      slug_firstname_exceptions: {
        Row: {
          allowed_city: string | null
          allowed_email: string | null
          allowed_plan: string | null
          allowed_user_id: string | null
          created_at: string
          first_name_normalized: string
          id: string
          is_enabled: boolean | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          allowed_city?: string | null
          allowed_email?: string | null
          allowed_plan?: string | null
          allowed_user_id?: string | null
          created_at?: string
          first_name_normalized: string
          id?: string
          is_enabled?: boolean | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          allowed_city?: string | null
          allowed_email?: string | null
          allowed_plan?: string | null
          allowed_user_id?: string | null
          created_at?: string
          first_name_normalized?: string
          id?: string
          is_enabled?: boolean | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      slug_registry: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          owner_user_id: string | null
          reserve_to_user_id: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          owner_user_id?: string | null
          reserve_to_user_id?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          owner_user_id?: string | null
          reserve_to_user_id?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      slug_rules: {
        Row: {
          created_at: string
          id: string
          max_slug_length: number | null
          min_slug_length: number | null
          reject_first_name_slugs: boolean | null
          reject_first_name_slugs_strict: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_slug_length?: number | null
          min_slug_length?: number | null
          reject_first_name_slugs?: boolean | null
          reject_first_name_slugs_strict?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_slug_length?: number | null
          min_slug_length?: number | null
          reject_first_name_slugs?: boolean | null
          reject_first_name_slugs_strict?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          appointment_id: string | null
          created_at: string
          error_message: string | null
          id: string
          message_content: string
          message_type: string | null
          recipient_phone: string
          sent_at: string | null
          status: string
          twilio_message_sid: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message_content: string
          message_type?: string | null
          recipient_phone: string
          sent_at?: string | null
          status?: string
          twilio_message_sid?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message_content?: string
          message_type?: string | null
          recipient_phone?: string
          sent_at?: string | null
          status?: string
          twilio_message_sid?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_feature_overrides: {
        Row: {
          business_card_add_colleague_enabled: boolean | null
          created_at: string
          email: string | null
          fal_license_number: string | null
          id: string
          left_slider_enabled: boolean | null
          notes: string | null
          offers_requests_enabled: boolean | null
          official_business_card_enabled: boolean | null
          publishing_enabled: boolean | null
          quick_calculator_enabled: boolean | null
          right_slider_mediation_course_enabled: boolean | null
          right_slider_owner_panel_enabled: boolean | null
          right_slider_team_management_enabled: boolean | null
          right_slider_workspace_enabled: boolean | null
          smart_paths_enabled: boolean | null
          spatial_intelligence_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_card_add_colleague_enabled?: boolean | null
          created_at?: string
          email?: string | null
          fal_license_number?: string | null
          id?: string
          left_slider_enabled?: boolean | null
          notes?: string | null
          offers_requests_enabled?: boolean | null
          official_business_card_enabled?: boolean | null
          publishing_enabled?: boolean | null
          quick_calculator_enabled?: boolean | null
          right_slider_mediation_course_enabled?: boolean | null
          right_slider_owner_panel_enabled?: boolean | null
          right_slider_team_management_enabled?: boolean | null
          right_slider_workspace_enabled?: boolean | null
          smart_paths_enabled?: boolean | null
          spatial_intelligence_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_card_add_colleague_enabled?: boolean | null
          created_at?: string
          email?: string | null
          fal_license_number?: string | null
          id?: string
          left_slider_enabled?: boolean | null
          notes?: string | null
          offers_requests_enabled?: boolean | null
          official_business_card_enabled?: boolean | null
          publishing_enabled?: boolean | null
          quick_calculator_enabled?: boolean | null
          right_slider_mediation_course_enabled?: boolean | null
          right_slider_owner_panel_enabled?: boolean | null
          right_slider_team_management_enabled?: boolean | null
          right_slider_workspace_enabled?: boolean | null
          smart_paths_enabled?: boolean | null
          spatial_intelligence_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          code: string
          created_at: string | null
          email: string | null
          expires_at: string
          id: string
          identifier: string | null
          phone: string | null
          type: string
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email?: string | null
          expires_at: string
          id?: string
          identifier?: string | null
          phone?: string | null
          type: string
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          identifier?: string | null
          phone?: string | null
          type?: string
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      wasata_ai_conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wasata_ai_messages: {
        Row: {
          actions: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          actions?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          actions?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "wasata_ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "wasata_ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_business_card_ownership: {
        Args: {
          card_email: string
          card_fal_license: string
          card_national_id: string
          card_phone: string
          card_user_id: string
        }
        Returns: boolean
      }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "user"
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
      app_role: ["owner", "admin", "user"],
    },
  },
} as const
