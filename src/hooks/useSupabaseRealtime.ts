// ========================================
// HOOKS PERSONALIZADOS PARA SUPABASE
// Integração completa com tempo real
// ========================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  RealtimeChannel, 
  RealtimePostgresChangesPayload,
  SupabaseClient
} from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';

// Tipos para os hooks
export interface RealtimeData<T = any> {
  data: T[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface RealtimeSubscriptionOptions {
  table: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  enabled?: boolean;
}

// Hook principal para tempo real
export function useRealtime<T = any>(
  initialQuery: any,
  options: RealtimeSubscriptionOptions
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { addNotification } = useStore();

  // Função para buscar dados iniciais
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: result, error: fetchError } = await initialQuery;
      
      if (fetchError) {
        throw fetchError;
      }
      
      setData(result || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      addNotification('error', 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [initialQuery, addNotification]);

  // Configurar subscription em tempo real
  useEffect(() => {
    if (!options.enabled) return;

    const channelName = `realtime-${options.table}`;
    
    // Limpar canal anterior se existir
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Criar novo canal
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event: options.event || '*',
          schema: 'public',
          table: options.table,
          filter: options.filter
        } as any,
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Realtime change received:', payload);
          
          setData(prevData => {
            let newData = [...prevData];
            
            switch (payload.eventType) {
              case 'INSERT':
                newData.push(payload.new as T);
                break;
              case 'UPDATE':
                newData = newData.map(item => 
                  (item as any).id === (payload.new as any).id 
                    ? payload.new as T 
                    : item
                );
                break;
              case 'DELETE':
                newData = newData.filter(item => 
                  (item as any).id !== (payload.old as any).id
                );
                break;
            }
            
            return newData;
          });
          
          setLastUpdated(new Date());
          
          // Notificação visual para mudanças importantes
          if (options.table === 'orders' && payload.eventType === 'INSERT') {
            addNotification('info', 'Novo pedido recebido!');
          }
        }
      );

    channelRef.current = channel;

    // Subscrever ao canal
    const subscription = channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to ${options.table} changes`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`Error subscribing to ${options.table}`);
        setError('Erro na conexão em tempo real');
      }
    });

    // Buscar dados iniciais
    fetchData();

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [options, supabase, fetchData, addNotification]);

  // Função para refresh manual
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch
  };
}

// Hook específico para pedidos
export function useRealtimeOrders() {
  const supabase = createClient();
  
  return useRealtime(
    supabase
      .from('orders')
      .select(`
        *,
        restaurant_tables:table_id (
          number,
          name,
          capacity
        ),
        employees:waiter_id (
          name,
          email
        ),
        order_items (
          *,
          dishes:product_id (
            name,
            price,
            image_url
          )
        )
      `)
      .order('created_at', { ascending: false }),
    {
      table: 'orders',
      enabled: true
    }
  );
}

// Hook específico para mesas
export function useRealtimeTables() {
  const supabase = createClient();
  
  return useRealtime(
    supabase
      .from('restaurant_tables')
      .select('*')
      .order('number'),
    {
      table: 'restaurant_tables',
      enabled: true
    }
  );
}

// Hook específico para produtos
export function useRealtimeProducts() {
  const supabase = createClient();
  
  return useRealtime(
    supabase
      .from('dishes')
      .select(`
        *,
        menu_categories:category_id (
          name,
          color
        )
      `)
      .eq('is_active', true)
      .order('name'),
    {
      table: 'dishes',
      filter: 'is_active=eq.true',
      enabled: true
    }
  );
}

// Hook específico para transações financeiras
export function useRealtimeTransactions() {
  const supabase = createClient();
  
  return useRealtime(
    supabase
      .from('transactions')
      .select(`
        *,
        orders:order_id (
          order_number,
          total_amount
        ),
        employees:processed_by (
          name
        )
      `)
      .order('created_at', { ascending: false }),
    {
      table: 'transactions',
      enabled: true
    }
  );
}

// Hook para métricas em tempo real
export function useRealtimeMetrics() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { addNotification } = useStore();

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar métricas via RPC
      const { data, error } = await supabase.rpc('calculate_realtime_metrics' as any);
      
      if (error) throw error;
      
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      addNotification('error', 'Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  }, [supabase, addNotification]);

  // Configurar subscription para mudanças que afetam métricas
  useEffect(() => {
    const channels: RealtimeChannel[] = [];
    
    // Escutar mudanças em orders
    const ordersChannel = supabase
      .channel('metrics-orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchMetrics()
      )
      .subscribe();
    
    channels.push(ordersChannel);
    
    // Escutar mudanças em transactions
    const transactionsChannel = supabase
      .channel('metrics-transactions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions' },
        () => fetchMetrics()
      )
      .subscribe();
    
    channels.push(transactionsChannel);

    // Buscar métricas iniciais
    fetchMetrics();

    // Cleanup
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [supabase, fetchMetrics]);

  return {
    metrics,
    loading,
    refetch: fetchMetrics
  };
}

// Hook para categorias com produtos
export function useRealtimeCategoriesWithProducts() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('menu_categories')
          .select(`
            *,
            dishes (
              id,
              name,
              price,
              image_url,
              is_available
            )
          `)
          .eq('is_active', true)
          .order('display_order');
        
        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    const setupRealtime = () => {
      // Escutar mudanças em categorias
      const categoriesChannel = supabase
        .channel('categories-realtime')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'menu_categories' },
          fetchCategories
        )
        .subscribe();

      // Escutar mudanças em produtos
      const productsChannel = supabase
        .channel('products-realtime')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'dishes' },
          fetchCategories
        )
        .subscribe();

      return () => {
        supabase.removeChannel(categoriesChannel);
        supabase.removeChannel(productsChannel);
      };
    };

    fetchCategories();
    const cleanup = setupRealtime();

    return cleanup;
  }, [supabase]);

  return { categories, loading };
}

// Hook para notificações do sistema
export function useSystemNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const setupChannel = async () => {
      const channel = supabase
        .channel('system-notifications')
        .on('postgres_changes' as any,
          { event: 'INSERT', schema: 'public', table: 'audit_logs' } as any,
          (payload: any) => {
          // Adicionar notificação para eventos importantes
          const importantEvents = ['INSERT', 'UPDATE'];
          const importantTables = ['orders', 'transactions', 'restaurant_tables'];
          
          if (importantEvents.includes(payload.eventType) && 
              importantTables.includes(payload.new.table_name)) {
            
            setNotifications(prev => [
              {
                id: payload.new.id,
                type: 'system',
                title: `Atualização em ${payload.new.table_name}`,
                message: `${payload.new.action} - ${new Date(payload.new.created_at).toLocaleTimeString()}`,
                timestamp: payload.new.created_at
              },
              ...prev.slice(0, 9) // Manter apenas 10 notificações
            ]);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
    };
    
    setupChannel();
  }, [supabase]);

  return { notifications };
}

// Hook para sincronização offline/online
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const supabase = createClient();

  const syncPendingActions = async () => {
    if (!isOnline || pendingActions.length === 0) return;

    try {
      for (const action of pendingActions) {
        // Executar ação pendente
        const { error } = await (supabase as any)
          .from(action.table)
          [action.method](action.data);

        if (!error) {
          // Remover ação pendente se sucesso
          setPendingActions(prev => 
            prev.filter(pending => pending.id !== action.id)
          );
        }
      }
    } catch (err) {
      console.error('Error syncing pending actions:', err);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Sincronizar ações pendentes
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingActions]);

  const addPendingAction = (action: any) => {
    setPendingActions(prev => [...prev, { ...action, id: Date.now() }]);
  };

  return {
    isOnline,
    pendingActions,
    addPendingAction,
    syncPendingActions
  };
}
