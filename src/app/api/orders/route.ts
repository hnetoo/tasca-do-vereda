import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API para salvar pedidos no Supabase
export async function POST(request: NextRequest) {
  console.log('🛒 ORDERS API: Saving order...');
  
  try {
    const body = await request.json();
    const { tableId, tableName, status, total, subtotal, tax_amount, items, customer_name, customer_phone, payment_method } = body;
    
    // Validar campos obrigatórios
    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Campos tableId e items são obrigatórios' },
        { status: 400 }
      );
    }
    
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
    
    // Gerar número do pedido
    const orderNumber = `ORD-${Date.now()}`;
    
    // Inserir pedido
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        table_id: tableId,
        status: status || 'OPEN',
        total: total || 0,
        subtotal: subtotal || 0,
        tax_amount: tax_amount || 0,
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
        payment_method: payment_method || null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (orderError) {
      console.error('❌ ORDERS API: Error saving order:', orderError);
      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      );
    }
    
    // Inserir itens do pedido
    const orderItems = items.map((item: any) => ({
      order_id: orderData.id,
      dish_id: item.dishId || item.id,
      quantity: item.quantity || 1,
      unit_price: item.price || 0,
      total_price: (item.price || 0) * (item.quantity || 1),
      notes: item.notes || null,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();
    
    if (itemsError) {
      console.error('❌ ORDERS API: Error saving order items:', itemsError);
      // Tentar deletar o pedido se os itens falharam
      await supabase.from('orders').delete().eq('id', orderData.id);
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }
    
    console.log('✅ ORDERS API: Order and items saved successfully:', { order: orderData, items: itemsData });
    
    return NextResponse.json(
      { 
        success: true,
        data: {
          order: orderData,
          items: itemsData
        },
        message: 'Pedido salvo com sucesso'
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ ORDERS API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// API para listar pedidos
export async function GET(request: NextRequest) {
  console.log('🛒 ORDERS API: Loading orders...');
  
  try {
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get('tableId');
    const status = searchParams.get('status');
    
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
    
    let query = supabase
      .from('orders')
      .select('*');
    
    // Aplicar filtros
    if (tableId) {
      query = query.eq('table_id', tableId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ ORDERS API: Error loading orders:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ ORDERS API: Orders loaded successfully:', data?.length || 0);
    
    return NextResponse.json(
      { 
        success: true,
        data: data || [],
        count: data?.length || 0
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ ORDERS API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
