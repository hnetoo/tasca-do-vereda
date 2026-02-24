'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

type DishRow = Database['public']['Tables']['dishes']['Row'];
type CategoryRow = Database['public']['Tables']['menu_categories']['Row'];

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  );

export default function PublicMenuPage() {
  const [dishes, setDishes] = useState<DishRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [ready, setReady] = useState(false);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const filtered = useMemo(() => {
    const byCat = activeCategory === 'ALL' ? dishes : dishes.filter(d => d.category_id === activeCategory);
    if (!search.trim()) return byCat;
    const s = search.trim().toLowerCase();
    return byCat.filter(d => d.name.toLowerCase().includes(s) || (d.description || '').toLowerCase().includes(s));
  }, [dishes, activeCategory, search]);

  const loadAll = async () => {
    const supabase = createClient();
    const [c, d] = await Promise.all([
      supabase.from('menu_categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('dishes').select('*')
    ]);
    if (!c.error && c.data) setCategories(c.data as CategoryRow[]);
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
      <header className="p-6 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-4">
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Ementa</h1>
          <div className="flex-1" />
          <input
            placeholder="Pesquisar prato..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-80 p-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:border-primary outline-none"
          />
        </div>
        <div className="max-w-6xl mx-auto mt-4">
          <a
            href="#encomendar"
            className="block w-full text-center px-4 py-3 rounded-xl bg-primary text-black font-black uppercase text-[10px] tracking-widest shadow-glow hover:brightness-110 transition-all"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map(d => (
              <div key={d.id} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-white">{d.name}</div>
                  <div className="text-sm font-mono text-emerald-400">{fmt(Number(d.price))}</div>
                </div>
                {!!d.description && <div className="text-xs text-slate-400">{d.description}</div>}
                {d.available === false && (
                  <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-red-400">Indisponível</div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
