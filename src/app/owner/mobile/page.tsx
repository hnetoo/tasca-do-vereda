'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardData } from '@/app/actions/dashboardService';
import { 
  Smartphone, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Wallet,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Trash2,
  Receipt,
  LogOut,
  ShoppingCart
} from 'lucide-react';

export default function OwnerMobilePage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [period, setPeriod] = useState<'HOJE' | 'SEMANA' | 'MES' | 'ANO'>('HOJE');
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Função para carregar dados do dashboard
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📱 MOBILE: Carregando dados do dashboard...');
      const result = await getDashboardData(period);
      
      if (result.success && result.data) {
        setDashboardData(result.data);
        console.log('✅ MOBILE: Dados carregados com sucesso:', result.data);
      } else {
        setError(result.error || 'Erro ao carregar dados');
        console.error('❌ MOBILE: Erro ao carregar dados:', result.error);
      }
    } catch (error: any) {
      setError(error.message || 'Erro inesperado');
      console.error('❌ MOBILE: Erro inesperado:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  // Carregar dados no mount
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

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

  // Formatar valores
  const formatKwanza = (value: number): string => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

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
            onClick={loadDashboardData}
            disabled={loading}
            className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Carregando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Error Display */}
        {error && (
          <div className="bg-red-600/20 border border-red-600 p-4 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Loading Display */}
        {loading && !dashboardData && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando dados...</p>
          </div>
        )}

        {/* Dashboard Cards */}
        {dashboardData && (
          <>
            {/* Vendas Card */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-100">Vendas</span>
                <DollarSign className="w-5 h-5 text-green-100" />
              </div>
              <div className="text-2xl font-bold">{formatKwanza(dashboardData.sales.total)}</div>
              <div className="flex items-center gap-1 text-sm text-green-100">
                <ArrowUpRight className="w-4 h-4" />
                <span>{dashboardData.sales.count} vendas</span>
              </div>
              {period === 'HOJE' && (
                <div className="text-xs text-green-200 mt-1">
                  Hoje: {formatKwanza(dashboardData.sales.today)} ({dashboardData.sales.todayCount} pedidos)
                </div>
              )}
            </div>

            {/* Impostos Card */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-amber-100">Impostos (6,5%)</span>
                <Receipt className="w-5 h-5 text-amber-100" />
              </div>
              <div className="text-2xl font-bold">{formatKwanza(dashboardData.taxes.total)}</div>
              <div className="flex items-center gap-1 text-sm text-amber-100">
                <Receipt className="w-4 h-4" />
                <span>Sobre total de vendas</span>
              </div>
            </div>

            {/* Despesas Card */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-100">Despesas</span>
                <TrendingDown className="w-5 h-5 text-red-100" />
              </div>
              <div className="text-2xl font-bold">{formatKwanza(dashboardData.expenses.total)}</div>
              <div className="flex items-center gap-1 text-sm text-red-100">
                <ArrowDownRight className="w-4 h-4" />
                <span>{dashboardData.expenses.count} despesas</span>
              </div>
            </div>

            {/* Folha Salarial Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100">Folha Salarial</span>
                <Wallet className="w-5 h-5 text-blue-100" />
              </div>
              <div className="text-2xl font-bold">{formatKwanza(dashboardData.payroll.total)}</div>
              <div className="flex items-center gap-1 text-sm text-blue-100">
                <Users className="w-4 h-4" />
                <span>{dashboardData.payroll.count} registros</span>
              </div>
              <div className="text-xs text-blue-200 mt-1">
                Mês atual: {formatKwanza(dashboardData.payroll.currentMonth)}
              </div>
            </div>

            {/* Receitas Externas Card */}
            {dashboardData.externalRevenue.total > 0 && (
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-100">Outras Receitas</span>
                  <TrendingUp className="w-5 h-5 text-purple-100" />
                </div>
                <div className="text-2xl font-bold">{formatKwanza(dashboardData.externalRevenue.total)}</div>
                <div className="flex items-center gap-1 text-sm text-purple-100">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{dashboardData.externalRevenue.count} entradas</span>
                </div>
              </div>
            )}

            {/* Lucro Líquido Card */}
            <div className={`bg-gradient-to-r p-4 rounded-2xl ${
              dashboardData.netProfit >= 0 
                ? 'from-emerald-600 to-emerald-700' 
                : 'from-orange-600 to-orange-700'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80">Lucro Líquido</span>
                {dashboardData.netProfit >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-white/80" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-white/80" />
                )}
              </div>
              <div className="text-3xl font-bold">{formatKwanza(dashboardData.netProfit)}</div>
              <div className="text-sm text-white/60">
                {dashboardData.netProfit >= 0 ? 'Lucro' : 'Prejuízo'}
              </div>
            </div>

            {/* Debug Information */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Debug Info</span>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-gray-400 hover:text-white"
                >
                  {showHistory ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              
              {showHistory && (
                <div className="text-xs text-gray-400 space-y-1">
                  <p>Período: {period}</p>
                  <p>Vendas: {formatKwanza(dashboardData.sales.total)} ({dashboardData.sales.count})</p>
                  <p>Despesas: {formatKwanza(dashboardData.expenses.total)} ({dashboardData.expenses.count})</p>
                  <p>Folha: {formatKwanza(dashboardData.payroll.total)} ({dashboardData.payroll.count})</p>
                  <p>Impostos: {formatKwanza(dashboardData.taxes.total)}</p>
                  <p>Lucro: {formatKwanza(dashboardData.netProfit)}</p>
                  <p>Última atualização: {new Date().toLocaleTimeString('pt-AO')}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
