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
  const [monthRevenues, setMonthRevenues] = useState<RevenueRow[]>([]);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const loadAll = async () => {
    const supabase = createClient();
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const startMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    const [r1, r2, r3, r4] = await Promise.all([
      supabase.from('revenues').select('*').gte('created_at', start).order('created_at', { ascending: false }),
      supabase.from('expenses').select('*').gte('created_at', start).order('created_at', { ascending: false }),
      supabase.from('orders').select('*').gte('created_at', start).order('created_at', { ascending: false }),
      supabase.from('revenues').select('*').gte('created_at', startMonth)
    ]);

    if (!r1.error && r1.data) setRevenues(r1.data as RevenueRow[]);
    if (!r2.error && r2.data) setExpenses(r2.data as ExpenseRow[]);
    if (!r3.error && r3.data) setOrders(r3.data as OrderRow[]);
    if (!r4.error && r4.data) setMonthRevenues(r4.data as RevenueRow[]);

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
    const monthTotal = monthRevenues.reduce((acc, r) => acc + Number(r.amount || 0), 0);
    return { revenueTotal, expenseTotal, net, monthTotal };
  }, [revenues, expenses, monthRevenues]);

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
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Visão remota</h2>
            <p className="text-slate-500 text-xs">Dashboard em Tempo Real (Nuvem)</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Atualizado
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-800 text-slate-400 border border-white/10">
              Conectando...
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-white/10">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Arrecadado</div>
            <div className="text-2xl font-black text-white">{fmt(totals.monthTotal)}</div>
            <div className="text-[10px] text-slate-500 mt-1">Este mês</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-white/10">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Hoje</div>
            <div className="text-2xl font-black text-white">{fmt(totals.revenueTotal)}</div>
            <div className="text-[10px] text-slate-500 mt-1">{orders.length} pedidos</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-white/10">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Despesas Hoje</div>
            <div className="text-2xl font-black text-red-400">{fmt(totals.expenseTotal)}</div>
            <div className="text-[10px] text-slate-500 mt-1">saídas</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-white/10">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Fluxo de Caixa</div>
            <div className="text-2xl font-black text-emerald-400">{fmt(totals.net)}</div>
            <div className="text-[10px] text-slate-500 mt-1">hoje</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-white/10">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Equipa</div>
            <div className="text-2xl font-black text-white">0</div>
            <div className="text-[10px] text-slate-500 mt-1">ao serviço</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-white/10">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Preparo Médio</div>
            <div className="text-2xl font-black text-white">15m</div>
            <div className="text-[10px] text-slate-500 mt-1">por encomenda</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-white/10">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Ativos</div>
            <div className="text-2xl font-black text-white">0</div>
            <div className="text-[10px] text-slate-500 mt-1">mesas ativas</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-white/10">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Mesas Livres</div>
            <div className="text-2xl font-black text-white">0</div>
            <div className="text-[10px] text-slate-500 mt-1">disponível</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-900 rounded-2xl border border-white/10">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Receitas Recentes</div>
            <div className="space-y-2">
              {revenues.slice(0, 6).map((r) => (
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

          <div className="p-6 bg-slate-900 rounded-2xl border border-white/10">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Despesas Recentes</div>
            <div className="space-y-2">
              {expenses.slice(0, 6).map((e) => (
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
