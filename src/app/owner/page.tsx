'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { addRealTestData } from '@/app/actions/addRealData';
import type { Database } from '@/types/supabase';
import { useRealtimeOrders, useRealtimeMetrics, useRealtimeTransactions } from '@/hooks/useSupabaseRealtime';
import { supabaseService } from '@/services/supabaseService';
import { useStore } from '@/store/useStore';

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
  const router = useRouter();
  const { addNotification } = useStore();
  const [ready, setReady] = useState(false);
  const [period, setPeriod] = useState<'HOJE' | 'SEMANA' | 'MES'>('HOJE');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [authChecking, setAuthChecking] = useState(true);

  // Hooks de tempo real
  const { data: orders, loading: ordersLoading, error: ordersError } = useRealtimeOrders();
  const { metrics, loading: metricsLoading } = useRealtimeMetrics();
  const { data: transactions, loading: transactionsLoading } = useRealtimeTransactions();

  // Estado para métricas calculadas
  const realtimeStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = orders.filter(order => 
      new Date(order.created_at) >= today
    );
    
    const todaySales = todayOrders.reduce((sum, order) => 
      sum + (order.total_amount || 0), 0
    );
    
    const pendingOrders = orders.filter(order => 
      order.status === 'pending' || order.status === 'preparing'
    ).length;
    
    const activeTables = new Set(
      todayOrders
        .filter(order => order.table_id && order.status !== 'completed')
        .map(order => order.table_id)
    ).size;
    
    const averageTicket = todayOrders.length > 0 
      ? todaySales / todayOrders.length 
      : 0;

    return {
      todaySales,
      todayOrders: todayOrders.length,
      pendingOrders,
      activeTables,
      averageTicket
    };
  }, [orders]);

  // Verificar autenticação
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setAuthChecking(true);
        const result = await supabaseService.client?.auth.getSession();
        if (!result?.data?.session) {
          window.location.href = '/login';
          return;
        }
        setReady(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
      } finally {
        setAuthChecking(false);
      }
    };

    checkAuth();
  }, []);

  // Combinar transações de pedidos e transações financeiras
  const combinedTransactions = useMemo(() => {
    const txs: Array<{
      id: string;
      date: string;
      description: string;
      category: string;
      type: 'REVENUE' | 'EXPENSE';
      amount: number;
    }> = [];

    // Adicionar transações dos pedidos
    orders.forEach(order => {
      txs.push({
        id: `order-${order.id}`,
        date: order.created_at,
        description: `Pedido #${order.order_number}`,
        category: 'Vendas',
        type: 'REVENUE',
        amount: order.total_amount || 0
      });
    });

    // Adicionar transações financeiras
    transactions.forEach(transaction => {
      txs.push({
        id: transaction.id,
        date: transaction.created_at,
        description: transaction.description || 'Transação',
        category: transaction.category || 'Geral',
        type: transaction.type as 'REVENUE' | 'EXPENSE',
        amount: transaction.amount || 0
      });
    });

    return txs;
  }, [orders, transactions]);

  // Filtrar transações por período
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let filterStart: Date;
    let filterEnd: Date;

    switch (period) {
      case 'HOJE':
        filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'SEMANA':
        filterStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filterEnd = now;
        break;
      case 'MES':
        filterStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filterEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      default:
        filterStart = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filterEnd = endDate ? new Date(endDate) : now;
    }

    return combinedTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= filterStart && txDate <= filterEnd;
    });
  }, [combinedTransactions, period, startDate, endDate]);

  // Calcular totais
  const totals = useMemo(() => {
    const revenue = filteredTransactions
      .filter(tx => tx.type === 'REVENUE')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const expense = filteredTransactions
      .filter(tx => tx.type === 'EXPENSE')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      revenue,
      expense,
      net: revenue - expense,
      count: filteredTransactions.length
    };
  }, [filteredTransactions]);

  // Loading state
  if (authChecking || ordersLoading || metricsLoading || transactionsLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando dados em tempo real...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (ordersError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Erro ao carregar dados: {ordersError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 px-4 py-2 rounded"
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Verificando autenticação...</p>
        </div>
      </div>
    );
  }
  // Renderizar dashboard em tempo real
  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard em Tempo Real</h1>
        <p className="text-gray-400">Monitoramento ao vivo do restaurante</p>
      </div>

      {/* KPIs em Tempo Real */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-2xl border border-green-500/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-green-200 text-sm font-medium">Vendas Hoje</span>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div className="text-3xl font-bold mb-1">{fmt(realtimeStats.todaySales)}</div>
          <div className="text-green-200 text-sm">{realtimeStats.todayOrders} pedidos</div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl border border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-blue-200 text-sm font-medium">Mesas Ativas</span>
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
          <div className="text-3xl font-bold mb-1">{realtimeStats.activeTables}</div>
          <div className="text-blue-200 text-sm">Ocupadas agora</div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-6 rounded-2xl border border-orange-500/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-orange-200 text-sm font-medium">Pedidos Pendentes</span>
            <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
          </div>
          <div className="text-3xl font-bold mb-1">{realtimeStats.pendingOrders}</div>
          <div className="text-orange-200 text-sm">Aguardando</div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-2xl border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-purple-200 text-sm font-medium">Ticket Médio</span>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
          </div>
          <div className="text-3xl font-bold mb-1">{fmt(realtimeStats.averageTicket)}</div>
          <div className="text-purple-200 text-sm">Por pedido</div>
        </div>
      </div>

      {/* Período Selector */}
      <div className="bg-gray-900/50 p-6 rounded-2xl border border-white/10 mb-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {(['HOJE', 'SEMANA', 'MES'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  period === p 
                    ? 'bg-primary text-black' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={startDate || ''}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-gray-800 px-3 py-2 rounded-lg text-white"
            />
            <span className="text-gray-400">até</span>
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gray-800 px-3 py-2 rounded-lg text-white"
            />
          </div>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-white/10">
          <h3 className="text-xl font-bold mb-4 text-green-400">Receitas</h3>
          <div className="text-3xl font-bold text-green-400">{fmt(totals.revenue)}</div>
          <div className="text-gray-400 text-sm mt-2">{filteredTransactions.filter(t => t.type === 'REVENUE').length} transações</div>
        </div>

        <div className="bg-gray-900/50 p-6 rounded-2xl border border-white/10">
          <h3 className="text-xl font-bold mb-4 text-red-400">Despesas</h3>
          <div className="text-3xl font-bold text-red-400">{fmt(totals.expense)}</div>
          <div className="text-gray-400 text-sm mt-2">{filteredTransactions.filter(t => t.type === 'EXPENSE').length} transações</div>
        </div>

        <div className="bg-gray-900/50 p-6 rounded-2xl border border-white/10">
          <h3 className="text-xl font-bold mb-4">Lucro Líquido</h3>
          <div className={`text-3xl font-bold ${totals.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {fmt(totals.net)}
          </div>
          <div className="text-gray-400 text-sm mt-2">Margem: {totals.revenue > 0 ? ((totals.net / totals.revenue) * 100).toFixed(1) : 0}%</div>
        </div>
      </div>

      {/* Transações Recentes */}
      <div className="bg-gray-900/50 p-6 rounded-2xl border border-white/10">
        <h3 className="text-xl font-bold mb-4">Transações Recentes</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredTransactions.slice(0, 20).map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{tx.description}</div>
                <div className="text-sm text-gray-400">{tx.category} • {new Date(tx.date).toLocaleTimeString()}</div>
              </div>
              <div className={`font-bold ${tx.type === 'REVENUE' ? 'text-green-400' : 'text-red-400'}`}>
                {tx.type === 'REVENUE' ? '+' : '-'}{fmt(tx.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Produtos Mais Vendidos */}
      {metrics?.top_products && (
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-white/10 mt-8">
          <h3 className="text-xl font-bold mb-4">Produtos Mais Vendidos</h3>
          <div className="space-y-2">
            {metrics.top_products.map((product: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-400">{product.quantity} vendidos</div>
                </div>
                <div className="font-bold text-green-400">{fmt(product.revenue)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
