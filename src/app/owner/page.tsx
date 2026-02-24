'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

type RevenueRow = Database['public']['Tables']['revenues']['Row'];
type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
type OrderRow = Database['public']['Tables']['orders']['Row'];

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  );

export default function OwnerRealtime() {
  const [ready, setReady] = useState(false);
  const [revenues, setRevenues] = useState<RevenueRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const loadAll = async () => {
    const supabase = createClient();
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

    const [r1, r2, r3] = await Promise.all([
      supabase.from('revenues').select('*').gte('created_at', start).order('created_at', { ascending: false }),
      supabase.from('expenses').select('*').gte('created_at', start).order('created_at', { ascending: false }),
      supabase.from('orders').select('*').gte('created_at', start).order('created_at', { ascending: false }),
    ]);

    if (!r1.error && r1.data) setRevenues(r1.data as RevenueRow[]);
    if (!r2.error && r2.data) setExpenses(r2.data as ExpenseRow[]);
    if (!r3.error && r3.data) setOrders(r3.data as OrderRow[]);

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
      .channel('owner-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'revenues' },
        () => loadAll()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        () => loadAll()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => loadAll()
      )
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    const revenueTotal = revenues.reduce((acc, r) => acc + Number(r.amount || 0), 0);
    const expenseTotal = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const net = revenueTotal - expenseTotal;
    return { revenueTotal, expenseTotal, net };
  }, [revenues, expenses]);

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-black text-white mb-4">Painel Financeiro (Cloud)</h1>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-sm text-slate-400">
              Cloud não configurada. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para ativar o
              modo online.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-black text-white">Painel Financeiro (Tempo Real)</h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
            Atualiza com alterações em receitas, despesas e pedidos.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
            <div className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1">Vendas Hoje</div>
            <div className="text-3xl font-black text-white">{fmt(totals.revenueTotal)}</div>
          </div>
          <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl">
            <div className="text-[10px] font-black uppercase text-red-400 tracking-widest mb-1">Despesas Hoje</div>
            <div className="text-3xl font-black text-white">{fmt(totals.expenseTotal)}</div>
          </div>
          <div className="p-6 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl">
            <div className="text-[10px] font-black uppercase text-cyan-400 tracking-widest mb-1">Resultado</div>
            <div className="text-3xl font-black text-white">{fmt(totals.net)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">
              Receitas Recentes
            </div>
            <div className="space-y-2">
              {revenues.slice(0, 10).map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <span className="text-sm font-bold">{r.description || 'Venda'}</span>
                  <span className="text-sm font-mono text-emerald-400">{fmt(Number(r.amount || 0))}</span>
                </div>
              ))}
              {ready && revenues.length === 0 && (
                <div className="text-xs text-slate-500">Sem receitas hoje.</div>
              )}
            </div>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Despesas Recentes</div>
            <div className="space-y-2">
              {expenses.slice(0, 10).map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <span className="text-sm font-bold">{e.description || 'Despesa'}</span>
                  <span className="text-sm font-mono text-red-400">{fmt(Number(e.amount || 0))}</span>
                </div>
              ))}
              {ready && expenses.length === 0 && (
                <div className="text-xs text-slate-500">Sem despesas hoje.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
