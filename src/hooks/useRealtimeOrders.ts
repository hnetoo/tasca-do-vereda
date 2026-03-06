import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // ajuste o caminho

export function useRealtimeOrders() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE e DELETE
          schema: 'public',
          table: 'orders' // Nome da tabela
        },
        (payload: any) => {
          console.log('Nova mudança em orders recebida!', payload);
          setOrders((current) => {
            if (payload.eventType === 'INSERT') {
              return [payload.new, ...current];
            } else if (payload.eventType === 'UPDATE') {
              return current.map((order: any) =>
                order.id === payload.old.id ? payload.new : order
              );
            } else if (payload.eventType === 'DELETE') {
              return current.filter((order: any) => order.id !== payload.old.id);
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

  return orders;
}
