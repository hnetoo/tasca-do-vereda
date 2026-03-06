'use client';

import Image from 'next/image';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, UtensilsCrossed, Plus, ShoppingBag, ChevronRight, Star, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Product, MenuCategory, SystemSettings } from '@/types';
import { useRealtimeCategoriesWithProducts } from '@/hooks/useSupabaseRealtime';
import { useOfflineMenu } from '@/hooks/useOfflineCache';

// Simplified types without Database
interface MenuCategoryRow {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface DishRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  available: boolean | null;
  is_active: boolean | null;
  is_available_on_digital_menu: boolean | null;
  preparation_time: number | null;
  track_stock: boolean | null;
  stock_quantity: number | null;
  min_stock_quantity: number | null;
  max_stock_quantity: number | null;
  unit: string | null;
  supplier_id: string | null;
  tax_code: string | null;
  tax_percentage: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export default function MenuDigital() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Partial<SystemSettings> | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Offline cache hook
  const { data: offlineMenu, loading: offlineLoading, updateCache, isExpired } = useOfflineMenu();
  
  // Hook de tempo real para categorias e produtos
  const { categories, loading: categoriesLoading } = useRealtimeCategoriesWithProducts();

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        setLastSync(new Date());
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    // Update cache when realtime data changes
    if (isOnline && menu_categories && !menu_categoriesLoading) {
      updateCache(menu_categories);
    }
  }, [menu_categories, isOnline, menu_categoriesLoading, updateCache]);

  // Determine which data to use
  const menuData = isOnline && menu_categories ? { menu_categories } : (offlineMenu || { menu_categories: [] });
  const loading = isOnline ? menu_categoriesLoading : offlineLoading;

  // Extrair produtos das categorias em tempo real
  const products = useMemo(() => {
    const allProducts: Product[] = [];
    if (menuData && menuData.menu_categories && Array.isArray(menuData.menu_categories)) {
      menuData.menu_categories.forEach((category: any) => {
        if (category.dishes) {
          category.dishes.forEach((dish: any) => {
            allProducts.push(mapToProduct(dish));
          });
        }
      });
    }
    return allProducts;
  }, [menuData]);

  // Helper to map DB row to Product interface
  const mapToProduct = (row: DishRow): Product => {
    if (!row) return {} as Product;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: Number(row.price),
      categoryId: row.category_id || undefined,
      imageUrl: row.image_url || undefined,
      taxCode: row.tax_code || 'NOR',
      taxPercentage: row.tax_percentage || 0,
      isActive: row.is_active ?? true,
      isAvailableOnDigitalMenu: row.is_available_on_digital_menu ?? true,
      available: row.available ?? true,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      preparationTime: row.preparation_time || undefined,
      trackStock: row.track_stock ?? false,
      stockQuantity: row.stock_quantity ?? 0,
      minStockQuantity: row.min_stock_quantity ?? 0,
      maxStockQuantity: row.max_stock_quantity ?? 0,
      unit: row.unit || 'un',
      supplierId: row.supplier_id || undefined
    };
  };

  // Atualizar loading state baseado no hook de tempo real
  useEffect(() => {
    setIsLoading(categoriesLoading);
  }, [categoriesLoading]);

  // Fetch settings (branding) - mantido separado pois não é crítico para tempo real
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: settingsRows } = await supabase.from('settings').select('*').limit(1);
        if (settingsRows && settingsRows.length > 0) {
          setSettings(settingsRows[0] as any);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    if (isOnline) {
      fetchSettings();
    }
  }, [isOnline]);

  // Real-time subscriptions - simplificado
  useEffect(() => {
    if (!supabase) return;

    // Subscribe to menu_categories changes
    const menu_categoriesSubscription = supabase
      .channel('menu-menu_categories-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'menu_menu_categories' },
        () => {
          // As categorias já são atualizadas pelo hook useRealtimemenu_categoriesWithProducts
          console.log('menu_categories updated in real-time');
        }
      )
      .subscribe();

    // Subscribe to dishes changes
    const dishesSubscription = supabase
      .channel('dishes-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'dishes' },
        () => {
          // Os produtos já são atualizados pelo hook useRealtimemenu_categoriesWithProducts
          console.log('Dishes updated in real-time');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(menu_categoriesSubscription);
      supabase.removeChannel(dishesSubscription);
    };
  }, [supabase]);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (product.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Group products by category for view (optional, but good for mobile lists)
  const productsByCategory = useMemo(() => {
    if (selectedCategory !== 'all') {
      return { [selectedCategory]: filteredProducts };
    }
    const grouped: Record<string, Product[]> = {};
    if (menuData && menuData.menu_categories && Array.isArray(menuData.menu_categories)) {
      menuData.menu_categories.forEach((cat: any) => {
        const catProducts = filteredProducts.filter(p => p.categoryId === cat.id);
        if (catProducts.length > 0) {
          grouped[cat.id] = catProducts;
        }
      });
      // Add products without category or with unknown category
      const uncategorized = filteredProducts.filter(p => !p.categoryId || !menuData.menu_categories.find((c: any) => c.id === p.categoryId));
      if (uncategorized.length > 0) {
        grouped['uncategorized'] = uncategorized;
      }
    }
    return grouped;
  }, [filteredProducts, selectedCategory, menuData]);

  const formatCurrency = (val: number) => 
    val.toLocaleString('pt-AO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' AKZ';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <UtensilsCrossed className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Erro ao carregar menu</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-emerald-500 text-white px-6 py-2 rounded-full font-bold hover:bg-emerald-400 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
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
              <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shadow-lg flex items-center justify-center w-[200px] h-[60px]">
                 <Image src={settings?.appLogoUrl || '/logo.png'} alt={settings?.restaurantName || 'Logo'} width={200} height={60} className="object-contain" />
              </div>
              <div className="min-w-0">
                <h1 className="text-[18px] md:text-[20px] font-bold text-white leading-none mb-1 truncate">{settings?.restaurantName || 'Tasca do Vereda'}</h1>
                <p className="text-xs text-slate-400 max-w-md truncate">{(settings?.description || 'Vitrine Digital').slice(0, 150)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <a href="tel:976825520" className="px-3 py-2 rounded-lg bg-emerald-600 text-white font-bold text-[16px] hover:bg-emerald-500 transition-colors">
                976 825 520
              </a>
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

          {/* menu_categories Scroller */}
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
            {menuData && menuData.menu_categories && Array.isArray(menuData.menu_categories) && menuData.menu_categories.map((cat: any) => (
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
          const category = menuData && menuData.menu_categories && Array.isArray(menuData.menu_categories) ? menuData.menu_categories.find((c: any) => c.id === catId) : null;
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
                       {product.imageUrl ? (
                         <Image
                           src={product.imageUrl}
                           alt={product.name}
                           fill
                           sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                           style={{ objectFit: 'cover' }}
                           placeholder="blur"
                           blurDataURL="/placeholder-image.jpg"
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
                          <button className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-90 transition-transform hover:bg-emerald-400" title="Adicionar ao carrinho" aria-label="Adicionar ao carrinho">
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

