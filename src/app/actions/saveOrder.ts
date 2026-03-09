import { Order } from '@/types';
import { supabase } from '@/lib/supabase';

export async function saveOrderAction(order: Order) {
  try {
    console.log('💾 [saveOrderAction] Salvando pedido:', order);
    
    // 🎯 MAPEAR ITENS DO CARRINHO CONFORME SCHEMA ORDER_ITEMS
    const items = order.items || [];
    console.log('💾 [saveOrderAction] Itens do pedido:', items);
    
    // 🎯 CALCULAR TOTAL CORRETO A PARTIR DOS ITENS
    const calculatedTotal = items.reduce((sum: number, item: any) => {
      const price = item.unit_price || item.price || 0;
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);
    
    console.log('💾 [saveOrderAction] Total calculado:', calculatedTotal);
    
    // GARANTIR STATUS CONCLUIDO e TOTAL CORRETO - SNAKE_CASE OBRIGATÓRIO
    const orderToSave: any = {
      ...order,
      status: 'CONCLUIDO', // Força status CONCLUIDO
      total: calculatedTotal, // 🎯 USAR TOTAL CALCULADO
      total_amount: calculatedTotal, // 🎯 USAR TOTAL CALCULADO - SNAKE_CASE
      paid_amount: calculatedTotal, // 🎯 USAR TOTAL CALCULADO - SNAKE_CASE
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
      // 🎯 MAPEAR ITENS CONFORME SCHEMA ORDER_ITEMS
      items: items.map((item: any) => ({
        id: item.id,
        order_id: item.order_id,
        dish_id: item.dish_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_percentage: item.tax_percentage || 0,
        tax_amount: item.tax_amount || 0,
        tax_code: item.tax_code || '',
        notes: item.notes || '',
        status: item.status || 'pending',
        created_at: item.created_at
      })),
      // REMOVIDO: created_at e updated_at - Supabase usa DEFAULT NOW()
    };
    
    console.log('💾 [saveOrderAction] Pedido formatado para salvar:', orderToSave);
    
    // 🎯 SALVAR NO LOCALSTORAGE PRIMEIRO (RESILIÊNCIA HÍBRIDA)
    try {
      localStorage.setItem('pendingOrder', JSON.stringify(orderToSave));
      console.log('💾 [saveOrderAction] Pedido salvo no LocalStorage como backup');
    } catch (error) {
      console.warn('💾 [saveOrderAction] Erro ao salvar no LocalStorage:', error);
    }
    
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
    
    // 🎯 LIMPAR LOCALSTORAGE APÓS SUCESSO
    try {
      localStorage.removeItem('pendingOrder');
      console.log('💾 [saveOrderAction] Backup do LocalStorage removido após sucesso');
    } catch (error) {
      console.warn('💾 [saveOrderAction] Erro ao remover do LocalStorage:', error);
    }
    
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ [saveOrderAction] Exceção ao salvar pedido:', error);
    return { success: false, error: (error as Error).message };
  }
}
