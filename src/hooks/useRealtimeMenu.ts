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
        .from('menu_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (catsError) throw catsError;

      // Fetch Products
      const query = client.from('dishes').select('*');
      
      let data: any[] = [];
      if (!isOwner) {
        // Consumer view: only available items
        const { data: d, error } = await query.eq('is_active', true);
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
        categoryId: p.category_id,
        imageUrl: p.image_url,
        taxCode: p.tax_code,
        taxPercentage: p.tax_percentage,
        isActive: p.is_active,
        isAvailableOnDigitalMenu: p.is_available_on_digital_menu,
        preparationTime: p.preparation_time,
        trackStock: p.track_stock,
        stockQuantity: p.stock_quantity,
        minStockQuantity: p.min_stock_quantity,
        maxStockQuantity: p.max_stock_quantity,
        unit: p.unit,
        supplierId: p.supplier_id
      } as unknown as Product));

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
        { event: '*', schema: 'public', table: 'menu_categories' },
        (payload) => {
          logger.info('Realtime category update', payload, 'MENU_SYNC');
          fetchMenu();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dishes' },
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
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, isActive: available } : p));

      const { error } = await client
        .from('dishes')
        .update({ is_active: available })
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
