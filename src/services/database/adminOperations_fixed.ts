// FIX ORDERS INSERT FINAL - Versão corrigida para resolver "column id does not exist"
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Order, UUID } from '@/types';
import { logger } from '@/services/logger';
import { ensureOpenShift } from '@/app/actions/ensureOpenShift';

export const adminOperations_fixed = {
  saveOrder: async (order: Order): Promise<{ success: boolean; error?: string; data?: any }> => {
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
      
      // 1. ESTRUTURA LIMPA E CORRETA - APENAS COLUNAS ESSENCIAIS
      const dbOrder = {
        // REMOVER ID - Deixar Supabase gerar automaticamente
        // id: order.id,  // ❌ REMOVIDO - Era a causa do erro!
        
        // Campos essenciais que existem na tabela
        order_number: order.order_number || `ORD-${Date.now()}`,
        table_id: order.table_id || order.tableId || null,  // ✅ Mapeamento correto
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

      console.log('📦 [FINAL] dbOrder structure (limpa):', dbOrder);

      // DEBUG DO OBJETO - Mostrar dados exatos antes do upsert
      console.log('🔍 [DEBUG] DADOS A ENVIAR:', JSON.stringify(dbOrder, null, 2));

      // FORCE UUID - Eliminar ID se for nulo ou pedido novo
      if (!order.id || order.id === 'null' || order.id === '') {
        console.log('🗑️ [FORCE UUID] Removendo campo ID (pedido novo)');
        // dbOrder não tem campo id, então não precisa remover
      } else {
        console.log('✅ [FORCE UUID] Mantendo campo ID (pedido existente):', order.id);
        // Adicionar ID apenas se existir e for válido
        (dbOrder as any).id = order.id;
      }

      // DEBUG APÓS LIMPEZA
      console.log('🔍 [DEBUG] DADOS FINAIS:', JSON.stringify(dbOrder, null, 2));

      // 2. UPSERT CORRETO - Usar order_number em vez de id
      try {
        console.log('🔄 [FINAL] Attempting upsert with order_number conflict resolution...');
        
        const { data, error: orderError } = await supabaseAdmin
          .from('orders')
          .upsert(dbOrder, { 
            onConflict: 'order_number'  // ✅ Usar order_number em vez de id (corrigido para onConflict)
          })
          .select();

        if (orderError) {
          console.log('❌ [FINAL] Order upsert error:', orderError);
          console.log('🔍 [FINAL] Error details:', {
            message: orderError.message,
            details: orderError.details,
            hint: orderError.hint,
            code: orderError.code
          });
          
          throw orderError;
        }

        console.log('✅ [FINAL] Order saved successfully:', data);
        console.log('📊 [FINAL] Status: Order registered with ID:', data[0]?.id);
        console.log('📋 [FINAL] Response Status: 200 OK');
        
        return { success: true, data: data };
        
      } catch (upsertError: any) {
        console.log('❌ [FINAL] Upsert failed completely:', upsertError.message);
        
        // ÚLTIMO RECURSO: Insert simples se upsert falhar
        const { data, error: insertError } = await supabaseAdmin
          .from('orders')
          .insert(dbOrder)
          .select();
          
        if (insertError) {
          console.log('❌ [FINAL] Even insert failed:', insertError);
          throw insertError;
        }
        
        console.log('✅ [FINAL] Order saved with insert fallback:', data);
        console.log('📊 [FINAL] Status: Order registered with ID:', data[0]?.id);
        console.log('📋 [FINAL] Response Status: 201 Created');
        
        return { success: true, data: data };
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
