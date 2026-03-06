'use server';

import { createClient } from '@/lib/supabase/server';

export async function ensureBalcaoTable() {
  const supabase = await createClient();
  
  try {
    console.log('🔍 Verificando mesa Balcão...');
    
    // Verificar se já existe mesa Balcão (usar 'number' em vez de 'name')
    const { data: existingTable, error: fetchError } = await supabase
      .from('restaurant_tables')
      .select('*')
      .eq('number', 999)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar mesa Balcão:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    if (existingTable) {
      console.log('✅ Mesa Balcão já existe:', existingTable.id);
      return { success: true, table: existingTable };
    }
    
    // Criar mesa Balcão se não existir (apenas colunas existentes)
    const balcaoTable = {
      id: 'balcao-999',
      number: 999,
      status: 'AVAILABLE',
      x: 0,
      y: 0,
      zone: 'INTERIOR'
    };
    
    const { data: newTable, error: insertError } = await supabase
      .from('restaurant_tables')
      .insert(balcaoTable)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erro ao criar mesa Balcão:', insertError);
      return { success: false, error: insertError.message };
    }
    
    console.log('✅ Mesa Balcão criada com sucesso:', newTable);
    return { success: true, table: newTable };
    
  } catch (error: any) {
    console.error('❌ Erro geral ao garantir mesa Balcão:', error);
    return { success: false, error: error.message };
  }
}
