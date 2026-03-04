'use server';

import { createClient } from '@/lib/supabase/server';

export async function createStaffTable() {
  const supabase = await createClient();
  
  try {
    console.log('🔧 [STAFF] Creating staff table...');
    
    // SQL para criar a tabela staff com estrutura correta
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
    
    // Tentar executar via SQL direto usando REST API
    try {
      console.log('🌐 [STAFF] Creating table via REST API...');
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            query: createTableSQL
          })
        });
        
        if (response.ok) {
          console.log('✅ [STAFF] Table created via REST API');
          
          // Verificar se a tabela foi criada
          const { data: testData, error: testError } = await supabase
            .from('staff')
            .select('*')
            .limit(1);
          
          if (testError) {
            console.error('❌ [STAFF] Error verifying table:', testError);
            throw testError;
          }
          
          console.log('✅ [STAFF] Table verified and working');
          
          return { 
            success: true, 
            message: 'Tabela staff criada e verificada com sucesso',
            tableExists: true
          };
        } else {
          throw new Error(`REST API error: ${response.status} ${response.statusText}`);
        }
      } else {
        throw new Error('Missing Supabase credentials');
      }
    } catch (restError) {
      console.error('❌ [STAFF] REST API method failed:', restError);
      
      // Último recurso: Retornar SQL para execução manual
      console.log('🚨 [STAFF] All methods failed. Manual SQL required:');
      console.log('--- COPY THIS SQL ---');
      console.log(createTableSQL);
      console.log('--- END SQL ---');
      
      return { 
        success: false, 
        error: 'Todos os métodos automáticos falharam. Execute o SQL manualmente no Supabase Editor.',
        sql: createTableSQL,
        requiresManualAction: true
      };
    }
    
  } catch (error: any) {
    console.error('❌ [STAFF] Critical error:', error);
    return { 
      success: false, 
      error: error.message || 'Erro desconhecido ao criar tabela staff',
      details: error
    };
  }
}
