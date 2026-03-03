'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { 
  Smartphone, 
  Users, 
  DollarSign, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  LogOut,
  TrendingUp,
  Trash2,
  AlertTriangle,
  Wallet
} from 'lucide-react';
import { useSafeCardCalculations } from '@/utils/cardCalculations';

export default function OwnerMobilePage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [period, setPeriod] = useState<'HOJE' | 'SEMANA' | 'MES' | 'ANO'>('HOJE');
  const [version, setVersion] = useState(Date.now()); // Forçar refresh
  const [supabaseData, setSupabaseData] = useState<any>({
    orders: [],
    expenses: [],
    payroll: [],
    dishes: [],
    categories: []
  });
  const [loadingSupabase, setLoadingSupabase] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  
  // Dados em tempo real do store local (SQLite)
  const { 
    orders, 
    expenses,
    dishes,
    categories,
    addNotification,
    settings,
    employees,
    payroll,
    setOrders,
    setExpenses
  } = useStore();

  // Debug inicial para mostrar dados salvos do reset
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDebug = localStorage.getItem('reset_debug_info');
      if (savedDebug) {
        console.log('🔍 ===== SAVED RESET DEBUG =====');
        console.log('🔍 Debug Info:', JSON.parse(savedDebug));
        console.log('🔍 ===========================');
        localStorage.removeItem('reset_debug_info');
      }
    }
  }, []);

  // Mobile: SEMPRE carregar da API para dados em tempo real de qualquer dispositivo
  useEffect(() => {
    console.log('📱 Mobile: Loading fresh data from API for cross-device consistency');
    loadApiData();
  }, []);

  // Auto-refresh a cada 30 segundos para dados em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh: Buscando novos dados...');
      loadApiData();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, []);

  // Recarregar quando forceUpdate mudar (mas apenas se for > 1)
  useEffect(() => {
    if (forceUpdate > 1) {
      console.log('📱 Mobile: Force update triggered, reloading API...');
      loadApiData();
    }
  }, [forceUpdate]);

  const loadApiData = async () => {
    setLoadingSupabase(true);
    try {
      console.log('🔄 Starting API call to /api/owner-data');
      
      const response = await fetch('/api/owner-data/test-route');
      const data = await response.json();
      
      console.log('🔍 DEBUG API RESPONSE:', data);
      console.log('🔍 API ORDERS:', data.orders?.length || 0);
      console.log('🔍 API EXPENSES:', data.expenses?.length || 0);
      
      // Se houver erro na API, mostrar mensagem clara
      if (data.error) {
        console.error('❌ API returned error:', data.error);
        alert(`❌ Erro na API: ${data.error}\n\nPor favor, verifique a conexão com o Supabase.`);
        return;
      }
      
      // Se for dados de teste (emergency), mostrar alerta
      if (data.emergency) {
        console.error('❌ Mobile is receiving TEST DATA instead of REAL data!');
        alert('❌ ATENÇÃO: O mobile está a receber dados de teste em vez de dados reais!\n\nPor favor, limpe o cache e tente novamente.');
        return;
      }
      
      // Usar APENAS dados reais
      const finalOrders = data.orders || [];
      const finalExpenses = data.expenses || [];
      
      console.log('🔍 Mobile Debug: Using ONLY REAL data');
      console.log('🔍 Mobile Debug: Final orders count:', finalOrders.length);
      console.log('🔍 Mobile Debug: Final expenses count:', finalExpenses.length);
      
      // Debug antes de setar estado
      console.log('🔍 DEBUG ANTES DE SETAR ESTADO:', {
        currentSupabaseOrders: supabaseData.orders?.length || 0,
        currentSupabaseExpenses: supabaseData.expenses?.length || 0,
        newOrders: finalOrders.length,
        newExpenses: finalExpenses.length
      });
      
      setSupabaseData({
        orders: finalOrders,
        expenses: finalExpenses,
        payroll: data.payroll || [],
        dishes: data.dishes || [],
        categories: data.categories || []
      });
      
      // Debug depois de setar estado
      setTimeout(() => {
        console.log('🔍 DEBUG DEPOIS DE SETAR ESTADO:', {
          supabaseOrders: supabaseData.orders?.length || 0,
          supabaseExpenses: supabaseData.expenses?.length || 0
        });
      }, 1000);
      
      console.log('✅ REAL data loaded for mobile:', {
        orders: finalOrders.length,
        expenses: finalExpenses.length
      });
      
    } catch (error: any) {
      console.error('❌ Error loading API data for mobile:', error);
      console.error('❌ Error details:', error.message);
      alert(`❌ Erro ao carregar dados: ${error.message}`);
    } finally {
      setLoadingSupabase(false);
    }
  };

  // Função de Reset COM TRUNCATE DIRETO NO BANCO
  const handleResetProduction = async () => {
    const confirm1 = confirm('Resetar Produção\n\nLIMPAR TUDO do banco de dados?\n\nDeseja continuar?');
    if (!confirm1) return;
    
    const confirm2 = confirm('ATENÇÃO! Isso vai APAGAR TUDO do banco!\n\nTem certeza absoluta?');
    if (!confirm2) return;
    
    setIsResetting(true);
    
    try {
      console.log('🔥 INICIANDO LIMPEZA COMPLETA DO BANCO DE DADOS...');
      
      // 1. LIMPAR DIRETO NO BANCO via RPC com SERVICE ROLE KEY
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Config Supabase ausente');
      }
      
      console.log('🔑 Using NEXT_PUBLIC_SUPABASE_SERVICE_ROLE KEY for full permissions');
      console.log('🔑 URL:', supabaseUrl);
      console.log('🔑 Key:', supabaseKey.substring(0, 20) + '...');
      
      // Criar cliente admin com SERVICE ROLE KEY
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
      
      // EXECUTAR TRUNCATE DIRETO NO BANCO
      console.log('🔥 Executando TRUNCATE no banco...');
      const { data, error } = await supabaseAdmin.rpc('clear_all_production_data');
      
      if (error) {
        console.error('❌ Erro no RPC:', error);
        throw new Error(`Erro no banco: ${error.message}`);
      }
      
      console.log('✅ Banco limpo:', data);
      
      // 2. Limpar estado local
      setSupabaseData({ orders: [], expenses: [], payroll: [], dishes: [], categories: [] });
      setOrders([]);
      setExpenses([]);
      
      // FORÇAR ATUALIZAÇÃO DO CURRENTDATA
      console.log('🔄 Forcing currentData update...');
      
      // SALVAR DEBUG NO LOCALSTORAGE PARA VER DEPOIS DO REFRESH
      if (typeof window !== 'undefined' && window.localStorage) {
        const debugInfo = {
          beforeReset: {
            supabaseOrders: supabaseData.orders?.length || 0,
            supabaseExpenses: supabaseData.expenses?.length || 0,
            storeOrders: orders?.length || 0,
            storeExpenses: expenses?.length || 0
          },
          afterClear: {
            supabaseOrders: supabaseData.orders?.length || 0,
            supabaseExpenses: supabaseData.expenses?.length || 0,
            storeOrders: orders?.length || 0,
            storeExpenses: expenses?.length || 0
          },
          realtimeStats: {
            currentDataOrders: currentData.orders?.length || 0,
            calculatedTotalRevenue: currentData.orders?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0
          },
          settings: {
            legacyTotalRevenue: settings?.legacyTotalRevenue || 0
          }
        };
        
        try {
          window.localStorage.setItem('reset_debug_info', JSON.stringify(debugInfo));
          console.log('💾 Debug info saved to localStorage');
        } catch (e) {
          console.warn('⚠️ Erro ao salvar debug info:', e);
        }
      }
      
      setTimeout(() => {
        console.log('🔄 CurrentData after timeout:', supabaseData);
      }, 100);
      
      // 3. LIMPAR SETTINGS TAMBÉM - O PROBLEMA REAL!
      try {
        const { useStore } = await import('@/store/useStore');
        const store = useStore.getState();
        if (store.updateSettings) {
          store.updateSettings({
            legacyTotalRevenue: 0,
            totalRevenue: 0,
            totalExpenses: 0,
            totalOrders: 0
          });
          console.log('🧹 Settings limpos também!');
        }
      } catch (e) {
        console.log('Não foi possível limpar settings:', e);
      }
      
      // 4. LIMPAR TUDO DO LOCALSTORAGE
      if (typeof window !== 'undefined') {
        console.log('🧹 Limpando localStorage completamente...');
        const keysToRemove: string[] = [];
        
        // Verificar se localStorage está disponível
        try {
          if (window.localStorage) {
            for (let i = 0; i < window.localStorage.length; i++) {
              const key = window.localStorage.key(i);
              if (key && (key.includes('tasca') || key.includes('supabase') || key.includes('owner'))) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => window.localStorage.removeItem(key));
          }
          if (window.sessionStorage) {
            window.sessionStorage.clear();
          }
        } catch (e) {
          console.warn('⚠️ Erro ao limpar localStorage:', e);
        }
      }
      
      // 5. Forçar reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Erro no reset:', error);
      alert(`❌ Erro: ${error.message}`);
      setIsResetting(false);
    }
  };

  // Mobile: SEMPRE usar dados da API para consistência entre dispositivos
  const currentData = useMemo(() => ({
    orders: supabaseData.orders || [],
    expenses: supabaseData.expenses || [],
    dishes: supabaseData.dishes || [],
    categories: supabaseData.categories || [],
    payroll: supabaseData.payroll || []
  }), [supabaseData]);

  // Usar hook seguro para cálculos dos cards
  const cardCalculations = useSafeCardCalculations(currentData, period);

  // Debug para verificar qual fonte de dados está sendo usada
  useEffect(() => {
    console.log('📊 Mobile Data Source Debug:', {
      hasLocalOrders: (orders?.length || 0) > 0,
      hasLocalExpenses: (expenses?.length || 0) > 0,
      usingLocalOrders: (orders?.length || 0) > 0,
      usingLocalExpenses: (expenses?.length || 0) > 0,
      finalOrdersCount: currentData.orders.length,
      finalExpensesCount: currentData.expenses.length,
      supabaseOrdersCount: supabaseData.orders.length,
      supabaseExpensesCount: supabaseData.expenses.length
    });
  }, [orders, expenses, supabaseData.orders, supabaseData.expenses]);

  // Debug para cards de despesas e folha salarial
  useEffect(() => {
    console.log('💰 ===== CARDS DEBUG =====');
    console.log('💰 Card Calculations:', cardCalculations);
    console.log('💰 Expenses Card:', {
      value: cardCalculations.expenses.value,
      label: cardCalculations.expenses.label,
      description: cardCalculations.expenses.description
    });
    console.log('💰 Payroll Card:', {
      value: cardCalculations.payroll.value,
      label: cardCalculations.payroll.label,
      description: cardCalculations.payroll.description
    });
    console.log('💰 Current Data:', {
      expensesCount: currentData.expenses?.length || 0,
      payrollCount: currentData.payroll?.length || 0,
      expensesData: currentData.expenses,
      payrollData: currentData.payroll
    });
    
    // Debug detalhado dos campos
    if (currentData.expenses && currentData.expenses.length > 0) {
      console.log('💰 Expenses Details:', currentData.expenses.map((e: any, i: number) => ({
        index: i,
        id: e.id,
        amount: e.amount,
        value: e.value,
        description: e.description,
        date: e.date
      })));
    }
    
    if (currentData.payroll && currentData.payroll.length > 0) {
      console.log('💰 Payroll Details:', currentData.payroll.map((p: any, i: number) => ({
        index: i,
        id: p.id,
        netSalary: p.net_salary,
        netSalary2: p.netSalary,
        amount: p.amount,
        baseSalary: p.base_salary,
        employee: p.employee_id || p.employee
      })));
    }
    
    console.log('💰 =======================');
  }, [cardCalculations, currentData]);

  // Verificar autenticação mobile
  useEffect(() => {
    const isAuth = localStorage.getItem('owner_mobile_authenticated') === 'true';
    
    console.log('🔐 Owner Mobile auth check:', { 
      localStorage: localStorage.getItem('owner_mobile_authenticated'), 
      isAuth
    });
    
    if (isAuth) {
      console.log('✅ Auth OK, staying on mobile page');
      setAuthChecking(false);
    } else {
      console.log('🚫 Not authenticated, redirecting to mobile login...');
      router.push('/owner/mobile/login');
    }
  }, [router]);

  // Função para calcular total da order com fallback
  const calculateOrderTotal = (order: any) => {
    if (order.total && order.total > 0) {
      return order.total;
    }
    
    // Fallback: calcular dos itens
    if (order.items && order.items.length > 0) {
      return order.items.reduce((sum: number, item: any) => {
        return sum + (item.price || 0) * (item.quantity || 0);
      }, 0);
    }
    
    return 0;
  };

  // Estatísticas em tempo real
  const realtimeStats = useMemo(() => {
    console.log('📊 ===== REALTIME STATS DEBUG =====');
    console.log('📊 Current Orders:', currentData.orders);
    console.log('📊 Orders Count:', currentData.orders?.length || 0);
    console.log('📊 SupabaseData Orders:', supabaseData.orders?.length || 0);
    console.log('📊 Store Orders:', orders?.length || 0);
    
    if (!currentData.orders || currentData.orders.length === 0) {
      console.log('📊 No orders found, returning zeros');
      return {
        todaySales: 0,
        todayOrders: 0,
        activeTables: 0,
        totalRevenue: 0
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = currentData.orders.filter((order: any) => {
      const orderDate = new Date(order.created_at || new Date());
      const isToday = orderDate >= today;
      console.log('📊 Order Date Check:', {
        orderId: order.id,
        orderDate: orderDate.toISOString(),
        today: today.toISOString(),
        isToday: isToday,
        orderTotal: order.total
      });
      return isToday;
    });

    console.log('📊 Today Orders:', todayOrders.length);
    console.log('📊 Today Orders Data:', todayOrders);

    const todaySales = todayOrders.reduce((sum: number, order: any) => {
      const orderTotal = calculateOrderTotal(order);
      console.log('📊 Order Total Calculation:', {
        orderId: order.id,
        orderTotal: orderTotal,
        runningSum: sum + orderTotal
      });
      return sum + orderTotal;
    }, 0);

    const totalRevenue = currentData.orders.reduce((sum: number, order: any) => {
      return sum + calculateOrderTotal(order);
    }, 0);

    console.log('📊 CALCULATED VALUES:', {
      todaySales,
      totalRevenue,
      ordersLength: currentData.orders.length
    });

    // Contar mesas ativas (orders que não estão fechadas)
    const activeTables = currentData.orders.filter((order: any) => 
      order.status !== 'closed' && order.status !== 'paid'
    ).length;

    const result = {
      todaySales,
      todayOrders: todayOrders.length,
      activeTables,
      totalRevenue
    };

    console.log('📊 Final Realtime Stats:', result);
    console.log('📊 ===============================');
    
    return result;
  }, [currentData.orders]);

  // Combinar transações (orders + expenses)
  const combinedTransactions = useMemo(() => {
    const txs: any[] = [];
    
    try {
      // Adicionar orders como transações de revenue
      if (currentData.orders && currentData.orders.length > 0) {
        currentData.orders.forEach((order: any) => {
          if (order && order.id) {
            txs.push({
              id: `order-${order.id}`,
              date: order.created_at || new Date().toISOString(),
              description: `Mesa ${order.tableId || 'N/A'}`,
              category: 'Vendas',
              type: 'REVENUE',
              amount: calculateOrderTotal(order)
            });
          }
        });
      }
      
      // Adicionar expenses como transações
      if (currentData.expenses && currentData.expenses.length > 0) {
        currentData.expenses.forEach((expense: any) => {
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
  }, [currentData.orders, currentData.expenses]);

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

  // Função para formatar valores
  const fmt = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(value || 0);
  };

  // Renderizar dashboard mobile
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Debug Visual */}
      <div id="mobile-debug" />
      
      {/* Debug Visual para Reset */}
      <div id="mobile-reset-debug" className="fixed top-32 left-2 bg-orange-500 text-black p-2 z-50 text-xs max-w-xs hidden">
        <h4 className="font-bold">🔄 RESET DEBUG</h4>
        <div id="reset-debug-content">Aguardando reset...</div>
      </div>
      
      {/* Debug Visual para Cards */}
      <div id="mobile-cards-debug" className="fixed top-48 left-2 bg-blue-500 text-white p-2 z-50 text-xs max-w-xs">
        <h4 className="font-bold">💰 CARDS DEBUG</h4>
        <div id="cards-debug-content">
          <div>Vendas: {fmt(realtimeStats.todaySales)}</div>
          <div>Pedidos: {realtimeStats.todayOrders}</div>
          <div>Despesas: {cardCalculations.expenses.value}</div>
          <div>Folha: {cardCalculations.payroll.value}</div>
        </div>
      </div>
      
      {/* Debug Visual para Mobile */}
      <div id="mobile-auth-debug"></div>
      
      {/* Header Mobile */}
      <div className="bg-slate-900 border-b border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Owner Mobile</h1>
              <p className="text-xs text-slate-400">Dashboard em tempo real</p>
            </div>
          </div>
          <div className="flex gap-2">
            {/* BOTÃO DE REFRESH MANUAL */}
            <button
              onClick={() => {
                console.log('🔄 Manual refresh triggered');
                loadApiData();
              }}
              className="p-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
              title="Atualizar dados"
            >
              <TrendingUp size={18} />
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('owner_mobile_authenticated');
                localStorage.removeItem('owner_mobile_user');
                localStorage.removeItem('owner_mobile_login_time');
                router.push('/owner/mobile/login');
              }}
              className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-all"
              title="Sair do sistema"
              aria-label="Sair do sistema"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {(['HOJE', 'SEMANA', 'MES', 'ANO'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                period === p 
                  ? 'bg-primary text-black' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* KPIs Mobile */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-green-600 to-green-800 p-4 rounded-2xl border border-green-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-200 text-xs font-medium">Vendas Hoje</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="text-xl font-bold mb-1">{fmt(realtimeStats.todaySales)} 📊</div>
            <div className="text-green-200 text-xs">{realtimeStats.todayOrders} pedidos (Total: {currentData.orders?.length || 0})</div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-4 rounded-2xl border border-blue-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-200 text-xs font-medium">Mesas Ativas</span>
              <Users size={16} className="text-blue-400" />
            </div>
            <div className="text-xl font-bold mb-1">{realtimeStats.activeTables}</div>
            <div className="text-blue-200 text-xs">em atendimento</div>
          </div>

          <div className="bg-gradient-to-br from-amber-600 to-amber-800 p-4 rounded-2xl border border-amber-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-amber-200 text-xs font-medium">Vendas Atuais</span>
              <TrendingUp size={16} className="text-amber-400" />
            </div>
            <div className="text-xl font-bold mb-1">{fmt(realtimeStats.totalRevenue)}</div>
            <div className="text-amber-200 text-xs">todas as vendas</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 p-4 rounded-2xl border border-yellow-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-200 text-xs font-medium">Total Acumulado</span>
              <TrendingUp size={16} className="text-yellow-400" />
            </div>
            <div className="text-xl font-bold mb-1">{fmt((settings?.legacyTotalRevenue || 0) + realtimeStats.totalRevenue)}</div>
            <div className="text-yellow-200 text-xs">histórico + atual</div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-4 rounded-2xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-200 text-xs font-medium">Receita Total</span>
              <DollarSign size={16} className="text-purple-400" />
            </div>
            <div className="text-xl font-bold mb-1">{fmt(totals.revenue)}</div>
            <div className="text-purple-200 text-xs">{period.toLowerCase()}</div>
          </div>

          <div className="bg-gradient-to-br from-red-600 to-red-800 p-4 rounded-2xl border border-red-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-200 text-xs font-medium">Despesas</span>
              <TrendingDown size={16} className="text-red-400" />
            </div>
            <div className="text-xl font-bold mb-1">{cardCalculations.expenses.value} 📊</div>
            <div className="text-red-200 text-xs">{period.toLowerCase()} (Total: {currentData.expenses?.length || 0})</div>
          </div>

          <div className="bg-gradient-to-br from-red-600 to-red-800 p-4 rounded-2xl border border-red-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-200 text-xs font-medium">Folha Salarial</span>
              <Wallet size={16} className="text-red-400" />
            </div>
            <div className="text-xl font-bold mb-1">{cardCalculations.payroll.value}</div>
            <div className="text-red-200 text-xs">total líquido</div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-4 rounded-2xl border border-indigo-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-indigo-200 text-xs font-medium">Impostos</span>
              <TrendingUp size={16} className="text-indigo-400" />
            </div>
            <div className="text-xl font-bold mb-1">{cardCalculations.tax.value}</div>
            <div className="text-indigo-200 text-xs">6.5% sobre faturação</div>
          </div>
        </div>

        {/* Top Produtos do Período */}
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white">Top Produtos</h4>
            <span className="text-xs text-slate-400">{period.toLowerCase()}</span>
          </div>
          <div className="space-y-2">
            {(() => {
              const productCounts: Record<string, number> = {};
              filteredTransactions
                .filter(t => t.type === 'REVENUE')
                .forEach(tx => {
                  // Extrair produtos do pedido (simplificado)
                  const order = orders.find(o => o.id === tx.id?.replace('order-', ''));
                  if (order?.items) {
                    order.items.forEach((item: any) => {
                      const productName = item.dish?.name || item.name || 'Desconhecido';
                      productCounts[productName] = (productCounts[productName] || 0) + (item.quantity || 1);
                    });
                  }
                });
              
              return Object.entries(productCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([name, count], idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
                    <span className="text-xs text-white truncate flex-1">{name}</span>
                    <span className="text-xs font-bold text-primary">{count}x</span>
                  </div>
                ));
            })()}
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
          <div className="text-xs text-slate-400 font-mono">
            <div>Orders: {orders?.length || 0}</div>
            <div>Expenses: {expenses?.length || 0}</div>
            <div>Payroll: {payroll?.length || 0}</div>
            <button 
              onClick={() => router.push('/owner')}
              className="text-slate-400 hover:text-slate-300 text-sm transition-colors mt-2"
            >
              ← Versão Desktop
            </button>
          </div>
        </div>

        {/* Reset Production Data Button */}
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
          <h4 className="text-sm font-bold text-white mb-3">Reset de Produção</h4>
          <p className="text-xs text-slate-400 mb-4">
            Limpa todos os dados do período atual para começar nova produção
          </p>
          <button
            onClick={handleResetProduction}
            disabled={isResetting}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all ${
              isResetting 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-600/30'
            }`}
          >
            {isResetting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Resetando...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Trash2 size={16} />
                Resetar Dados de Produção
              </div>
            )}
          </button>
          
          <p className="text-xs text-slate-500 mt-2 text-center">
            ⚠️ Esta ação é irreversível
          </p>
        </div>
      </div>
    </div>
  );
}
