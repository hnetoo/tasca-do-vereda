'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useSafeCardCalculations } from '@/utils/cardCalculations';
import { getDashboardData } from '@/app/actions/dashboardService';
import { 
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
  ShoppingCart,
  Settings
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function OwnerPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<'HOJE' | 'SEMANA' | 'MES' | 'ANO'>('HOJE');
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    orders, 
    expenses, 
    dishes, 
    categories, 
    addNotification, 
    employees, 
    payroll 
  } = useStore();

  // Função para carregar dados do dashboard
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🖥️ PC: Carregando dados do dashboard...');
      const result = await getDashboardData(period);
      
      if (result.success && result.data) {
        setDashboardData(result.data);
        console.log('✅ PC: Dados carregados com sucesso:', result.data);
      } else {
        setError(result.error || 'Erro ao carregar dados');
        console.error('❌ PC: Erro ao carregar dados:', result.error);
      }
    } catch (error: any) {
      setError(error.message || 'Erro inesperado');
      console.error('❌ PC: Erro inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados no mount
  useEffect(() => {
    loadDashboardData();
  }, [period]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Formatar valores
  const formatKwanza = (value: number): string => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Visão geral do restaurante</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={loadDashboardData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Carregando...' : 'Atualizar'}
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Configurações
              </button>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2 mt-6">
            {(['HOJE', 'SEMANA', 'MES', 'ANO'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading Display */}
        {loading && !dashboardData && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados...</p>
          </div>
        )}

        {/* Dashboard Cards */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Vendas Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vendas</p>
                  <p className="text-2xl font-bold text-gray-900">{formatKwanza(dashboardData.sales.total)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ArrowUpRight className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">{dashboardData.sales.count} vendas</span>
              </div>
              {period === 'HOJE' && (
                <div className="text-xs text-gray-500 mt-2">
                  Hoje: {formatKwanza(dashboardData.sales.today)} ({dashboardData.sales.todayCount} pedidos)
                </div>
              )}
            </div>

            {/* Impostos Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Impostos (6,5%)</p>
                  <p className="text-2xl font-bold text-gray-900">{formatKwanza(dashboardData.taxes.total)}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Receipt className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Receipt className="w-4 h-4 text-amber-600" />
                <span className="text-gray-600">Sobre total de vendas</span>
              </div>
            </div>

            {/* Despesas Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Despesas</p>
                  <p className="text-2xl font-bold text-gray-900">{formatKwanza(dashboardData.expenses.total)}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ArrowDownRight className="w-4 h-4 text-red-600" />
                <span className="text-gray-600">{dashboardData.expenses.count} despesas</span>
              </div>
            </div>

            {/* Folha Salarial Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Folha Salarial</p>
                  <p className="text-2xl font-bold text-gray-900">{formatKwanza(dashboardData.payroll.total)}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">{dashboardData.payroll.count} registros</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Mês atual: {formatKwanza(dashboardData.payroll.currentMonth)}
              </div>
            </div>

            {/* Receitas Externas Card */}
            {dashboardData.externalRevenue.total > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Outras Receitas</p>
                    <p className="text-2xl font-bold text-gray-900">{formatKwanza(dashboardData.externalRevenue.total)}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ArrowUpRight className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-600">{dashboardData.externalRevenue.count} entradas</span>
                </div>
              </div>
            )}

            {/* Lucro Líquido Card */}
            <div className={`bg-white rounded-xl shadow-sm p-6 ${
              dashboardData.netProfit >= 0 ? 'border-green-200' : 'border-red-200'
            } border-2`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Lucro Líquido</p>
                  <p className={`text-2xl font-bold ${
                    dashboardData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatKwanza(dashboardData.netProfit)}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  dashboardData.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {dashboardData.netProfit >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </div>
              <div className={`text-sm ${
                dashboardData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {dashboardData.netProfit >= 0 ? 'Lucro' : 'Prejuízo'}
              </div>
            </div>
          </div>
        )}

        {/* Debug Information */}
        {dashboardData && (
          <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Período:</p>
                <p className="text-gray-600">{period}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Vendas:</p>
                <p className="text-gray-600">{formatKwanza(dashboardData.sales.total)} ({dashboardData.sales.count})</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Despesas:</p>
                <p className="text-gray-600">{formatKwanza(dashboardData.expenses.total)} ({dashboardData.expenses.count})</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Folha:</p>
                <p className="text-gray-600">{formatKwanza(dashboardData.payroll.total)} ({dashboardData.payroll.count})</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Impostos:</p>
                <p className="text-gray-600">{formatKwanza(dashboardData.taxes.total)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Lucro:</p>
                <p className="text-gray-600">{formatKwanza(dashboardData.netProfit)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Última atualização:</p>
                <p className="text-gray-600">{new Date().toLocaleTimeString('pt-AO')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
