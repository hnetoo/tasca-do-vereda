'use client';

import { useEffect } from 'react'; 
import { supabase } from '@/lib/supabase';
import { RealtimePayload } from '@/types';

export const useRealtimeSync = (
  table: string,
  callback: (payload: RealtimePayload) => void,
  filter?: { column: string; value: string | number }
) => {
  useEffect(() => {
    let channel = supabase.channel(`realtime-${table}`);

    if (filter) {
      channel = supabase
        .channel(`realtime-${table}-${filter.column}-${filter.value}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: `${filter.column}=eq.${filter.value}`,
          },
          (payload) => {
            console.log(`Mudança real-time em ${table} (filtrado por ${filter.column}=${filter.value}):`, payload);
            callback(payload as unknown as RealtimePayload);
          }
        );
    } else {
      channel = supabase
        .channel(`realtime-${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: table },
          (payload) => {
            console.log(`Mudança real-time em ${table}:`, payload);
            callback(payload as unknown as RealtimePayload);
          }
        );
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Conectado ao Realtime: ${table}${filter ? ` (filtrado por ${filter.column}=${filter.value})` : ''}`);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, callback, filter]);
};