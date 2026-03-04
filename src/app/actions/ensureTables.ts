'use server';

import { createClient } from '@/lib/supabase/server';

export async function ensureTables() {
  const supabase = await createClient();
  
  try {
    console.log('🔍 Verificando/criando tabelas necessárias...');
    
    // Verificar/criar tabela menu_items se não existir
    const { error: menuItemsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS menu_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          preco_custo DECIMAL(10,2) DEFAULT 0,
          category VARCHAR(100),
          available BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        INSERT INTO menu_items (id, name, description, price, preco_custo, category)
        SELECT 
          gen_random_uuid(), 'Grelhada Mista', 'Grelhada mista de carne e peixe', 20000.00, 15000.00, 'Pratos Principais'
        WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Grelhada Mista')
        UNION ALL
        SELECT 
          gen_random_uuid(), 'Fino Lambreta', 'Fino tradicional da lambreta', 600.00, 400.00, 'Bebidas'
        WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Fino Lambreta');
      `
    });
    
    if (menuItemsError) {
      console.error('❌ Erro ao criar menu_items:', menuItemsError);
    } else {
      console.log('✅ Tabela menu_items verificada/criada');
    }
    
    // Verificar/criar tabela employees se não existir
    const { error: employeesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS employees (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE,
          phone VARCHAR(50),
          position VARCHAR(100),
          base_salary DECIMAL(12,2) DEFAULT 0,
          hire_date DATE,
          is_active BOOLEAN DEFAULT true,
          role VARCHAR(50) DEFAULT 'EMPLOYEE',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        INSERT INTO employees (id, name, email, position, base_salary, role)
        SELECT 
          gen_random_uuid(), 'Administrador', 'admin@tasca.com', 'Gerente', 300000.00, 'ADMIN'
        WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'admin@tasca.com');
      `
    });
    
    if (employeesError) {
      console.error('❌ Erro ao criar employees:', employeesError);
    } else {
      console.log('✅ Tabela employees verificada/criada');
    }

    // Verificar/criar tabela payroll_records se não existir
    const { error: payrollError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS payroll_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          employee_id UUID NOT NULL,
          base_salary DECIMAL(12,2) NOT NULL,
          net_salary DECIMAL(12,2) NOT NULL,
          month VARCHAR(7) NOT NULL,
          overtime_hours DECIMAL(5,2) DEFAULT 0,
          overtime_pay DECIMAL(12,2) DEFAULT 0,
          bonuses DECIMAL(12,2) DEFAULT 0,
          deductions DECIMAL(12,2) DEFAULT 0,
          payment_date DATE,
          payment_method VARCHAR(50),
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (payrollError) {
      console.error('❌ Erro ao criar payroll_records:', payrollError);
    } else {
      console.log('✅ Tabela payroll_records verificada/criada');
    }
    
    // Verificar/criar tabela restaurant_tables se não existir
    const { error: tablesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS restaurant_tables (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          number INTEGER NOT NULL UNIQUE,
          seats INTEGER DEFAULT 4,
          shape VARCHAR(50) DEFAULT 'RECTANGLE',
          ambiente VARCHAR(20) DEFAULT 'INTERIOR' CHECK (ambiente IN ('INTERIOR', 'EXTERIOR', 'BALCAO')),
          posicao_x DECIMAL(10,2) DEFAULT 0,
          posicao_y DECIMAL(10,2) DEFAULT 0,
          color VARCHAR(20) DEFAULT '#3B82F6',
          status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING')),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (tablesError) {
      console.error('❌ Erro ao criar restaurant_tables:', tablesError);
    } else {
      console.log('✅ Tabela restaurant_tables verificada/criada');
    }

    // Verificar/criar tabela daily_analytics se não existir
    const { error: analyticsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS daily_analytics (
          date DATE PRIMARY KEY,
          total_revenue DECIMAL(12,2) DEFAULT 0,
          total_expenses DECIMAL(12,2) DEFAULT 0,
          total_product_cost DECIMAL(12,2) DEFAULT 0,
          total_orders INTEGER DEFAULT 0,
          net_profit DECIMAL(12,2) DEFAULT 0,
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (analyticsError) {
      console.error('❌ Erro ao criar daily_analytics:', analyticsError);
    } else {
      console.log('✅ Tabela daily_analytics verificada/criada');
    }
    
    return {
      success: true,
      message: 'Todas as tabelas foram verificadas/criadas com sucesso'
    };
    
  } catch (error: any) {
    console.error('❌ Erro geral ao verificar tabelas:', error);
    return {
      success: false,
      error: error?.message || 'Erro desconhecido'
    };
  }
}
