'use server';

import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function ensureOpenShift() {
  const supabase = await createClient();
  
  try {
    console.log('🔍 Verificando se existe turno aberto...');
    
    // Verificar se já existe turno aberto
    const { data: openShift, error: fetchError } = await supabase
      .from('cash_shifts')
      .select('*')
      .eq('status', 'open')
      .is('end_time', null)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar turno aberto:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    if (openShift) {
      console.log('✅ Turno aberto encontrado:', openShift.id);
      return { success: true, shiftId: openShift.id };
    }
    
    // Se não existe turno aberto, criar um automaticamente
    console.log('⚠️ Nenhum turno aberto. Criando turno automático...');
    
    const newShift = {
      id: uuidv4(),
      status: 'open',
      start_time: new Date().toISOString(),
      end_time: null,
      opening_amount: 0,
      closing_amount: null,
      user_id: null, // Pode ser null para turno automático
      notes: 'Turno aberto automaticamente pelo sistema'
    };
    
    const { data: createdShift, error: createError } = await supabase
      .from('cash_shifts')
      .insert(newShift)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Erro ao criar turno automático:', createError);
      return { success: false, error: createError.message };
    }
    
    console.log('✅ Turno automático criado:', createdShift.id);
    return { success: true, shiftId: createdShift.id };
    
  } catch (error) {
    console.error('❌ Erro ao garantir turno aberto:', error);
    return { success: false, error: (error as Error).message };
  }
}
