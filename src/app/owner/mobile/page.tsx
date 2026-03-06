'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { 
  Smartphone, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  RefreshCw,
  LogOut,
  Trash2,
  AlertTriangle,
  Wallet,
  DollarSign,
  Receipt,
  ShoppingCart,
  Calendar,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { getOwnerMobileData } from '@/app/actions/ownerMobile';
import { createSampleData } from '@/app/actions/createSampleData';
import { resetProductionData } from '@/app/actions/resetProduction';
import { ensureTables } from '@/app/actions/ensureTables';
import { useSafeCardCalculations } from '@/utils/cardCalculations';
import { createClient } from '@/lib/supabase/client';

import { formatKwanza } from '@/utils/currency';

export default function OwnerMobilePage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [period, setPeriod] = useState<'HOJE' | 'SEMANA' | 'MES' | 'ANO'>('HOJE');
  const [showHistory, setShowHistory] = useState(false);
  const [showTodaySales, setShowTodaySales] = useState(true);
  const [showAccumulatedSales, setShowAccumulatedSales] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [supabaseData, setSupabaseData] = useState<any>({
    orders: [],
    expenses: [],
    payroll: [],
    dishes: [],
    menu_categories: []
  });
  const [loadingSupabase, setLoadingSupabase] = useState(false);
  
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
          console.error('❌ [MOBILE] Erro ao buscar dados externos:', error);
          setExternalFinance([]);
        } else {
          console.log('✅ [MOBILE] Dados externos carregados:', data?.length || 0);
          setExternalFinance(data || []);
        }
      } catch (err) {
        console.error('❌ [MOBILE] Exceção ao buscar dados externos:', err);
        setExternalFinance([]);
      }
    };

    fetchExternalFinance();
    
    // Forçar refresh a cada 30 segundos para mobile
    const interval = setInterval(fetchExternalFinance, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Dados em tempo real do store local
  const { 
    orders, 
    expenses,
    dishes,
    menu_categories,
    addNotification,
    settings,
    employees,
    payroll,
    setOrders,
    setExpenses
  } = useStore();

  // Função para carregar dados da API
  const loadApiData = useCallback(async () => {
    try {
      setLoadingSupabase(true);
      console.log('� MOBILE: Carregando dados da API...');
      
      // Primeiro, garantir que todas as tabelas existem
      console.log('� MOBILE: Verificando tabelas...');
      const tablesResult = await ensureTables();
      if (!tablesResult.success) {
        console.error('❌ MOBILE: Erro ao verificar tabelas:', tablesResult.error);
        addNotification(`❌ Erro ao preparar tabelas: ${tablesResult.error}`, 'error');
        return;
      }
      
      // Depois de garantir tabelas, carregar dados
      console.log('📊 MOBILE: Carregando dados do Supabase...');
      const data = await getOwnerMobileData();
      
      console.log('📱 MOBILE: Dados recebidos:', {
        ordersCount: data.orders?.length || 0,
        expensesCount: data.expenses?.length || 0,
        payrollCount: data.payroll?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      setSupabaseData(data);
      addNotification('✅ Dados atualizados com sucesso!', 'success');
      
    } catch (error: any) {
      console.error('❌ MOBILE: Erro ao carregar dados:', error);
      addNotification(`❌ Erro ao carregar dados: ${error.message}`, 'error');
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
    
    console.log('🔥 STORE VS API (MOBILE):', { 
      store: orders.length, 
      api: supabaseData.orders?.length || 0,
      finalOrders: allOrders.length,
      storeExpenses: expenses.length,
      apiExpenses: supabaseData.expenses?.length || 0,
      finalExpenses: allExpenses.length,
      storePayroll: payroll.length,
      apiPayroll: supabaseData.payroll?.length || 0,
      finalPayroll: allPayroll.length
    });
    
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
    return {
      orders: currentData.orders,
      expenses: currentData.expenses,
      payroll: currentData.payroll
    };
  }, [currentData]);

  // Cálculos do período
  const periodCalculations = useSafeCardCalculations(filteredData, period);
  
  // Cálculo manual forçado para garantir valores corretos
  const manualRevenue = filteredData.orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
  const manualExpenses = filteredData.expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
  
  // Adicionar dados externos ao total
  const externalTotal = externalFinance.reduce((sum: number, ext: any) => sum + (ext.amount || 0), 0);
  const grandTotalRevenue = manualRevenue + externalTotal;
  
  // Cálculo corrigido da folha salarial - usar apenas tabela payroll
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const totalPayroll = filteredData.payroll
    .filter(p => p.mes_referencia === currentMonth)
    .reduce((sum: number, p: any) => {
    // Usar apenas o campo net_total da tabela payroll
    const amount = p.net_total || 0;
    return sum + amount;
  }, 0);
  
  // Filtrar vendas de hoje
  const today = new Date();
  // Forçar timezone Africa/Luanda para consistência mobile/desktop
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999); // Fim do dia
  
  const todayOrders = filteredData.orders.filter((order: any) => {
    const orderDate = new Date(order.created_at);
    // Normalizar para timezone de Luanda
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  });
  
  const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
  
  // Vendas acumuladas (total desde o início - NUNCA ZERA)
  const accumulatedRevenue = grandTotalRevenue; // Incluir dados externos
  
  // Data do primeiro registro para mostrar "desde quando"
  const firstOrderDate = filteredData.orders.length > 0 
    ? new Date(Math.min(...filteredData.orders.map((o: any) => new Date(o.created_at).getTime())))
    : new Date();
  
  const daysSinceStart = Math.floor((today.getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Cálculo de impostos (6,5% sobre o total de vendas)
  const taxRate = 0.065; // 6.5%
  const totalTaxes = grandTotalRevenue * taxRate;
  
  console.log('🔍 CÁLCULOS MANUAIS:', {
    manualRevenue,
    manualExpenses,
    totalPayroll,
    payrollDetails: filteredData.payroll.map(p => ({
      id: p.id,
      total_liquido: p.total_liquido,
      funcionario_name: p.funcionario_name,
      mes_referencia: p.mes_referencia,
      status_pagamento: p.status_pagamento
    })),
    totalTaxes,
    taxRate: `${(taxRate * 100)}%`,
    todayRevenue,
    todayOrdersCount: todayOrders.length,
    accumulatedRevenue,
    daysSinceStart,
    firstOrderDate: firstOrderDate.toLocaleDateString('pt-AO'),
    ordersCount: filteredData.orders.length,
    expensesCount: filteredData.expenses.length,
    payrollCount: filteredData.payroll.length
  });
  
  // USAR VALORES MANUAIS DIRETAMENTE
  const displayValues = {
    revenue: formatKwanza(manualRevenue),
    expenses: formatKwanza(manualExpenses),
    payroll: formatKwanza(totalPayroll),
    taxes: formatKwanza(totalTaxes),
    todayRevenue: formatKwanza(todayRevenue),
    accumulatedRevenue: formatKwanza(accumulatedRevenue),
    netProfit: manualRevenue - manualExpenses - totalPayroll - totalTaxes
  };

  // Funções para gerenciar dados
  const handleResetData = async () => {
    if (!confirm('⚠️ Tem certeza que deseja resetar os dados de produção? Esta ação limpará todas as vendas e despesas.')) {
      return;
    }
    
    try {
      addNotification('🔄 Resetando dados de produção...', 'info');
      const result = await resetProductionData();
      
      if (result.success) {
        addNotification('✅ Dados resetados com sucesso!', 'success');
        setOrders([]);
        setExpenses([]);
        await loadApiData();
      } else {
        addNotification(`❌ Erro: ${result.error}`, 'error');
      }
    } catch (error: any) {
      addNotification(`❌ Erro ao resetar dados: ${error.message}`, 'error');
    }
  };

  // Verificar autenticação e status online
  useEffect(() => {
    const checkAuth = () => {
      const cookie = document.cookie.split(';').find(c => c.trim().startsWith('owner_authenticated='));
      if (cookie?.split('=')[1] === 'true') {
        setAuthChecking(false);
      } else {
        router.push('/owner/mobile/login');
      }
    };
    
    // Verificar status online/offline
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };
    
    checkAuth();
    checkOnlineStatus();
    
    // Listener para mudanças de conexão
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
        <div className="flex gap-2 overflow-x-auto mb-4">
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
              {p}
            </button>
          ))}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleResetData}
            className="flex-1 px-3 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Reset Produção
          </button>
          <button
            onClick={loadApiData}
            className="px-3 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

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
        </div>

        {/* Taxes Card (6.5%) */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-100">Impostos (6,5%)</span>
            <Receipt className="w-5 h-5 text-amber-100" />
          </div>
          <div className="text-2xl font-bold">{displayValues.taxes}</div>
          <div className="flex items-center gap-1 text-sm text-amber-100">
            <Receipt className="w-4 h-4" />
            <span>Sobre total de vendas</span>
          </div>
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
        </div>

        {/* Today Sales Card */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-indigo-100">Vendas de Hoje</span>
            <Calendar className="w-5 h-5 text-indigo-100" />
          </div>
          <div className="text-2xl font-bold">{displayValues.todayRevenue}</div>
          <div className="flex items-center gap-1 text-sm text-indigo-100">
            <Clock className="w-4 h-4" />
            <span>{todayOrders.length} pedidos hoje</span>
          </div>
        </div>

        {/* Accumulated Sales Card */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-100">Vendas Acumuladas</span>
            <TrendingUp className="w-5 h-5 text-purple-100" />
          </div>
          <div className="text-2xl font-bold">{displayValues.accumulatedRevenue}</div>
          <div className="flex items-center gap-1 text-sm text-purple-100">
            <TrendingUp className="w-4 h-4" />
            <span>Desde {firstOrderDate.toLocaleDateString('pt-AO')}</span>
          </div>
          <div className="text-xs text-purple-80 mt-1">
            ({daysSinceStart} dias de operação)
          </div>
        </div>

        {/* Payroll Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100">Folha Salarial</span>
            <Wallet className="w-5 h-5 text-blue-100" />
          </div>
          {loadingSupabase ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-100"></div>
              <span className="text-blue-100 text-sm">Carregando...</span>
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-blue-100">{displayValues.payroll}</div>
              <div className="flex items-center gap-1 text-sm text-blue-100">
                <Users className="w-4 h-4" />
                <span>{filteredData.payroll.length} registros</span>
              </div>
              {filteredData.payroll.length === 0 && (
                <div className="text-xs text-blue-200 mt-1">
                  Nenhum registro de folha encontrado
                </div>
              )}
            </>
          )}
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
          <div className="text-2xl font-bold">{formatKwanza(displayValues.netProfit)}</div>
          <div className="text-sm text-white/60">
            Margem: {manualRevenue > 0 ? ((displayValues.netProfit / manualRevenue) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-xs text-white/40 mt-1">
            (Vendas - Despesas - Folha - Impostos)
          </div>
        </div>

        {/* Sales History Toggle */}
        <div className="bg-gray-800 p-4 rounded-2xl">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gray-300" />
              <span className="text-gray-300 font-medium">
                {showHistory ? 'Ocultar' : 'Mostrar'} Histórico de Vendas
              </span>
            </div>
            <span className="text-gray-400">
              {showHistory ? '▲' : '▼'}
            </span>
          </button>
          
          {showHistory && (
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              {filteredData.orders.length === 0 ? (
                <div className="text-center text-gray-400 py-4">
                  Nenhuma venda encontrada
                </div>
              ) : (
                filteredData.orders.map((order: any, index: number) => (
                  <div key={order.id || index} className="bg-gray-700 p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-white font-medium">
                          Pedido #{index + 1}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {new Date(order.created_at).toLocaleString('pt-AO', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="text-gray-500 text-xs">
                          Mesa: {order.table_id || 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">{formatKwanza(order.total || 0)}</div>
                        <div className="text-gray-400 text-xs">
                          +{formatKwanza(order.tax_total || 0)} imposto
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
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
              <RefreshCw className="w-5 h-5" />
              <span>Atualizar Dados</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

