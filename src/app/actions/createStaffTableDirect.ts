'use server';

import { createClient } from '@/lib/supabase/server';

export async function createStaffTableDirect() {
  const supabase = await createClient();
  
  try {
    console.log('🔧 [STAFF] Creating staff table directly...');
    
    // SQL para criar a tabela staff
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.staff (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        nome TEXT NOT NULL,
        cargo TEXT NOT NULL,
        telefone TEXT,
        salario_base NUMERIC DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Adicionar comentários
      COMMENT ON TABLE public.staff IS 'Tabela de funcionários da Tasca do Vereda';
      COMMENT ON COLUMN public.staff.id IS 'Identificador único do funcionário';
      COMMENT ON COLUMN public.staff.nome IS 'Nome completo do funcionário';
      COMMENT ON COLUMN public.staff.cargo IS 'Cargo ou função do funcionário';
      COMMENT ON COLUMN public.staff.telefone IS 'Telefone de contato';
      COMMENT ON COLUMN public.staff.salario_base IS 'Salário base do funcionário';
      COMMENT ON COLUMN public.staff.created_at IS 'Data de criação';
      COMMENT ON COLUMN public.staff.updated_at IS 'Data da última atualização';
      
      -- Criar índices para melhor performance
      CREATE INDEX IF NOT EXISTS idx_staff_nome ON public.staff(nome);
      CREATE INDEX IF NOT EXISTS idx_staff_cargo ON public.staff(cargo);
      CREATE INDEX IF NOT EXISTS idx_staff_created_at ON public.staff(created_at);
      
      -- Habilitar RLS (Row Level Security)
      ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
      
      -- Criar política para permitir leitura/escrita
      DROP POLICY IF EXISTS "Users can manage staff" ON public.staff;
      CREATE POLICY "Users can manage staff" ON public.staff
        FOR ALL USING (true)
        WITH CHECK (true);
    `;
    
    // Executar SQL usando o método direto do Supabase
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });
    
    if (createError) {
      console.error('❌ [STAFF] Error creating table with exec_sql:', createError);
      
      // Tentar método alternativo usando SQL direto
      console.log('🔄 [STAFF] Trying alternative method...');
      
      // Tentar criar tabela usando método direto
      const { error: altError } = await supabase
        .from('staff')
        .select('*')
        .limit(1);
      
      if (altError && altError.code === 'PGRST116') {
        // Tabela não existe, precisamos criar manualmente
        console.log('⚠️ [STAFF] Table does not exist, manual creation required');
        return {
          success: false,
          error: 'Tabela staff não existe. Execute o SQL manualmente no Supabase Editor.',
          requiresManualAction: true,
          sql: createTableSQL
        };
      }
      
      if (altError) {
        throw altError;
      }
    }
    
    console.log('✅ [STAFF] Staff table created successfully');
    
    // Verificar se a tabela funciona
    const { data: testData, error: testError } = await supabase
      .from('staff')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ [STAFF] Error verifying table:', testError);
      throw testError;
    }
    
    console.log('✅ [STAFF] Table verification successful');
    
    return {
      success: true,
      message: 'Tabela staff criada com sucesso',
      requiresManualAction: false
    };
    
  } catch (error: any) {
    console.error('❌ [STAFF] Critical error creating table:', error);
    
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao criar tabela staff',
      requiresManualAction: true,
      details: error
    };
  }
}
