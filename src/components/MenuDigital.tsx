'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, UtensilsCrossed, Plus, ShoppingBag, ChevronRight, Star } from 'lucide-react';
import { Product, MenuCategory } from '@/types';

export default function MenuDigital() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Helper to map DB row to Product interface
  const mapToProduct = (row: any): Product => {
    if (!row) return {} as Product;
    return {
      // Base Row properties (snake_case)
      ...row,
      id: row.id,
      category_id: row.category_id,
      image_url: row.image_url || row.image,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_active: row.is_active ?? row.is_available ?? true,
      
      // Extended properties (camelCase aliases)
      name: row.name,
      description: row.description,
      price: Number(row.price),
      categoryId: row.category_id,
      imageUrl: row.image_url || row.image, // Support both column names
      taxCode: row.tax_code || 'NOR',
      taxPercentage: row.tax_percentage || 0,
      isActive: row.is_active ?? row.is_available ?? true,
      available: row.available ?? row.is_available ?? true, // Schema has 'available'
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      
      // Legacy / Runtime extensions
      is_available_on_digital_menu: row.is_available_on_digital_menu ?? true,
      preparation_time: row.preparation_time || row.tempo_preparo,
      track_stock: row.track_stock ?? row.controla_estoque ?? false,
      stock_quantity: row.stock_quantity ?? row.quantidade_estoque ?? 0,
      min_stock_quantity: row.min_stock_quantity ?? row.quantidade_minima ?? 0,
      max_stock_quantity: row.max_stock_quantity ?? row.quantidade_maxima ?? 0,
      unit: row.unit || row.unidade_medida || 'un',
      supplier_id: row.supplier_id || row.fornecedor_padrao_id
    } as unknown as Product;
  };

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories (table: menu_categories)
        const { data: cats, error: catError } = await supabase
          .from('menu_categories')
          .select('*');
        
        if (catError) throw catError;

        // Fetch all products (table: dishes)
        const { data: prods, error: prodError } = await supabase
          .from('dishes')
          .select('*');

        if (prodError) throw prodError;

        if (cats) {
          // Client-side sort
          const sortedCats = (cats as any[]).map(c => ({
            ...c,
            // Map snake_case to camelCase for internal use if needed, or rely on Product type aliases
            id: c.id,
            name: c.name,
            sortOrder: c.sort_order,
            isActive: c.is_active
          } as MenuCategory)).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          setCategories(sortedCats);
        }

        if (prods) {
          const mappedProds = prods.map(mapToProduct);
          // Client-side filter
          const availableProds = mappedProds.filter(p => p.isActive !== false); // Default true
          setProducts(availableProds);
        }
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
    // Products Channel (table: dishes)
    const productsChannel = supabase
      .channel('menu-geral-dishes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dishes' }, (payload) => {
        console.log('Product change received:', payload);
        if (payload.eventType === 'INSERT') {
          const newProduct = mapToProduct(payload.new);
          if (newProduct.isActive !== false) {
            setProducts(prev => [...prev, newProduct]);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedProduct = mapToProduct(payload.new);
          // Check availability
          if (updatedProduct.isActive !== false) {
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

    // Categories Channel (table: menu_categories)
    const categoriesChannel = supabase
      .channel('menu-geral-categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_categories' }, (payload) => {
        console.log('Category change received:', payload);
        if (!payload.new && payload.eventType !== 'DELETE') return;

        if (payload.eventType === 'INSERT') {
          const c = payload.new as any;
          const newCat: MenuCategory = {
             id: c.id,
             name: c.name,
             sortOrder: c.sort_order,
             isActive: c.is_active,
             // ... other fields
          } as MenuCategory;
          setCategories(prev => [...prev, newCat].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
        } else if (payload.eventType === 'UPDATE') {
           const c = payload.new as any;
           const updatedCat: MenuCategory = {
             id: c.id,
             name: c.name,
             sortOrder: c.sort_order,
             isActive: c.is_active,
          } as MenuCategory;
          setCategories(prev => prev.map(cat => cat.id === updatedCat.id ? updatedCat : cat).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shadow-lg flex items-center justify-center">
                 <img src="/logo.png" alt="Tasca do Vereda" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-none mb-1">Tasca do Vereda</h1>
                <div className="flex items-center gap-1.5">
                   <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">TAS</span>
                   <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                   <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Vitrine Digital</p>
                </div>
              </div>
            </div>
            
          </div>

          {/* Search Bar */}
          <div className="relative mb-6 group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="O que você deseja pedir hoje?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-inner"
            />
          </div>

          {/* Categories Scroller */}
          <div className="flex overflow-x-auto pb-1 -mx-4 px-4 gap-2 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold transition-all transform active:scale-95 ${
                selectedCategory === 'all' 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
              }`}
            >
              TODOS
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold transition-all transform active:scale-95 uppercase ${
                  selectedCategory === cat.id 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8 pb-24">
        {Object.entries(productsByCategory).map(([catId, items]) => {
          const category = categories.find(c => c.id === catId);
          const categoryName = category ? category.name : (catId === 'uncategorized' ? 'Outros' : '');
          
          if (items.length === 0) return null;

          return (
            <div key={catId} className="animate-fadeIn">
              {selectedCategory === 'all' && (
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-6 rounded-full bg-emerald-500"></span>
                    {categoryName}
                  </h2>
                  <button 
                    onClick={() => setSelectedCategory(catId)}
                    className="text-xs font-medium text-emerald-500 flex items-center gap-1 hover:text-emerald-400"
                  >
                    Ver tudo <ChevronRight size={14} />
                  </button>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map(product => (
                  <div 
                    key={product.id} 
                    className="group bg-slate-900 rounded-2xl p-3 border border-slate-800 shadow-lg hover:border-emerald-500/50 hover:shadow-emerald-500/10 transition-all duration-300 flex gap-4 sm:flex-col sm:gap-0 relative overflow-hidden"
                  >
                    {/* Image */}
                    <div className="w-24 h-24 sm:w-full sm:h-48 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800 relative">
                       {product.image_url ? (
                         <img 
                           src={product.image_url} 
                           alt={product.name} 
                           className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                           onError={(e) => {
                             (e.target as HTMLImageElement).src = '/placeholder-food.png';
                           }}
                         />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-700">
                           <UtensilsCrossed className="w-8 h-8 sm:w-12 sm:h-12" />
                         </div>
                       )}
                       {/* Floating Price Tag for Mobile List View */}
                       <div className="absolute top-2 right-2 sm:hidden bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                          <span className="text-xs font-bold text-emerald-400">{formatCurrency(product.price)}</span>
                       </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 justify-between sm:pt-4">
                       <div>
                          <div className="flex justify-between items-start mb-1">
                             <h3 className="text-sm sm:text-base font-bold text-white line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors">
                               {product.name}
                             </h3>
                             <div className="hidden sm:block">
                                <span className="text-sm font-bold text-emerald-400">{formatCurrency(product.price)}</span>
                             </div>
                          </div>
                          {product.description && (
                            <p className="text-xs text-slate-400 line-clamp-2 mb-3 sm:mb-4 leading-relaxed">
                              {product.description}
                            </p>
                          )}
                       </div>
                       
                       <div className="mt-auto flex items-center justify-between sm:border-t sm:border-slate-800 sm:pt-3">
                          <div className="flex items-center gap-1 text-amber-400">
                             <Star size={12} fill="currentColor" />
                             <span className="text-[10px] font-bold text-slate-300">4.8</span>
                             <span className="text-[10px] text-slate-600">(120)</span>
                          </div>
                          <button className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-90 transition-transform hover:bg-emerald-400">
                             <Plus size={18} />
                          </button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {products.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
               <UtensilsCrossed className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Menu Indisponível</h3>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
              Nenhum prato encontrado com os filtros atuais. Tente buscar por outro termo.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
