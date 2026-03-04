import { NextRequest, NextResponse } from 'next/server';
import { createStaffTable } from '@/app/actions/createStaffTable';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [API] Creating staff table...');
    
    const result = await createStaffTable();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        tableExists: result.tableExists
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        sql: result.sql,
        requiresManualAction: result.requiresManualAction
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ [API] Error creating staff table:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to create staff table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.staff (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        nome TEXT NOT NULL,
        cargo TEXT NOT NULL,
        telefone TEXT,
        salario_base NUMERIC DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Índices
      CREATE INDEX IF NOT EXISTS idx_staff_nome ON public.staff(nome);
      CREATE INDEX IF NOT EXISTS idx_staff_cargo ON public.staff(cargo);
      CREATE INDEX IF NOT EXISTS idx_staff_created_at ON public.staff(created_at);
      
      -- Segurança
      ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can manage staff" ON public.staff;
      CREATE POLICY "Users can manage staff" ON public.staff
        FOR ALL USING (true)
        WITH CHECK (true);
    `
  });
}
