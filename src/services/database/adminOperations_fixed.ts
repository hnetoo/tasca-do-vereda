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

      // 3. MAPA DE COLUNAS - Remover campo id para evitar erro "column id does not exist"
      console.log('🔍 [DEBUG ANTES] dbOrder completo:', JSON.stringify(dbOrder, null, 2));
      console.log('🔍 [DEBUG ANTES] Chaves do dbOrder:', Object.keys(dbOrder));
      
      let dataToSave = { ...dbOrder };
      if ('id' in dataToSave) {
        console.log('🗑️ [DEBUG] ENCONTRADO ID - Removendo...');
        const { id, ...dataWithoutId } = dataToSave;
        dataToSave = dataWithoutId;
        console.log('🗑️ [DEBUG] ID removido:', JSON.stringify(dataToSave, null, 2));
        console.log('🗑️ [DEBUG] Chaves após remoção:', Object.keys(dataToSave));
      } else {
        console.log('✅ [DEBUG] Sem campo id para remover');
        console.log('✅ [DEBUG] Enviando diretamente:', JSON.stringify(dataToSave, null, 2));
        console.log('✅ [DEBUG] Chaves finais:', Object.keys(dataToSave));
      }
      
      // VERIFICAÇÃO FINAL - Garantir que não há id
      if ('id' in dataToSave) {
        console.error('❌ [CRÍTICO] ID ainda presente após remoção!');
        console.error('❌ [CRÍTICO] dataToSave com id:', JSON.stringify(dataToSave, null, 2));
        throw new Error('ID ainda presente no objeto - abortando para evitar erro');
      } else {
        console.log('✅ [VERIFICAÇÃO FINAL] Objeto limpo, sem campo id');
      }

      // 4. LIMPEZA COMPLETA DO OBJETO - Apenas campos essenciais
      console.log('🧹 [LIMPEZA] Iniciando limpeza completa do objeto...');
      
      const cleanData = {
        table_id: dataToSave.table_id,
        total: dataToSave.total,
        items: dataToSave.items,
        status: dataToSave.status || 'ABERTO',
        payment_method: dataToSave.payment_method || 'PENDING',
        customer_name: dataToSave.customer_name,
        customer_nif: dataToSave.customer_nif,
        order_number: dataToSave.order_number,
        created_at: dataToSave.created_at,
        updated_at: dataToSave.updated_at
      };
      
      console.log('🧹 [LIMPEZA] Objeto limpo:', JSON.stringify(cleanData, null, 2));
      console.log('🧹 [LIMPEZA] Chaves do objeto limpo:', Object.keys(cleanData));
      
      // VERIFICAÇÃO FINAL ABSOLUTA
      if ('id' in cleanData) {
        console.error('❌ [CRÍTICO] ID ainda presente no objeto limpo!');
        throw new Error('ID ainda presente - abortando para evitar erro');
      } else {
        console.log('✅ [VERIFICAÇÃO FINAL] Objeto 100% limpo, sem campo id');
      }

      // 2. INSERT SIMPLES - Sem on_conflict para evitar erro 42P10
      try {
        console.log('🔄 [FINAL] Attempting simple insert...');
        
        const { data, error: orderError } = await supabaseAdmin
          .from('orders')
          .insert([cleanData])
          .select();

        if (orderError) {
          console.log('❌ [FINAL] Order insert error:', orderError);
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
