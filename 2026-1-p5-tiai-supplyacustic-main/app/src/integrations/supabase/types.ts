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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analyses: {
        Row: {
          ai_report: string | null
          analysis_type: string
          created_at: string
          error_message: string | null
          id: string
          problems_identified: Json | null
          project_id: string
          rt60_1000hz: number | null
          rt60_125hz: number | null
          rt60_2000hz: number | null
          rt60_250hz: number | null
          rt60_4000hz: number | null
          rt60_500hz: number | null
          rt60_average: number | null
          status: string
          suggestions: Json | null
          total_absorption: number | null
          updated_at: string
          user_id: string
          volume_m3: number | null
        }
        Insert: {
          ai_report?: string | null
          analysis_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          problems_identified?: Json | null
          project_id: string
          rt60_1000hz?: number | null
          rt60_125hz?: number | null
          rt60_2000hz?: number | null
          rt60_250hz?: number | null
          rt60_4000hz?: number | null
          rt60_500hz?: number | null
          rt60_average?: number | null
          status?: string
          suggestions?: Json | null
          total_absorption?: number | null
          updated_at?: string
          user_id: string
          volume_m3?: number | null
        }
        Update: {
          ai_report?: string | null
          analysis_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          problems_identified?: Json | null
          project_id?: string
          rt60_1000hz?: number | null
          rt60_125hz?: number | null
          rt60_2000hz?: number | null
          rt60_250hz?: number | null
          rt60_4000hz?: number | null
          rt60_500hz?: number | null
          rt60_average?: number | null
          status?: string
          suggestions?: Json | null
          total_absorption?: number | null
          updated_at?: string
          user_id?: string
          volume_m3?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analyses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      furniture_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          sabins_1000hz: number
          sabins_125hz: number
          sabins_2000hz: number
          sabins_250hz: number
          sabins_4000hz: number
          sabins_500hz: number
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sabins_1000hz?: number
          sabins_125hz?: number
          sabins_2000hz?: number
          sabins_250hz?: number
          sabins_4000hz?: number
          sabins_500hz?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sabins_1000hz?: number
          sabins_125hz?: number
          sabins_2000hz?: number
          sabins_250hz?: number
          sabins_4000hz?: number
          sabins_500hz?: number
        }
        Relationships: []
      }
      materials: {
        Row: {
          absorption_1000hz: number
          absorption_125hz: number
          absorption_2000hz: number
          absorption_250hz: number
          absorption_4000hz: number
          absorption_500hz: number
          category: string
          created_at: string
          created_by: string | null
          density_kg_m3: number | null
          description: string | null
          id: string
          is_custom: boolean
          material_type: string | null
          name: string
          nrc: number
          stc: number | null
          thickness_mm: number | null
        }
        Insert: {
          absorption_1000hz?: number
          absorption_125hz?: number
          absorption_2000hz?: number
          absorption_250hz?: number
          absorption_4000hz?: number
          absorption_500hz?: number
          category: string
          created_at?: string
          created_by?: string | null
          density_kg_m3?: number | null
          description?: string | null
          id?: string
          is_custom?: boolean
          material_type?: string | null
          name: string
          nrc?: number
          stc?: number | null
          thickness_mm?: number | null
        }
        Update: {
          absorption_1000hz?: number
          absorption_125hz?: number
          absorption_2000hz?: number
          absorption_250hz?: number
          absorption_4000hz?: number
          absorption_500hz?: number
          category?: string
          created_at?: string
          created_by?: string | null
          density_kg_m3?: number | null
          description?: string | null
          id?: string
          is_custom?: boolean
          material_type?: string | null
          name?: string
          nrc?: number
          stc?: number | null
          thickness_mm?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          daily_credits: number
          display_name: string | null
          id: string
          last_refill_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          daily_credits?: number
          display_name?: string | null
          id?: string
          last_refill_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          daily_credits?: number
          display_name?: string | null
          id?: string
          last_refill_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          additional_materials: Json | null
          ceiling_material_id: string | null
          ceiling_thickness_mm: number | null
          created_at: string
          custom_furniture: Json
          description: string | null
          floor_material_id: string | null
          floor_thickness_mm: number | null
          furniture_elements: string[] | null
          furniture_inventory: Json | null
          height_m: number | null
          id: string
          interior_description: string | null
          length_m: number | null
          model_file_name: string | null
          model_file_path: string | null
          name: string
          occupancy_preset: string | null
          room_function: string
          status: string
          updated_at: string
          user_id: string
          wall_material_id: string | null
          wall_thickness_mm: number | null
          width_m: number | null
        }
        Insert: {
          additional_materials?: Json | null
          ceiling_material_id?: string | null
          ceiling_thickness_mm?: number | null
          created_at?: string
          custom_furniture?: Json
          description?: string | null
          floor_material_id?: string | null
          floor_thickness_mm?: number | null
          furniture_elements?: string[] | null
          furniture_inventory?: Json | null
          height_m?: number | null
          id?: string
          interior_description?: string | null
          length_m?: number | null
          model_file_name?: string | null
          model_file_path?: string | null
          name: string
          occupancy_preset?: string | null
          room_function?: string
          status?: string
          updated_at?: string
          user_id: string
          wall_material_id?: string | null
          wall_thickness_mm?: number | null
          width_m?: number | null
        }
        Update: {
          additional_materials?: Json | null
          ceiling_material_id?: string | null
          ceiling_thickness_mm?: number | null
          created_at?: string
          custom_furniture?: Json
          description?: string | null
          floor_material_id?: string | null
          floor_thickness_mm?: number | null
          furniture_elements?: string[] | null
          furniture_inventory?: Json | null
          height_m?: number | null
          id?: string
          interior_description?: string | null
          length_m?: number | null
          model_file_name?: string | null
          model_file_path?: string | null
          name?: string
          occupancy_preset?: string | null
          room_function?: string
          status?: string
          updated_at?: string
          user_id?: string
          wall_material_id?: string | null
          wall_thickness_mm?: number | null
          width_m?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_ceiling_material_id_fkey"
            columns: ["ceiling_material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_floor_material_id_fkey"
            columns: ["floor_material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_wall_material_id_fkey"
            columns: ["wall_material_id"]
            isOneToOne: false
            referencedRelation: "materials"
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
