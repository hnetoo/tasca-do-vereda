'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabaseService } from '../services/supabaseService';
import { MenuCategory, Product } from '../types';
import { logger } from '../services/logger';

export interface RealtimeMenuData {
  categories: MenuCategory[];
  products: Product[];
  loading: boolean;
  error: string | null;
  toggleAvailability: (productId: string, available: boolean) => Promise<void>;
}

/**
 * Hook for real-time menu synchronization.
 * Used by both the Digital Menu (Vercel) and Owner Dashboard (Tauri).
 * - Digital Menu: Listens for changes to update the UI instantly.
 * - Owner Dashboard: Listens for changes and provides methods to update availability.
 */
export const useRealtimeMenu = (isOwner: boolean = false): RealtimeMenuData => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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

      // Fetch Products
      const query = client.from('products').select('*');
      
      let data: any[] = [];
      if (!isOwner) {
        // Consumer view: only available items
        const { data: d, error } = await query.eq('is_available', true);
        if (error) throw error;
        data = d || [];
      } else {
        // Owner view: all items
        const { data: d, error } = await query;
        if (error) throw error;
        data = d || [];
      }

      const mappedProducts: Product[] = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category_id: p.category_id,
        image_url: p.image,
        tax_code: p.tax_code,
        tax_percentage: p.tax_percentage,
        is_active: p.is_available,
        is_available_on_digital_menu: p.is_available_on_digital_menu,
        preparation_time: p.tempo_preparo,
        track_stock: p.controla_estoque,
        stock_quantity: p.quantidade_estoque,
        min_stock_quantity: p.quantidade_minima,
        max_stock_quantity: p.quantidade_maxima,
        unit: p.unidade_medida,
        supplier_id: p.fornecedor_padrao_id
      }));

      setProducts(mappedProducts);
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

  const toggleAvailability = async (productId: string, available: boolean) => {
    if (!isOwner) return;

    const client = supabaseService.getClient();
    if (!client) return;

    try {
      // Optimistic update
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active: available } : p));

      const { error } = await client
        .from('products')
        .update({ is_available: available })
        .eq('id', productId);

      if (error) throw error;
      
      logger.info(`Product ${productId} availability toggled to ${available}`, {}, 'MENU_SYNC');
    } catch (err: any) {
      logger.error('Failed to toggle availability', { error: err.message }, 'MENU_SYNC');
      // Revert optimistic update
      fetchMenu();
      throw err;
    }
  };

  return {
    categories,
    products,
    loading,
    error,
    toggleAvailability
  };
};
