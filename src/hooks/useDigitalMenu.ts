'use client';

import { useEffect, useState } } from 'react';
import { supabaseService } from '../services/supabaseService';
import { Category, Dish } from '../types';

export interface MenuData {
  categories: Category[];
  dishes: Dish[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useDigitalMenu = (): MenuData => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // Don't set loading to true on refresh to avoid flickering
      if (categories.length === 0) setLoading(true);
      
      const client = supabaseService.getClient();
      if (!client) {
        // If not connected to Supabase, we might want to fallback to local storage or API
        // For now, just return empty or error
        // But since this is "Digital Menu", it likely relies on cloud data.
        // However, if we are in the "MSI" (Desktop App), we might be the source of truth?
        // The prompt says "Menu Digital (página pública acessível via QR Code) deve atualizar instantaneamente".
        // This implies this hook is used in the Public Page (Next.js), so it connects to Supabase.
        console.warn('Supabase client not initialized in useDigitalMenu');
        setLoading(false);
        return;
      }

      const { data: cats, error: catsError } = await client
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (catsError) throw catsError;

      const { data: menuItems, error: itemsError } = await client
        .from('menu_items')
        .select('*')
        .eq('available', true);

      if (itemsError) throw itemsError;

      // Map Supabase fields to local types if necessary
      // Assuming Supabase columns match the types
      setCategories(cats || []);
      setDishes(menuItems || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching digital menu:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const client = supabaseService.getClient();
    if (!client) return;

    const channel = client
      .channel('digital_menu_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          console.log('Category change detected:', payload);
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        (payload) => {
            console.log('Menu item change detected:', payload);
            fetchData();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  return {
    categories,
    dishes,
    loading,
    error,
    refresh: fetchData
  };
};
