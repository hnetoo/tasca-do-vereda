'use client';

import { useEffect, useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { logger } from '../services/logger';
import { DailyAnalytics } from '../types';
import { formatAOA } from '@/utils/format';
import { getAngolaToday } from '@/utils/date';

export const useRestaurantStats = () => {
  const [stats, setStats] = useState<DailyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!supabaseService.isConnected()) {
        setLoading(false);
        return;
    }

    try {
      const today = getAngolaToday().split('T')[0];
      const result = await supabaseService.getDailyAnalytics(today);
      
      console.log('Dados Financeiros:', result.data);

      if (!result.success) {
        throw new Error(result.error);
      }

      if (result.data) {
        setStats(result.data as DailyAnalytics);
      } else {
        // Initialize with zeros if no data for today
        setStats({
          date: today,
          totalRevenue: 0,
          totalExpenses: 0,
          totalProductCost: 0,
          totalOrders: 0,
          netProfit: 0,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (err: any) {
      logger.error('Failed to fetch restaurant stats', { error: err.message }, 'useRestaurantStats');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let channel: any = null;

    const initSubscription = async () => {
        let client = supabaseService.getClient();
        let retries = 0;
        
        // Wait for Supabase client to be initialized
        while (!client && retries < 10 && mounted) {
            await new Promise(r => setTimeout(r, 500));
            client = supabaseService.getClient();
            retries++;
        }

        if (!client || !mounted) {
            if (mounted) setLoading(false);
            return;
        }

        // Initial fetch
        fetchStats();

        // Subscribe to changes
        channel = client
          .channel('daily_analytics_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'daily_analytics',
              filter: `date=eq.${getAngolaToday().split('T')[0]}`
            },
            (payload) => {
              logger.info('Real-time update for daily_analytics', payload, 'useRestaurantStats');
              if (!mounted) return;
              
              setIsUpdating(true);
              
              if (payload.eventType === 'DELETE') {
                 setStats(prev => prev ? { ...prev, totalRevenue: 0, totalExpenses: 0, totalOrders: 0, netProfit: 0 } : null);
              } else {
                 const newData = payload.new as any;
                 setStats({
                    date: newData.date,
                    totalRevenue: newData.total_revenue,
                    totalExpenses: newData.total_expenses,
                    totalProductCost: newData.total_product_cost,
                    totalOrders: newData.total_orders,
                    netProfit: newData.net_profit,
                    lastUpdated: newData.last_updated
                 });
              }

              // Reset updating state after animation duration
              setTimeout(() => {
                  if (mounted) setIsUpdating(false);
              }, 2000);
            }
          )
          .subscribe();
    };

    initSubscription();

    return () => {
      mounted = false;
      if (channel) {
          const client = supabaseService.getClient();
          if (client) client.removeChannel(channel);
      }
    };
  }, []);

  return {
    stats,
    loading,
    isUpdating,
    error,
    formatted: stats ? {
      revenue: formatAOA(stats.totalRevenue),
      expenses: formatAOA(stats.totalExpenses),
      profit: formatAOA(stats.netProfit),
      orders: stats.totalOrders.toString()
    } : null
  };
};
