import { NextRequest, NextResponse } from 'next/server';
import { createPayrollTableDirect } from '@/app/actions/createPayrollTableDirect';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [API] Creating payroll table...');
    
    const result = await createPayrollTableDirect();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        method: result.method,
        tableExists: result.tableExists
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        sql: result.sql,
        requiresManualAction: result.requiresManualAction,
        methods: result.methods
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ [API] Error creating payroll table:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to create payroll table',
    sql: `
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
      
      -- Índices
      CREATE INDEX IF NOT EXISTS idx_payroll_funcionario ON public.payroll(funcionario_name);
      CREATE INDEX IF NOT EXISTS idx_payroll_mes ON public.payroll(mes_referencia);
      CREATE INDEX IF NOT EXISTS idx_payroll_status ON public.payroll(status);
      
      -- Segurança
      ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can manage payroll" ON public.payroll;
      CREATE POLICY "Users can manage payroll" ON public.payroll
        FOR ALL USING (true)
        WITH CHECK (true);
    `
  });
}
