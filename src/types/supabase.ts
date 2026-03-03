// Generated manually - Basic types for Tasca do Vereda
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Database types
export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          nif: string | null
          bi: string | null
          role: string
          salary: number | null
          admission_date: string | null
          daily_work_hours: number | null
          work_days_per_month: number | null
          bank_account: string | null
          social_security_number: string | null
          pin: string | null
          color: string | null
          external_bio_id: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          nif?: string | null
          bi?: string | null
          role: string
          salary?: number | null
          admission_date?: string | null
          daily_work_hours?: number | null
          work_days_per_month?: number | null
          bank_account?: string | null
          social_security_number?: string | null
          pin?: string | null
          color?: string | null
          external_bio_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          nif?: string | null
          bi?: string | null
          role?: string
          salary?: number | null
          admission_date?: string | null
          daily_work_hours?: number | null
          work_days_per_month?: number | null
          bank_account?: string | null
          social_security_number?: string | null
          pin?: string | null
          color?: string | null
          external_bio_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string | null
          status: string
          table_id: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_nif: string | null
          user_id: string | null
          user_name: string | null
          total: number | null
          tax_total: number | null
          payment_method: string | null
          notes: string | null
          shift_id: string | null
          sub_account_name: string | null
          invoice_number: string | null
          agt_submission_uuid: string | null
          is_synced_agt: number | null
          hash: string | null
          previous_hash: string | null
          signature: string | null
          jws_payload: Json | null
          split_payments: Json | null
          closed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          order_number?: string | null
          status: string
          table_id?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_nif?: string | null
          user_id?: string | null
          user_name?: string | null
          total?: number | null
          tax_total?: number | null
          payment_method?: string | null
          notes?: string | null
          shift_id?: string | null
          sub_account_name?: string | null
          invoice_number?: string | null
          agt_submission_uuid?: string | null
          is_synced_agt?: number | null
          hash?: string | null
          previous_hash?: string | null
          signature?: string | null
          jws_payload?: Json | null
          split_payments?: Json | null
          closed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          order_number?: string | null
          status?: string
          table_id?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_nif?: string | null
          user_id?: string | null
          user_name?: string | null
          total?: number | null
          tax_total?: number | null
          payment_method?: string | null
          notes?: string | null
          shift_id?: string | null
          sub_account_name?: string | null
          invoice_number?: string | null
          agt_submission_uuid?: string | null
          is_synced_agt?: number | null
          hash?: string | null
          previous_hash?: string | null
          signature?: string | null
          jws_payload?: Json | null
          split_payments?: Json | null
          closed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      expenses: {
        Row: {
          id: string
          description: string
          amount: number
          category: string | null
          date: string
          payment_method: string | null
          status: string | null
          notes: string | null
          supplier_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          description: string
          amount: number
          category?: string | null
          date: string
          payment_method?: string | null
          status?: string | null
          notes?: string | null
          supplier_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          description?: string
          amount?: number
          category?: string | null
          date?: string
          payment_method?: string | null
          status?: string | null
          notes?: string | null
          supplier_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      payroll: {
        Row: {
          id: string
          employee_id: string | null
          month: string
          base_salary: number
          overtime_hours: number
          overtime_pay: number
          bonuses: number
          deductions: number
          net_salary: number
          payment_date: string | null
          payment_method: string | null
          notes: string | null
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          employee_id?: string | null
          month: string
          base_salary: number
          overtime_hours?: number
          overtime_pay?: number
          bonuses?: number
          deductions?: number
          net_salary: number
          payment_date?: string | null
          payment_method?: string | null
          notes?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string | null
          month?: string
          base_salary?: number
          overtime_hours?: number
          overtime_pay?: number
          bonuses?: number
          deductions?: number
          net_salary?: number
          payment_date?: string | null
          payment_method?: string | null
          notes?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      dishes: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          cost_price: number | null
          category_id: string | null
          supplier_id: string | null
          image_url: string | null
          available: boolean | null
          is_active: boolean | null
          is_available_on_digital_menu: boolean | null
          tax_percentage: number | null
          tax_code: string | null
          preparation_time: number | null
          track_stock: boolean | null
          stock_quantity: number | null
          min_stock_quantity: number | null
          max_stock_quantity: number | null
          unit: string | null
          user_id: string | null
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          cost_price?: number | null
          category_id?: string | null
          supplier_id?: string | null
          image_url?: string | null
          available?: boolean | null
          is_active?: boolean | null
          is_available_on_digital_menu?: boolean | null
          tax_percentage?: number | null
          tax_code?: string | null
          preparation_time?: number | null
          track_stock?: boolean | null
          stock_quantity?: number | null
          min_stock_quantity?: number | null
          max_stock_quantity?: number | null
          unit?: string | null
          user_id?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          cost_price?: number | null
          category_id?: string | null
          supplier_id?: string | null
          image_url?: string | null
          available?: boolean | null
          is_active?: boolean | null
          is_available_on_digital_menu?: boolean | null
          tax_percentage?: number | null
          tax_code?: string | null
          preparation_time?: number | null
          track_stock?: boolean | null
          stock_quantity?: number | null
          min_stock_quantity?: number | null
          max_stock_quantity?: number | null
          unit?: string | null
          user_id?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      menu_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          icon: string | null
          parent_id: string | null
          sort_order: number | null
          is_active: boolean | null
          is_available_on_digital_menu: boolean | null
          deleted_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          icon?: string | null
          parent_id?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          is_available_on_digital_menu?: boolean | null
          deleted_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          icon?: string | null
          parent_id?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          is_available_on_digital_menu?: boolean | null
          deleted_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      restaurant_tables: {
        Row: {
          id: string
          name: string | null
          number: number
          seats: number | null
          shape: string | null
          zone: string | null
          status: string | null
          x: number | null
          y: number | null
          width: number | null
          height: number | null
          rotation: number | null
          color: string | null
          label: string | null
          group_id: string | null
          user_id: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          number: number
          seats?: number | null
          shape?: string | null
          zone?: string | null
          status?: string | null
          x?: number | null
          y?: number | null
          width?: number | null
          height?: number | null
          rotation?: number | null
          color?: string | null
          label?: string | null
          group_id?: string | null
          user_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          number?: number
          seats?: number | null
          shape?: string | null
          zone?: string | null
          status?: string | null
          x?: number | null
          y?: number | null
          width?: number | null
          height?: number | null
          rotation?: number | null
          color?: string | null
          label?: string | null
          group_id?: string | null
          user_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      revenues: {
        Row: {
          id: string
          order_id: string | null
          amount: number
          category: string | null
          description: string | null
          payment_method: string | null
          date: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          amount: number
          category?: string | null
          description?: string | null
          payment_method?: string | null
          date: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string | null
          amount?: number
          category?: string | null
          description?: string | null
          payment_method?: string | null
          date?: string
          created_at?: string | null
          updated_at?: string | null
        }
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

// Simple type helpers
export type Tables<
  TableName extends keyof Database['public']['Tables'],
  RowType = Database['public']['Tables'][TableName]['Row'],
  InsertType = Database['public']['Tables'][TableName]['Insert'],
  UpdateType = Database['public']['Tables'][TableName]['Update'],
> = {
  [Key in TableName]: {
    Row: RowType
    Insert: InsertType
    Update: UpdateType
  }
}

export type TablesInsert<
  TableName extends keyof Database['public']['Tables'],
  InsertType = Database['public']['Tables'][TableName]['Insert'],
> = {
  [Key in TableName]: {
    Insert: InsertType
  }
}

export type TablesUpdate<
  TableName extends keyof Database['public']['Tables'],
  UpdateType = Database['public']['Tables'][TableName]['Update'],
> = {
  [Key in TableName]: {
    Update: UpdateType
  }
}
