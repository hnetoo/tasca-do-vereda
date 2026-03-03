'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { getOwnerMobileData } from '@/app/actions/ownerMobile';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  );

export default function OwnerMobilePage() {
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
  
  // Dados em tempo real do store local
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

  // Mobile: SEMPRE carregar da Server Action para dados em tempo real
  const loadApiData = useCallback(async () => {
    setLoadingSupabase(true);
    try {
      // MOBILE SPECIFIC LOGS - Funciona em computador e telemóvel
      console.log('📱 MOBILE DASHBOARD: Iniciando carregamento de dados...');
      console.log('📱 MOBILE DASHBOARD: User Agent:', navigator.userAgent);
      console.log('📱 MOBILE DASHBOARD: Platform:', navigator.platform);
      console.log('📱 MOBILE DASHBOARD: Screen:', {
        width: window.screen.width,
        height: window.screen.height,
        isMobile: window.screen.width <= 768
      });
      
      console.log('🔄 Starting Server Action call to getOwnerMobileData');
      
      const data = await getOwnerMobileData();
      
      console.log('🔍 SERVER ACTION RESPONSE:', data);
      console.log('� MOBILE DATA COMPARISON:', {
        '📊 Store Orders': orders.length,
        '☁️ Supabase Orders': data.orders?.length || 0,
        '📊 Store Expenses': expenses.length,
        '☁️ Supabase Expenses': data.expenses?.length || 0,
        '📊 Store Payroll': payroll.length,
        '☁️ Supabase Payroll': data.payroll?.length || 0,
        '📱 Device Type': window.screen.width <= 768 ? 'MOBILE' : 'DESKTOP',
        '🕐 Timestamp': new Date().toISOString()
      });
      
      if (!data.success) {
        console.error('❌ Server Action returned error:', data.error);
        addNotification(`❌ Erro: ${data.error}`, 'error');
        return;
      }
      
      // FALLBACK: Se Supabase retornar vazio, usar dados da Store
      const finalData = {
        orders: (data.orders && data.orders.length > 0) ? data.orders : orders,
        expenses: (data.expenses && data.expenses.length > 0) ? data.expenses : expenses,
        payroll: (data.payroll && data.payroll.length > 0) ? data.payroll : payroll,
        dishes: (data.dishes && data.dishes.length > 0) ? data.dishes : dishes,
        categories: (data.categories && data.categories.length > 0) ? data.categories : categories
      };
      
      console.log('🔍 FINAL DATA AFTER FALLBACK:', {
        orders: finalData.orders.length,
        expenses: finalData.expenses.length,
        payroll: finalData.payroll.length,
        usedStoreFallback: {
          orders: data.orders?.length === 0,
          expenses: data.expenses?.length === 0,
          payroll: data.payroll?.length === 0
        },
        deviceInfo: {
          type: window.screen.width <= 768 ? 'MOBILE' : 'DESKTOP',
          screen: `${window.screen.width}x${window.screen.height}`,
          userAgent: navigator.userAgent.includes('Mobile') ? 'MOBILE_BROWSER' : 'DESKTOP_BROWSER'
        }
      });
      
      setSupabaseData(finalData);
      
      console.log('✅ MOBILE DASHBOARD: Dados carregados com sucesso:', {
        orders: finalData.orders.length,
        expenses: finalData.expenses.length,
        payroll: finalData.payroll.length,
        device: window.screen.width <= 768 ? '📱 MOBILE' : '💻 DESKTOP',
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('❌ Mobile Server Action error:', error);
      addNotification(`❌ Falha ao carregar dados: ${error.message}`, 'error');
    } finally {
      setLoadingSupabase(false);
    }
  }, [addNotification, orders, expenses, payroll, dishes, categories]);

  // Carregar dados no mount
  useEffect(() => {
    loadApiData();
  }, [loadApiData]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(loadApiData, 30000);
    return () => clearInterval(interval);
  }, [loadApiData]);

  // Combinar dados locais com dados do Supabase - FORÇADO STORE
  const currentData = useMemo(() => {
    // FORÇAR: Usar Store se Supabase retornar vazio
    const finalOrders = supabaseData.orders && supabaseData.orders.length > 0 ? supabaseData.orders : orders;
    const finalExpenses = supabaseData.expenses && supabaseData.expenses.length > 0 ? supabaseData.expenses : expenses;
    const finalPayroll = supabaseData.payroll && supabaseData.payroll.length > 0 ? supabaseData.payroll : payroll;
    
    console.log('🔥 MOBILE FORCED DATA:', {
      'Store Orders': orders.length,
      'Supabase Orders': supabaseData.orders?.length || 0,
      'Final Orders': finalOrders.length,
      'Store Expenses': expenses.length,
      'Supabase Expenses': supabaseData.expenses?.length || 0,
      'Final Expenses': finalExpenses.length,
      'Store Payroll': payroll.length,
      'Supabase Payroll': supabaseData.payroll?.length || 0,
      'Final Payroll': finalPayroll.length
    });
    
    return {
      orders: finalOrders,
      expenses: finalExpenses,
      payroll: finalPayroll
    };
  }, [orders, expenses, payroll, supabaseData]);

  // Cálculos financeiros
  const calculations = useSafeCardCalculations(currentData, period);

  // Filtrar por período - TEMPORARIAMENTE DESATIVADO PARA DEBUG
  const filteredData = useMemo(() => {
    return {
      orders: currentData.orders,
      expenses: currentData.expenses,
      payroll: currentData.payroll
    };
  }, [currentData]);

  // Cálculos do período - COM CÁLCULO MANUAL FORÇADO
  const periodCalculations = useSafeCardCalculations(filteredData, period);
  
  // Cálculo manual forçado para garantir valores corretos
  const manualRevenue = filteredData.orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
  const manualExpenses = filteredData.expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
  const totalPayroll = filteredData.payroll.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  
  console.log('🔍 CÁLCULOS MANUAIS:', {
    manualRevenue,
    manualExpenses,
    totalPayroll,
    ordersCount: filteredData.orders.length,
    expensesCount: filteredData.expenses.length,
    payrollCount: filteredData.payroll.length
  });
  
  // USAR VALORES MANUAIS DIRETAMENTE - não tentar sobrescrever o objeto do hook
  const displayValues = {
    revenue: fmt(manualRevenue),
    expenses: fmt(manualExpenses),
    payroll: fmt(totalPayroll),
    netProfit: manualRevenue - manualExpenses - totalPayroll
  };

  // Verificar autenticação
  useEffect(() => {
    const checkAuth = () => {
      const cookie = document.cookie.split(';').find(c => c.trim().startsWith('owner_authenticated='));
      if (cookie?.split('=')[1] === 'true') {
        setAuthChecking(false);
      } else {
        router.push('/owner/mobile/login');
      }
    };
    checkAuth();
  }, [router]);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-6 h-6" />
            <h1 className="text-xl font-bold">Tasca Mobile</h1>
          </div>
          <button
            onClick={() => {
              document.cookie = 'owner_authenticated=; path=/; max-age=0';
              router.push('/owner/mobile/login');
            }}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 overflow-x-auto">
          {(['HOJE', 'SEMANA', 'MES', 'ANO'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                period === p
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {p === 'HOJE' ? 'Hoje' : p === 'SEMANA' ? 'Semana' : p === 'MES' ? 'Mês' : 'Ano'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Revenue Card */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-100">Vendas</span>
            <DollarSign className="w-5 h-5 text-green-100" />
          </div>
          <div className="text-2xl font-bold">{displayValues.revenue}</div>
          <div className="flex items-center gap-1 text-sm text-green-100">
            <ArrowUpRight className="w-4 h-4" />
            <span>{filteredData.orders.length} vendas</span>
          </div>
          {(() => {
            console.log('📱 MOBILE CARD VENDAS:', { 
              device: window.screen.width <= 768 ? '📱 MOBILE' : '💻 DESKTOP',
              totalVendas: filteredData.orders.length, 
              primeiroValor: filteredData.orders[0]?.total,
              todosValores: filteredData.orders.map(o => o.total),
              calculado: periodCalculations.revenue.value,
              userAgent: navigator.userAgent.includes('Mobile') ? 'MOBILE_BROWSER' : 'DESKTOP_BROWSER',
              timestamp: new Date().toISOString()
            });
            return null;
          })()}
        </div>

        {/* Expenses Card */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-100">Despesas</span>
            <TrendingDown className="w-5 h-5 text-red-100" />
          </div>
          <div className="text-2xl font-bold">{displayValues.expenses}</div>
          <div className="flex items-center gap-1 text-sm text-red-100">
            <ArrowDownRight className="w-4 h-4" />
            <span>{filteredData.expenses.length} despesas</span>
          </div>
          {(() => {
            console.log('📱 MOBILE CARD DESPESAS:', { 
              device: window.screen.width <= 768 ? '📱 MOBILE' : '💻 DESKTOP',
              totalDespesas: filteredData.expenses.length, 
              primeiroValor: filteredData.expenses[0]?.amount,
              todosValores: filteredData.expenses.map(e => e.amount),
              calculado: periodCalculations.expenses.value,
              userAgent: navigator.userAgent.includes('Mobile') ? 'MOBILE_BROWSER' : 'DESKTOP_BROWSER',
              timestamp: new Date().toISOString()
            });
            return null;
          })()}
        </div>

        {/* Payroll Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100">Folha Salarial</span>
            <Wallet className="w-5 h-5 text-blue-100" />
          </div>
          <div className="text-2xl font-bold">{displayValues.payroll}</div>
          <div className="flex items-center gap-1 text-sm text-blue-100">
            <Users className="w-4 h-4" />
            <span>{filteredData.payroll.length} registros</span>
          </div>
          {(() => {
            console.log('📱 MOBILE CARD FOLHA:', { 
              device: window.screen.width <= 768 ? '📱 MOBILE' : '💻 DESKTOP',
              totalFolha: filteredData.payroll.length, 
              primeiroValor: filteredData.payroll[0]?.amount,
              todosValores: filteredData.payroll.map(p => p.amount),
              calculado: totalPayroll,
              userAgent: navigator.userAgent.includes('Mobile') ? 'MOBILE_BROWSER' : 'DESKTOP_BROWSER',
              timestamp: new Date().toISOString()
            });
            return null;
          })()}
        </div>

        {/* Net Profit Card */}
        <div className={`bg-gradient-to-r p-4 rounded-2xl ${
          displayValues.netProfit >= 0 
            ? 'from-emerald-600 to-emerald-700' 
            : 'from-orange-600 to-orange-700'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80">Lucro Líquido</span>
            <TrendingUp className="w-5 h-5 text-white/80" />
          </div>
          <div className="text-2xl font-bold">{fmt(displayValues.netProfit)}</div>
          <div className="text-sm text-white/60">
            Margem: {manualRevenue > 0 ? ((displayValues.netProfit / manualRevenue) * 100).toFixed(1) : 0}%
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={loadApiData}
          disabled={loadingSupabase}
          className="w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {loadingSupabase ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Atualizando...</span>
            </>
          ) : (
            <>
              <ArrowUpRight className="w-4 h-4" />
              <span>Atualizar Dados</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
