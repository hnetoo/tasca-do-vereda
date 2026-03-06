'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useSafeCardCalculations } from '@/utils/cardCalculations';
import { createClient } from '@/lib/supabase/client';

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
  const [period, setPeriod] = useState<'HOJE' | 'SEMANA' | 'MES' | 'ANO'>('HOJE');
  const [supabaseData, setSupabaseData] = useState<any>({
    orders: [],
    expenses: [],
    payroll: [],
    dishes: [],
    categories: []
  });
  const [loadingSupabase, setLoadingSupabase] = useState(false);
  
  // Dados em tempo real do store local (SQLite)
  const { 
    orders, 
    expenses,
    revenues,
    dishes,
    categories,
    settings,
    employees,
    setOrders,
    setExpenses,
    setRevenues
  } = useStore();

  // Estado para dados financeiros externos
  const [externalFinance, setExternalFinance] = useState<any[]>([]);

  // Buscar dados financeiros externos
  useEffect(() => {
    const fetchExternalFinance = async () => {
      try {
        // Adicionar timestamp para evitar cache mobile + forçar refresh
        const timestamp = Date.now();
        const cacheBuster = `?_t=${timestamp}&_v=${Date.now()}`;
        const supabase = createClient();
        const { data, error } = await supabase
          .from('external_finance')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ [OWNER] Erro ao buscar dados externos:', error);
          setExternalFinance([]);
        } else {
          console.log('✅ [OWNER] Dados externos carregados:', data?.length || 0);
          setExternalFinance(data || []);
        }
      } catch (err) {
        console.error('❌ [OWNER] Exceção ao buscar dados externos:', err);
        setExternalFinance([]);
      }
    };

    fetchExternalFinance();
    
    // Forçar refresh a cada 30 segundos para mobile
    const interval = setInterval(fetchExternalFinance, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fallback: Carregar dados da API se store local estiver vazio
  useEffect(() => {
    const hasLocalData = (orders?.length || 0) > 0 || (expenses?.length || 0) > 0 || (revenues?.length || 0) > 0;
    
    if (!hasLocalData && !loadingSupabase) {
      console.log('🔄 Loading data from API (fallback for owner desktop)');
      loadApiData();
    }
  }, [orders, expenses, revenues, loadingSupabase]);

  const loadApiData = async () => {
    setLoadingSupabase(true);
    try {
      const response = await fetch('/api/owner-data');
      const result = await response.json();
      console.log('✅ API Response:', result);

      // Verificar se a API realmente limpou os dados
      if (result.success && result.cleared) {
        console.log('✅ API successfully cleared data:', result.cleared);
        
        // Limpar dados locais
        setSupabaseData({
          orders: [],
          expenses: [],
          dishes: supabaseData.dishes || [],
          categories: supabaseData.categories || []
        });
        
        // Limpar store local também
        setOrders([]);
        setExpenses([]);

        // Forçar reload da página para garantir atualização
        setTimeout(() => {
          console.log('🔄 Forcing page reload to ensure data is cleared...');
          window.location.reload();
        }, 2000);
      } else {
        throw new Error('API failed to clear data properly');
      }
      
      setSupabaseData({
        orders: result.orders || [],
        expenses: result.expenses || [],
        payroll: result.payroll || [],
        dishes: result.dishes || [],
        categories: result.categories || []
      });
      
      console.log('✅ API data loaded for owner desktop:', {
        orders: result.orders?.length || 0,
        expenses: result.expenses?.length || 0,
        dishes: result.dishes?.length || 0,
        categories: result.categories?.length || 0
      });
      
    } catch (error: any) {
      console.error('❌ Error loading API data for owner desktop:', error);
    } finally {
      setLoadingSupabase(false);
    }
  };

  // Função para limpar dados de produção com proteções
  const clearProductionData = async () => {
    // Verificação 1: Tem dados para limpar?
    const hasOrders = (orders?.length || 0) > 0 || (supabaseData.orders?.length || 0) > 0;
    const hasExpenses = (expenses?.length || 0) > 0 || (supabaseData.expenses?.length || 0) > 0;
    
    if (!hasOrders && !hasExpenses) {
      alert('ℹ️ Não há dados de produção para limpar.');
      return;
    }

    // Verificação 2: Confirmação inicial
    const confirm1 = confirm('🔄 Limpar Produção\n\nEsta ação irá limpar todos os pedidos e despesas do período atual.\n\nDeseja continuar?');
    if (!confirm1) return;

    // Verificação 3: Aviso forte
    const confirm2 = confirm('⚠️ ATENÇÃO! ESTA AÇÃO É IRREVERSÍVEL!\n\nTodos os dados de pedidos e despesas serão APAGADOS permanentemente.\n\nÚltima chance: Tem certeza absoluta?');
    if (!confirm2) return;

    try {
      setLoadingSupabase(true);
      
      // Backup automático dos dados
      const backupData = {
        timestamp: new Date().toISOString(),
        orders: currentData.orders,
        expenses: currentData.expenses,
        summary: {
          totalOrders: currentData.orders.length,
          totalExpenses: currentData.expenses.length,
          totalRevenue: currentData.orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0),
          totalExpensesAmount: currentData.expenses.reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0)
        }
      };

      // Salvar backup no localStorage
      localStorage.setItem('production_backup_' + Date.now(), JSON.stringify(backupData));
      
      // Limpar via API (melhorado para usar 'all')
      const response = await fetch('/api/clear-production-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all' })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('✅ Produção limpa com sucesso! Backup salvo automaticamente.');
        
        // Recarregar dados
        setSupabaseData({ orders: [], expenses: [], dishes: [], categories: [] });
        await loadApiData();
        
        // Mostrar resumo no console
        console.log('📦 Backup salvo:', backupData.summary);
      } else {
        throw new Error(result.error || 'Falha ao limpar dados');
      }
      
    } catch (error: any) {
      alert('❌ Erro ao limpar dados de produção: ' + error.message);
      console.error('Error clearing production data:', error);
    } finally {
      setLoadingSupabase(false);
    }
  };

  // Usar dados do store local ou API
  const currentData = {
    orders: (orders?.length || 0) > 0 ? orders : supabaseData.orders,
    expenses: (expenses?.length || 0) > 0 ? expenses : supabaseData.expenses,
    dishes: (dishes?.length || 0) > 0 ? dishes : supabaseData.dishes,
    categories: (categories?.length || 0) > 0 ? categories : supabaseData.categories,
    payroll: supabaseData.payroll || []
  };

  // Usar hook seguro para cálculos dos cards
  const cardCalculations = useSafeCardCalculations(currentData, period);

  // Debug para verificar se dados estão carregados
  useEffect(() => {
    const debugInfo = {
      localOrders: orders?.length || 0,
      localExpenses: expenses?.length || 0,
      localRevenues: revenues?.length || 0,
      localDishes: dishes?.length || 0,
      localcategories: categories?.length || 0,
      apiOrders: supabaseData.orders.length,
      apiExpenses: supabaseData.expenses.length,
      finalOrders: currentData.orders.length,
      finalExpenses: currentData.expenses.length,
      isMobile: typeof window !== 'undefined' ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) : 'SSR'
    };
    
    if (typeof window !== 'undefined') {
      console.log('📊 Owner Debug Info:', debugInfo);
      
      // Mostrar aviso no console se não há dados
      if (debugInfo.localOrders === 0 && debugInfo.localRevenues === 0) {
        console.warn('⚠️ NO SALES DATA FOUND: Orders=0, Revenues=0');
        console.warn('⚠️ CHECK: POS may not be creating revenue records');
      }
    }
  }, [orders, expenses, revenues, dishes, categories, supabaseData.orders.length, supabaseData.expenses.length, currentData.orders.length, currentData.expenses.length]);

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
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalizar para timezone de Luanda
      
      console.log('📊 Owner Stats Debug:', {
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR',
        isMobile: typeof window !== 'undefined' ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) : 'SSR',
        orders: orders?.length || 0,
        revenues: revenues?.length || 0,
        dishes: dishes?.length || 0,
        categories: categories?.length || 0,
        sampleOrders: orders?.slice(0, 2).map(o => ({ id: o.id, total: o.total, itemsCount: o.items?.length || 0 })),
        sampleRevenues: revenues?.slice(0, 2).map(r => ({ id: r.id, amount: r.amount, description: r.description }))
      });
      
      // PRIORIDADE 1: Calcular usando revenues (dados diretos do POS)
      if (revenues && revenues.length > 0) {
        const todayRevenues = revenues.filter((revenue: any) => {
          const revenueDate = new Date(revenue.date instanceof Date ? revenue.date : new Date(revenue.date));
          // Normalizar para timezone de Luanda
          revenueDate.setHours(0, 0, 0, 0);
          return revenueDate.getTime() === today.getTime();
        });
        
        const todaySales = todayRevenues.reduce((sum: number, revenue: any) => {
          return sum + (revenue.amount || 0);
        }, 0);
        
        const totalRevenue = revenues.reduce((sum: number, revenue: any) => {
          return sum + (revenue.amount || 0);
        }, 0);

        // Adicionar dados externos ao total
        const externalTotal = externalFinance.reduce((sum: number, ext: any) => sum + (ext.amount || 0), 0);
        const grandTotal = totalRevenue + externalTotal;
        
        console.log('📊 Using revenues + external for calculations:', {
          todayRevenues: todayRevenues.length,
          todaySales,
          totalRevenue,
          externalTotal,
          grandTotal,
          sample: todayRevenues.slice(0, 2)
        });
        
        return {
          todaySales,
          todayOrders: todayRevenues.length,
          todayRevenue: todaySales * 0.85, // 85% de margem
          activeTables: 0, // Revenues não têm mesas ativas
          totalRevenue: grandTotal, // Incluir dados externos
          totalOrders: revenues.length,
          avgTicket: todayRevenues.length > 0 ? todaySales / todayRevenues.length : 0,
          growth: 0,
          pendingOrders: 0,
          averageTicket: todayRevenues.length > 0 ? todaySales / todayRevenues.length : 0
        };
      }
      
      // PRIORIDADE 2: Fallback para orders (se não houver revenues)
      const todayOrders = currentData.orders.filter((order: any) => {
        const orderDate = new Date(order.created_at || new Date());
        // Normalizar para timezone de Luanda
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
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

      console.log('📊 Using orders for calculations:', {
        todayOrders: todayOrders.length,
        todaySales,
        totalRevenue,
        activeTables
      });

      return {
        todaySales,
        todayOrders: todayOrders.length,
        todayRevenue,
        activeTables,
        totalRevenue,
        totalOrders: currentData.orders.length,
        avgTicket: todayOrders.length > 0 ? todaySales / todayOrders.length : 0,
        growth: 0, // Sem cálculo de crescimento para evitar instabilidade
        pendingOrders: todayOrders.filter((o: any) => o && o.status === 'ABERTO').length,
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
  }, [orders, revenues, externalFinance, currentData.orders]);

  // Combinar transações - PRIORIDADE LOCAL + REVENUES
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
      // Fallback: usar dados da API quando não há pedidos locais
      if ((!orders || orders.length === 0) && supabaseData.orders && supabaseData.orders.length > 0) {
        supabaseData.orders.forEach((order: any) => {
          if (order && order.id) {
            txs.push({
              id: `order-${order.id}`,
              date: order.created_at || new Date().toISOString(),
              description: `Pedido #${order.order_number || 'N/A'}`,
              category: 'Vendas',
              type: 'REVENUE',
              amount: order.total || 0
            });
          }
        });
      }

      // Adicionar revenues do store local (CRÍTICO PARA VENDAS)
      if (revenues && revenues.length > 0) {
        revenues.forEach(revenue => {
          if (revenue && revenue.id) {
            txs.push({
              id: `revenue-${revenue.id}`,
              date: (revenue.date instanceof Date ? revenue.date.toISOString() : revenue.date) || new Date().toISOString(),
              description: revenue.description || 'Receita',
              category: revenue.category || 'Vendas',
              type: 'REVENUE',
              amount: revenue.amount || 0
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
      // Fallback: usar despesas da API quando não há locais
      if ((!expenses || expenses.length === 0) && supabaseData.expenses && supabaseData.expenses.length > 0) {
        supabaseData.expenses.forEach((expense: any) => {
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

      console.log('📊 Combined Transactions:', {
        total: txs.length,
        orders: orders?.length || 0,
        revenues: revenues?.length || 0,
        expenses: expenses?.length || 0,
        sample: txs.slice(0, 3)
      });

      return txs;
    } catch (error) {
      console.error('Error combining transactions:', error);
      return [];
    }
  }, [orders, revenues, expenses, supabaseData.orders, supabaseData.expenses, calculateOrderTotal]);

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
      case 'ANO':
        filterStart = new Date(now.getFullYear(), 0, 1); // 1 de Janeiro
        filterEnd = new Date(now.getFullYear(), 11, 31); // 31 de Dezembro
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
            onClick={clearProductionData}
            disabled={loadingSupabase}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 px-3 py-2 rounded-lg transition-colors text-sm"
            title="Limpar dados de produção (pedidos e despesas)"
          >
            🗑️ Limpar Produção
          </button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
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

        <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-2xl border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-purple-200 text-sm font-medium">Ticket Médio</span>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
          </div>
          <div className="text-3xl font-bold mb-1">{fmt(totals.revenue > 0 && filteredTransactions.filter(t => t.type === 'REVENUE').length > 0 ? totals.revenue / filteredTransactions.filter(t => t.type === 'REVENUE').length : 0)}</div>
          <div className="text-purple-200 text-sm">por pedido ({period.toLowerCase()})</div>
        </div>

        <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 p-6 rounded-2xl border border-cyan-500/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-cyan-200 text-sm font-medium">Crescimento</span>
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
          </div>
          <div className="text-3xl font-bold mb-1">
            {(() => {
              const currentRevenue = totals.revenue;
              let prevRevenue = 0;
              
              if (period === 'HOJE') {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                prevRevenue = orders
                  .filter(o => o.status === 'FECHADO' && new Date(o.createdAt || o.created_at || new Date()).toDateString() === yesterday.toDateString())
                  .reduce((sum, o) => sum + (o.total || 0), 0);
              } else if (period === 'SEMANA') {
                const lastWeek = new Date();
                lastWeek.setDate(lastWeek.getDate() - 7);
                prevRevenue = orders
                  .filter(o => o.status === 'FECHADO' && new Date(o.createdAt || o.created_at || new Date()) >= lastWeek && new Date(o.createdAt || o.created_at || new Date()) < new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000))
                  .reduce((sum, o) => sum + (o.total || 0), 0);
              } else if (period === 'MES') {
                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                prevRevenue = orders
                  .filter(o => o.status === 'FECHADO' && new Date(o.createdAt || o.created_at || new Date()).getMonth() === lastMonth.getMonth())
                  .reduce((sum, o) => sum + (o.total || 0), 0);
              }
              
              const growth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
              return growth >= 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
            })()}
          </div>
          <div className="text-cyan-200 text-sm">vs período anterior</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 p-6 rounded-2xl border border-yellow-500/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-yellow-200 text-sm font-medium">Total Acumulado</span>
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
          </div>
          <div className="text-3xl font-bold mb-1">{fmt((settings.legacyTotalRevenue || 0) + realtimeStats.totalRevenue)}</div>
          <div className="text-yellow-200 text-sm">histórico + atual</div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-6 rounded-2xl border border-orange-500/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-orange-200 text-sm font-medium">Pedidos Pendentes</span>
            <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
          </div>
          <div className="text-3xl font-bold mb-1">{realtimeStats.pendingOrders}</div>
          <div className="text-orange-200 text-sm">Aguardando</div>
        </div>
      </div>

      {/* Período Selector */}
      <div className="bg-gray-900/50 p-6 rounded-2xl border border-white/10 mb-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {(['HOJE', 'SEMANA', 'MES', 'ANO'] as const).map(p => (
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
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-white/10">
          <h3 className="text-xl font-bold mb-4 text-green-400">Receitas</h3>
          <div className="text-3xl font-bold text-green-400">{fmt(totals.revenue)}</div>
          <div className="text-gray-400 text-sm mt-2">{filteredTransactions.filter(t => t.type === 'REVENUE').length} transações</div>
        </div>

        <div className="bg-gray-900/50 p-6 rounded-2xl border border-white/10">
          <h3 className="text-xl font-bold mb-4 text-red-400">Despesas</h3>
          <div className="text-3xl font-bold text-red-400">{cardCalculations.expenses.value}</div>
          <div className="text-gray-400 text-sm mt-2">{filteredTransactions.filter(t => t.type === 'EXPENSE').length} transações</div>
        </div>

        <div className="bg-gray-900/50 p-6 rounded-2xl border border-white/10">
          <h3 className="text-xl font-bold mb-4 text-red-500">Folha Salarial</h3>
          <div className="text-3xl font-bold text-red-500">{cardCalculations.payroll.value}</div>
          <div className="text-gray-400 text-sm mt-2">{employees?.length || 0} funcionários</div>
        </div>

        <div className="bg-gray-900/50 p-6 rounded-2xl border border-white/10">
          <h3 className="text-xl font-bold mb-4 text-indigo-400">Impostos</h3>
          <div className="text-3xl font-bold text-indigo-500">{cardCalculations.tax.value}</div>
          <div className="text-gray-400 text-sm mt-2">6.5% sobre faturação</div>
        </div>

        <div className="bg-gray-900/50 p-6 rounded-2xl border border-white/10">
          <h3 className="text-xl font-bold mb-4 text-amber-400">Vendas Totais</h3>
          <div className="text-3xl font-bold text-amber-400">{fmt(realtimeStats.totalRevenue)}</div>
          <div className="text-gray-400 text-sm mt-2">todas as vendas atuais</div>
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

