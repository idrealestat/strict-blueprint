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
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          publish_token_hash?: string | null
          published?: boolean
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          publish_token_hash?: string | null
          published?: boolean
          slug?: string
          updated_at?: string
          user_id?: string
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
          video_url?: string | null
          views?: number | null
          warehouses?: string | null
          warranties?: Json | null
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
