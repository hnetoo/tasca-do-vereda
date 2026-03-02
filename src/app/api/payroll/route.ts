import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API para salvar folha salarial no Supabase
export async function POST(request: NextRequest) {
  console.log('💼 PAYROLL API: Saving payroll record...');
  
  try {
    const body = await request.json();
    console.log('💼 PAYROLL API: Received body:', body);
    
    const { 
      employee_id, 
      month, 
      base_salary, 
      overtime_hours, 
      overtime_pay, 
      bonuses, 
      deductions, 
      net_salary, 
      payment_date, 
      payment_method, 
      notes 
    } = body;
    
    // Validar campos obrigatórios
    if (!employee_id || !month || !base_salary || !net_salary) {
      console.error('❌ PAYROLL API: Missing required fields:', { employee_id, month, base_salary, net_salary });
      return NextResponse.json(
        { error: 'Campos obrigatórios: employee_id, month, base_salary, net_salary' },
        { status: 400 }
      );
    }
    
    // Validar valores numéricos
    if (isNaN(parseFloat(base_salary)) || isNaN(parseFloat(net_salary))) {
      console.error('❌ PAYROLL API: Invalid numeric values:', { base_salary, net_salary });
      return NextResponse.json(
        { error: 'Valores numéricos inválidos para salário' },
        { status: 400 }
      );
    }
    
    // Validar ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ PAYROLL API: Missing Supabase configuration');
      return NextResponse.json(
        { error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      );
    }
    
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar se tabela existe
    try {
      const { error: tableCheckError } = await supabase.from('payroll_records').select('id').limit(1);
      if (tableCheckError && tableCheckError.code === 'PGRST116') {
        console.error('❌ PAYROLL API: Table payroll_records does not exist');
        return NextResponse.json(
          { error: 'Tabela payroll_records não encontrada. Execute as migrações do Supabase.' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('❌ PAYROLL API: Error checking table:', error);
    }
    
    // Inserir registro da folha salarial
    const insertData = {
      employee_id: employee_id,
      month: month,
      base_salary: parseFloat(base_salary),
      overtime_hours: parseFloat(overtime_hours || '0'),
      overtime_pay: parseFloat(overtime_pay || '0'),
      bonuses: parseFloat(bonuses || '0'),
      deductions: parseFloat(deductions || '0'),
      net_salary: parseFloat(net_salary),
      payment_date: payment_date || null,
      payment_method: payment_method || null,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('💼 PAYROLL API: Inserting data:', insertData);
    
    const { data, error } = await supabase
      .from('payroll_records')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ PAYROLL API: Error saving payroll record:', error);
      console.error('❌ PAYROLL API: Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Tratar erros específicos
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Já existe um registro para este funcionário neste mês' },
          { status: 409 }
        );
      }
      
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Funcionário não encontrado. Verifique o ID do funcionário.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: error.message || 'Erro ao salvar registro da folha salarial' },
        { status: 500 }
      );
    }
    
    console.log('✅ PAYROLL API: Payroll record saved successfully:', data);
    
    return NextResponse.json(
      { 
        success: true,
        data: data,
        message: 'Registro da folha salarial salvo com sucesso'
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ PAYROLL API: Unexpected error:', error);
    console.error('❌ PAYROLL API: Error stack:', error.stack);
    
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// API para listar folha salarial
export async function GET(request: NextRequest) {
  console.log('💼 PAYROLL API: Loading payroll records...');
  
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const employee_id = searchParams.get('employee_id');
    
    // Validar ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      );
    }
    
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Construir query
    let query = supabase.from('payroll_records').select('*');
    
    // Aplicar filtros
    if (month) {
      query = query.eq('month', month);
    }
    
    if (employee_id) {
      query = query.eq('employee_id', employee_id);
    }
    
    // Ordenar por mês (mais recente primeiro)
    query = query.order('month', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ PAYROLL API: Error loading payroll records:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ PAYROLL API: Payroll records loaded successfully:', data?.length || 0);
    
    return NextResponse.json(
      { 
        success: true,
        data: data || [],
        count: data?.length || 0
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ PAYROLL API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
