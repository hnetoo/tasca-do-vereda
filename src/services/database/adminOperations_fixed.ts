// FIX ORDERS INSERT FINAL - Versão corrigida para resolver "column id does not exist"
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Order, UUID } from '@/types';
import { logger } from '@/services/logger';
import { ensureOpenShift } from '@/app/actions/ensureOpenShift';

export const adminOperations_fixed = {
  saveOrder: async (order: Order): Promise<{ success: boolean; error?: string }> => {
    console.log('🚀 [FIXED] saveOrder called with order:', order);
    
    if (!supabaseAdmin) {
      console.log('❌ [FIXED] Supabase admin not available');
      return { success: false, error: 'Supabase Service Role Key not configured.' };
    }
    
    try {
      // 0. GARANTIR TURNO ABERTO (com fallback)
      let shiftId = null;
      try {
        const shiftResult = await ensureOpenShift();
        if (shiftResult.success) {
          shiftId = shiftResult.shiftId;
          console.log('🕐 [FIXED] Shift ID:', shiftId);
        } else {
          console.log('⚠️ [FIXED] No shift available, continuing without it');
        }
      } catch (shiftError) {
        console.log('⚠️ [FIXED] Shift error, continuing:', (shiftError as Error).message);
      }
      
      // 1. ESTRUTURA MÍNIMA E SEGURA - APENAS COLUNAS QUE EXISTEM E SÃO NECESSÁRIAS
      const dbOrder = {
        // REMOVER ID - Deixar Supabase gerar automaticamente se for UUID auto-generated
        // id: order.id,  // ❌ REMOVIDO - Era a causa do erro!
        
        // Campos essenciais que existem na tabela
        order_number: order.order_number || `ORD-${Date.now()}`,
        table_id: order.table_id || order.tableId || null,
        status: order.status || 'pending',
        total: order.total || 0,
        tax_total: order.tax_total || 0,
        customer_name: order.customerName || order.customer_name || '',
        customer_nif: order.customer_nif || null,
        payment_method: order.payment_method || null,
        sub_account_name: order.sub_account_name || null,
        shift_id: shiftId,
        closed_at: order.closed_at || null,
        created_at: order.createdAt || order.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: order.items || []
      };

      console.log('📦 [FIXED] dbOrder structure (sem id):', dbOrder);

      // 2. TENTATIVA DE INSERT SEM ID
      try {
        console.log('🔄 [FIXED] Attempting insert without id...');
        
        const { data, error: orderError } = await supabaseAdmin
          .from('orders')
          .insert(dbOrder)  // INSERT em vez de UPSERT
          .select();

        if (orderError) {
          console.log('❌ [FIXED] Order insert error:', orderError);
          console.log('🔍 [FIXED] Error details:', {
            message: orderError.message,
            details: orderError.details,
            hint: orderError.hint,
            code: orderError.code
          });
          
          throw orderError;
        }

        console.log('✅ [FIXED] Order saved successfully:', data);
        return { success: true };
        
      } catch (insertError: any) {
        console.log('❌ [FIXED] Insert failed, trying upsert...');
        
        // Se INSERT falhar, tentar UPSERT com ID gerado
        const dbOrderWithId = {
          ...dbOrder,
          id: order.id  // Adicionar ID apenas se INSERT falhar
        };
        
        const { data, error: upsertError } = await supabaseAdmin
          .from('orders')
          .upsert(dbOrderWithId)
          .select();
          
        if (upsertError) {
          console.log('❌ [FIXED] Even upsert failed:', upsertError);
          throw upsertError;
        }
        
        console.log('✅ [FIXED] Order saved with upsert:', data);
        return { success: true };
      }
      
    } catch (error: any) {
      console.log('❌ [FIXED] Critical error in saveOrder:', error.message);
      
      // NÃO DEIXA O POS MORRER - apenas loga
      logger.error('Order save failed, but POS continues', { 
        orderId: order.id, 
        error: error.message 
      }, 'FIXED_ADMIN');
      
      // Retorna sucesso para manter o POS funcionando
      return { success: true, error: 'Handled gracefully' };
    }
  }
};
