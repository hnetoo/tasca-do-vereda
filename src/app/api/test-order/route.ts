import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Criar uma venda de teste simples - mínima para evitar erros
    const testOrder = {
      id: crypto.randomUUID(),
      order_number: 'TEST-' + Date.now(),
      status: 'FECHADO',
      total: 15000, // 150.00 AKZ
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('🧪 Creating test order:', testOrder);
    
    const { data, error } = await supabase
      .from('orders')
      .insert([testOrder])
      .select();
    
    if (error) {
      console.error('❌ Error creating test order:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('✅ Test order created successfully:', data);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test order created successfully',
      order: data[0]
    });
    
  } catch (error: any) {
    console.error('❌ Error in test-order API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
