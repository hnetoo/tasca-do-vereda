import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { action } = await request.json();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (action === 'create_test_orders') {
      // Criar orders de teste
      const testOrders = [
        {
          id: crypto.randomUUID(),
          order_number: null,
          status: 'FECHADO',
          total: 15000,
          tax_total: null,
          table_id: null,
          customer_id: null,
          user_id: null,
          user_name: null,
          customer_name: 'Mesa Teste',
          customer_nif: null,
          shift_id: null,
          notes: null,
          payment_method: null,
          split_payments: null,
          invoice_number: null,
          sub_account_name: null,
          is_synced_agt: 0,
          agt_submission_uuid: null,
          hash: null,
          previous_hash: null,
          signature: null,
          jws_payload: null,
          closed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: []
        },
        {
          id: crypto.randomUUID(),
          order_number: null,
          status: 'ABERTO',
          total: 25000,
          tax_total: null,
          table_id: null,
          customer_id: null,
          user_id: null,
          user_name: null,
          customer_name: 'Balcão Teste',
          customer_nif: null,
          shift_id: null,
          notes: null,
          payment_method: null,
          split_payments: null,
          invoice_number: null,
          sub_account_name: null,
          is_synced_agt: 0,
          agt_submission_uuid: null,
          hash: null,
          previous_hash: null,
          signature: null,
          jws_payload: null,
          closed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: []
        }
      ];
      
      const { data, error } = await supabase
        .from('orders')
        .insert(testOrders)
        .select();
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Test orders created successfully',
        created: data?.length || 0
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
