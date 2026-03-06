'use server';

import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { ensureOpenShift } from './ensureOpenShift';

export async function createTestOrder() {
  const supabase = await createClient();
  
  try {
    console.log('🧪 Criando ordem de teste...');
    
    // Garantir turno aberto
    const shiftResult = await ensureOpenShift();
    if (!shiftResult.success) {
      console.error('❌ Erro ao garantir turno:', shiftResult.error);
      return { success: false, error: shiftResult.error };
    }
    
    // Criar ordem de teste
    const testOrder = {
      id: uuidv4(),
      order_number: `TEST-${Date.now()}`,
      table_id: 'd96e1852-7fe3-4456-98dc-7408654b4877', // Mesa 5
      status: 'paid',
      total: 5000.00,
      tax_total: 325.00,
      customer_name: 'Cliente Teste Dashboard',
      shift_id: shiftResult.shiftId,
      created_at: new Date().toISOString(),
      items: []
    };
    
    const { data, error } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar ordem de teste:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Ordem de teste criada:', data);
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ Erro ao criar ordem de teste:', error);
    return { success: false, error: (error as Error).message };
  }
}
