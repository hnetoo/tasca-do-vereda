'use server';

import { createClient } from '@/lib/supabase/server';

export async function ensurePayrollTable() {
  const supabase = await createClient();
  
  try {
    console.log('🔍 [PAYROLL] Checking if payroll table exists...');
    
    // First, check if table exists
    const { error: checkError } = await supabase
      .from('payroll')
      .select('*')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ [PAYROLL] Table already exists');
      return { 
        success: true, 
        message: 'Tabela payroll já existe'
      };
    }
    
    // If table doesn't exist, try to create it
    if (checkError && checkError.code === 'PGRST116') {
      console.log('🔧 [PAYROLL] Creating payroll table...');
      
      // SQL to create the payroll table with correct structure
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
        
        -- Add comments
        COMMENT ON TABLE public.payroll IS 'Tabela de folha salarial da Tasca do Vereda';
        COMMENT ON COLUMN public.payroll.id IS 'Identificador único do registro';
        COMMENT ON COLUMN public.payroll.funcionario_name IS 'Nome do funcionário';
        COMMENT ON COLUMN public.payroll.mes_referencia IS 'Mês de referência (YYYY-MM)';
        COMMENT ON COLUMN public.payroll.salario_base IS 'Salário base do funcionário';
        COMMENT ON COLUMN public.payroll.subsidios IS 'Valor dos subsídios/bónus';
        COMMENT ON COLUMN public.payroll.descontos IS 'Valor dos descontos';
        COMMENT ON COLUMN public.payroll.total_liquido IS 'Salário líquido (calculado automaticamente)';
        COMMENT ON COLUMN public.payroll.status IS 'Status do pagamento';
        
        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_payroll_funcionario ON public.payroll(funcionario_name);
        CREATE INDEX IF NOT EXISTS idx_payroll_mes ON public.payroll(mes_referencia);
        CREATE INDEX IF NOT EXISTS idx_payroll_status ON public.payroll(status);
        
        -- Enable RLS (Row Level Security)
        ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
        
        -- Create policy to allow read/write
        DROP POLICY IF EXISTS "Users can manage payroll" ON public.payroll;
        CREATE POLICY "Users can manage payroll" ON public.payroll
          FOR ALL USING (true)
          WITH CHECK (true);
      `;
      
      // Try to execute SQL directly via REST API
      console.log('🌐 [PAYROLL] Creating table via REST API...');
      
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
          console.log('✅ [PAYROLL] Table created successfully via REST');
          
          // Verify table was created
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
            tableExists: true
          };
        } else {
          throw new Error(`REST API error: ${response.status} ${response.statusText}`);
        }
      } else {
        throw new Error('Missing Supabase credentials');
      }
    }
    
    // Some other error occurred
    throw checkError;
    
  } catch (error: any) {
    console.error('❌ [PAYROLL] Critical error:', error);
    return { 
      success: false, 
      error: error.message || 'Erro desconhecido ao verificar/criar tabela payroll',
      details: error
    };
  }
}
