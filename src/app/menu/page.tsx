'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import DishModal from '@/components/DishModal';
import { normalizeDishImage } from '@/utils/imageUtils';

type DishRow = Database['public']['Tables']['dishes']['Row'];
type CategoryRow = Database['public']['Tables']['menu_categories']['Row'];

const fmt = (n: number) => {
  const val = Number.isFinite(n) ? n : 0;
  return val.toLocaleString('pt-AO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' AKZ';
};

export default function PublicMenuPage() {
  const [dishes, setDishes] = useState<DishRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [ready, setReady] = useState(false);
  const [selectedDish, setSelectedDish] = useState<DishRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const filtered = useMemo(() => {
    const byCat = activeCategory === 'ALL' ? dishes : dishes.filter(d => d.category_id === activeCategory);
    if (!search.trim()) return byCat;
    const s = search.trim().toLowerCase();
    return byCat.filter(d => d.name.toLowerCase().includes(s) || (d.description || '').toLowerCase().includes(s));
  }, [dishes, activeCategory, search]);

  const openDishModal = (dish: DishRow) => {
    setSelectedDish(dish);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDish(null);
  };

  const loadAll = async () => {
    const supabase = createClient();
    const [c, d] = await Promise.all([
      supabase.from('menu_categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('dishes').select('*')
    ]);
    if (!c.error && c.data) {
      const mapped = (c.data as CategoryRow[]).map(cat => ({
        ...cat,
        name: (typeof cat.name === 'string' && cat.name.trim().toLowerCase() === 'grelhoes') ? 'Grelhados' : cat.name
      }));
      setCategories(mapped);
    }
    if (!d.error && d.data) setDishes(d.data as DishRow[]);
    setReady(true);
  };

  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) {
      setReady(true);
      return;
    }
    loadAll();
    const supabase = createClient();
    const ch = supabase
      .channel('menu-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dishes' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_categories' }, () => loadAll())
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-black text-white mb-4">Ementa Online</h1>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-sm text-slate-400">
              Cloud não configurada. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para ativar este
              menu público em tempo real.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="sticky top-0 z-30 p-6 border-b border-white/10 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <img src="/logo.png" alt="Logo" style={{ width: 200, height: 60, objectFit: 'contain' }} />
            <div className="min-w-0">
              <div className="text-[18px] md:text-[20px] font-black text-white tracking-wider">Tasca do Vereda</div>
              <div className="text-xs text-slate-400 max-w-md truncate">Faça a sua encomenda e acompanhe os melhores grelhados da casa.</div>
            </div>
          </div>
          <a href="tel:976825520" className="px-3 py-2 rounded-lg bg-emerald-600 text-white font-bold text-[16px] hover:bg-emerald-500 transition-colors">
            976 825 520
          </a>
        </div>
        <div className="max-w-6xl mx-auto mt-4 flex items-center gap-3">
          <input
            placeholder="Pesquisar prato..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 p-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:border-primary outline-none"
          />
          <a
            href="#encomendar"
            className="px-4 py-3 rounded-xl bg-primary text-black font-black uppercase text-[10px] tracking-widest shadow-glow hover:brightness-110 transition-all"
          >
            Faça a sua encomenda
          </a>
        </div>
        <div className="max-w-6xl mx-auto mt-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                activeCategory === 'ALL'
                  ? 'bg-primary text-black border-primary'
                  : 'bg-white/5 text-slate-300 border-white/10'
              }`}
            >
              Todas
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  activeCategory === c.id
                    ? 'bg-primary text-black border-primary'
                    : 'bg-white/5 text-slate-300 border-white/10'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {ready && filtered.length === 0 ? (
          <div className="text-sm text-slate-400">Sem itens disponíveis.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filtered.map(d => (
              <div 
                key={d.id} 
                className="group cursor-pointer bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                onClick={() => openDishModal(d)}
              >
                {/* Image Container */}
                <div className="aspect-video bg-slate-800 relative overflow-hidden">
                  <img
                    src={normalizeDishImage(d.image_url || undefined)}
                    alt={d.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo.png';
                    }}
                  />
                  {d.available === false && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="px-3 py-1 bg-red-600 rounded-full">
                        <span className="text-white text-xs font-bold">Indisponível</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-white group-hover:text-primary transition-colors">{d.name}</div>
                    <div className="text-sm font-mono text-emerald-400">{fmt(Number(d.price))}</div>
                  </div>
                  {!!d.description && (
                    <div className="text-xs text-slate-400 line-clamp-2">{d.description}</div>
                  )}
                  
                  {/* Additional Info */}
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                    {d.preparation_time && (
                      <span className="flex items-center gap-1">
                        <span>⏱️</span>
                        <span>{d.preparation_time}min</span>
                      </span>
                    )}
                    {d.track_stock && (d.stock_quantity || 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <span>📦</span>
                        <span>{d.stock_quantity}un</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Dish Modal */}
      <DishModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        dish={selectedDish} 
      />
    </div>
  );
}
