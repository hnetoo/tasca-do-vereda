import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Criar pedido de teste
    const testOrder = {
      id: `test-order-${Date.now()}`,
      order_number: `TEST-${Date.now()}`,
      table_id: '1',
      status: 'COMPLETED',
      subtotal: 1000,
      total: 1200,
      tax_amount: 200,
      customer_name: 'Cliente Teste',
      payment_method: 'CASH',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Inserir pedido
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();
    
    if (orderError) {
      console.error('Error creating test order:', orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }
    
    // Criar itens do pedido
    const testOrderItems = [
      {
        id: `test-item-${Date.now()}-1`,
        order_id: testOrder.id,
        dish_id: '1',
        quantity: 2,
        unit_price: 500,
        total_price: 1000,
        notes: 'Item de teste 1',
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `test-item-${Date.now()}-2`,
        order_id: testOrder.id,
        dish_id: '2',
        quantity: 1,
        unit_price: 200,
        total_price: 200,
        notes: 'Item de teste 2',
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .insert(testOrderItems)
      .select();
    
    if (itemsError) {
      console.error('Error creating test order items:', itemsError);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }
    
    // Criar despesa de teste
    const testExpense = {
      id: `test-expense-${Date.now()}`,
      amount: 500,
      category: 'Teste',
      description: 'Despesa de teste para verificar mobile',
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .insert(testExpense)
      .select()
      .single();
    
    if (expenseError) {
      console.error('Error creating test expense:', expenseError);
      return NextResponse.json({ error: expenseError.message }, { status: 500 });
    }
    
    console.log('✅ Test data created successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Dados de teste criados com sucesso',
      data: {
        order: orderData,
        orderItems: itemsData,
        expense: expenseData
      }
    });
    
  } catch (error: any) {
    console.error('Error creating test data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
