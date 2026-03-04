'use server';

import { createClient } from '@/lib/supabase/server';

export async function createPayrollTableDirect() {
  const supabase = await createClient();
  
  try {
    console.log('🔧 [PAYROLL] Creating payroll table directly...');
    
    // SQL para criar a tabela payroll com estrutura correta
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.payroll (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        funcionario_name TEXT NOT NULL,
        mes_referencia TEXT NOT NULL,
        salario_base NUMERIC DEFAULT 0,
        subsidios NUMERIC DEFAULT 0,
        descontos NUMERIC DEFAULT 0,
        total_liquido NUMERIC GENERATED ALWAYS AS (salario_base + subsidios - descontos) STORED,
        status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Adicionar comentários
      COMMENT ON TABLE public.payroll IS 'Tabela de folha salarial da Tasca do Vereda';
      COMMENT ON COLUMN public.payroll.id IS 'Identificador único do registro';
      COMMENT ON COLUMN public.payroll.funcionario_name IS 'Nome do funcionário';
      COMMENT ON COLUMN public.payroll.mes_referencia IS 'Mês de referência (YYYY-MM)';
      COMMENT ON COLUMN public.payroll.salario_base IS 'Salário base do funcionário';
      COMMENT ON COLUMN public.payroll.subsidios IS 'Valor dos subsídios/bónus';
      COMMENT ON COLUMN public.payroll.descontos IS 'Valor dos descontos';
      COMMENT ON COLUMN public.payroll.total_liquido IS 'Salário líquido (calculado automaticamente)';
      COMMENT ON COLUMN public.payroll.status IS 'Status do pagamento';
      
      -- Criar índices para melhor performance
      CREATE INDEX IF NOT EXISTS idx_payroll_funcionario ON public.payroll(funcionario_name);
      CREATE INDEX IF NOT EXISTS idx_payroll_mes ON public.payroll(mes_referencia);
      CREATE INDEX IF NOT EXISTS idx_payroll_status ON public.payroll(status);
      
      -- Habilitar RLS (Row Level Security)
      ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
      
      -- Criar política para permitir leitura/escrita
      DROP POLICY IF EXISTS "Users can manage payroll" ON public.payroll;
      CREATE POLICY "Users can manage payroll" ON public.payroll
        FOR ALL USING (true)
        WITH CHECK (true);
    `;
    
    // Tentar executar via SQL direto usando RPC
    try {
      console.log('🔄 [PAYROLL] Trying RPC method...');
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql: createTableSQL 
      });
      
      if (error) {
        console.log('⚠️ [PAYROLL] RPC failed:', error);
        throw error;
      }
      
      console.log('✅ [PAYROLL] Table created via RPC');
      return { 
        success: true, 
        message: 'Tabela payroll criada com sucesso via RPC',
        method: 'rpc'
      };
      
    } catch (rpcError) {
      console.log('⚠️ [PAYROLL] RPC method failed, trying direct SQL...');
      
      // Método alternativo: Tentar criar via REST API do Supabase
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey) {
          console.log('🌐 [PAYROLL] Creating table via REST API...');
          
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
            console.log('✅ [PAYROLL] Table created via REST API');
            
            // Verificar se a tabela foi criada
            const { data: testData, error: testError } = await supabase
              .from('payroll')
              .select('*')
              .limit(1);
            
            if (testError) {
              console.error('❌ [PAYROLL] Error verifying table:', testError);
              throw testError;
            }
            
            console.log('✅ [PAYROLL] Table verified and working');
            
            return { 
              success: true, 
              message: 'Tabela payroll criada e verificada com sucesso',
              method: 'rest',
              tableExists: true
            };
          } else {
            throw new Error(`REST API error: ${response.status} ${response.statusText}`);
          }
        } else {
          throw new Error('Missing Supabase credentials');
        }
      } catch (restError) {
        console.error('❌ [PAYROLL] REST API method failed:', restError);
        
        // Último recurso: Retornar SQL para execução manual
        console.log('🚨 [PAYROLL] All methods failed. Manual SQL required:');
        console.log('--- COPY THIS SQL ---');
        console.log(createTableSQL);
        console.log('--- END SQL ---');
        
        return { 
          success: false, 
          error: 'Todos os métodos automáticos falharam. Execute o SQL manualmente no Supabase Editor.',
          sql: createTableSQL,
          requiresManualAction: true,
          methods: ['RPC', 'REST API']
        };
      }
    }
    
  } catch (error: any) {
    console.error('❌ [PAYROLL] Critical error:', error);
    return { 
      success: false, 
      error: error.message || 'Erro desconhecido ao criar tabela payroll',
      details: error
    };
  }
}
