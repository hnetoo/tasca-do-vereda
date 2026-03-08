import { createClient } from '@/lib/supabase/server';
import { Order } from '@/types';

export const adminOperations_fixed = {
  saveOrder: async (order: Order) => {
    try {
      console.log('🔄 [DIRECT] Salvando pedido diretamente com Supabase...');
      
      const supabase = await createClient();
      
      // Objeto limpo para insert direto
      const cleanData = {
        table_id: order.tableId === 'balcao-999' ? null : order.tableId, // UUID ou null
        total: order.total,
        items: order.items,
        status: order.status || 'ABERTO',
        payment_method: order.paymentMethod || 'PENDING',
        customer_name: order.customerName,
        customer_nif: order.customerNif,
        order_number: order.orderNumber,
        created_at: order.createdAt,
        updated_at: order.updatedAt
      };
      
      console.log('🔍 [DIRECT] Objeto a inserir:', JSON.stringify(cleanData, null, 2));
      
      // Insert direto sem camadas de erro
      const { data, error } = await supabase
        .from('orders')
        .insert(cleanData);
      
      if (error) {
        console.error('❌ [DIRECT] Erro ao salvar pedido:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ [DIRECT] Pedido salvo com sucesso!');
      return { success: true, data };
      
    } catch (error: any) {
      console.error('❌ [DIRECT] Exceção ao salvar pedido:', error);
      return { success: false, error: error.message };
    }
  }
};
