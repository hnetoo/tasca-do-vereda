import { Order } from '@/types';
import { supabase } from '@/lib/supabase';

export async function saveOrderAction(order: Order) {
  try {
    console.log('💾 [saveOrderAction] Salvando pedido:', order);
    
    // GARANTIR STATUS CONCLUIDO e TOTAL COMO NÚMERO - SNAKE_CASE OBRIGATÓRIO
    const orderToSave: any = {
      ...order,
      status: 'CONCLUIDO', // Força status CONCLUIDO
      total: Number(order.total) || 0, // Garante que total seja Number
      total_amount: Number(order.total_amount) || 0, // SNAKE_CASE
      paid_amount: Number(order.paidAmount) || 0, // SNAKE_CASE
      customer_name: order.customer_name || null, // SNAKE_CASE DIRETO
      table_id: order.table_id || null, // SNAKE_CASE DIRETO
      order_number: order.order_number || null, // SNAKE_CASE DIRETO
      shift_id: order.shift_id || null, // SNAKE_CASE DIRETO
      invoice_number: order.invoice_number || null, // SNAKE_CASE DIRETO
      tax_total: order.tax_total || null, // SNAKE_CASE DIRETO
      sub_account_name: order.sub_account_name || null, // SNAKE_CASE DIRETO
      user_id: order.user_id || null, // SNAKE_CASE DIRETO
      user_name: order.user_name || null, // SNAKE_CASE DIRETO
      customer_id: order.customer_id || null, // SNAKE_CASE DIRETO
      // REMOVIDO: created_at e updated_at - Supabase usa DEFAULT NOW()
      // NÃO ENVIAR: created_at e updated_at para evitar erros de schema
    };
    
    console.log('💾 [saveOrderAction] Pedido formatado para salvar:', orderToSave);
    
    const { data, error } = await supabase
      .from('orders')
      .upsert(orderToSave)
      .select();

    if (error) {
      console.error('❌ [saveOrderAction] Erro ao salvar pedido:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [saveOrderAction] SUCESSO! Pedido salvo no Supabase:', data);
    console.log('✅ [saveOrderAction] Status:', (data as any)?.[0]?.status);
    console.log('✅ [saveOrderAction] Total:', (data as any)?.[0]?.total, '(Tipo:', typeof (data as any)?.[0]?.total, ')');
    console.log('✅ [saveOrderAction] Resposta Supabase:', { status: 201, data: data });
    
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ [saveOrderAction] Exceção ao salvar pedido:', error);
    return { success: false, error: (error as Error).message };
  }
}
