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
      total_amount: Number(order.total_amount) || 0, // Garante que total_amount seja Number
      paidAmount: Number(order.paidAmount) || 0, // Garante que paidAmount seja Number
      // REMOVIDO: closedAt - está causando erro de coluna inexistente
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
