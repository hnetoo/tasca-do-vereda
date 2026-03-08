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
      totalAmount: Number(order.total_amount) || 0, // CAMELCASE: total_amount → totalAmount
      paidAmount: Number(order.paidAmount) || 0, // Garante que paidAmount seja Number
      customerName: order.customer_name || null, // CAMELCASE: customer_name → customerName
      tableName: order.table_id || null, // CAMELCASE: table_id → tableName
      orderNumber: order.order_number || null, // CAMELCASE: order_number → orderNumber
      shiftId: order.shift_id || null, // CAMELCASE: shift_id → shiftId
      invoiceNumber: order.invoice_number || null, // CAMELCASE: invoice_number → invoiceNumber
      taxTotal: order.tax_total || null, // CAMELCASE: tax_total → taxTotal
      subAccountName: order.sub_account_name || null, // CAMELCASE: sub_account_name → subAccountName
      userId: order.user_id || null, // CAMELCASE: user_id → userId
      userName: order.user_name || null, // CAMELCASE: user_name → userName
      customerId: order.customer_id || null, // CAMELCASE: customer_id → customerId
      createdAt: order.created_at || null, // CAMELCASE: created_at → createdAt
      updatedAt: order.updated_at || null, // CAMELCASE: updated_at → updatedAt
      // SEMPRE USAR CAMELCASE PARA SUPABASE
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
