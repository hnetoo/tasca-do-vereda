import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    console.log('🧪 CREATE TEST DATA: Starting...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Criar orders de teste (ESTRUTURA EXATA DO SCHEMA)
    const testOrders = [
      {
        id: crypto.randomUUID(),
        status: 'completed',
        total: 15000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        status: 'completed',
        total: 8500,
        created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
        updated_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    
    // Criar expenses de teste (ESTRUTURA EXATA DO SCHEMA)
    const testExpenses = [
      {
        id: crypto.randomUUID(),
        description: 'Compra de bebidas',
        amount: 5000,
        category: 'Estoque',
        date: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        description: 'Limpeza',
        amount: 2000,
        category: 'Serviços',
        date: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ];
    
    // Inserir orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .insert(testOrders)
      .select();
    
    if (ordersError) {
      console.error('❌ Error inserting orders:', ordersError);
    } else {
      console.log('✅ Orders inserted:', ordersData?.length);
    }
    
    // Inserir expenses
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .insert(testExpenses)
      .select();
    
    if (expensesError) {
      console.error('❌ Error inserting expenses:', expensesError);
    } else {
      console.log('✅ Expenses inserted:', expensesData?.length);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test data created successfully',
      orders: ordersData?.length || 0,
      expenses: expensesData?.length || 0,
      errors: {
        orders: ordersError?.message,
        expenses: expensesError?.message
      }
    });
    
  } catch (error: any) {
    console.error('❌ CREATE TEST DATA Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
