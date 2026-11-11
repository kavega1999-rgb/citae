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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appointment_services: {
        Row: {
          appointment_id: string
          business_id: string
          created_at: string
          display_order: number
          duration_minutes: number
          id: string
          service_id: string
          service_name: string
          unit_price: number
        }
        Insert: {
          appointment_id: string
          business_id?: string
          created_at?: string
          display_order?: number
          duration_minutes: number
          id?: string
          service_id: string
          service_name: string
          unit_price: number
        }
        Update: {
          appointment_id?: string
          business_id?: string
          created_at?: string
          display_order?: number
          duration_minutes?: number
          id?: string
          service_id?: string
          service_name?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_tenant_appointment"
            columns: ["business_id", "appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "appointment_services_tenant_service"
            columns: ["business_id", "service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["business_id", "id"]
          },
        ]
      }
      appointments: {
        Row: {
          access_token_hash: string | null
          admin_notes: string | null
          buffer_minutes: number
          business_id: string
          cancellation_reason: string | null
          client_id: string
          client_notes: string | null
          created_at: string
          created_by: string | null
          duration_is_manual: boolean
          duration_minutes: number
          end_at: string
          id: string
          payment_deadline_at: string | null
          professional_id: string | null
          start_at: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          access_token_hash?: string | null
          admin_notes?: string | null
          buffer_minutes?: number
          business_id?: string
          cancellation_reason?: string | null
          client_id: string
          client_notes?: string | null
          created_at?: string
          created_by?: string | null
          duration_is_manual?: boolean
          duration_minutes: number
          end_at: string
          id?: string
          payment_deadline_at?: string | null
          professional_id?: string | null
          start_at: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          access_token_hash?: string | null
          admin_notes?: string | null
          buffer_minutes?: number
          business_id?: string
          cancellation_reason?: string | null
          client_id?: string
          client_notes?: string | null
          created_at?: string
          created_by?: string | null
          duration_is_manual?: boolean
          duration_minutes?: number
          end_at?: string
          id?: string
          payment_deadline_at?: string | null
          professional_id?: string | null
          start_at?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_tenant_client"
            columns: ["business_id", "client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "appointments_tenant_professional"
            columns: ["business_id", "professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["business_id", "id"]
          },
        ]
      }
      blocked_slots: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          end_at: string
          id: string
          reason: string | null
          start_at: string
        }
        Insert: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          end_at: string
          id?: string
          reason?: string | null
          start_at: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          end_at?: string
          id?: string
          reason?: string | null
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_slots_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_slots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hour_slots: {
        Row: {
          business_hours_id: string
          business_id: string
          created_at: string
          display_order: number
          id: string
          slot_time: string
        }
        Insert: {
          business_hours_id: string
          business_id?: string
          created_at?: string
          display_order?: number
          id?: string
          slot_time: string
        }
        Update: {
          business_hours_id?: string
          business_id?: string
          created_at?: string
          display_order?: number
          id?: string
          slot_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_hour_slots_business_hours_id_fkey"
            columns: ["business_hours_id"]
            isOneToOne: false
            referencedRelation: "business_hours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_hour_slots_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_hour_slots_tenant_hours"
            columns: ["business_id", "business_hours_id"]
            isOneToOne: false
            referencedRelation: "business_hours"
            referencedColumns: ["business_id", "id"]
          },
        ]
      }
      business_hours: {
        Row: {
          business_id: string
          closes_at: string
          created_at: string
          id: string
          interval_minutes: number
          is_active: boolean
          opens_at: string
          slot_mode: string
          updated_at: string
          weekday: number
        }
        Insert: {
          business_id?: string
          closes_at: string
          created_at?: string
          id?: string
          interval_minutes?: number
          is_active?: boolean
          opens_at: string
          slot_mode?: string
          updated_at?: string
          weekday: number
        }
        Update: {
          business_id?: string
          closes_at?: string
          created_at?: string
          id?: string
          interval_minutes?: number
          is_active?: boolean
          opens_at?: string
          slot_mode?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          account_holder: string | null
          account_number: string | null
          account_type: string | null
          bank_name: string | null
          buffer_minutes: number
          business_id: string
          business_name: string
          cancellation_policy: string | null
          created_at: string
          currency: string
          daviplata_number: string | null
          deposit_percentage: number
          hold_minutes: number
          id: string
          nequi_number: string | null
          payment_instructions: string | null
          requires_deposit: boolean
          singleton_key: boolean
          timezone: string
          updated_at: string
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          account_type?: string | null
          bank_name?: string | null
          buffer_minutes?: number
          business_id?: string
          business_name?: string
          cancellation_policy?: string | null
          created_at?: string
          currency?: string
          daviplata_number?: string | null
          deposit_percentage?: number
          hold_minutes?: number
          id?: string
          nequi_number?: string | null
          payment_instructions?: string | null
          requires_deposit?: boolean
          singleton_key?: boolean
          timezone?: string
          updated_at?: string
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          account_type?: string | null
          bank_name?: string | null
          buffer_minutes?: number
          business_id?: string
          business_name?: string
          cancellation_policy?: string | null
          created_at?: string
          currency?: string
          daviplata_number?: string | null
          deposit_percentage?: number
          hold_minutes?: number
          id?: string
          nequi_number?: string | null
          payment_instructions?: string | null
          requires_deposit?: boolean
          singleton_key?: boolean
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          activity: string
          agenda_mode: string
          created_at: string
          id: string
          is_legacy: boolean
          logo_path: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          activity?: string
          agenda_mode?: string
          created_at?: string
          id?: string
          is_legacy?: boolean
          logo_path?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          activity?: string
          agenda_mode?: string
          created_at?: string
          id?: string
          is_legacy?: boolean
          logo_path?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          business_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          business_id?: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string
          business_id: string
          created_at: string
          id: string
          payment_method: string
          payment_type: string
          proof_path: string | null
          reference_number: string | null
          rejection_reason: string | null
          status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          appointment_id: string
          business_id?: string
          created_at?: string
          id?: string
          payment_method: string
          payment_type: string
          proof_path?: string | null
          reference_number?: string | null
          rejection_reason?: string | null
          status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string
          business_id?: string
          created_at?: string
          id?: string
          payment_method?: string
          payment_type?: string
          proof_path?: string | null
          reference_number?: string | null
          rejection_reason?: string | null
          status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_appointment"
            columns: ["business_id", "appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_hours: {
        Row: {
          business_id: string
          closes_at: string
          created_at: string
          id: string
          opens_at: string
          professional_id: string
          updated_at: string
          weekday: number
        }
        Insert: {
          business_id?: string
          closes_at: string
          created_at?: string
          id?: string
          opens_at: string
          professional_id: string
          updated_at?: string
          weekday: number
        }
        Update: {
          business_id?: string
          closes_at?: string
          created_at?: string
          id?: string
          opens_at?: string
          professional_id?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "professional_hours_tenant_professional"
            columns: ["business_id", "professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["business_id", "id"]
          },
        ]
      }
      professional_services: {
        Row: {
          business_id: string
          created_at: string
          id: string
          professional_id: string
          service_id: string
        }
        Insert: {
          business_id?: string
          created_at?: string
          id?: string
          professional_id: string
          service_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          professional_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_tenant_professional"
            columns: ["business_id", "professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "professional_services_tenant_service"
            columns: ["business_id", "service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["business_id", "id"]
          },
        ]
      }
      professionals: {
        Row: {
          business_id: string
          created_at: string
          display_order: number
          full_name: string
          id: string
          is_active: boolean
          photo_path: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          business_id?: string
          created_at?: string
          display_order?: number
          full_name: string
          id?: string
          is_active?: boolean
          photo_path?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          display_order?: number
          full_name?: string
          id?: string
          is_active?: boolean
          photo_path?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professionals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_business_id: string | null
          created_at: string
          full_name: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          active_business_id?: string | null
          created_at?: string
          full_name: string
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          active_business_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_business_id_fkey"
            columns: ["active_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          display_order: number
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          business_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          duration_minutes: number
          id?: string
          is_active?: boolean
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          business_id: string
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_payment: { Args: { p_payment_id: string }; Returns: boolean }
      create_my_business: {
        Args: {
          p_activity: string
          p_agenda_mode: string
          p_name: string
          p_slug: string
        }
        Returns: string
      }
      create_public_appointment: {
        Args: {
          p_client_notes?: string
          p_email: string
          p_full_name: string
          p_payment_method: string
          p_phone: string
          p_service_ids: string[]
          p_start_at: string
        }
        Returns: {
          appointment_id: string
          payment_amount: number
          payment_deadline_at: string
          payment_id: string
          total_amount: number
        }[]
      }
      create_public_appointment_v2: {
        Args: {
          p_business_slug?: string
          p_client_notes?: string
          p_email: string
          p_full_name: string
          p_payment_method: string
          p_phone: string
          p_professional_id?: string
          p_service_ids: string[]
          p_start_at: string
        }
        Returns: {
          access_token: string
          appointment_id: string
          payment_amount: number
          payment_deadline_at: string
          payment_id: string
          total_amount: number
        }[]
      }
      current_business_id: { Args: never; Returns: string }
      expire_pending_appointments: { Args: never; Returns: number }
      get_available_slots: {
        Args: {
          p_business_slug?: string
          p_date: string
          p_professional_id?: string
          p_service_ids: string[]
        }
        Returns: {
          slot_end: string
          slot_start: string
          total_amount: number
          total_duration_minutes: number
        }[]
      }
      get_my_business: {
        Args: never
        Returns: {
          activity: string
          agenda_mode: string
          id: string
          logo_path: string
          name: string
          primary_color: string
          secondary_color: string
          slug: string
        }[]
      }
      get_public_appointment: {
        Args: { p_appointment_id: string; p_token: string }
        Returns: Json
      }
      get_public_booking_settings: {
        Args: { p_business_slug?: string }
        Returns: {
          account_holder: string
          account_number: string
          account_type: string
          bank_name: string
          buffer_minutes: number
          business_name: string
          cancellation_policy: string
          currency: string
          daviplata_number: string
          deposit_percentage: number
          hold_minutes: number
          nequi_number: string
          payment_instructions: string
          requires_deposit: boolean
          timezone: string
        }[]
      }
      get_public_business: {
        Args: { p_slug?: string }
        Returns: {
          activity: string
          agenda_mode: string
          id: string
          logo_path: string
          name: string
          primary_color: string
          secondary_color: string
          slug: string
        }[]
      }
      get_public_business_hours: {
        Args: { p_business_slug?: string }
        Returns: {
          closes_at: string
          opens_at: string
          weekday: number
        }[]
      }
      get_public_professionals: {
        Args: { p_business_slug: string; p_service_ids?: string[] }
        Returns: {
          display_order: number
          full_name: string
          id: string
          photo_path: string
          specialty: string
        }[]
      }
      get_public_services: {
        Args: { p_business_slug?: string }
        Returns: {
          description: string
          display_order: number
          duration_minutes: number
          id: string
          name: string
          price: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      list_my_businesses: {
        Args: never
        Returns: {
          id: string
          is_active: boolean
          name: string
          slug: string
        }[]
      }
      reject_payment: {
        Args: { p_payment_id: string; p_rejection_reason: string }
        Returns: boolean
      }
      resolve_booking_business: { Args: { p_slug?: string }; Returns: string }
      set_active_business: { Args: { p_business_id: string }; Returns: boolean }
      submit_payment_proof: {
        Args: {
          p_appointment_id: string
          p_object_path: string
          p_token: string
        }
        Returns: boolean
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
