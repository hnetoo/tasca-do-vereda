'use server';

import { createClient } from '@/lib/supabase/server';

export async function updateTablePosition(tableId: string, x: number, y: number) {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from('restaurant_tables')
      .update({ 
        posicao_x: x, 
        posicao_y: y,
        updated_at: new Date().toISOString()
      })
      .eq('id', tableId);

    if (error) {
      console.error('Error updating table position:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating table position:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function updateTableAmbiente(tableId: string, ambiente: 'INTERIOR' | 'EXTERIOR' | 'BALCAO') {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from('restaurant_tables')
      .update({ 
        ambiente,
        updated_at: new Date().toISOString()
      })
      .eq('id', tableId);

    if (error) {
      console.error('Error updating table ambiente:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating table ambiente:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function createTableWithAmbiente(tableData: {
  name: string;
  number: number;
  seats?: number;
  shape?: string;
  posicao_x?: number;
  posicao_y?: number;
  color?: string;
}) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .insert({
        id: crypto.randomUUID(),
        name: tableData.name,
        number: tableData.number,
        seats: tableData.seats || 4,
        shape: tableData.shape || 'RECTANGLE',
        posicao_x: tableData.posicao_x || 0,
        posicao_y: tableData.posicao_y || 0,
        color: tableData.color || '#3B82F6',
        status: 'AVAILABLE',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating table:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error creating table:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function getTablesByAmbiente(ambiente: 'INTERIOR' | 'EXTERIOR' | 'BALCAO' | 'ALL') {
  const supabase = await createClient();
  
  try {
    // Colunas EXATAS como no Supabase
    const { data, error } = await supabase
      .from('restaurant_tables')
      .select('id, number, seats, shape, status, is_active, color, x, y, zone, label')
      .eq('is_active', true)
      .order('number', { ascending: true });

    if (error) {
      console.error('Error fetching tables:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Unexpected error fetching tables:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
