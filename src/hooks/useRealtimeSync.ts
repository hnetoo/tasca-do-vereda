'use client';

import { useEffect } from 'react'; 
import { supabase } from '@/lib/supabase';
import { RealtimePayload } from '@/types';
import { useStore } from '@/store/useStore';

export const useRealtimeSync = <T = any>(
  table: string,
  callback: (payload: RealtimePayload<T>) => void,
  filter?: { column: string; value: string | number }
) => {
  const setSaveStatus = useStore((state) => state.setSaveStatus);

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
            callback(payload as unknown as RealtimePayload<T>);
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
            callback(payload as unknown as RealtimePayload<T>);
          }
        );
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Conectado ao Realtime: ${table}${filter ? ` (filtrado por ${filter.column}=${filter.value})` : ''}`);
        setSaveStatus('IDLE');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error(`Erro no Realtime: ${table}`, status);
        setSaveStatus('ERROR');
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, callback, filter, setSaveStatus]);
};