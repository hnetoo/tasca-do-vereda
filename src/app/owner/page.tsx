'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

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

export default function OwnerPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [period, setPeriod] = useState<'HOJE' | 'SEMANA' | 'MES'>('HOJE');
  const [supabaseData, setSupabaseData] = useState<any>({
    orders: [],
    expenses: [],
    dishes: [],
    categories: []
  });
  const [loadingSupabase, setLoadingSupabase] = useState(false);
  
  // Dados em tempo real do store local (SQLite)
  const { 
    orders, 
    expenses,
    dishes,
    categories 
  } = useStore();

  // Fallback: Carregar dados da API se store local estiver vazio
  useEffect(() => {
    const hasLocalData = (orders?.length || 0) > 0 || (expenses?.length || 0) > 0;
    
    if (!hasLocalData && !loadingSupabase) {
      console.log('🔄 Loading data from API (fallback for owner desktop)');
      loadApiData();
    }
  }, [orders, expenses, loadingSupabase]);

  const loadApiData = async () => {
    setLoadingSupabase(true);
    try {
      const response = await fetch('/api/owner-data');
      const data = await response.json();
      
      setSupabaseData({
        orders: data.orders || [],
        expenses: data.expenses || [],
        dishes: data.dishes || [],
        categories: data.categories || []
      });
      
      console.log('✅ API data loaded for owner desktop:', {
        orders: data.orders?.length || 0,
        expenses: data.expenses?.length || 0,
        dishes: data.dishes?.length || 0,
        categories: data.categories?.length || 0
      });
      
    } catch (error: any) {
      console.error('❌ Error loading API data for owner desktop:', error);
    } finally {
      setLoadingSupabase(false);
    }
  };

  // Usar dados do store local ou API
  const currentData = {
    orders: (orders?.length || 0) > 0 ? orders : supabaseData.orders,
    expenses: (expenses?.length || 0) > 0 ? expenses : supabaseData.expenses,
    dishes: (dishes?.length || 0) > 0 ? dishes : supabaseData.dishes,
    categories: (categories?.length || 0) > 0 ? categories : supabaseData.categories
  };

  // Debug para verificar se dados estão carregados
  useEffect(() => {
    const debugInfo = {
      localOrders: orders?.length || 0,
      localExpenses: expenses?.length || 0,
      localDishes: dishes?.length || 0,
      localCategories: categories?.length || 0,
      apiOrders: supabaseData.orders.length,
      apiExpenses: supabaseData.expenses.length,
      finalOrders: currentData.orders.length,
      finalExpenses: currentData.expenses.length,
      isMobile: typeof window !== 'undefined' ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) : 'SSR'
    };
    
    console.log('📊 Owner Desktop Data Debug:', debugInfo);
    
    // Adicionar debug visual na página
    const debugElement = document.getElementById('mobile-debug');
    if (debugElement) {
      debugElement.innerHTML = `
        <div style="position: fixed; top: 10px; right: 10px; background: red; color: white; padding: 10px; z-index: 9999; font-size: 12px;">
          📊 DEBUG: ${JSON.stringify(debugInfo)}
        </div>
      `;
    }
  }, [orders, expenses, dishes, categories]);

  // Verificar autenticação
  useEffect(() => {
    // Verificar cookie de autenticação owner (compatível com mobile)
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    
    const cookieValue = getCookie('owner_authenticated');
    const localStorageValue = localStorage.getItem('owner_authenticated');
    const isAuth = cookieValue === 'true' || localStorageValue === 'true';
    
    console.log('🔐 Owner auth check:', { cookie: cookieValue, localStorage: localStorageValue, isAuth });
    
    // Debug visual para mostrar o estado da autenticação
    const authDebugElement = document.getElementById('auth-debug');
    if (authDebugElement) {
      authDebugElement.innerHTML = `
        <div style="position: fixed; top: 60px; right: 10px; background: orange; color: black; padding: 10px; z-index: 9999; font-size: 12px;">
          🔐 AUTH DEBUG: cookie=${cookieValue} | localStorage=${localStorageValue} | isAuth=${isAuth}
        </div>
      `;
    }
    
    if (!isAuth) {
      router.push('/owner/login');
      return;
    }
    setAuthChecking(false);
  }, [router]);

  // Função para calcular total da order com fallback
  const calculateOrderTotal = (order: any) => {
    if (order.total && order.total > 0) {
      return order.total;
    }
    
    // Fallback: calcular dos itens
    if (order.items && order.items.length > 0) {
      return order.items.reduce((sum: number, item: any) => {
        const dish = dishes?.find((d: any) => d.id === (item.dishId || item.dish_id));
        if (!dish) return sum;
        return sum + (dish.price || 0) * (item.quantity || 0);
      }, 0);
    }
    
    return 0;
  };

  // Estado para métricas calculadas
  const realtimeStats = useMemo(() => {
    console.log('📊 Owner Stats Debug:', {
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR',
      isMobile: typeof window !== 'undefined' ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) : 'SSR',
      orders: orders?.length || 0,
      dishes: dishes?.length || 0,
      categories: categories?.length || 0,
      sampleOrders: orders?.slice(0, 2).map(o => ({ id: o.id, total: o.total, itemsCount: o.items?.length || 0 })),
      sampleDishes: dishes?.slice(0, 2).map(d => ({ id: d.id, name: d.name, price: d.price }))
    });
    
    // Se não há dados, retornar zeros estáveis
    if (!currentData.orders || currentData.orders.length === 0) {
      console.log('📊 No orders found, returning zeros');
      return {
        todaySales: 0,
        todayOrders: 0,
        todayRevenue: 0,
        activeTables: 0,
        totalRevenue: 0,
        totalOrders: 0,
        avgTicket: 0,
        growth: 0,
        pendingOrders: 0,
        averageTicket: 0
      };
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = currentData.orders.filter((order: any) => {
        const orderDate = new Date(order.created_at || new Date());
        return orderDate >= today;
      });
      
      const todaySales = todayOrders.reduce((sum: number, order: any) => {
        return sum + (order.total || 0);
      }, 0);
      
      const todayRevenue = todaySales * 0.85; // 85% de margem
      
      const totalRevenue = currentData.orders.reduce((sum: number, order: any) => {
        return sum + (order.total || 0);
      }, 0);

      // Contar mesas ativas (orders que não estão fechadas)
      const activeTables = currentData.orders.filter((order: any) => 
        order.status !== 'closed' && order.status !== 'paid'
      ).length;

      return {
        todaySales,
        todayOrders: todayOrders.length,
        todayRevenue,
        activeTables,
        totalRevenue,
        totalOrders: currentData.orders.length,
        avgTicket: todayOrders.length > 0 ? todaySales / todayOrders.length : 0,
        growth: 0, // Sem cálculo de crescimento para evitar instabilidade
        pendingOrders: todayOrders.filter(o => o && o.status === 'ABERTO').length,
        averageTicket: todayOrders.length > 0 ? todaySales / todayOrders.length : 0
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return {
        todaySales: 0,
        todayOrders: 0,
        todayRevenue: 0,
        activeTables: 0,
        totalRevenue: 0,
        totalOrders: 0,
        avgTicket: 0,
        growth: 0,
        pendingOrders: 0,
        averageTicket: 0
      };
    }
  }, [orders]);

  // Combinar transações - PRIORIDADE LOCAL
  const combinedTransactions = useMemo(() => {
    const txs: Array<{
      id: string;
      date: string;
      description: string;
      category: string;
      type: 'REVENUE' | 'EXPENSE';
      amount: number;
    }> = [];

    try {
      // Adicionar transações dos pedidos (local)
      if (orders && orders.length > 0) {
        orders.forEach(order => {
          if (order && order.id) {
            txs.push({
              id: `order-${order.id}`,
              date: (order.created_at instanceof Date ? order.created_at.toISOString() : order.created_at) || new Date().toISOString(),
              description: `Pedido #${order.order_number || 'N/A'}`,
              category: 'Vendas',
              type: 'REVENUE' as const,
              amount: calculateOrderTotal(order)
            });
          }
        });
      }

      // Adicionar transações financeiras (local)
      if (expenses && expenses.length > 0) {
        expenses.forEach(expense => {
          if (expense && expense.id) {
            txs.push({
              id: `expense-${expense.id}`,
              date: expense.date || new Date().toISOString(),
              description: expense.description || 'Despesa',
              category: expense.category || 'Outros',
              type: 'EXPENSE',
              amount: expense.amount || 0
            });
          }
        });
      }
    } catch (error) {
      console.error('Erro ao combinar transações:', error);
    }

    return txs;
  }, [orders, expenses]);

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
        filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filterEnd = now;
    }

    return combinedTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= filterStart && txDate <= filterEnd;
    });
  }, [combinedTransactions, period]);

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
  if (authChecking) {
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
    <div className="min-h-screen bg-black text-white p-8" style={{marginLeft: '0', paddingLeft: '8px', paddingRight: '8px'}}>
      {/* Debug Visual para Mobile */}
      <div id="mobile-debug"></div>
      <div id="auth-debug"></div>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard em Tempo Real</h1>
          <p className="text-gray-400">Monitoramento ao vivo do restaurante</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            OWNER
          </span>
          <button
            onClick={() => {
              localStorage.removeItem('owner_authenticated');
              localStorage.removeItem('owner_user');
              localStorage.removeItem('owner_login_time');
              router.push('/owner/login');
            }}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
          >
            Sair
          </button>
        </div>
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
          <div className="text-3xl font-bold mb-1">{fmt(realtimeStats.averageTicket || 0)}</div>
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
    </div>
  );
}
