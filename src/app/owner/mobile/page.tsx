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

export default function OwnerMobilePage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [period, setPeriod] = useState<'HOJE' | 'SEMANA' | 'MES'>('HOJE');
  const [version, setVersion] = useState(Date.now()); // Forçar refresh
  const [supabaseData, setSupabaseData] = useState<any>({
    orders: [],
    expenses: [],
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
    
    console.log('📱 Data Check Effect:', {
      hasLocalData,
      ordersLength: orders?.length || 0,
      expensesLength: expenses?.length || 0,
      loadingSupabase,
      shouldLoad: !hasLocalData && !loadingSupabase
    });
    
    // MOBILE: Sempre carregar API para garantir dados atualizados
    if (!loadingSupabase) {
      console.log('🔄 Mobile: Forcing API reload for fresh data...');
      loadApiData();
    }
  }, [loadingSupabase]); // Removido orders/expenses para não criar loop

  // MOBILE: Forçar carregamento inicial da API
  useEffect(() => {
    console.log('📱 Mobile Initial Load: Starting API data load...');
    if (!loadingSupabase) {
      loadApiData();
    }
  }, []); // Executa apenas uma vez no mount


  const loadApiData = async () => {
    setLoadingSupabase(true);
    try {
      console.log('🔄 Starting API call to /api/owner-data');
      
      // FORÇAR APENAS API ORIGINAL COM DADOS REAIS
      const timestamp = new Date().getTime();
      const random = Math.random().toString(36).substring(7);
      const url = `/api/owner-data?t=${timestamp}&v=${random}&force=true&version=${version}`;
      
      console.log('🔍 Mobile Debug: Fetching REAL API URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Force-Refresh': 'true'
        }
      });
      
      console.log('🔍 Mobile Debug: Response status:', response.status);
      console.log('🔍 Mobile Debug: Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('🔍 Mobile Debug: RAW API Response:', data);
      console.log('🔍 Mobile Debug: Response has error?', !!data.error);
      console.log('🔍 Mobile Debug: Response has orders?', !!data.orders);
      console.log('🔍 Mobile Debug: Orders count:', data.orders?.length || 0);
      console.log('🔍 Mobile Debug: Expenses count:', data.expenses?.length || 0);
      console.log('🔍 Mobile Debug: Is emergency data?', !!data.emergency);
      
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

  // Função de Reset de Produção com Proteções
  const handleResetProduction = async () => {
    // Verificação 1: Tem dados para resetar?
    const hasOrders = (orders?.length || 0) > 0 || (supabaseData.orders?.length || 0) > 0;
    const hasExpenses = (expenses?.length || 0) > 0 || (supabaseData.expenses?.length || 0) > 0;
    
    if (!hasOrders && !hasExpenses) {
      alert('ℹ️ Não há dados de produção para limpar.');
      return;
    }

    // Verificação 2: Confirmação inicial
    const confirm1 = confirm('🔄 Resetar Produção\n\nEsta ação irá limpar todos os pedidos e despesas do período atual.\n\nDeseja continuar?');
    if (!confirm1) return;

    // Verificação 3: Aviso forte
    const confirm2 = confirm('⚠️ ATENÇÃO! ESTA AÇÃO É IRREVERSÍVEL!\n\nTodos os dados de pedidos e despesas serão APAGADOS permanentemente.\n\nÚltima chance: Tem certeza absoluta?');
    if (!confirm2) return;

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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao limpar dados de produção');
      }

      // Limpar dados locais
      setSupabaseData({
        orders: [],
        expenses: [],
        dishes: [],
        categories: []
      });
      
      // Limpar store local também
      setOrders([]);
      setExpenses([]);

      // Forçar reload dos dados
      setForceUpdate(prev => prev + 1);

      addNotification('success', '✅ Produção resetada com sucesso! Backup salvo automaticamente.');
      
      // Mostrar resumo do backup
      console.log('📦 Backup salvo:', backupData.summary);
      
    } catch (error: any) {
      console.error('❌ Error resetting production:', error);
      alert(`❌ Falha ao resetar produção: ${error.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  // Usar dados da API diretamente - sem lógica complexa
  const currentData = {
    orders: supabaseData.orders || [],
    expenses: supabaseData.expenses || [],
    dishes: supabaseData.dishes || [],
    categories: supabaseData.categories || []
  };

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
      isMobile: true,
      loadingSupabase
    };
    
    console.log('📊 Owner Mobile Data Debug:', debugInfo);
    console.log('📊 Mobile Final Data:', {
      ordersCount: currentData.orders.length,
      expensesCount: currentData.expenses.length,
      ordersSource: (orders?.length || 0) > 0 ? 'STORE' : 'API',
      expensesSource: (expenses?.length || 0) > 0 ? 'STORE' : 'API'
    });
  }, [orders, expenses, dishes, categories, supabaseData]);

  // Verificar autenticação mobile
  useEffect(() => {
    // Timeout para evitar loop infinito
    const timeout = setTimeout(() => {
      console.log('� Auth timeout - forcing redirect to mobile login');
      router.push('/owner/mobile/login');
    }, 3000); // 3 segundos timeout
    
    const isAuth = localStorage.getItem('owner_mobile_authenticated') === 'true';
    
    console.log('🔐 Owner Mobile auth check:', { 
      localStorage: localStorage.getItem('owner_mobile_authenticated'), 
      isAuth
    });
    
    if (isAuth) {
      clearTimeout(timeout);
      console.log('✅ Auth OK, staying on mobile page');
      setAuthChecking(false);
    } else {
      clearTimeout(timeout);
      console.log('🚫 Not authenticated, redirecting to mobile login...');
      router.push('/owner/mobile/login');
    }
    
    return () => clearTimeout(timeout);
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
    <div className="min-h-screen bg-black text-white">
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
          {(['HOJE', 'SEMANA', 'MES'] as const).map(p => (
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
            <div className="text-xl font-bold mb-1">{fmt(totals.expense)}</div>
            <div className="text-red-200 text-xs">{period.toLowerCase()}</div>
          </div>

          <div className="bg-gradient-to-br from-red-600 to-red-800 p-4 rounded-2xl border border-red-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-200 text-xs font-medium">Folha Salarial</span>
              <Wallet size={16} className="text-red-400" />
            </div>
            <div className="text-xl font-bold mb-1">{fmt(payroll?.reduce((sum: number, record: any) => sum + (record.netSalary || 0), 0) || 0)}</div>
            <div className="text-red-200 text-xs">total líquido</div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-4 rounded-2xl border border-indigo-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-indigo-200 text-xs font-medium">Impostos</span>
              <TrendingUp size={16} className="text-indigo-400" />
            </div>
            <div className="text-xl font-bold mb-1">{fmt(totals.revenue * 0.065)}</div>
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
      </div>
    </div>
  );
}
