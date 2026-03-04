'use server';

import { createClient } from '@/lib/supabase/server';

export async function createPayrollTable() {
  const supabase = await createClient();
  
  try {
    console.log('🔍 Verificando/criando tabela payroll...');
    
    // Primeiro, verificar se a tabela já existe
    const { error: checkError } = await supabase
      .from('payroll')
      .select('*')
      .limit(1);
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.log('✅ Tabela payroll já existe');
      return {
        success: true,
        message: 'Tabela payroll já existe'
      };
    }
    
    // Se a tabela não existe, criar via SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS payroll (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        funcionario_name TEXT NOT NULL,
        valor_base DECIMAL(10,2) NOT NULL DEFAULT 0,
        subsidios DECIMAL(10,2) NOT NULL DEFAULT 0,
        descontos DECIMAL(10,2) NOT NULL DEFAULT 0,
        total_liquido DECIMAL(10,2) NOT NULL DEFAULT 0,
        mes_referencia TEXT NOT NULL,
        status_pagamento TEXT DEFAULT 'pendente',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Criar índices para melhor performance
      CREATE INDEX IF NOT EXISTS idx_payroll_mes_referencia ON payroll(mes_referencia);
      CREATE INDEX IF NOT EXISTS idx_payroll_status_pagamento ON payroll(status_pagamento);
      CREATE INDEX IF NOT EXISTS idx_payroll_funcionario_name ON payroll(funcionario_name);
    `;
    
    // Executar SQL para criar tabela
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError) {
      console.error('❌ Erro ao criar tabela payroll:', createError);
      
      // Tentar abordagem alternativa via SQL direto
      const { error: directError } = await supabase
        .from('payroll')
        .select('*')
        .limit(1);
      
      if (directError && directError.code === 'PGRST116') {
        // Tabela não existe e não podemos criar via server action
        return {
          success: false,
          error: 'Tabela payroll não existe. Por favor, crie manualmente no Supabase Dashboard.',
          sql: createTableSQL
        };
      }
    }
    
    console.log('✅ Tabela payroll verificada/criada com sucesso');
    
    // Inserir um registro de exemplo para teste
    const { error: insertError } = await supabase
      .from('payroll')
      .insert({
        funcionario_name: 'Funcionário Exemplo',
        valor_base: 100000.00,
        subsidios: 15000.00,
        descontos: 5000.00,
        total_liquido: 110000.00,
        mes_referencia: new Date().toISOString().slice(0, 7), // YYYY-MM
        status_pagamento: 'pendente'
      });
    
    if (insertError) {
      console.error('❌ Erro ao inserir registro de exemplo:', insertError);
    } else {
      console.log('✅ Registro de exemplo inserido com sucesso');
    }
    
    return {
      success: true,
      message: 'Tabela payroll criada/inicializada com sucesso'
    };
    
  } catch (error: any) {
    console.error('❌ Erro geral ao criar tabela payroll:', error);
    return {
      success: false,
      error: error?.message || 'Erro desconhecido'
    };
  }
}
