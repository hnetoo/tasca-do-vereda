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
      api_keys: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          last_used_at: string | null
          name: string
          prefix: string
          scopes: string[] | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          last_used_at?: string | null
          name: string
          prefix: string
          scopes?: string[] | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          last_used_at?: string | null
          name?: string
          prefix?: string
          scopes?: string[] | null
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          clock_in: string | null
          clock_in_method: string | null
          clock_out: string | null
          clock_out_method: string | null
          created_at: string | null
          date: string
          employee_id: string | null
          id: string
          is_absence: boolean | null
          is_late: boolean | null
          late_minutes: number | null
          overtime_hours: number | null
          total_hours: number | null
        }
        Insert: {
          clock_in?: string | null
          clock_in_method?: string | null
          clock_out?: string | null
          clock_out_method?: string | null
          created_at?: string | null
          date: string
          employee_id?: string | null
          id?: string
          is_absence?: boolean | null
          is_late?: boolean | null
          late_minutes?: number | null
          overtime_hours?: number | null
          total_hours?: number | null
        }
        Update: {
          clock_in?: string | null
          clock_in_method?: string | null
          clock_out?: string | null
          clock_out_method?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string | null
          id?: string
          is_absence?: boolean | null
          is_late?: boolean | null
          late_minutes?: number | null
          overtime_hours?: number | null
          total_hours?: number | null
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
          action: string
          created_at: string | null
          details: string | null
          id: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: string | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backups: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          hash: string
          id: string
          status: string | null
          timestamp: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          hash: string
          id?: string
          status?: string | null
          timestamp: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          hash?: string
          id?: string
          status?: string | null
          timestamp?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      biometric_devices: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string
          last_sync: string | null
          name: string
          port: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address: string
          last_sync?: string | null
          name: string
          port?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string
          last_sync?: string | null
          name?: string
          port?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cash_shifts: {
        Row: {
          closing_balance: number | null
          created_at: string | null
          end_time: string | null
          expected_balance: number | null
          id: string
          opening_balance: number | null
          start_time: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          closing_balance?: number | null
          created_at?: string | null
          end_time?: string | null
          expected_balance?: number | null
          id?: string
          opening_balance?: number | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          closing_balance?: number | null
          created_at?: string | null
          end_time?: string | null
          expected_balance?: number | null
          id?: string
          opening_balance?: number | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_shifts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          balance: number | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          nif: string | null
          phone: string | null
          points: number | null
          updated_at: string | null
          visits: number | null
        }
        Insert: {
          address?: string | null
          balance?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          nif?: string | null
          phone?: string | null
          points?: number | null
          updated_at?: string | null
          visits?: number | null
        }
        Update: {
          address?: string | null
          balance?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          nif?: string | null
          phone?: string | null
          points?: number | null
          updated_at?: string | null
          visits?: number | null
        }
        Relationships: []
      }
      daily_analytics: {
        Row: {
          average_ticket: number | null
          date: string
          last_updated: string | null
          net_profit: number | null
          total_expenses: number | null
          total_orders: number | null
          total_product_cost: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          average_ticket?: number | null
          date?: string
          last_updated?: string | null
          net_profit?: number | null
          total_expenses?: number | null
          total_orders?: number | null
          total_product_cost?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          average_ticket?: number | null
          date?: string
          last_updated?: string | null
          net_profit?: number | null
          total_expenses?: number | null
          total_orders?: number | null
          total_product_cost?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          address: string | null
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          driver_name: string | null
          end_time: string | null
          id: string
          order_id: string | null
          start_time: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          driver_name?: string | null
          end_time?: string | null
          id?: string
          order_id?: string | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          driver_name?: string | null
          end_time?: string | null
          id?: string
          order_id?: string | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          available: boolean | null
          category_id: string | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_available_on_digital_menu: boolean | null
          max_stock_quantity: number | null
          min_stock_quantity: number | null
          name: string
          preparation_time: number | null
          price: number
          status: string | null
          stock_quantity: number | null
          supplier_id: string | null
          tax_code: string | null
          tax_percentage: number | null
          track_stock: boolean | null
          unit: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          available?: boolean | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_available_on_digital_menu?: boolean | null
          max_stock_quantity?: number | null
          min_stock_quantity?: number | null
          name: string
          preparation_time?: number | null
          price: number
          status?: string | null
          stock_quantity?: number | null
          supplier_id?: string | null
          tax_code?: string | null
          tax_percentage?: number | null
          track_stock?: boolean | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          available?: boolean | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_available_on_digital_menu?: boolean | null
          max_stock_quantity?: number | null
          min_stock_quantity?: number | null
          name?: string
          preparation_time?: number | null
          price?: number
          status?: string | null
          stock_quantity?: number | null
          supplier_id?: string | null
          tax_code?: string | null
          tax_percentage?: number | null
          track_stock?: boolean | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dishes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          admission_date: string | null
          bank_account: string | null
          base_salary: number | null
          bi: string | null
          color: string | null
          created_at: string | null
          daily_work_hours: number | null
          department: string | null
          email: string | null
          external_bio_id: string | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          name: string
          net_salary: number | null
          nif: string | null
          permissions: string[] | null
          phone: string | null
          pin: string | null
          pin_code: string | null
          position: string | null
          role: string
          salary: number | null
          social_security_number: string | null
          status: string | null
          updated_at: string | null
          work_days_per_month: number | null
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          bank_account?: string | null
          base_salary?: number | null
          bi?: string | null
          color?: string | null
          created_at?: string | null
          daily_work_hours?: number | null
          department?: string | null
          email?: string | null
          external_bio_id?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          net_salary?: number | null
          nif?: string | null
          permissions?: string[] | null
          phone?: string | null
          pin?: string | null
          pin_code?: string | null
          position?: string | null
          role: string
          salary?: number | null
          social_security_number?: string | null
          status?: string | null
          updated_at?: string | null
          work_days_per_month?: number | null
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          bank_account?: string | null
          base_salary?: number | null
          bi?: string | null
          color?: string | null
          created_at?: string | null
          daily_work_hours?: number | null
          department?: string | null
          email?: string | null
          external_bio_id?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          net_salary?: number | null
          nif?: string | null
          permissions?: string[] | null
          phone?: string | null
          pin?: string | null
          pin_code?: string | null
          position?: string | null
          role?: string
          salary?: number | null
          social_security_number?: string | null
          status?: string | null
          updated_at?: string | null
          work_days_per_month?: number | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          date: string
          description: string
          id: string
          notes: string | null
          payment_method: string | null
          status: string | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          date: string
          description: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      external_finance: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          metadata: Json | null
          period_end: string | null
          period_start: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id: string
          metadata?: Json | null
          period_end?: string | null
          period_start?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          period_end?: string | null
          period_start?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      integration_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          event: string
          id: string
          service: string
          status: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event: string
          id?: string
          service: string
          status: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event?: string
          id?: string
          service?: string
          status?: string
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_available_on_digital_menu: boolean | null
          name: string
          parent_id: string | null
          sort_order: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_available_on_digital_menu?: boolean | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_available_on_digital_menu?: boolean | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          available: boolean | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          preco_custo: number | null
          price: number
          updated_at: string | null
        }
        Insert: {
          available?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          preco_custo?: number | null
          price: number
          updated_at?: string | null
        }
        Update: {
          available?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          preco_custo?: number | null
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          dish_id: string | null
          id: string
          notes: string | null
          order_id: string | null
          quantity: number
          status: string | null
          tax_amount: number | null
          tax_code: string | null
          tax_percentage: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          dish_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          quantity: number
          status?: string | null
          tax_amount?: number | null
          tax_code?: string | null
          tax_percentage?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          dish_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          quantity?: number
          status?: string | null
          tax_amount?: number | null
          tax_code?: string | null
          tax_percentage?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          agt_submission_uuid: string | null
          closed_at: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_nif: string | null
          hash: string | null
          id: string
          invoice_number: string | null
          is_synced_agt: number | null
          items: Json
          jws_payload: Json | null
          notes: string | null
          order_number: string | null
          payment_method: string | null
          previous_hash: string | null
          shift_id: string | null
          signature: string | null
          split_payments: Json | null
          status: string
          sub_account_name: string | null
          table_id: string | null
          tax_total: number | null
          total: number | null
          updated_at: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          agt_submission_uuid?: string | null
          closed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_nif?: string | null
          hash?: string | null
          id?: string
          invoice_number?: string | null
          is_synced_agt?: number | null
          items?: Json
          jws_payload?: Json | null
          notes?: string | null
          order_number?: string | null
          payment_method?: string | null
          previous_hash?: string | null
          shift_id?: string | null
          signature?: string | null
          split_payments?: Json | null
          status: string
          sub_account_name?: string | null
          table_id?: string | null
          tax_total?: number | null
          total?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          agt_submission_uuid?: string | null
          closed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_nif?: string | null
          hash?: string | null
          id?: string
          invoice_number?: string | null
          is_synced_agt?: number | null
          items?: Json
          jws_payload?: Json | null
          notes?: string | null
          order_number?: string | null
          payment_method?: string | null
          previous_hash?: string | null
          shift_id?: string | null
          signature?: string | null
          split_payments?: Json | null
          status?: string
          sub_account_name?: string | null
          table_id?: string | null
          tax_total?: number | null
          total?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "cash_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          base_salary: number | null
          created_at: string | null
          descontos: number | null
          funcionario: string
          id: string
          mes_referencia: string | null
          net_total: number | null
          nome_funcionario: string | null
          reference_month: string
          salario_base: number | null
          staff_id: string | null
          status_pagamento: string | null
          subsidios: number | null
        }
        Insert: {
          base_salary?: number | null
          created_at?: string | null
          descontos?: number | null
          funcionario: string
          id?: string
          mes_referencia?: string | null
          net_total?: number | null
          nome_funcionario?: string | null
          reference_month: string
          salario_base?: number | null
          staff_id?: string | null
          status_pagamento?: string | null
          subsidios?: number | null
        }
        Update: {
          base_salary?: number | null
          created_at?: string | null
          descontos?: number | null
          funcionario?: string
          id?: string
          mes_referencia?: string | null
          net_total?: number | null
          nome_funcionario?: string | null
          reference_month?: string
          salario_base?: number | null
          staff_id?: string | null
          status_pagamento?: string | null
          subsidios?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "v_payroll_integration"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      payroll_records: {
        Row: {
          amount: number
          base_salary: number | null
          created_at: string | null
          date: string
          employee_id: string | null
          employee_name: string
          id: string
          month: number | null
          net_salary: number | null
          notes: string | null
          payment_date: string | null
          status: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          amount: number
          base_salary?: number | null
          created_at?: string | null
          date: string
          employee_id?: string | null
          employee_name?: string
          id?: string
          month?: number | null
          net_salary?: number | null
          notes?: string | null
          payment_date?: string | null
          status?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          amount?: number
          base_salary?: number | null
          created_at?: string | null
          date?: string
          employee_id?: string | null
          employee_name?: string
          id?: string
          month?: number | null
          net_salary?: number | null
          notes?: string | null
          payment_date?: string | null
          status?: string | null
          updated_at?: string | null
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
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string | null
          customer_name: string
          customer_phone: string
          date: string
          guests: number
          id: string
          notes: string | null
          status: string
          table_id: string | null
          time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name: string
          customer_phone: string
          date: string
          guests: number
          id?: string
          notes?: string | null
          status: string
          table_id?: string | null
          time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string
          customer_phone?: string
          date?: string
          guests?: number
          id?: string
          notes?: string | null
          status?: string
          table_id?: string | null
          time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      restaurant_tables: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          number: number
          status: string | null
          x: number | null
          y: number | null
          zone: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          number: number
          status?: string | null
          x?: number | null
          y?: number | null
          zone?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          number?: number
          status?: string | null
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
          created_at: string | null
          date: string
          description: string | null
          id: string
          order_id: string | null
          payment_method: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenues_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          color: string | null
          created_at: string | null
          description: string
          id: string
          is_active: boolean | null
          name: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description: string
          id?: string
          is_active?: boolean | null
          name: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string
          id?: string
          is_active?: boolean | null
          name?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          address: string | null
          admin_pin: string | null
          agt_certificate: string | null
          api_token: string | null
          app_logo_url: string | null
          backup_config: Json | null
          created_at: string | null
          currency: string | null
          email: string | null
          id: string
          language: string | null
          logo_url: string | null
          nif: string | null
          open_drawer_code: string | null
          phone: string | null
          printer_config: Json | null
          qr_code_short_code: string | null
          qr_code_subtitle: string | null
          qr_code_title: string | null
          qr_menu_cloud_url: string | null
          qr_menu_url: string | null
          restaurant_name: string | null
          supabase_config: Json | null
          tax_percentage: number | null
          timezone: string | null
          updated_at: string | null
          wifi_name: string | null
          wifi_password: string | null
        }
        Insert: {
          address?: string | null
          admin_pin?: string | null
          agt_certificate?: string | null
          api_token?: string | null
          app_logo_url?: string | null
          backup_config?: Json | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          language?: string | null
          logo_url?: string | null
          nif?: string | null
          open_drawer_code?: string | null
          phone?: string | null
          printer_config?: Json | null
          qr_code_short_code?: string | null
          qr_code_subtitle?: string | null
          qr_code_title?: string | null
          qr_menu_cloud_url?: string | null
          qr_menu_url?: string | null
          restaurant_name?: string | null
          supabase_config?: Json | null
          tax_percentage?: number | null
          timezone?: string | null
          updated_at?: string | null
          wifi_name?: string | null
          wifi_password?: string | null
        }
        Update: {
          address?: string | null
          admin_pin?: string | null
          agt_certificate?: string | null
          api_token?: string | null
          app_logo_url?: string | null
          backup_config?: Json | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          language?: string | null
          logo_url?: string | null
          nif?: string | null
          open_drawer_code?: string | null
          phone?: string | null
          printer_config?: Json | null
          qr_code_short_code?: string | null
          qr_code_subtitle?: string | null
          qr_code_title?: string | null
          qr_menu_cloud_url?: string | null
          qr_menu_url?: string | null
          restaurant_name?: string | null
          supabase_config?: Json | null
          tax_percentage?: number | null
          timezone?: string | null
          updated_at?: string | null
          wifi_name?: string | null
          wifi_password?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          active: boolean | null
          base_salary: number | null
          cargo: string | null
          created_at: string | null
          id: string
          name: string | null
          nome: string | null
          phone: string | null
          position: string | null
          role: string | null
          salario_base: number | null
          status: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          base_salary?: number | null
          cargo?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          nome?: string | null
          phone?: string | null
          position?: string | null
          role?: string | null
          salario_base?: number | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          base_salary?: number | null
          cargo?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          nome?: string | null
          phone?: string | null
          position?: string | null
          role?: string | null
          salario_base?: number | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_schedule: {
        Row: {
          created_at: string | null
          day_of_week: number | null
          id: string
          shift_end: string | null
          shift_start: string | null
          staff_id: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week?: number | null
          id?: string
          shift_end?: string | null
          shift_start?: string | null
          staff_id?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number | null
          id?: string
          shift_end?: string | null
          shift_start?: string | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_schedule_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_schedule_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "v_payroll_integration"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      stock_items: {
        Row: {
          created_at: string | null
          id: string
          min_threshold: number | null
          name: string
          quantity: number | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          min_threshold?: number | null
          name: string
          quantity?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          min_threshold?: number | null
          name?: string
          quantity?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          category: string | null
          contact: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          nif: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          contact?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          nif?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          contact?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          nif?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_health_logs: {
        Row: {
          component: string
          details: Json | null
          id: string
          status: string
          timestamp: string | null
        }
        Insert: {
          component: string
          details?: Json | null
          id?: string
          status: string
          timestamp?: string | null
        }
        Update: {
          component?: string
          details?: Json | null
          id?: string
          status?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          id: string
          settings: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          settings?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          settings?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          payment_method: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          last_login: string | null
          name: string
          permissions: Json | null
          pin: string
          role: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          last_login?: string | null
          name: string
          permissions?: Json | null
          pin: string
          role: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          last_login?: string | null
          name?: string
          permissions?: Json | null
          pin?: string
          role?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          created_at: string | null
          events: string[]
          failure_count: number | null
          id: string
          is_active: boolean | null
          name: string
          secret: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          events: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          secret: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          events?: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          secret?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      work_shifts: {
        Row: {
          closing_balance: number | null
          created_at: string | null
          employee_id: string | null
          end_time: string | null
          id: string
          opening_balance: number | null
          start_time: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          closing_balance?: number | null
          created_at?: string | null
          employee_id?: string | null
          end_time?: string | null
          id?: string
          opening_balance?: number | null
          start_time: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          closing_balance?: number | null
          created_at?: string | null
          employee_id?: string | null
          end_time?: string | null
          id?: string
          opening_balance?: number | null
          start_time?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      dashboard_summary: {
        Row: {
          custo_fixo_mensal: number | null
          mesas_ativas: number | null
          total_payroll_mes: number | null
          total_staff: number | null
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number | null
          category: string | null
          date: string | null
          description: string | null
          id: string | null
          status: string | null
          type: string | null
        }
        Relationships: []
      }
      v_payroll_integration: {
        Row: {
          base_salary: number | null
          descontos: number | null
          funcionario: string | null
          staff_id: string | null
          subsidios: number | null
          total_liquido: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_daily_product_cost: {
        Args: { target_date: string }
        Returns: number
      }
      calculate_realtime_metrics: { Args: never; Returns: Json }
      clear_all_production_data: {
        Args: never
        Returns: {
          expenses_cleared: number
          message: string
          orders_cleared: number
          success: boolean
        }[]
      }
      truncate_table: { Args: { table_name: string }; Returns: undefined }
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
