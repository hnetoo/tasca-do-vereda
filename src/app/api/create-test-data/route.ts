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
    
    // Criar orders de teste
    const testOrders = [
      {
        id: crypto.randomUUID(),
        tableId: 'mesa-1',
        status: 'completed',
        total: 15000,
        created_at: new Date().toISOString(),
        items: [
          { name: 'Cerveja', price: 500, quantity: 2 },
          { name: 'Frango', price: 7000, quantity: 1 }
        ]
      },
      {
        id: crypto.randomUUID(),
        tableId: 'mesa-2',
        status: 'completed',
        total: 8500,
        created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
        items: [
          { name: 'Refrigerante', price: 300, quantity: 2 },
          { name: 'Batata', price: 4000, quantity: 1 }
        ]
      }
    ];
    
    // Criar expenses de teste
    const testExpenses = [
      {
        id: crypto.randomUUID(),
        description: 'Compra de bebidas',
        amount: 5000,
        category: 'Estoque',
        date: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        description: 'Limpeza',
        amount: 2000,
        category: 'Serviços',
        date: new Date().toISOString()
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
