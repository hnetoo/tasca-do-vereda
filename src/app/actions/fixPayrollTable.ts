'use server';

import { createClient } from '@/lib/supabase/server';

export async function fixPayrollTable() {
  const supabase = await createClient();
  
  try {
    console.log('🔧 [PAYROLL] Fixing table name and structure...');
    
    // Step 1: Check if payroll table exists
    const { error: checkError } = await supabase
      .from('payroll')
      .select('*')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ [PAYROLL] Table payroll already exists');
      return { 
        success: true, 
        message: 'Tabela payroll já existe e está funcionando'
      };
    }
    
    // Step 2: Check if payroll_records exists (the problematic one)
    const { error: recordsError } = await supabase
      .from('payroll_records')
      .select('*')
      .limit(1);
    
    if (!recordsError) {
      console.log('⚠️ [PAYROLL] Found problematic payroll_records table, migrating data...');
      
      // Migrate data from payroll_records to payroll
      const { data: oldRecords, error: fetchError } = await supabase
        .from('payroll_records')
        .select('*');
      
      if (fetchError) {
        console.error('❌ [PAYROLL] Error fetching old records:', fetchError);
        throw fetchError;
      }
      
      let migratedCount = 0;
      if (oldRecords && oldRecords.length > 0) {
        console.log(`🔄 [PAYROLL] Migrating ${oldRecords.length} records...`);
        
        for (const record of oldRecords) {
          const newRecord = {
            funcionario_name: record.funcionario_name || record.employee_name || '',
            mes_referencia: record.mes_referencia || record.reference_month || new Date().toISOString().slice(0, 7),
            salario_base: parseFloat(record.valor_base || record.base_salary || '0'),
            subsidios: parseFloat(record.subsidios || record.bonuses || '0'),
            descontos: parseFloat(record.descontos || record.deductions || '0'),
            status: record.status_pagamento || record.payment_status || 'pendente'
          };
          
          const { error: insertError } = await supabase
            .from('payroll')
            .insert(newRecord);
          
          if (insertError) {
            console.error('❌ [PAYROLL] Error migrating record:', insertError);
          } else {
            console.log('✅ [PAYROLL] Migrated record:', newRecord.funcionario_name);
            migratedCount++;
          }
        }
        
        console.log('✅ [PAYROLL] Migration completed');
        console.log(`📊 [PAYROLL] Total migrated: ${migratedCount}/${oldRecords.length} records`);
        
        // Drop old table
        const { error: dropError } = await supabase.rpc('exec_sql', {
          sql: 'DROP TABLE IF EXISTS public.payroll_records;'
        });
        
        if (dropError) {
          console.error('❌ [PAYROLL] Error dropping old table:', dropError);
        } else {
          console.log('✅ [PAYROLL] Dropped old payroll_records table');
        }
      }
    }
    
    // Step 3: Create payroll table if it doesn't exist
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
      
      -- Add indexes
      CREATE INDEX IF NOT EXISTS idx_payroll_funcionario ON public.payroll(funcionario_name);
      CREATE INDEX IF NOT EXISTS idx_payroll_mes ON public.payroll(mes_referencia);
      CREATE INDEX IF NOT EXISTS idx_payroll_status ON public.payroll(status);
      
      -- Enable RLS
      ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
      
      -- Create policy
      DROP POLICY IF EXISTS "Users can manage payroll" ON public.payroll;
      CREATE POLICY "Users can manage payroll" ON public.payroll
        FOR ALL USING (true)
        WITH CHECK (true);
    `;
    
    // Execute table creation
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    });
    
    if (createError) {
      console.error('❌ [PAYROLL] Error creating table:', createError);
      throw createError;
    }
    
    console.log('✅ [PAYROLL] Table payroll created/verified successfully');
    
    // Verify table works
    const { data: testData, error: testError } = await supabase
      .from('payroll')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ [PAYROLL] Error verifying table:', testError);
      throw testError;
    }
    
    return { 
      success: true, 
      message: 'Tabela payroll corrigida e verificada com sucesso',
      migrated: migratedCount || 0
    };
    
  } catch (error: any) {
    console.error('❌ [PAYROLL] Critical error fixing table:', error);
    return { 
      success: false, 
      error: error.message || 'Erro desconhecido ao corrigir tabela payroll',
      details: error
    };
  }
}
