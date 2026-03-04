'use server';

import { createClient } from '@/lib/supabase/server';

export async function updateTablePosition(tableId: string, x: number, y: number) {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from('restaurant_tables')
      .update({ 
        x: x, 
        y: y,
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

export async function updateTableAmbiente(tableId: string, zone: 'INTERIOR' | 'EXTERIOR' | 'BALCAO') {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from('restaurant_tables')
      .update({ 
        zone,
        updated_at: new Date().toISOString()
      })
      .eq('id', tableId);

    if (error) {
      console.error('Error updating table zone:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating table zone:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function createTableWithAmbiente(tableData: {
  label: string;
  number: number;
  seats?: number;
  shape?: string;
  x?: number;
  y?: number;
  zone?: string;
  color?: string;
}) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .insert({
        id: crypto.randomUUID(),
        label: tableData.label,
        number: tableData.number,
        seats: tableData.seats || 4,
        shape: tableData.shape || 'square',
        x: tableData.x || 100,
        y: tableData.y || 100,
        zone: tableData.zone || 'Sala',
        color: tableData.color || '#3B82F6',
        status: 'available',
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
