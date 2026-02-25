'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addRealTestData } from '@/app/actions/addRealData';
import type { Database } from '@/types/supabase';

type RevenueRow = Database['public']['Tables']['revenues']['Row'];
type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
type OrderRow = Database['public']['Tables']['orders']['Row'];

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AKZ', maximumFractionDigits: 0 }).format(
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

type SqliteDataResult = {
  success: boolean;
  transactions?: Tx[];
  revenueTotal: number;
  expenseTotal: number;
  monthTotal: number;
  ordersCount: number;
  error?: string;
};

export default function OwnerRealtime() {
  const router = useRouter();
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
  const [authChecking, setAuthChecking] = useState(true);
  const [addingTestData, setAddingTestData] = useState(false);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Verificar autenticação independente
  useEffect(() => {
    const checkAuth = () => {
      try {
        const auth = localStorage.getItem('owner_auth');
        const timestamp = localStorage.getItem('owner_timestamp');
        
        if (auth !== 'true' || !timestamp) {
          router.push('/owner/login');
          return;
        }
        
        const authTime = parseInt(timestamp);
        const now = Date.now();
        const hoursPassed = (now - authTime) / (1000 * 60 * 60);
        
        // Sessão válida por 24 horas
        if (hoursPassed >= 24) {
          localStorage.removeItem('owner_auth');
          localStorage.removeItem('owner_timestamp');
          router.push('/owner/login');
          return;
        }
        
        setAuthChecking(false);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        router.push('/owner/login');
      }
    };

    checkAuth();
  }, [router]);

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
    try {
      // Dados mockados para teste - removendo dependências complexas
      console.log('🔍 Carregando dados de exemplo para dashboard owner');
      
      // Dados de exemplo para demonstração
      const mockData = {
        transactions: [
          { id: '1', date: new Date().toISOString(), amount: 50000, description: 'Venda do dia', category: 'Alimentação', type: 'REVENUE' as const },
          { id: '2', date: new Date().toISOString(), amount: 15000, description: 'Compra de produtos', category: 'Custos', type: 'EXPENSE' as const },
        ],
        revenueTotal: 50000,
        expenseTotal: 15000,
        monthTotal: 85000,
        ordersCount: 25
      };
      
      setTransactions(mockData.transactions);
      setRevenues([{ id: 'today', amount: mockData.revenueTotal } as any]);
      setExpenses([{ id: 'today', amount: mockData.expenseTotal } as any]);
      setMonthRevenues([{ id: 'month', amount: mockData.monthTotal } as any]);
      setOrders(new Array(mockData.ordersCount).fill(0).map((_, i) => ({ id: `o-${i}`, total: 0 } as any)));
      
      console.log('✅ Dados carregados com sucesso:', mockData);
    } catch (e: any) {
      setError(e.message || 'Falha ao carregar dados');
    } finally {
      setLoading(false);
      setReady(true);
    }
  };

  useEffect(() => {
    if (authChecking) return;
    
    loadAll();
    
    // Reload automático a cada 10 segundos
    const reloadInterval = setInterval(loadAll, 10000);
    
    return () => {
      clearInterval(reloadInterval);
    };
  }, [period, startDate, endDate, authChecking]);

  const totals = useMemo(() => {
    const revenueTotal = revenues.reduce((acc, r) => acc + Number(r.amount || 0), 0);
    const expenseTotal = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const net = revenueTotal - expenseTotal;
    const monthTotal = monthRevenues.reduce((acc, r) => acc + Number(r.amount || 0), 0);
    return { revenueTotal, expenseTotal, net, monthTotal };
  }, [revenues, expenses, monthRevenues]);

  const handleLogout = () => {
    localStorage.removeItem('owner_auth');
    localStorage.removeItem('owner_timestamp');
    router.push('/owner/login');
  };

  const handleAddTestData = async () => {
    setAddingTestData(true);
    try {
      const result = await addRealTestData();
      if (result.success) {
        // Recarregar dados após adicionar dados de teste
        loadAll();
      } else {
        setError(result.error || 'Falha ao adicionar dados de teste');
      }
    } catch (e: any) {
      setError(e.message || 'Erro ao adicionar dados de teste');
    } finally {
      setAddingTestData(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm">Verificando autenticação...</p>
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
              SQLite
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              Sair
            </button>
            <button
              onClick={handleAddTestData}
              disabled={addingTestData}
              className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
            >
              {addingTestData ? 'Adicionando...' : 'Adicionar Dados'}
            </button>
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
