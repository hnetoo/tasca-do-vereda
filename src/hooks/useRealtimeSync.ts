'use client';

import { useEffect, useRef } from 'react'; 
import { supabase } from '@/lib/supabase';
import { RealtimePayload } from '@/types';
import { useStore } from '@/store/useStore';
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';

export const useRealtimeSync = <T = any>(
  table: string,
  callback: (payload: RealtimePayload<T>) => void,
  filter?: { column: string; value: string | number }
) => {
  const setSaveStatus = useStore((state) => state.setSaveStatus);
  const addNotification = useStore((state) => state.addNotification);
  const retryAttempts = useRef(0);

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
          (payload: any) => {
            console.log(`Mudança real-time em ${table} (filtrado por ${filter.column}=${filter.value}):`, payload);
            callback(payload as unknown as RealtimePayload<T>);
          }
        );
    } else {
      channel = supabase
        .channel(`realtime-${table}`)
        .on(
          'postgres_changes',
          { 
            event: '*',
            schema: 'public',
            table: table,
          },
          (payload: any) => {
            console.log(`Mudança real-time em ${table}:`, payload);
            callback(payload as unknown as RealtimePayload<T>);
          }
        );
    }

    channel.subscribe((status: REALTIME_SUBSCRIBE_STATES) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Conectado ao Realtime: ${table}${filter ? ` (filtrado por ${filter.column}=${filter.value})` : ''}`);
        setSaveStatus('IDLE');
        retryAttempts.current = 0; // Reset retry attempts on successful connection
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error(`Erro no Realtime: ${table}`, status);
        setSaveStatus('ERROR');
        retryAttempts.current += 1;
        if (retryAttempts.current >= 3) {
          addNotification('error', 'Conexão em tempo real indisponível; dados atualizados ao recarregar');
          retryAttempts.current = 0; // Reset after showing notification
        }
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, callback, filter, setSaveStatus, addNotification]);
};