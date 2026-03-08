import { Order } from '@/types';
import { supabase } from '@/lib/supabase';

export async function saveOrderAction(order: Order) {
  try {
    console.log('💾 [saveOrderAction] Salvando pedido:', order);
    
    // GARANTIR STATUS CONCLUIDO e TOTAL COMO NÚMERO
    const orderToSave: any = {
      ...order,
      status: 'CONCLUIDO', // Força status CONCLUIDO
      total: Number(order.total) || 0, // Garante que total seja Number
      total_amount: Number(order.totalAmount) || 0, // SNAKE_CASE: totalAmount → total_amount
      paid_amount: Number(order.paidAmount) || 0, // SNAKE_CASE: paidAmount → paid_amount
      customer_name: order.customerName || null, // SNAKE_CASE: customerName → customer_name
      table_id: order.tableName || null, // SNAKE_CASE: tableName → table_id
      order_number: order.orderNumber || null, // SNAKE_CASE: orderNumber → order_number
      shift_id: order.shiftId || null, // SNAKE_CASE: shiftId → shift_id
      invoice_number: order.invoiceNumber || null, // SNAKE_CASE: invoiceNumber → invoice_number
      tax_total: order.taxTotal || null, // SNAKE_CASE: taxTotal → tax_total
      sub_account_name: order.subAccountName || null, // SNAKE_CASE: subAccountName → sub_account_name
      user_id: order.userId || null, // SNAKE_CASE: userId → user_id
      user_name: order.userName || null, // SNAKE_CASE: userName → user_name
      customer_id: order.customerId || null, // SNAKE_CASE: customerId → customer_id
      created_at: order.createdAt || null, // SNAKE_CASE: createdAt → created_at
      updated_at: order.updatedAt || null, // SNAKE_CASE: updatedAt → updated_at
      // SEMPRE USAR SNAKE_CASE PARA POSTGRESQL/SUPABASE
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
