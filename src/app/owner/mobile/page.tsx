'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Calendar, ArrowUpRight, ArrowDownRight, LogOut } from 'lucide-react';

export default function OwnerMobilePage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [period, setPeriod] = useState<'HOJE' | 'SEMANA' | 'MES'>('HOJE');
  
  // Dados em tempo real do store local (SQLite)
  const { 
    orders, 
    expenses,
    dishes,
    categories 
  } = useStore();

  // Debug para verificar se dados estão carregados
  useEffect(() => {
    const debugInfo = {
      ordersCount: orders?.length || 0,
      expensesCount: expenses?.length || 0,
      dishesCount: dishes?.length || 0,
      categoriesCount: categories?.length || 0,
      isMobile: true
    };
    
    console.log('📊 Owner Mobile Store Data:', debugInfo);
  }, [orders, expenses, dishes, categories]);

  // Verificar autenticação mobile
  useEffect(() => {
    const isAuth = localStorage.getItem('owner_mobile_authenticated') === 'true';
    
    console.log('🔐 Owner Mobile auth check:', { localStorage: localStorage.getItem('owner_mobile_authenticated'), isAuth });
    
    if (!isAuth) {
      router.push('/owner/mobile/login');
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
        return sum + (item.price || 0) * (item.quantity || 0);
      }, 0);
    }
    
    return 0;
  };

  // Estatísticas em tempo real
  const realtimeStats = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        todaySales: 0,
        todayOrders: 0,
        activeTables: 0,
        totalRevenue: 0
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at || order.date);
      return orderDate >= today;
    });

    const todaySales = todayOrders.reduce((sum, order) => {
      return sum + calculateOrderTotal(order);
    }, 0);

    const totalRevenue = orders.reduce((sum, order) => {
      return sum + calculateOrderTotal(order);
    }, 0);

    // Contar mesas ativas (orders que não estão fechadas)
    const activeTables = orders.filter(order => 
      order.status !== 'closed' && order.status !== 'paid'
    ).length;

    return {
      todaySales,
      todayOrders: todayOrders.length,
      activeTables,
      totalRevenue
    };
  }, [orders]);

  // Combinar transações (orders + expenses)
  const combinedTransactions = useMemo(() => {
    const txs = [];
    
    try {
      // Adicionar orders como transações de revenue
      if (orders && orders.length > 0) {
        orders.forEach(order => {
          if (order && order.id) {
            txs.push({
              id: `order-${order.id}`,
              date: order.created_at || order.date || new Date().toISOString(),
              description: `Mesa ${order.table_name || order.tableId || 'N/A'}`,
              category: 'Vendas',
              type: 'REVENUE',
              amount: calculateOrderTotal(order)
            });
          }
        });
      }
      
      // Adicionar expenses como transações
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
        </div>

        {/* Net Result */}
        <div className={`p-4 rounded-2xl border ${
          totals.net >= 0 
            ? 'bg-gradient-to-br from-green-600 to-green-800 border-green-500/30' 
            : 'bg-gradient-to-br from-red-600 to-red-800 border-red-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium mb-1 opacity-80">Resultado Líquido</div>
              <div className="text-2xl font-bold">{fmt(totals.net)}</div>
            </div>
            {totals.net >= 0 ? (
              <ArrowUpRight size={24} className="text-green-300" />
            ) : (
              <ArrowDownRight size={24} className="text-red-300" />
            )}
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
          <div className="text-xs text-slate-400 font-mono">
            <div>Orders: {orders?.length || 0}</div>
            <div>Expenses: {expenses?.length || 0}</div>
            <div>Dishes: {dishes?.length || 0}</div>
            <div>Categories: {categories?.length || 0}</div>
          </div>
        </div>

        {/* Back to Desktop */}
        <div className="text-center pt-4">
          <button
            onClick={() => router.push('/owner')}
            className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
          >
            ← Versão Desktop
          </button>
        </div>
      </div>
    </div>
  );
}
