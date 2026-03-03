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
      console.log('🔄 Starting Server Action call to getOwnerMobileData');
      
      const data = await getOwnerMobileData();
      
      console.log('🔍 SERVER ACTION RESPONSE:', data);
      
      if (data && typeof data === 'object' && 'error' in data) {
        console.error('❌ Server Action returned error:', data.error);
        addNotification(`❌ Erro: ${(data as any).error}`, 'error');
        return;
      }
      
      setSupabaseData({
        orders: data.orders || [],
        expenses: data.expenses || [],
        payroll: data.payroll || [],
        dishes: data.dishes || [],
        categories: data.categories || []
      });
      
      console.log('✅ Mobile Server Action data loaded successfully:', {
        orders: data.orders?.length || 0,
        expenses: data.expenses?.length || 0,
        payroll: data.payroll?.length || 0
      });
      
    } catch (error: any) {
      console.error('❌ Mobile Server Action error:', error);
      addNotification(`❌ Falha ao carregar dados: ${error.message}`, 'error');
    } finally {
      setLoadingSupabase(false);
    }
  }, [addNotification]);

  // Carregar dados no mount
  useEffect(() => {
    loadApiData();
  }, [loadApiData]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(loadApiData, 30000);
    return () => clearInterval(interval);
  }, [loadApiData]);

  // Combinar dados locais com dados do Supabase
  const currentData = useMemo(() => {
    const allOrders = [...(orders || []), ...(supabaseData.orders || [])];
    const allExpenses = [...(expenses || []), ...(supabaseData.expenses || [])];
    const allPayroll = [...(payroll || []), ...(supabaseData.payroll || [])];
    
    return {
      orders: allOrders,
      expenses: allExpenses,
      payroll: allPayroll
    };
  }, [orders, expenses, payroll, supabaseData]);

  // Cálculos financeiros
  const calculations = useSafeCardCalculations(currentData, period);

  // Filtrar por período
  const filteredData = useMemo(() => {
    const now = new Date();
    const filterDate = (date: string) => {
      const d = new Date(date);
      switch (period) {
        case 'HOJE':
          return d.toDateString() === now.toDateString();
        case 'SEMANA':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return d >= weekAgo;
        case 'MES':
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        case 'ANO':
          return d.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    };

    return {
      orders: currentData.orders.filter((o: any) => filterDate(o.created_at || o.date)),
      expenses: currentData.expenses.filter((e: any) => filterDate(e.created_at || e.date)),
      payroll: currentData.payroll.filter((p: any) => filterDate(p.created_at || p.date))
    };
  }, [currentData, period]);

  // Cálculos do período
  const periodCalculations = useSafeCardCalculations(filteredData, period);
  const totalPayroll = filteredData.payroll.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

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
          <div className="text-2xl font-bold">{periodCalculations.revenue.value}</div>
          <div className="flex items-center gap-1 text-sm text-green-100">
            <ArrowUpRight className="w-4 h-4" />
            <span>{filteredData.orders.length} vendas</span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-100">Despesas</span>
            <TrendingDown className="w-5 h-5 text-red-100" />
          </div>
          <div className="text-2xl font-bold">{periodCalculations.expenses.value}</div>
          <div className="flex items-center gap-1 text-sm text-red-100">
            <ArrowDownRight className="w-4 h-4" />
            <span>{filteredData.expenses.length} despesas</span>
          </div>
        </div>

        {/* Payroll Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100">Folha Salarial</span>
            <Wallet className="w-5 h-5 text-blue-100" />
          </div>
          <div className="text-2xl font-bold">{fmt(totalPayroll)}</div>
          <div className="flex items-center gap-1 text-sm text-blue-100">
            <Users className="w-4 h-4" />
            <span>{filteredData.payroll.length} registros</span>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className={`bg-gradient-to-r p-4 rounded-2xl ${
          periodCalculations.totals.revenue - periodCalculations.totals.expenses >= 0 
            ? 'from-emerald-600 to-emerald-700' 
            : 'from-orange-600 to-orange-700'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80">Lucro Líquido</span>
            <TrendingUp className="w-5 h-5 text-white/80" />
          </div>
          <div className="text-2xl font-bold">{fmt(periodCalculations.totals.revenue - periodCalculations.totals.expenses)}</div>
          <div className="text-sm text-white/60">
            Margem: {periodCalculations.totals.revenue > 0 ? ((periodCalculations.totals.revenue - periodCalculations.totals.expenses) / periodCalculations.totals.revenue * 100).toFixed(1) : 0}%
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
