'use server';

import { createClient } from '@/lib/supabase/server';

export async function resetProductionData() {
  const supabase = await createClient();
  
  try {
    console.log('🔄 RESET: Iniciando limpeza completa de produção...');
    
    // Método infalível: Apagar na ordem correta para evitar Foreign Key conflicts
    // 1. Primeiro apagar itens dos pedidos (order_items)
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all but fake UUID
    
    if (itemsError) {
      console.error('❌ RESET: Erro ao apagar order_items:', itemsError);
    } else {
      console.log('✅ RESET: order_items apagados com sucesso');
    }
    
    // 2. Depois apagar os pedidos (orders)
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all but fake UUID
    
    if (ordersError) {
      console.error('❌ RESET: Erro ao apagar orders:', ordersError);
    } else {
      console.log('✅ RESET: orders apagados com sucesso');
    }
    
    // 3. Apagar movimentações de stock (stock_movements)
    const { error: stockError } = await supabase
      .from('stock_movements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all but fake UUID
    
    if (stockError) {
      console.error('❌ RESET: Erro ao apagar stock_movements:', stockError);
    } else {
      console.log('✅ RESET: stock_movements apagados com sucesso');
    }
    
    // 4. Apagar vendas (se existir tabela separada)
    const { error: salesError } = await supabase
      .from('sales')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all but fake UUID
    
    if (salesError && !salesError.message?.includes('does not exist')) {
      console.error('❌ RESET: Erro ao apagar sales:', salesError);
    } else {
      console.log('✅ RESET: sales apagados com sucesso (ou tabela não existe)');
    }
    
    console.log('✅ RESET: Dados de produção limpos com sucesso!');
    
    return {
      success: true,
      message: 'Dados de produção limpos com sucesso',
      cleared: {
        order_items: !itemsError,
        orders: !ordersError,
        stock_movements: !stockError,
        sales: !salesError || salesError.message?.includes('does not exist')
      }
    };
    
  } catch (error) {
    console.error('❌ RESET: Erro geral:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}
