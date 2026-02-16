import { useEffect, useState, useCallback } from 'react';
import { supabaseService } from '../services/supabaseService';
import { MenuCategory, Dish } from '../types';
import { logger } from '../services/logger';

export interface RealtimeMenuData {
  categories: MenuCategory[];
  dishes: Dish[];
  loading: boolean;
  error: string | null;
  toggleAvailability: (dishId: string, available: boolean) => Promise<void>;
}

/**
 * Hook for real-time menu synchronization.
 * Used by both the Digital Menu (Vercel) and Owner Dashboard (Tauri).
 * - Digital Menu: Listens for changes to update the UI instantly.
 * - Owner Dashboard: Listens for changes and provides methods to update availability.
 */
export const useRealtimeMenu = (isOwner: boolean = false): RealtimeMenuData => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenu = useCallback(async () => {
    const client = supabaseService.getClient();
    if (!client) return;

    try {
      // Fetch Categories
      const { data: cats, error: catsError } = await client
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (catsError) throw catsError;

      // Fetch Products (Dishes)
      const query = client.from('products').select('*');
      
      if (!isOwner) {
        // Consumer view: only available items
        const { data, error } = await query.eq('available', true);
        if (error) throw error;
        setDishes(data || []);
      } else {
        // Owner view: all items
        const { data, error } = await query;
        if (error) throw error;
        setDishes(data || []);
      }

      setCategories(cats || []);
      setError(null);
    } catch (err: any) {
      logger.error('Failed to fetch menu', { error: err.message }, 'MENU_SYNC');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isOwner]);

  useEffect(() => {
    fetchMenu();

    const client = supabaseService.getClient();
    if (!client) return;

    // Subscribe to changes
    const channel = client
      .channel('realtime_menu')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          logger.info('Realtime category update', payload, 'MENU_SYNC');
          fetchMenu();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          logger.info('Realtime product update', payload, 'MENU_SYNC');
          // Optimistic update could be done here, but fetching ensures consistency
          fetchMenu();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [fetchMenu]);

  const toggleAvailability = async (dishId: string, available: boolean) => {
    if (!isOwner) return;

    const client = supabaseService.getClient();
    if (!client) return;

    try {
      // Optimistic update
      setDishes(prev => prev.map(d => d.id === dishId ? { ...d, available } : d));

      const { error } = await client
        .from('products')
        .update({ available })
        .eq('id', dishId);

      if (error) throw error;
      
      logger.info(`Dish ${dishId} availability toggled to ${available}`, {}, 'MENU_SYNC');
    } catch (err: any) {
      logger.error('Failed to toggle availability', { error: err.message }, 'MENU_SYNC');
      // Revert optimistic update
      fetchMenu();
      throw err;
    }
  };

  return {
    categories,
    dishes,
    loading,
    error,
    toggleAvailability
  };
};
