'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { MenuCategory, Product } from '../types';

export interface MenuData {
  menu_categories: MenuCategory[];
  products: Product[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useDigitalMenu = (): MenuData => {
  const [menu_categories, setmenu_categories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) setLoading(true);
      
      const client = supabaseService.getClient();
      if (!client) {
        console.warn('Supabase client not initialized in useDigitalMenu');
        setLoading(false);
        return;
      }

      const { data: cats, error: catsError } = await client
        .from('menu_menu_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (catsError) throw catsError;

      const { data: menuItems, error: itemsError } = await client
        .from('dishes')
        .select('*')
        .eq('is_active', true)
        .eq('is_available_on_digital_menu', true);

      if (itemsError) throw itemsError;

      const mappedProducts: Product[] = (menuItems || []).map((p: any) => ({
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

      setmenu_categories(cats || []);
      setProducts(mappedProducts);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching digital menu:', err);
      setError(err.message);
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const client = supabaseService.getClient();
    if (!client) return;

    const channel = client
      .channel('digital_menu_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_menu_categories' },
        (payload) => {
          console.log('Category change detected:', payload);
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dishes' },
        (payload) => {
            console.log('Product change detected:', payload);
            fetchData();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [fetchData]);

  return {
    menu_categories,
    products,
    loading,
    error,
    refresh: fetchData
  };
};

