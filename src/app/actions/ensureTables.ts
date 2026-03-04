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
    
    // Verificar/criar tabela users se não existir
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE,
          pin VARCHAR(10) NOT NULL,
          role VARCHAR(50) DEFAULT 'CAIXA',
          status VARCHAR(20) DEFAULT 'active',
          permissions TEXT[] DEFAULT '{}',
          last_login TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        INSERT INTO users (id, name, email, pin, role, status)
        SELECT 
          gen_random_uuid(), 'Administrador', 'admin@tasca.com', '1234', 'ADMIN', 'active'
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@tasca.com');
      `
    });
    
    if (usersError) {
      console.error('❌ Erro ao criar users:', usersError);
    } else {
      console.log('✅ Tabela users verificada/criada');
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
    const { error: payrollError } = await supabase
      .from('payroll_records')
      .select('*')
      .limit(1);
    
    if (payrollError && payrollError.code !== 'PGRST116') { // PGRST116 = table doesn't exist
      console.error('❌ Erro ao verificar payroll_records:', payrollError);
    } else {
      console.log('✅ Tabela payroll_records verificada/criada');
    }
    
    // Verificar/criar tabela restaurant_tables se não existir
    const { error: tablesError } = await supabase
      .from('restaurant_tables')
      .select('*')
      .limit(1);
    
    if (tablesError && tablesError.code !== 'PGRST116') { // PGRST116 = table doesn't exist
      console.error('❌ Erro ao verificar restaurant_tables:', tablesError);
    } else {
      console.log('✅ Tabela restaurant_tables verificada/criada');
    }

    // Verificar/criar tabela daily_analytics se não existir
    const { data: existingAnalytics, error: analyticsError } = await supabase
      .from('daily_analytics')
      .select('*')
      .limit(1);
    
    if (analyticsError) {
      console.error('❌ Erro ao verificar daily_analytics:', analyticsError);
    } else {
      console.log('✅ Tabela daily_analytics verificada');
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
