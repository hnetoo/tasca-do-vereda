'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingBasket, ChevronRight, Star, Flame } from 'lucide-react';
import { normalizeDishImage } from '@/utils/imageUtils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category_id: string;
  available: boolean;
  is_popular?: boolean;
  preparation_time?: number;
  spicy_level?: number;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
  sort_order?: number;
}

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Initial Fetch
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
          .eq('available', true);

        if (cats) setCategories(cats);
        if (prods) setProducts(prods);
      } catch (error) {
        console.error('Error fetching menu:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Realtime Subscriptions
    const productsChannel = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProducts(prev => [...prev, payload.new as Product]);
        } else if (payload.eventType === 'UPDATE') {
          setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new as Product : p));
        } else if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();

    const categoriesChannel = supabase
      .channel('public:categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCategories(prev => [...prev, payload.new as Category]);
        } else if (payload.eventType === 'UPDATE') {
          setCategories(prev => prev.map(c => c.id === payload.new.id ? payload.new as Category : c));
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

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    return products.filter(p => p.category_id === selectedCategory);
  }, [products, selectedCategory]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(val);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      {/* Header Mobile */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">
            Tasca <span className="text-primary">Vereda</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Menu Digital</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
          <ShoppingBasket size={18} className="text-primary" />
        </div>
      </header>

      {/* Categories Scroll */}
      <div className="sticky top-[73px] z-40 bg-slate-950/95 py-4 border-b border-white/5 overflow-x-auto no-scrollbar pl-6">
        <div className="flex gap-3 pr-6 w-max">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${
              selectedCategory === 'all' 
                ? 'bg-primary text-black border-primary shadow-glow' 
                : 'bg-white/5 text-slate-400 border-white/10'
            }`}
          >
            Tudo
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-primary text-black border-primary shadow-glow'
                  : 'bg-white/5 text-slate-400 border-white/10'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-6 space-y-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="group relative bg-white/5 rounded-3xl p-4 border border-white/5 overflow-hidden active:scale-[0.98] transition-all">
            <div className="flex gap-4">
              {/* Image */}
              <div className="w-24 h-24 rounded-2xl bg-slate-900 overflow-hidden shrink-0 border border-white/5">
                {product.image ? (
                   <img 
                     src={normalizeDishImage(product.image)} 
                     alt={product.name}
                     className="w-full h-full object-cover"
                   />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <ShoppingBasket size={24} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-bold text-white leading-tight mb-1 truncate pr-2">{product.name}</h3>
                    {product.is_popular && <Star size={12} className="text-yellow-500 fill-yellow-500 shrink-0 mt-1" />}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{product.description}</p>
                </div>
                
                <div className="flex items-end justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-mono font-bold text-primary">{formatCurrency(product.price)}</span>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center shadow-glow active:bg-white transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="absolute top-4 right-4 flex flex-col gap-1">
              {product.spicy_level && product.spicy_level > 0 && (
                <div className="bg-red-500/20 p-1 rounded-md border border-red-500/30 backdrop-blur-sm">
                   <Flame size={10} className="text-red-500 fill-red-500" />
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 opacity-50">
            <ShoppingBasket size={48} className="mx-auto mb-4 text-slate-600" />
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Sem produtos nesta categoria</p>
          </div>
        )}
      </div>
    </div>
  );
}
