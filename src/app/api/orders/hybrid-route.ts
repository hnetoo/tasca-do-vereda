import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { localStorage } from '@/services/hybridStorage';

// API híbrida para salvar pedidos: SQLite local + Supabase backup
export async function POST(request: NextRequest) {
  console.log('🛒 HYBRID ORDERS API: Saving order...');
  
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
    
    // 1. Salvar no SQLite local (primário)
    console.log('💾 Saving to SQLite local...');
    const localResult = await localStorage.saveOrder({
      id: crypto.randomUUID(),
      order_number: `ORD-${Date.now()}`,
      table_id: tableId,
      status: status || 'OPEN',
      total: total || 0,
      subtotal: subtotal || 0,
      tax_amount: tax_amount || 0,
      customer_name: customer_name || null,
      customer_phone: customer_phone || null,
      payment_method: payment_method || null,
      notes: null,
      items: items
    });
    
    if (!localResult.success) {
      console.error('❌ Failed to save to SQLite:', localResult.error);
      return NextResponse.json(
        { error: `Falha no SQLite: ${localResult.error}` },
        { status: 500 }
      );
    }
    
    console.log('✅ Order saved to SQLite:', localResult.data?.id);
    
    // 2. Tentar salvar no Supabase (backup assíncrono)
    console.log('☁️ Attempting Supabase backup...');
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Inserir pedido no Supabase
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: localResult.data?.order_number,
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
          console.warn('⚠️ Supabase backup failed (order):', orderError.message);
        } else {
          // Inserir itens no Supabase
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
          
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);
          
          if (itemsError) {
            console.warn('⚠️ Supabase backup failed (items):', itemsError.message);
          } else {
            console.log('✅ Supabase backup successful');
          }
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
          order: localResult.data,
          source: 'sqlite',
          message: 'Pedido salvo localmente com sucesso'
        }
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ HYBRID ORDERS API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// API híbrida para listar pedidos: SQLite local + Supabase fallback
export async function GET(request: NextRequest) {
  console.log('🛒 HYBRID ORDERS API: Loading orders...');
  
  try {
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get('tableId');
    const status = searchParams.get('status');
    const useSupabase = searchParams.get('supabase') === 'true';
    
    // Se solicitado explicitamente Supabase, tentar primeiro
    if (useSupabase) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          
          let query = supabase
            .from('orders')
            .select(`
              *,
              order_items (*)
            `);
          
          if (tableId) query = query.eq('table_id', tableId);
          if (status) query = query.eq('status', status);
          
          const { data, error } = await query.order('created_at', { ascending: false });
          
          if (!error && data) {
            console.log('✅ Orders loaded from Supabase:', data.length);
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
    if (tableId) filters.tableId = tableId;
    if (status) filters.status = status;
    
    const localOrders = await localStorage.getOrders(filters);
    
    if (localOrders.length > 0) {
      console.log('✅ Orders loaded from SQLite:', localOrders.length);
      return NextResponse.json(
        { 
          success: true,
          data: localOrders,
          source: 'sqlite',
          count: localOrders.length
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
        
        let query = supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `);
        
        if (tableId) query = query.eq('table_id', tableId);
        if (status) query = query.eq('status', status);
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (!error && data && data.length > 0) {
          console.log('✅ Orders loaded from Supabase fallback:', data.length);
          
          // Sincronizar dados do Supabase para SQLite local
          for (const order of data) {
            await localStorage.saveOrder(order);
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
    console.log('📭 No orders found in any source');
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
    console.error('❌ HYBRID ORDERS API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
