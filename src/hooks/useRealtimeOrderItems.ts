import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // ajuste o caminho

export function useRealtimeOrderItems() {
  const [orderItems, setOrderItems] = useState<any[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel('order_items_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE e DELETE
          schema: 'public',
          table: 'order_items' // Nome da tabela
        },
        (payload) => {
          console.log('Nova mudança em order_items recebida!', payload);
          setOrderItems((current) => {
            if (payload.eventType === 'INSERT') {
              return [payload.new, ...current];
            } else if (payload.eventType === 'UPDATE') {
              return current.map((item: any) =>
                item.id === payload.old.id ? payload.new : item
              );
            } else if (payload.eventType === 'DELETE') {
              return current.filter((item: any) => item.id !== payload.old.id);
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

  return orderItems;
}
