'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, UtensilsCrossed } from 'lucide-react';
import { Product, MenuCategory } from '@/types';

export default function MenuDigital() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Helper to map DB row to Product interface
  const mapToProduct = (row: any): Product => ({
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    category_id: row.category_id,
    image_url: row.image_url || row.image, // Support both column names
    tax_code: row.tax_code || 'NOR',
    tax_percentage: row.tax_percentage || 0,
    is_active: row.is_active ?? row.is_available ?? true,
    is_available_on_digital_menu: row.is_available_on_digital_menu ?? true,
    preparation_time: row.preparation_time || row.tempo_preparo,
    track_stock: row.track_stock ?? row.controla_estoque ?? false,
    stock_quantity: row.stock_quantity ?? row.quantidade_estoque ?? 0,
    min_stock_quantity: row.min_stock_quantity ?? row.quantidade_minima ?? 0,
    max_stock_quantity: row.max_stock_quantity ?? row.quantidade_maxima ?? 0,
    unit: row.unit || row.unidade_medida || 'un',
    supplier_id: row.supplier_id || row.fornecedor_padrao_id
  });

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: cats } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });
        
        const { data: prods } = await supabase
          .from('products')
          .select('*')
          .eq('is_available_on_digital_menu', true); // Only fetch available items

        if (cats) setCategories(cats as MenuCategory[]);
        if (prods) setProducts(prods.map(mapToProduct));
      } catch (error) {
        console.error('Error fetching menu:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Realtime Subscriptions
  useEffect(() => {
    // Products Channel
    const productsChannel = supabase
      .channel('menu-geral-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        console.log('Product change received:', payload);
        if (payload.eventType === 'INSERT') {
          const newProduct = mapToProduct(payload.new);
          if (newProduct.is_available_on_digital_menu) {
            setProducts(prev => [...prev, newProduct]);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedProduct = mapToProduct(payload.new);
          // Check availability directly from the payload
          if (updatedProduct.is_available_on_digital_menu) {
            setProducts(prev => {
              const exists = prev.some(p => p.id === updatedProduct.id);
              return exists 
                ? prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
                : [...prev, updatedProduct];
            });
          } else {
            // Remove if updated to unavailable
            setProducts(prev => prev.filter(p => p.id !== updatedProduct.id));
          }
        } else if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();

    // Categories Channel
    const categoriesChannel = supabase
      .channel('menu-geral-categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
        console.log('Category change received:', payload);
        if (payload.eventType === 'INSERT') {
          setCategories(prev => [...prev, payload.new as MenuCategory].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
        } else if (payload.eventType === 'UPDATE') {
          setCategories(prev => prev.map(c => c.id === payload.new.id ? payload.new as MenuCategory : c).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
        } else if (payload.eventType === 'DELETE') {
          setCategories(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, []);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (product.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Group products by category for the view (optional, but good for mobile lists)
  const productsByCategory = useMemo(() => {
    if (selectedCategory !== 'all') {
      return { [selectedCategory]: filteredProducts };
    }
    const grouped: Record<string, Product[]> = {};
    categories.forEach(cat => {
      const catProducts = filteredProducts.filter(p => p.category_id === cat.id);
      if (catProducts.length > 0) {
        grouped[cat.id] = catProducts;
      }
    });
    // Add products without category or with unknown category
    const uncategorized = filteredProducts.filter(p => !p.category_id || !categories.find(c => c.id === p.category_id));
    if (uncategorized.length > 0) {
      grouped['uncategorized'] = uncategorized;
    }
    return grouped;
  }, [filteredProducts, categories, selectedCategory]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(val);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 shadow-sm px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Cardápio Digital</h1>
          <div className="bg-gray-100 p-2 rounded-full">
            <UtensilsCrossed className="w-5 h-5 text-gray-600" />
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar pratos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
          />
        </div>

        {/* Categories Scroller */}
        <div className="flex overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all' 
                ? 'bg-black text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.id 
                  ? 'bg-black text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Product List */}
      <main className="flex-1 px-4 py-2 overflow-y-auto">
        {Object.entries(productsByCategory).map(([catId, items]) => {
          const category = categories.find(c => c.id === catId);
          const categoryName = category ? category.name : (catId === 'uncategorized' ? 'Outros' : '');
          
          if (items.length === 0) return null;

          return (
            <div key={catId} className="mb-8">
              {selectedCategory === 'all' && (
                <h2 className="text-lg font-bold text-gray-800 mb-4 sticky top-0 bg-white/95 py-2 z-0">
                  {categoryName}
                </h2>
              )}
              <div className="space-y-6">
                {items.map(product => (
                  <div key={product.id} className="flex items-start gap-4 pb-6 border-b border-gray-100 last:border-0">
                    {/* Circular Image */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-full overflow-hidden shadow-sm border border-gray-100 bg-gray-50">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-food.png'; // Fallback
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <UtensilsCrossed className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-base font-semibold text-gray-900 leading-tight">
                          {product.name}
                        </h3>
                        <span className="text-base font-bold text-green-700 whitespace-nowrap">
                          {formatCurrency(product.price)}
                        </span>
                      </div>
                      
                      {product.description && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {products.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-500">
            <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nenhum prato disponível no momento.</p>
          </div>
        )}
      </main>
    </div>
  );
}
