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
      .channel('table-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_tables'
        },
        (payload) => {
          logger.info('Realtime table update received', { event: payload.eventType }, 'REALTIME');
          
          if (payload.eventType === 'INSERT') {
            addTable(payload.new as Table);
          } else if (payload.eventType === 'UPDATE') {
            updateTable(payload.new as Table);
          } else if (payload.eventType === 'DELETE') {
            // payload.old only contains the ID if REPLICA IDENTITY is set to FULL or if it's the PK
            // Assuming ID is available
            if (payload.old && payload.old.id) {
               removeTable(payload.old.id as string);
            }
          }
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
  }, []); // Empty dependency array to run once on mount

  return { tables };
};
