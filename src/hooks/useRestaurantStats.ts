'use client';

import { useState, useEffect, useCallback } from 'react';
import { getOwnerMobileData } from '@/app/actions/ownerMobile';

interface RestaurantData {
  orders: any[];
  expenses: any[];
  payroll: any[];
  dishes: any[];
  categories: any[];
  loading: boolean;
  error: string | null;
}

export const useRestaurantStats = () => {
  const [data, setData] = useState<RestaurantData>({
    orders: [],
    expenses: [],
    payroll: [],
    dishes: [],
    categories: [],
    loading: true,
    error: null
  });

  const loadData = useCallback(async () => {
    console.log('🔄 useRestaurantStats: Loading unified data...');
    setData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await getOwnerMobileData();
      
      if (result && typeof result === 'object' && 'error' in result) {
        console.error('❌ useRestaurantStats: Error loading data:', result.error);
        setData(prev => ({ 
          ...prev, 
          loading: false, 
          error: (result as any).error || 'Erro ao carregar dados' 
        }));
        return;
      }
      
      console.log('✅ useRestaurantStats: Data loaded successfully:', {
        orders: result.orders?.length || 0,
        expenses: result.expenses?.length || 0,
        payroll: result.payroll?.length || 0,
        dishes: result.dishes?.length || 0,
        categories: result.categories?.length || 0
      });
      
      setData({
        orders: result.orders || [],
        expenses: result.expenses || [],
        payroll: result.payroll || [],
        dishes: result.dishes || [],
        categories: result.categories || [],
        loading: false,
        error: null
      });
      
    } catch (error: any) {
      console.error('❌ useRestaurantStats: Unexpected error:', error);
      setData(prev => ({ 
        ...prev, 
        loading: false, 
        error: error?.message || 'Erro inesperado' 
      }));
    }
  }, []);

  // Carregar dados no mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Função para refresh manual
  const refresh = useCallback(() => {
    console.log('🔄 useRestaurantStats: Manual refresh triggered');
    loadData();
  }, [loadData]);

  return {
    ...data,
    refresh,
    loadData
  };
};
