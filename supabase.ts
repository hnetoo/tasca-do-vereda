// This is a placeholder file for Supabase type definitions.
// To generate actual types from your Supabase project,
// run the Supabase CLI command:
// supabase gen types typescript --project-id "your-project-ref" --schema public > supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_log: {
        Row: {
          context: string | null
          details: Json | null
          id: string
          level: string
          message: string
          timestamp: string
        }
        Insert: {
          context?: string | null
          details?: Json | null
          id?: string
          level: string
          message: string
          timestamp?: string
        }
        Update: {
          context?: string | null
          details?: Json | null
          id?: string
          level?: string
          message?: string
          timestamp?: string
        }
        Relationships: []
      }
      category: {
        Row: {
          deleted_at: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          sort_order: number
        }
        Insert: {
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          sort_order?: number
        }
        Update: {
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "category_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          }
        ]
      }
      customer: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          nif: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          nif?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          nif?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      expense: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string | null
          id: string
          incurred_at: string
          supplier_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          incurred_at?: string
          supplier_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          incurred_at?: string
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          }
        ]
      }
      fixed_expense: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          day_of_month: number
          description: string | null
          id: string
          supplier_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          day_of_month: number
          description?: string | null
          id?: string
          supplier_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          day_of_month?: number
          description?: string | null
          id?: string
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixed_expense_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          }
        ]
      }
      offline_queue: {
        Row: {
          created_at: string
          id: string
          payload: Json
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload: Json
          status?: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          status?: string
          type?: string
        }
        Relationships: []
      }
      order: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          is_paid: boolean
          order_number: number
          table_id: string | null
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          is_paid?: boolean
          order_number?: number
          table_id?: string | null
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          is_paid?: boolean
          order_number?: number
          table_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "table"
            referencedColumns: ["id"]
          }
        ]
      }
      order_item: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          sub_total: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity: number
          sub_total: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          sub_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_item_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          }
        ]
      }
      payment: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          payment_method: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_id: string
          payment_method: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          payment_method?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order"
            referencedColumns: ["id"]
          }
        ]
      }
      product: {
        Row: {
          available: boolean
          category_id: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          tax_rate: number
        }
        Insert: {
          available?: boolean
          category_id: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          tax_rate?: number
        }
        Update: {
          available?: boolean
          category_id?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          tax_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          }
        ]
      }
      profile: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      supplier: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      table: {
        Row: {
          capacity: number
          id: string
          name: string
          status: string
        }
        Insert: {
          capacity?: number
          id?: string
          name: string
          status?: string
        }
        Update: {
          capacity?: number
          id?: string
          name?: string
          status?: string
        }
        Relationships: []
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
