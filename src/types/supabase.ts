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
      active_orders_snapshot: {
        Row: {
          created_at: string | null
          id: string
          items_count: number | null
          status: string | null
          table_id: number | null
          total: number | null
        }
        Insert: {
          created_at?: string | null
          id: string
          items_count?: number | null
          status?: string | null
          table_id?: number | null
          total?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          items_count?: number | null
          status?: string | null
          table_id?: number | null
          total?: number | null
        }
        Relationships: []
      }
      analytics: {
        Row: {
          data: Json | null
          id: string
          updated_at: string | null
        }
        Insert: {
          data?: Json | null
          id: string
          updated_at?: string | null
        }
        Update: {
          data?: Json | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      application_state: {
        Row: {
          data: Json
          id: string
          updated_at: string | null
        }
        Insert: {
          data: Json
          id: string
          updated_at?: string | null
        }
        Update: {
          data?: Json
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          clock_in: string
          clock_in_method: string | null
          clock_out: string | null
          clock_out_method: string | null
          date: string
          employee_id: string | null
          id: string
          status: string | null
        }
        Insert: {
          clock_in: string
          clock_in_method?: string | null
          clock_out?: string | null
          clock_out_method?: string | null
          date: string
          employee_id?: string | null
          id: string
          status?: string | null
        }
        Update: {
          clock_in?: string
          clock_in_method?: string | null
          clock_out?: string | null
          clock_out_method?: string | null
          date?: string
          employee_id?: string | null
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          context: string | null
          details: Json | null
          id: number
          level: string | null
          message: string | null
          timestamp: string | null
        }
        Insert: {
          context?: string | null
          details?: Json | null
          id?: number
          level?: string | null
          message?: string | null
          timestamp?: string | null
        }
        Update: {
          context?: string | null
          details?: Json | null
          id?: number
          level?: string | null
          message?: string | null
          timestamp?: string | null
        }
        Relationships: []
      }
      backups: {
        Row: {
          hash: string | null
          id: string
          metadata: Json | null
          size: number | null
          status: string | null
          timestamp: string | null
          type: string | null
        }
        Insert: {
          hash?: string | null
          id: string
          metadata?: Json | null
          size?: number | null
          status?: string | null
          timestamp?: string | null
          type?: string | null
        }
        Update: {
          hash?: string | null
          id?: string
          metadata?: Json | null
          size?: number | null
          status?: string | null
          timestamp?: string | null
          type?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          icon: string | null
          id: string
          is_visible_digital: boolean | null
          name: string
          updated_at: string | null
          visible: boolean | null
        }
        Insert: {
          icon?: string | null
          id: string
          is_visible_digital?: boolean | null
          name: string
          updated_at?: string | null
          visible?: boolean | null
        }
        Update: {
          icon?: string | null
          id?: string
          is_visible_digital?: boolean | null
          name?: string
          updated_at?: string | null
          visible?: boolean | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          balance: number | null
          id: string
          last_visit: string | null
          name: string
          nif: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          id: string
          last_visit?: string | null
          name: string
          nif?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          id?: string
          last_visit?: string | null
          name?: string
          nif?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_analytics: {
        Row: {
          average_ticket: number | null
          created_at: string | null
          date: string
          hourly_traffic: Json | null
          id: string
          payment_methods_breakdown: Json | null
          top_selling_items: Json | null
          total_orders: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          average_ticket?: number | null
          created_at?: string | null
          date: string
          hourly_traffic?: Json | null
          id?: string
          payment_methods_breakdown?: Json | null
          top_selling_items?: Json | null
          total_orders?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          average_ticket?: number | null
          created_at?: string | null
          date?: string
          hourly_traffic?: Json | null
          id?: string
          payment_methods_breakdown?: Json | null
          top_selling_items?: Json | null
          total_orders?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dashboard_summary: {
        Row: {
          active_orders_count: number | null
          id: string
          last_updated: string | null
          total_orders: number | null
          total_revenue: number | null
        }
        Insert: {
          active_orders_count?: number | null
          id: string
          last_updated?: string | null
          total_orders?: number | null
          total_revenue?: number | null
        }
        Update: {
          active_orders_count?: number | null
          id?: string
          last_updated?: string | null
          total_orders?: number | null
          total_revenue?: number | null
        }
        Relationships: []
      }
      dishes: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          is_visible_digital: boolean
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id: string
          image_url?: string | null
          is_featured?: boolean
          is_visible_digital?: boolean
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_visible_digital?: boolean
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dishes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          bi: string | null
          color: string | null
          daily_work_hours: number | null
          external_bio_id: string | null
          id: string
          name: string
          nif: string | null
          phone: string | null
          role: string | null
          salary: number | null
          status: string | null
          work_days_per_month: number | null
        }
        Insert: {
          bi?: string | null
          color?: string | null
          daily_work_hours?: number | null
          external_bio_id?: string | null
          id: string
          name: string
          nif?: string | null
          phone?: string | null
          role?: string | null
          salary?: number | null
          status?: string | null
          work_days_per_month?: number | null
        }
        Update: {
          bi?: string | null
          color?: string | null
          daily_work_hours?: number | null
          external_bio_id?: string | null
          id?: string
          name?: string
          nif?: string | null
          phone?: string | null
          role?: string | null
          salary?: number | null
          status?: string | null
          work_days_per_month?: number | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          date: string
          description: string | null
          id: string
          status: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          date: string
          description?: string | null
          id: string
          status?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          date?: string
          description?: string | null
          id?: string
          status?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          id: string
          min_threshold: number | null
          name: string
          quantity: number | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          min_threshold?: number | null
          name: string
          quantity?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          min_threshold?: number | null
          name?: string
          quantity?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      menu: {
        Row: {
          category_id: string | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          is_featured: boolean | null
          is_visible_digital: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          description?: string | null
          id: string
          image_url?: string | null
          is_available?: boolean | null
          is_featured?: boolean | null
          is_visible_digital?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_featured?: boolean | null
          is_visible_digital?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          available: boolean | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          tax_rate: number | null
          updated_at: string | null
        }
        Insert: {
          available?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id: string
          image_url?: string | null
          name: string
          price: number
          tax_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          available?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          tax_rate?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          id: string
          items: Json | null
          payment_method: string | null
          status: string | null
          table_id: number | null
          timestamp: string | null
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          items?: Json | null
          payment_method?: string | null
          status?: string | null
          table_id?: number | null
          timestamp?: string | null
          total: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          items?: Json | null
          payment_method?: string | null
          status?: string | null
          table_id?: number | null
          timestamp?: string | null
          total?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      payroll_records: {
        Row: {
          amount: number | null
          base_salary: number | null
          date: string | null
          employee_id: string | null
          id: string
          month: number | null
          net_salary: number | null
          notes: string | null
          status: string | null
          year: number | null
        }
        Insert: {
          amount?: number | null
          base_salary?: number | null
          date?: string | null
          employee_id?: string | null
          id: string
          month?: number | null
          net_salary?: number | null
          notes?: string | null
          status?: string | null
          year?: number | null
        }
        Update: {
          amount?: number | null
          base_salary?: number | null
          date?: string | null
          employee_id?: string | null
          id?: string
          month?: number | null
          net_salary?: number | null
          notes?: string | null
          status?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_settings: {
        Row: {
          address: string | null
          api_token: string | null
          currency: string | null
          id: string
          logo_url: string | null
          name: string | null
          phone: string | null
          wifi_name: string | null
          wifi_password: string | null
        }
        Insert: {
          address?: string | null
          api_token?: string | null
          currency?: string | null
          id: string
          logo_url?: string | null
          name?: string | null
          phone?: string | null
          wifi_name?: string | null
          wifi_password?: string | null
        }
        Update: {
          address?: string | null
          api_token?: string | null
          currency?: string | null
          id?: string
          logo_url?: string | null
          name?: string | null
          phone?: string | null
          wifi_name?: string | null
          wifi_password?: string | null
        }
        Relationships: []
      }
      restaurant_tables: {
        Row: {
          color: string | null
          current_order_id: string | null
          groupid: string | null
          height: number | null
          id: string
          label: string | null
          name: string | null
          rotation: number | null
          seats: number | null
          shape: string | null
          status: string | null
          userid: string | null
          width: number | null
          x: number | null
          y: number | null
          zone: string | null
        }
        Insert: {
          color?: string | null
          current_order_id?: string | null
          groupid?: string | null
          height?: number | null
          id: string
          label?: string | null
          name?: string | null
          rotation?: number | null
          seats?: number | null
          shape?: string | null
          status?: string | null
          userid?: string | null
          width?: number | null
          x?: number | null
          y?: number | null
          zone?: string | null
        }
        Update: {
          color?: string | null
          current_order_id?: string | null
          groupid?: string | null
          height?: number | null
          id?: string
          label?: string | null
          name?: string | null
          rotation?: number | null
          seats?: number | null
          shape?: string | null
          status?: string | null
          userid?: string | null
          width?: number | null
          x?: number | null
          y?: number | null
          zone?: string | null
        }
        Relationships: []
      }
      revenues: {
        Row: {
          amount: number
          category: string | null
          date: string
          description: string | null
          id: string
          payment_method: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          date: string
          description?: string | null
          id: string
          payment_method?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          date?: string
          description?: string | null
          id?: string
          payment_method?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          id: string
          name: string
          phone: string | null
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name: string
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stock: {
        Row: {
          id: string
          min_threshold: number | null
          name: string
          quantity: number | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          min_threshold?: number | null
          name: string
          quantity?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          min_threshold?: number | null
          name?: string
          quantity?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stock_items: {
        Row: {
          id: string
          min_threshold: number | null
          name: string
          quantity: number
          unit: string | null
        }
        Insert: {
          id: string
          min_threshold?: number | null
          name: string
          quantity: number
          unit?: string | null
        }
        Update: {
          id?: string
          min_threshold?: number | null
          name?: string
          quantity?: number
          unit?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          email: string | null
          endereco: string | null
          id: string
          nif: string | null
          nome: string
          telefone: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          email?: string | null
          endereco?: string | null
          id: string
          nif?: string | null
          nome: string
          telefone?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nif?: string | null
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          active: boolean | null
          id: string
          name: string
          pin: string | null
          role: string | null
        }
        Insert: {
          active?: boolean | null
          id: string
          name: string
          pin?: string | null
          role?: string | null
        }
        Update: {
          active?: boolean | null
          id?: string
          name?: string
          pin?: string | null
          role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      sync_menu: {
        Args: { categories: Json; items: Json; settings: Json; token: string }
        Returns: undefined
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
