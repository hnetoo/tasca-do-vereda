import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // ajuste o caminho
import { Database } from '../types/supabase';

export function useRealtimeOrderItems() {
  const [orderItems, setOrderItems] = useState<any[]>([]);

  useEffect(() => {
    // ATENÇÃO: tabela order_items NÃO existe no schema real
    // Os itens dos pedidos estão em orders.items (JSON)
    // Este hook agora escuta mudanças na tabela orders
    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE e DELETE
          schema: 'public',
          table: 'orders' // Nome da tabela real
        },
        (payload: any) => {
          console.log('Nova mudança em orders recebida!', payload);
          // Extrair itens do JSON quando houver mudança
          if (payload.new && 'items' in payload.new) {
            const items = Array.isArray(payload.new.items) ? payload.new.items : [];
            setOrderItems(items);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return orderItems;
}
