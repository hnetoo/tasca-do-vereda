import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { localStorage } from '@/services/hybridStorage';

// API híbrida para despesas: SQLite local + Supabase backup
export async function POST(request: NextRequest) {
  console.log('💰 HYBRID EXPENSES API: Saving expense...');
  
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
    
    // 1. Salvar no SQLite local (primário)
    console.log('💾 Saving to SQLite local...');
    const localResult = await localStorage.saveExpense({
      amount: parseFloat(amount),
      category: category || 'Outros',
      date: date,
      description: description,
      notes: notes || null,
      payment_method: payment_method || null,
      status: status || 'PENDING'
    });
    
    if (!localResult.success) {
      console.error('❌ Failed to save to SQLite:', localResult.error);
      return NextResponse.json(
        { error: `Falha no SQLite: ${localResult.error}` },
        { status: 500 }
      );
    }
    
    console.log('✅ Expense saved to SQLite:', localResult.data?.id);
    
    // 2. Tentar salvar no Supabase (backup assíncrono)
    console.log('☁️ Attempting Supabase backup...');
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
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
          console.warn('⚠️ Supabase backup failed:', error.message);
        } else {
          console.log('✅ Supabase backup successful');
        }
      } else {
        console.warn('⚠️ Supabase not configured, skipping backup');
      }
    } catch (supabaseError: any) {
      console.warn('⚠️ Supabase backup error:', supabaseError.message);
      // Não falhar se Supabase falhar - SQLite é primário
    }
    
    return NextResponse.json(
      { 
        success: true,
        data: {
          expense: localResult.data,
          source: 'sqlite',
          message: 'Despesa salva localmente com sucesso'
        }
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ HYBRID EXPENSES API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// API híbrida para listar despesas: SQLite local + Supabase fallback
export async function GET(request: NextRequest) {
  console.log('💰 HYBRID EXPENSES API: Loading expenses...');
  
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const date = searchParams.get('date');
    const useSupabase = searchParams.get('supabase') === 'true';
    
    // Se solicitado explicitamente Supabase, tentar primeiro
    if (useSupabase) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          
          let query = supabase.from('expenses').select('*');
          
          if (category) query = query.eq('category', category);
          if (date) query = query.eq('date', date);
          
          const { data, error } = await query.order('created_at', { ascending: false });
          
          if (!error && data && data.length > 0) {
            console.log('✅ Expenses loaded from Supabase:', data.length);
            return NextResponse.json(
              { 
                success: true,
                data: data,
                source: 'supabase',
                count: data.length
              },
              { status: 200 }
            );
          }
        }
      } catch (supabaseError: any) {
        console.warn('⚠️ Supabase query failed, falling back to SQLite:', supabaseError.message);
      }
    }
    
    // 1. Tentar SQLite local (primário)
    console.log('💾 Loading from SQLite local...');
    const filters: any = {};
    if (category) filters.category = category;
    if (date) filters.date = date;
    
    const localExpenses = await localStorage.getExpenses(filters);
    
    if (localExpenses.length > 0) {
      console.log('✅ Expenses loaded from SQLite:', localExpenses.length);
      return NextResponse.json(
        { 
          success: true,
          data: localExpenses,
          source: 'sqlite',
          count: localExpenses.length
        },
        { status: 200 }
      );
    }
    
    // 2. Fallback para Supabase se SQLite estiver vazio
    console.log('☁️ SQLite empty, trying Supabase fallback...');
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        let query = supabase.from('expenses').select('*');
        
        if (category) query = query.eq('category', category);
        if (date) query = query.eq('date', date);
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (!error && data && data.length > 0) {
          console.log('✅ Expenses loaded from Supabase fallback:', data.length);
          
          // Sincronizar dados do Supabase para SQLite local
          for (const expense of data) {
            await localStorage.saveExpense(expense);
          }
          
          return NextResponse.json(
            { 
              success: true,
              data: data,
              source: 'supabase_fallback',
              count: data.length
            },
            { status: 200 }
          );
        }
      }
    } catch (supabaseError: any) {
      console.warn('⚠️ Supabase fallback failed:', supabaseError.message);
    }
    
    // Retornar vazio se nada for encontrado
    console.log('📭 No expenses found in any source');
    return NextResponse.json(
      { 
        success: true,
        data: [],
        source: 'none',
        count: 0
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ HYBRID EXPENSES API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
