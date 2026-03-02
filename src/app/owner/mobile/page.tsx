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

  // Fallback: Carregar dados da API se store local estiver vazio
  useEffect(() => {
    const hasLocalData = (orders?.length || 0) > 0 || (expenses?.length || 0) > 0;
    
    if (!hasLocalData && !loadingSupabase) {
      console.log('🔄 Loading data from API (fallback for owner mobile)');
      loadApiData();
    }
  }, [orders, expenses, loadingSupabase]);


  const loadApiData = async () => {
    setLoadingSupabase(true);
    try {
      console.log('🔄 Starting API call to /api/owner-data');
      
      const response = await fetch('/api/owner-data');
      const data = await response.json();
      
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
      console.log('🔍 Mobile Debug: Before setSupabaseData - orders:', supabaseData.orders.length);
      console.log('🔍 Mobile Debug: Before setSupabaseData - expenses:', supabaseData.expenses.length);
      
      setSupabaseData({
        orders: finalOrders,
        expenses: finalExpenses,
        payroll: data.payroll || [],
        dishes: data.dishes || [],
        categories: data.categories || []
      });
      
      // Forçar re-renderização
      setForceUpdate(prev => prev + 1);
      
      // Debug depois de setar estado
      setTimeout(() => {
        console.log('🔍 Mobile Debug: After setSupabaseData - orders:', supabaseData.orders.length);
        console.log('🔍 Mobile Debug: After setSupabaseData - expenses:', supabaseData.expenses.length);
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

  // Função de Reset de Produção com Proteções e Debug
  const handleResetProduction = async () => {
    console.log('🔄 ===== RESET PRODUCTION DEBUG START =====');
    console.log('🔄 Current Data Before Reset:', {
      localOrders: orders?.length || 0,
      localExpenses: expenses?.length || 0,
      apiOrders: supabaseData.orders?.length || 0,
      apiExpenses: supabaseData.expenses?.length || 0,
      finalOrders: currentData.orders?.length || 0,
      finalExpenses: currentData.expenses?.length || 0
    });
    
    // Verificação 1: Tem dados para resetar?
    const hasOrders = (orders?.length || 0) > 0 || (supabaseData.orders?.length || 0) > 0;
    const hasExpenses = (expenses?.length || 0) > 0 || (supabaseData.expenses?.length || 0) > 0;
    
    console.log('🔄 Reset Check:', { hasOrders, hasExpenses });
    
    if (!hasOrders && !hasExpenses) {
      console.log('🔄 Reset Cancelled: No data to clear');
      alert('ℹ️ Não há dados de produção para limpar.');
      return;
    }

    // Verificação 2: Confirmação inicial
    const confirm1 = confirm('🔄 Resetar Produção\n\nEsta ação irá limpar todos os pedidos e despesas do período atual.\n\nDeseja continuar?');
    if (!confirm1) {
      console.log('🔄 Reset Cancelled: User confirmation 1');
      return;
    }

    // Verificação 3: Aviso forte
    const confirm2 = confirm('⚠️ ATENÇÃO! ESTA AÇÃO É IRREVERSÍVEL!\n\nTodos os dados de pedidos e despesas serão APAGADOS permanentemente.\n\nÚltima chance: Tem certeza absoluta?');
    if (!confirm2) {
      console.log('🔄 Reset Cancelled: User confirmation 2');
      return;
    }

    console.log('🔄 Reset Confirmed: Starting clear process...');
    setIsResetting(true);
    
    try {
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

      // Limpar dados via API
      const response = await fetch('/api/clear-production-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao limpar dados de produção');
      }

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

        // Forçar reload completo dos dados
        setForceUpdate(prev => prev + 1);
        
        // Forçar reload da página para garantir atualização
        setTimeout(() => {
          console.log('🔄 Forcing page reload to ensure data is cleared...');
          window.location.reload();
        }, 2000);
      } else {
        throw new Error('API failed to clear data properly');
      }

      // Notificação de sucesso
      if (addNotification) {
        addNotification('success', '✅ Produção resetada com sucesso! Backup salvo automaticamente.');
      } else {
        alert('✅ Produção resetada com sucesso! Backup salvo automaticamente.');
      }
      
      // Mostrar resumo do backup
      console.log('📦 Backup salvo:', backupData.summary);
      
    } catch (error: any) {
      console.error('❌ Error resetting production:', error);
      
      // Notificação de erro
      const errorMessage = `❌ Falha ao resetar produção: ${error.message}`;
      if (addNotification) {
        addNotification('error', errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsResetting(false);
    }
  };

  // Usar dados da API diretamente - sem lógica complexa
  const currentData = {
    orders: supabaseData.orders || [],
    expenses: supabaseData.expenses || [],
    payroll: supabaseData.payroll || [],
    dishes: supabaseData.dishes || [],
    categories: supabaseData.categories || []
  };

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

  // Debug para verificar dados reais
  useEffect(() => {
    const debugInfo = {
      // Store local
      localOrders: orders?.length || 0,
      localExpenses: expenses?.length || 0,
      localDishes: dishes?.length || 0,
      localCategories: categories?.length || 0,
      
      // API data
      apiOrders: supabaseData.orders?.length || 0,
      apiExpenses: supabaseData.expenses?.length || 0,
      apiDishes: supabaseData.dishes?.length || 0,
      apiCategories: supabaseData.categories?.length || 0,
      
      // Final data being used
      finalOrders: currentData.orders?.length || 0,
      finalExpenses: currentData.expenses?.length || 0,
      
      // Card calculations
      cardCalculations: cardCalculations,
      
      // Environment
      isMobile: true,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR',
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 ===== OWNER MOBILE DEBUG =====');
    console.log('📊 Store Local:', {
      orders: debugInfo.localOrders,
      expenses: debugInfo.localExpenses,
      dishes: debugInfo.localDishes,
      categories: debugInfo.localCategories
    });
    
    console.log('📊 API Data:', {
      orders: debugInfo.apiOrders,
      expenses: debugInfo.apiExpenses,
      dishes: debugInfo.apiDishes,
      categories: debugInfo.apiCategories
    });
    
    console.log('📊 Final Data Used:', {
      orders: debugInfo.finalOrders,
      expenses: debugInfo.finalExpenses
    });
    
    console.log('📊 Card Calculations:', cardCalculations);
    console.log('📊 ======================================');
    
    // Mostrar debug visual na página
    const debugElement = document.getElementById('mobile-debug');
    if (debugElement) {
      debugElement.innerHTML = `
        <div style="position: fixed; top: 10px; left: 10px; background: red; color: white; padding: 10px; z-index: 9999; font-size: 12px; max-width: 300px;">
          <h4>📱 MOBILE DEBUG</h4>
          <div>Local: O(${debugInfo.localOrders}) E(${debugInfo.localExpenses})</div>
          <div>API: O(${debugInfo.apiOrders}) E(${debugInfo.apiExpenses})</div>
          <div>Final: O(${debugInfo.finalOrders}) E(${debugInfo.finalExpenses})</div>
          <div>Time: ${new Date().toLocaleTimeString()}</div>
        </div>
      `;
    }
  }, [orders, expenses, dishes, categories, supabaseData, cardCalculations]);

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
    if (!currentData.orders || currentData.orders.length === 0) {
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
      return orderDate >= today;
    });

    const todaySales = todayOrders.reduce((sum: number, order: any) => {
      return sum + calculateOrderTotal(order);
    }, 0);

    const totalRevenue = currentData.orders.reduce((sum: number, order: any) => {
      return sum + calculateOrderTotal(order);
    }, 0);

    // Contar mesas ativas (orders que não estão fechadas)
    const activeTables = currentData.orders.filter((order: any) => 
      order.status !== 'closed' && order.status !== 'paid'
    ).length;

    return {
      todaySales,
      todayOrders: todayOrders.length,
      activeTables,
      totalRevenue
    };
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
          <button
            onClick={() => {
              localStorage.removeItem('owner_mobile_authenticated');
              localStorage.removeItem('owner_mobile_user');
              localStorage.removeItem('owner_mobile_login_time');
              router.push('/owner/mobile/login');
            }}
            className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-all"
          >
            <LogOut size={18} />
          </button>
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
            <div className="text-xl font-bold mb-1">{fmt(realtimeStats.todaySales)}</div>
            <div className="text-green-200 text-xs">{realtimeStats.todayOrders} pedidos</div>
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
            <div className="text-xl font-bold mb-1">{cardCalculations.expenses.value}</div>
            <div className="text-red-200 text-xs">{period.toLowerCase()}</div>
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
