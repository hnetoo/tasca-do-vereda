import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // ajuste o caminho

export function useRealtimeAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel('audit_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE e DELETE
          schema: 'public',
          table: 'audit_logs' // Nome da tabela
        },
        (payload: any) => {
          console.log('Nova mudança em audit_logs recebida!', payload);
          setAuditLogs((current) => {
            // Lógica para atualizar o estado com base no tipo de evento
            if (payload.eventType === 'INSERT') {
              return [payload.new, ...current];
            } else if (payload.eventType === 'UPDATE') {
              return current.map((log: any) =>
                log.id === payload.old.id ? payload.new : log
              );
            } else if (payload.eventType === 'DELETE') {
              return current.filter((log: any) => log.id !== payload.old.id);
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

  return auditLogs;
}
