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
          id: string
          publish_token_hash: string | null
          published: boolean
          slug: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          publish_token_hash?: string | null
          published?: boolean
          slug?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          publish_token_hash?: string | null
          published?: boolean
          slug?: string | null
          updated_at?: string
          user_id?: string
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
