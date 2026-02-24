import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // ajuste o caminho

export function useRealtimeSystemSettings() {
  const [systemSettings, setSystemSettings] = useState<any[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel('system_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE e DELETE
          schema: 'public',
          table: 'system_settings' // Nome da tabela
        },
        (payload) => {
          console.log('Nova mudança em system_settings recebida!', payload);
          setSystemSettings((current) => {
            if (payload.eventType === 'INSERT') {
              return [payload.new, ...current];
            } else if (payload.eventType === 'UPDATE') {
              return current.map((setting: any) =>
                setting.id === payload.old.id ? payload.new : setting
              );
            } else if (payload.eventType === 'DELETE') {
              return current.filter((setting: any) => setting.id !== payload.old.id);
            }
            return current;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return systemSettings;
}
