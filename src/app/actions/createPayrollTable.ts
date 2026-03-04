'use server';

import { createClient } from '@/lib/supabase/server';

export async function createPayrollTable() {
  const supabase = await createClient();
  
  try {
    console.log('🔧 [PAYROLL] Creating payroll table...');
    
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
    
    // Executar o SQL via RPC (se disponível)
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (error) {
        console.log('⚠️ [PAYROLL] RPC method failed, trying direct approach...');
        throw error;
      }
      
      console.log('✅ [PAYROLL] Table created successfully via RPC');
    } catch (rpcError) {
      // Método alternativo: Verificar se tabela existe e criar manualmente
      console.log('🔄 [PAYROLL] RPC failed, checking table existence...');
      
      const { error: checkError } = await supabase
        .from('payroll')
        .select('*')
        .limit(1);
      
      if (checkError && checkError.code === 'PGRST116') {
        // Tabela não existe, precisamos criar manualmente
        console.log('🚨 [PAYROLL] Table does not exist. Please create manually in Supabase SQL Editor:');
        console.log('--- COPY THIS SQL ---');
        console.log(createTableSQL);
        console.log('--- END SQL ---');
        
        return { 
          success: false, 
          error: 'Table does not exist. Please create manually using the SQL provided in console logs.',
          sql: createTableSQL,
          requiresManualAction: true
        };
      } else if (!checkError) {
        console.log('✅ [PAYROLL] Table already exists');
        return { 
          success: true, 
          message: 'Tabela payroll já existe'
        };
      } else {
        throw checkError;
      }
    }
    
    // Verificar se a tabela foi criada
    const { data: testData, error: testError } = await supabase
      .from('payroll')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ [PAYROLL] Error verifying table:', testError);
      throw testError;
    }
    
    console.log('✅ [PAYROLL] Table created and verified successfully');
    
    return { 
      success: true, 
      message: 'Tabela payroll criada e verificada com sucesso',
      tableExists: true
    };
    
  } catch (error: any) {
    console.error('❌ [PAYROLL] Critical error:', error);
    return { 
      success: false, 
      error: error.message || 'Erro desconhecido ao criar tabela payroll',
      details: error
    };
  }
}
