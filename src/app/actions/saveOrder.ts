import { Order } from '@/types';

// 🎯 SINGLETON SUPABASE CLIENT - EVITAR MULTIPLE GOTHCLIENT
let supabaseClient: any = null;

async function getSupabaseClient() {
  if (!supabaseClient) {
    const { supabase } = await import('@/lib/supabase');
    supabaseClient = supabase;
    console.log('🔒 [SUPABASE] Singleton client criado');
  }
  return supabaseClient;
}

export async function saveOrderAction(order: Order, cartItems?: any[]) {
  try {
    console.log('💾 [saveOrderAction] Salvando pedido:', order);
    
    // 🎯 OBRIGATORIEDADE: Receber carrinho como argumento direto
    if (!cartItems) {
      // Se não recebeu, obter do estado (fallback)
      const { cartItems: stateCartItems } = await import('@/store/useStore').then(m => m.useStore.getState());
      cartItems = stateCartItems;
    }
    
    console.log('💾 [saveOrderAction] Carrinho recebido:', cartItems);
    
    // 🎯 VALIDAÇÃO CRÍTICA: Se não há itens, erro
    if (!cartItems || cartItems.length === 0) {
      console.error('❌ [saveOrderAction] ERRO: Carrinho vazio! Nenhum item para salvar.');
      return { success: false, error: 'Carrinho vazio! Adicione itens antes de salvar.' };
    }
    
    // 🎯 OBRIGATORIEDADE: Recalcular total manualmente
    const realTotal = cartItems.reduce((acc: number, i: any) => {
      const price = i.unit_price || i.price || 0;
      const quantity = i.quantity || 1;
      return acc + (price * quantity);
    }, 0);
    
    console.log('💾 [saveOrderAction] Total manualmente calculado:', realTotal);
    
    // 🎯 TRAVÃO DE SEGURANÇA: Se total é 0, parar e dar erro
    if (realTotal === 0) {
      console.error('🚨 [saveOrderAction] TRAVÃO DE SEGURANÇA: Total calculado é 0! ENVIANDO LIXO PARA DB - PARADO!');
      console.error('🚨 [saveOrderAction] Itens no carrinho:', cartItems);
      console.error('🚨 [saveOrderAction] Preços dos itens:', cartItems.map(i => ({ name: i.name, price: i.unit_price || i.price })));
      return { success: false, error: 'TRAVÃO DE SEGURANÇA: Total calculado é 0! Verifique os preços dos itens.' };
    }
    
    // 🎯 MAPEAR ITENS CONFORME SCHEMA
    const mappedItems = cartItems.map((item: any) => ({
      id: item.id,
      order_id: order.id,
      dish_id: item.dish_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_percentage: item.tax_percentage || 0,
      tax_amount: item.tax_amount || 0,
      tax_code: item.tax_code || '',
      notes: item.notes || '',
      status: item.status || 'pending',
      created_at: item.created_at
    }));
    
    console.log('💾 [saveOrderAction] Itens mapeados:', mappedItems);
    
    // 🎯 VALIDAÇÃO FINAL
    if (!mappedItems || mappedItems.length === 0) {
      console.error('❌ [saveOrderAction] ERRO: Falha ao mapear itens do carrinho!');
      return { success: false, error: 'Falha ao processar itens do carrinho!' };
    }
    
    // 🎯 PAYLOAD CORRETO COM closedAt (COM 'A' MAIÚSCULO)
    const orderToSave: any = {
      ...order,
      status: 'CONCLUIDO',
      total: realTotal,                    // 🎯 TOTAL MANUALMENTE CALCULADO
      total_amount: realTotal,             // 🎯 TOTAL MANUALMENTE CALCULADO
      paid_amount: realTotal,             // 🎯 TOTAL MANUALMENTE CALCULADO
      customer_name: order.customer_name || 'Balcão',
      table_id: order.table_id || null,
      order_number: order.order_number || null,
      shift_id: order.shift_id || null,
      invoice_number: order.invoice_number || null,
      tax_total: order.tax_total || null,
      sub_account_name: order.sub_account_name || null,
      user_id: order.user_id || null,
      user_name: order.user_name || null,
      customer_id: order.customer_id || null,
      // 🎯 OBRIGATORIEDADE: closedAt COM 'A' MAIÚSCULO CONFORME SUPABASE
      closedAt: new Date().toISOString(),
      // 🎯 ITENS REAIS DO CARRINHO
      items: mappedItems,
    };
    
    console.log('💾 [saveOrderAction] Payload final:', {
      id: orderToSave.id,
      total: orderToSave.total,
      items_count: orderToSave.items.length,
      closedAt: orderToSave.closedAt,
      customer_name: orderToSave.customer_name
    });
    
    // 🎯 SALVAR NO LOCALSTORAGE PRIMEIRO
    try {
      localStorage.setItem('pendingOrder', JSON.stringify(orderToSave));
      console.log('💾 [saveOrderAction] Pedido salvo no LocalStorage como backup');
    } catch (error) {
      console.warn('💾 [saveOrderAction] Erro ao salvar no LocalStorage:', error);
    }
    
    // 🎯 USAR SINGLETON SUPABASE CLIENT
    const supabase = await getSupabaseClient();
    
    console.log('💾 [saveOrderAction] ENVIANDO PARA SUPABASE...');
    
    // 🎯 INSERT DIRETO
    const { data, error } = await supabase
      .from('orders')
      .insert(orderToSave)
      .select();

    if (error) {
      console.error('❌ [saveOrderAction] Erro ao salvar pedido:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [saveOrderAction] SUCESSO! Pedido salvo no Supabase:', data);
    console.log('✅ [saveOrderAction] Total salvo:', (data as any)?.[0]?.total);
    console.log('✅ [saveOrderAction] Items salvos:', (data as any)?.[0]?.items?.length);
    console.log('✅ [saveOrderAction] closedAt salvo:', (data as any)?.[0]?.closedAt);
    
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
