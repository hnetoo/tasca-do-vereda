import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';
import { Table } from '@/types';
import { logger } from '@/services/logger';

export const useTables = () => {
  const tables = useStore((state) => state.tables);
  const fetchTables = useStore((state) => state.fetchTables);
  const addTable = useStore((state) => state.addTable);
  const updateTable = useStore((state) => state.updateTable);
  const removeTable = useStore((state) => state.removeTable);
  
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    fetchTables();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('tables')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_tables'
        },
        (payload: any) => {
          logger.info('Realtime table change', payload, 'DATABASE');
          fetchTables();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Subscribed to restaurant_tables changes', undefined, 'REALTIME');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTables, addTable, updateTable, removeTable, supabase]); // Adicionadas dependências para ESLint

  return { tables };
};
