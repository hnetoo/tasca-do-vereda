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

type Tx = {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  type: 'REVENUE' | 'EXPENSE';
  status?: string;
};

export default function OwnerRealtime() {
  const [ready, setReady] = useState(false);
  const [revenues, setRevenues] = useState<RevenueRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [monthRevenues, setMonthRevenues] = useState<RevenueRow[]>([]);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'HOJE' | 'SEMANA' | 'MES' | 'CUSTOM'>('HOJE');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const computeRange = () => {
    const now = new Date();
    if (period === 'HOJE') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      return { start, end };
    }
    if (period === 'SEMANA') {
      const d = new Date(now);
      const day = d.getDay() || 7;
      const startDate = new Date(d);
      startDate.setDate(d.getDate() - day + 1);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
      return { start: startDate.toISOString(), end: endDate.toISOString() };
    }
    if (period === 'MES') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      return { start, end };
    }
    return { start: startDate || undefined, end: endDate || undefined };
  };

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { start, end } = computeRange();
    const today = new Date();
    const startDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const startMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    try {
      // Prefer unified view if available
      const txQuery = (supabase as any)
        .from('financial_transactions')
        .select('*')
        .order('date', { ascending: false });
      let txRes;
      if (start && end) txRes = await txQuery.gte('date', start).lte('date', end);
      else if (start) txRes = await txQuery.gte('date', start);
      else if (end) txRes = await txQuery.lte('date', end);
      else txRes = await txQuery;
      if (!txRes.error && txRes.data) {
        setTransactions(
          (txRes.data as any[]).map((r) => ({
            id: r.id,
            date: r.date,
            amount: Number(r.amount || 0),
            description: r.description || '',
            category: r.category || '',
            type: r.type,
            status: r.status,
          }))
        );
      } else {
        // Fallback: combine manually
        const [r1, r2] = await Promise.all([
          supabase.from('revenues').select('*').order('created_at', { ascending: false }),
          supabase.from('expenses').select('*').order('created_at', { ascending: false }),
        ]);
        const txs: Tx[] = [];
        if (!r1.error && r1.data) {
          (r1.data as RevenueRow[]).forEach((r) => {
            const d = new Date(r.created_at || '');
            if ((!start || d >= new Date(start)) && (!end || d <= new Date(end))) {
              txs.push({
                id: r.id,
                date: r.created_at || '',
                amount: Number(r.amount || 0),
                description: r.description || '',
                category: r.category || 'REVENUE',
                type: 'REVENUE',
                status: (r as any).status || 'COMPLETED',
              });
            }
          });
        }
        if (!r2.error && r2.data) {
          (r2.data as ExpenseRow[]).forEach((e) => {
            const d = new Date(e.created_at || '');
            if ((!start || d >= new Date(start)) && (!end || d <= new Date(end))) {
              txs.push({
                id: e.id,
                date: e.created_at || '',
                amount: Number(e.amount || 0),
                description: e.description || '',
                category: e.category || 'EXPENSE',
                type: 'EXPENSE',
                status: (e as any).status || 'COMPLETED',
              });
            }
          });
        }
        txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(txs);
      }

      const [r1, r2, r3, r4] = await Promise.all([
        supabase.from('revenues').select('*').gte('created_at', startDay).order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').gte('created_at', startDay).order('created_at', { ascending: false }),
        supabase.from('orders').select('*').gte('created_at', startDay).order('created_at', { ascending: false }),
        supabase.from('revenues').select('*').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ]);

      if (!r1.error && r1.data) setRevenues(r1.data as RevenueRow[]);
      if (!r2.error && r2.data) setExpenses(r2.data as ExpenseRow[]);
      if (!r3.error && r3.data) setOrders(r3.data as OrderRow[]);
      if (!r4.error && r4.data) setMonthRevenues(r4.data as RevenueRow[]);
    } catch (e: any) {
      setError(e.message || 'Falha ao carregar dados');
    } finally {
      setLoading(false);
    }

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
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2 bg-slate-900 border border-white/10 rounded-xl p-1">
            {(['HOJE','SEMANA','MES','CUSTOM'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${period===p ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'}`}
              >
                {p}
              </button>
            ))}
          </div>
          {period === 'CUSTOM' && (
            <>
              <input type="datetime-local" className="bg-slate-900 border border-white/10 rounded-lg p-2 text-xs"
                value={startDate || ''} onChange={e=>setStartDate(e.target.value)} />
              <input type="datetime-local" className="bg-slate-900 border border-white/10 rounded-lg p-2 text-xs"
                value={endDate || ''} onChange={e=>setEndDate(e.target.value)} />
              <button onClick={loadAll} className="px-3 py-2 rounded-lg bg-primary text-black text-[10px] font-black uppercase tracking-widest">Aplicar</button>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-white/10 min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Arrecadado</div>
            <div className="font-black text-white leading-tight tracking-wide whitespace-nowrap overflow-hidden text-ellipsis text-[clamp(1.25rem,3vw,2rem)]">{fmt(totals.monthTotal)}</div>
            <div className="text-[10px] text-slate-500 mt-1">Este mês</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-white/10 min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Hoje</div>
            <div className="font-black text-white leading-tight tracking-wide whitespace-nowrap overflow-hidden text-ellipsis text-[clamp(1.25rem,3vw,2rem)]">{fmt(totals.revenueTotal)}</div>
            <div className="text-[10px] text-slate-500 mt-1">{orders.length} pedidos</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-white/10 min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Despesas Hoje</div>
            <div className="font-black text-red-400 leading-tight tracking-wide whitespace-nowrap overflow-hidden text-ellipsis text-[clamp(1.25rem,3vw,2rem)]">{fmt(totals.expenseTotal)}</div>
            <div className="text-[10px] text-slate-500 mt-1">saídas</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-white/10 min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Fluxo de Caixa</div>
            <div className="font-black text-emerald-400 leading-tight tracking-wide whitespace-nowrap overflow-hidden text-ellipsis text-[clamp(1.25rem,3vw,2rem)]">{fmt(totals.net)}</div>
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

        <div className="p-6 bg-slate-900 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transações Financeiras</h3>
            <div className="text-xs text-slate-500 font-mono">
              Total Receitas: <span className="text-emerald-400">{fmt(transactions.filter(t=>t.type==='REVENUE').reduce((a,b)=>a+b.amount,0))}</span> •
              Total Despesas: <span className="text-red-400">{fmt(transactions.filter(t=>t.type==='EXPENSE').reduce((a,b)=>a+b.amount,0))}</span>
            </div>
          </div>
          {loading ? (
            <div className="py-10 text-center text-slate-500 text-xs font-black uppercase tracking-widest">A carregar…</div>
          ) : error ? (
            <div className="py-10 text-center text-red-400 text-xs font-black uppercase tracking-widest">{error}</div>
          ) : transactions.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs font-black uppercase tracking-widest">Sem transações no período</div>
          ) : (
            <div className="overflow-auto rounded-xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-slate-400">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold">Data</th>
                    <th className="px-4 py-2 text-left font-bold">Descrição</th>
                    <th className="px-4 py-2 text-left font-bold">Categoria</th>
                    <th className="px-4 py-2 text-left font-bold">Tipo</th>
                    <th className="px-4 py-2 text-right font-bold">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="px-4 py-2 text-slate-300">{new Date(t.date).toLocaleString('pt-AO')}</td>
                      <td className="px-4 py-2 text-white">{t.description}</td>
                      <td className="px-4 py-2 text-slate-300">{t.category}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${t.type==='REVENUE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className={`px-4 py-2 text-right font-mono ${t.type==='REVENUE' ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
