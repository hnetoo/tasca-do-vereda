'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface StatusConfig {
  color: string;
  bgColor: string;
  pulse: boolean;
  text: string;
}

export const useStatusMonitor = () => {
  const [supabaseStatus, setSupabaseStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [kitchenStatus, setKitchenStatus] = useState<'normal' | 'warning' | 'critical'>('normal');
  const [reservationsStatus, setReservationsStatus] = useState<'normal' | 'warning' | 'critical'>('normal');

  // Verificar status do Supabase
  const checkSupabaseStatus = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('dishes').select('id').limit(1);
      
      if (error) {
        setSupabaseStatus('offline');
      } else {
        setSupabaseStatus('online');
      }
    } catch (error) {
      setSupabaseStatus('offline');
    }
  };

  // Verificar pedidos em atraso na cozinha
  const checkKitchenOrders = async () => {
    try {
      const supabase = createClient();
      const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .lt('created_at', twentyMinutesAgo);

      if (error) {
        setKitchenStatus('normal');
        return;
      }

      if (data && data.length > 0) {
        setKitchenStatus('critical');
      } else {
        setKitchenStatus('normal');
      }
    } catch (error) {
      setKitchenStatus('normal');
    }
  };

  // Verificar reservas atrasadas
  const checkReservations = async () => {
    try {
      const supabase = createClient();
      const now = new Date();
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('status', 'confirmed')
        .lt('reservation_time', thirtyMinutesAgo.toISOString())
        .gt('reservation_time', now.toISOString());

      if (error) {
        setReservationsStatus('normal');
        return;
      }

      if (data && data.length > 0) {
        setReservationsStatus('warning');
      } else {
        setReservationsStatus('normal');
      }
    } catch (error) {
      setReservationsStatus('normal');
    }
  };

  // Obter configuração de status para cards
  const getStatusConfig = (type: 'supabase' | 'kitchen' | 'reservations'): StatusConfig => {
    switch (type) {
      case 'supabase':
        switch (supabaseStatus) {
          case 'online':
            return { color: 'text-green-400', bgColor: 'bg-green-500', pulse: false, text: 'Online' };
          case 'offline':
            return { color: 'text-red-400', bgColor: 'bg-red-500', pulse: true, text: 'Offline / Erro de Ligação' };
          default:
            return { color: 'text-yellow-400', bgColor: 'bg-yellow-500', pulse: true, text: 'Verificando...' };
        }
      
      case 'kitchen':
        switch (kitchenStatus) {
          case 'normal':
            return { color: 'text-green-400', bgColor: 'bg-green-500', pulse: false, text: 'Normal' };
          case 'warning':
            return { color: 'text-yellow-400', bgColor: 'bg-yellow-500', pulse: true, text: 'Pedidos Pendentes' };
          case 'critical':
            return { color: 'text-red-400', bgColor: 'bg-red-500', pulse: true, text: 'Atraso Crítico!' };
          default:
            return { color: 'text-green-400', bgColor: 'bg-green-500', pulse: false, text: 'Normal' };
        }
      
      case 'reservations':
        switch (reservationsStatus) {
          case 'normal':
            return { color: 'text-green-400', bgColor: 'bg-green-500', pulse: false, text: 'Normal' };
          case 'warning':
            return { color: 'text-orange-400', bgColor: 'bg-orange-500', pulse: true, text: 'Reservas Atrasadas' };
          case 'critical':
            return { color: 'text-red-400', bgColor: 'bg-red-500', pulse: true, text: 'Reservas Críticas!' };
          default:
            return { color: 'text-green-400', bgColor: 'bg-green-500', pulse: false, text: 'Normal' };
        }
      
      default:
        return { color: 'text-green-400', bgColor: 'bg-green-500', pulse: false, text: 'Normal' };
    }
  };

  // Iniciar monitoramento
  useEffect(() => {
    // Verificar status inicial com timeout para evitar cascading renders
    const timeoutId = setTimeout(() => {
      checkSupabaseStatus();
      checkKitchenOrders();
      checkReservations();
    }, 0);

    // Configurar intervalos de verificação
    const supabaseInterval = setInterval(checkSupabaseStatus, 30000); // 30 segundos
    const kitchenInterval = setInterval(checkKitchenOrders, 60000); // 1 minuto
    const reservationsInterval = setInterval(checkReservations, 120000); // 2 minutos

    return () => {
      clearTimeout(timeoutId);
      clearInterval(supabaseInterval);
      clearInterval(kitchenInterval);
      clearInterval(reservationsInterval);
    };
  }, []);

  return {
    supabaseStatus,
    kitchenStatus,
    reservationsStatus,
    getStatusConfig,
    refetch: {
      supabase: checkSupabaseStatus,
      kitchen: checkKitchenOrders,
      reservations: checkReservations
    }
  };
};
