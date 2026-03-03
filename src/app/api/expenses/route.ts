import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API para salvar despesas no Supabase
export async function POST(request: NextRequest) {
  console.log('💰 EXPENSES API: Saving expense...');
  
  try {
    const body = await request.json();
    const { amount, category, date, description, notes, payment_method, status } = body;
    
    // Validar campos obrigatórios
    if (!amount || !category || !date || !description) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: amount, category, date, description' },
        { status: 400 }
      );
    }
    
    // Validar ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      );
    }
    
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Inserir despesa
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        amount: parseFloat(amount),
        category: category || 'Outros',
        date: date,
        description: description,
        notes: notes || null,
        payment_method: payment_method || null,
        status: status || 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ EXPENSES API: Error saving expense:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ EXPENSES API: Expense saved successfully:', data);
    
    return NextResponse.json(
      { 
        success: true,
        data: data,
        message: 'Despesa salva com sucesso'
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ EXPENSES API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// API para listar despesas
export async function GET(request: NextRequest) {
  console.log('💰 EXPENSES API: Loading expenses...');
  
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');
    
    // Validar ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      );
    }
    
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Construir query
    let query = supabase.from('expenses').select('*');
    
    // Aplicar filtros
    if (startDate) {
      query = query.gte('date', startDate);
    }
    
    if (endDate) {
      query = query.lte('date', endDate);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    // Ordenar por data (mais recente primeiro)
    query = query.order('date', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ EXPENSES API: Error loading expenses:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ EXPENSES API: Expenses loaded successfully:', data?.length || 0);
    
    return NextResponse.json(
      { 
        success: true,
        data: data || [],
        count: data?.length || 0
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ EXPENSES API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
