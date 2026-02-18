'use client';

import { useEffect, useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { MenuCategory, Product } from '../types';

export interface MenuData {
  categories: MenuCategory[];
  products: Product[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useDigitalMenu = (): MenuData => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // Don't set loading to true on refresh to avoid flickering
      if (categories.length === 0) setLoading(true);
      
      const client = supabaseService.getClient();
      if (!client) {
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
        .from('products')
        .select('*')
        .eq('is_available', true)
        .eq('is_available_on_digital_menu', true);

      if (itemsError) throw itemsError;

      const mappedProducts: Product[] = (menuItems || []).map((p: any) => ({
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

      setCategories(cats || []);
      setProducts(mappedProducts);
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
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
            console.log('Product change detected:', payload);
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
    products,
    loading,
    error,
    refresh: fetchData
  };
};
