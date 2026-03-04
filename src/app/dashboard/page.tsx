'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, BarChart, Bar } from 'recharts';
import { DollarSign, ShoppingBag, Users, TrendingUp, Sparkles, Loader2, Activity, ChefHat, QrCode, ArrowRight, Utensils, Clock, Download, AlertTriangle } from 'lucide-react';
import { analyzeBusinessPerformance } from '@/services/geminiService';
import { Order, AIAnalysisResult, PedidoPayload, DailyAnalyticsPayload, PaymentMethod, Expense, Revenue, Customer } from '@/types';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import ExportButton from '@/components/ExportButton';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { formatDateInLuanda } from '@/utils/date';
import { normalizeDate, buildDateRange, getOrderDate } from '@/services/utils/dateUtils';
import { formatCurrency as formatKz } from '@/utils/formatCurrency';

interface PaymentDailyDataRow {
  date: Date;
  label: string;
  totalSales: number;
  totalProfit: number;
  salesByMethod: Record<PaymentMethod, number>;
  profitByMethod: Record<PaymentMethod, number>;
}

const paymentMethods: PaymentMethod[] = ['NUMERARIO', 'TPA', 'TRANSFERENCIA', 'QR_CODE', 'SPLIT'];
const paymentLabels: Record<PaymentMethod, string> = {
  NUMERARIO: 'Numerário',
  TPA: 'Cartão',
  TRANSFERENCIA: 'Transferência',
  QR_CODE: 'QR Code',
  SPLIT: 'Split',
};

const Dashboard = () => {
  const { 
    activeOrders, orders, customers, dishes: menu, settings, expenses, revenues,
    getDailySalesAnalytics, getMenuAnalytics, saveStatus, onRealtimeChange
  } = useStore();

  const [realtimeActivity, setRealtimeActivity] = useState(false);

  useRealtimeSync('pedidos', (payload) => {
    onRealtimeChange({ tableName: 'pedidos', eventType: payload.eventType, new: payload.new, old: payload.old });
    setRealtimeActivity(true);
  });

  useRealtimeSync('daily_analytics', (payload) => {
    onRealtimeChange({ tableName: 'daily_analytics', eventType: payload.eventType, new: payload.new, old: payload.old });
    setRealtimeActivity(true);
  });
  
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [performanceRange, setPerformanceRange] = useState<'SEMANA' | '30D'>('SEMANA');
  const [paymentPeriod, setPaymentPeriod] = useState<'DIA' | 'SEMANA' | 'MES' | 'ANO'>('SEMANA');
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear());
  const [paymentMetric, setPaymentMetric] = useState<'VENDAS' | 'LUCRO'>('VENDAS');
  const paymentChartRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();




  useEffect(() => {
    if (realtimeActivity) {
      const timer = setTimeout(() => setRealtimeActivity(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [realtimeActivity]);

  // Métricas em Tempo Real
  const closedOrders = useMemo(() => orders.filter((o: Order) => o.status === 'FECHADO'), [orders]);
  const activeOrderCount = useMemo(() => activeOrders.filter((o: Order) => o.status === 'ABERTO').length, [activeOrders]);
  
  const dailyAnalytics = useMemo(() => getDailySalesAnalytics(7), [getDailySalesAnalytics]);
  const performanceAnalytics = useMemo(() => getDailySalesAnalytics(performanceRange === 'SEMANA' ? 7 : 30), [getDailySalesAnalytics, performanceRange]);
  const todayStats = useMemo(() => dailyAnalytics[dailyAnalytics.length - 1] || { totalSales: 0, totalProfit: 0, totalOrders: 0 }, [dailyAnalytics]);
  
  const totalSales = useMemo(() => closedOrders.reduce((acc: number, o: Order) => acc + (o.total || 0), 0), [closedOrders]);
  const totalRevenueWithLegacy = useMemo(() => totalSales + (settings.legacyTotalRevenue || 0), [totalSales, settings.legacyTotalRevenue]);
  const totalProfit = useMemo(() => dailyAnalytics.reduce((acc: number, d: DailyAnalyticsPayload) => acc + (d.totalProfit || 0), 0), [dailyAnalytics]);
  const avgMargin = useMemo(() => totalSales > 0 ? (totalProfit / totalSales) * 100 : 0, [totalSales, totalProfit]);
  const chartData = performanceAnalytics.map((d: DailyAnalyticsPayload) => ({
    name: formatDateInLuanda(d.date, { weekday: 'short' }),
    vendas: d.totalSales,
    lucro: d.totalProfit
  }));



  const handleAIAnalysis = async () => {
    setLoadingAi(true);
    const result = await analyzeBusinessPerformance(activeOrders, menu);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  const extractPayments = (order: Order): { method: PaymentMethod; amount: number }[] => {
    if (order.splitPayments && order.splitPayments.length > 0) {
      return order.splitPayments.map(p => ({ method: p.method as PaymentMethod, amount: p.amount }));
    }
    if (order.payments && order.payments.length > 0) {
      return order.payments.map(p => ({ method: p.method as PaymentMethod, amount: p.amount }));
    }
    if (order.paymentMethod) {
      return [{ method: order.paymentMethod as PaymentMethod, amount: order.total || 0 }];
    }
    return [];
  };

  const paymentDateRange = useMemo(() => {
    const today = normalizeDate(new Date());
    if (paymentPeriod === 'DIA') {
      return { start: today, end: today };
    }
    if (paymentPeriod === 'SEMANA') {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return { start, end: today };
    }
    if (paymentPeriod === 'MES') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start, end };
    }
    const start = new Date(paymentYear, 0, 1);
    const end = new Date(paymentYear, 11, 31);
    return { start, end };
  }, [paymentPeriod, paymentYear]);

  const paymentDailyData = useMemo(() => {
    const closed = orders.filter((o: Order) => o.status === 'FECHADO' || o.status === 'PAGO');
    const { start, end } = paymentDateRange;
    const days = buildDateRange(start, end);
    const profitByDay = new Map<number, number>();
    days.forEach(date => {
      const dayKey = normalizeDate(date).getTime();
      const daySales = closed.reduce((acc: number, order: Order) => {
        const d = normalizeDate(getOrderDate(order.timestamp || (order as any).createdAt || (order as any).updatedAt));
        return d.getTime() === dayKey ? acc + (order.total || 0) : acc;
      }, 0);
      const dayExpenses = (expenses || []).reduce((acc: number, exp: Expense) => {
        const d = normalizeDate(getOrderDate(exp.date));
        return d.getTime() === dayKey ? acc + exp.amount : acc;
      }, 0);
      const dayRevenues = (revenues || []).reduce((acc: number, rev: Revenue) => {
        const d = normalizeDate(getOrderDate(rev.date));
        return d.getTime() === dayKey ? acc + rev.amount : acc;
      }, 0);
      profitByDay.set(dayKey, (daySales + dayRevenues) - dayExpenses);
    });

    return days.map(date => {
      const dayKey = normalizeDate(date).getTime();
      const salesByMethod: Record<PaymentMethod, number> = {
        NUMERARIO: 0,
        TPA: 0,
        TRANSFERENCIA: 0,
        QR_CODE: 0,
        SPLIT: 0,
      };

      closed.forEach((order: Order) => {
        const orderDate = normalizeDate(getOrderDate((order.timestamp || order.createdAt || order.updated_at) || undefined));
        if (orderDate.getTime() !== dayKey) return;
        extractPayments(order).forEach(payment => {
          if (salesByMethod[payment.method] !== undefined) {
            salesByMethod[payment.method] += payment.amount;
          }
        });
      });
      const totalSales = paymentMethods.reduce((acc, method) => acc + salesByMethod[method], 0);
      const totalProfit = profitByDay.get(dayKey) || 0;
      const profitByMethod = paymentMethods.reduce((acc, method) => {
        const methodSales = salesByMethod[method];
        const allocated = totalSales > 0 ? (totalProfit * methodSales) / totalSales : 0;
        acc[method] = allocated;
        return acc;
      }, {} as Record<PaymentMethod, number>);
      const label = date.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
      return {
        date,
        label,
        totalSales,
        totalProfit,
        salesByMethod,
        profitByMethod
      };
    });
  }, [orders, expenses, revenues, paymentDateRange]);

  const paymentChartData = useMemo(() => {
    return paymentDailyData.map((row: PaymentDailyDataRow) => {
      const base: Record<string, number | string> = { name: row.label };
      paymentMethods.forEach(method => {
        base[method] = paymentMetric === 'VENDAS' ? row.salesByMethod[method] : row.profitByMethod[method];
      });
      return base;
    });
  }, [paymentDailyData, paymentMetric]);

  const exportConfig = {
    data: dailyAnalytics.map((d: DailyAnalyticsPayload) => ({
      ...d,
      totalSales: formatKz(d.totalSales),
      totalProfit: formatKz(d.totalProfit || 0),
      margin: d.totalSales > 0 ? `${((d.totalProfit || 0) / d.totalSales * 100).toFixed(1)}%` : '0%'
    })),
    columns: [
      { header: 'Data', dataKey: 'date' },
      { header: 'Vendas', dataKey: 'totalSales' },
      { header: 'Lucro Est.', dataKey: 'totalProfit' },
      { header: 'Margem', dataKey: 'margin' },
      { header: 'Pedidos', dataKey: 'totalOrders' }
    ],
    fileName: `dashboard_financeiro_${new Date().toISOString().split('T')[0]}`,
    title: 'Relatório Executivo - Tasca Do VEREDA'
  };

  const paymentExportData = useMemo(() => {
    return paymentDailyData.map((row: PaymentDailyDataRow) => {
      const entry: Record<string, unknown> = {
        data: row.date.toLocaleDateString('pt-AO'),
        total: formatKz(row.totalSales),
        lucro: formatKz(row.totalProfit)
      };
      paymentMethods.forEach(method => {
        entry[paymentLabels[method]] = formatKz(paymentMetric === 'VENDAS' ? row.salesByMethod[method] : row.profitByMethod[method]);
      });
      return entry;
    });
  }, [paymentDailyData, paymentMetric]);

  const paymentExportColumns = useMemo(() => {
    const cols = [
      { header: 'Data', dataKey: 'data' },
      { header: 'Total', dataKey: 'total' },
      { header: 'Lucro', dataKey: 'lucro' },
    ];
    paymentMethods.forEach(method => {
      cols.push({ header: paymentLabels[method], dataKey: paymentLabels[method] });
    });
    return cols;
  }, []);



  return (
    <div className="p-6 pb-24 space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-center md:items-end mb-8 gap-2 md:gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
             <Activity size={16} className="animate-pulse"/>
             <span className="text-xs font-mono font-bold tracking-widest uppercase">Sistema Operativo v2.0</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase italic">Painel de Comando</h2>
          <p className="text-slate-400 text-sm mt-1">Visão geral em tempo real</p>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">Online</span>
          </div>

          <button
            onClick={handleAIAnalysis}
            disabled={loadingAi}
            className="relative group overflow-hidden px-6 py-2.5 rounded-xl bg-primary text-slate-950 hover:bg-white transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] flex-1 md:flex-none justify-center"
          >
            <div className="flex items-center gap-2 relative z-10 font-black uppercase tracking-wide text-xs">
              {loadingAi ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16} />}
              <span>Análise Tática (IA)</span>
            </div>
          </button>
        </div>
      </header>

      {aiAnalysis && (
        <div className="bg-slate-800 backdrop-blur-xl border border-white/5 p-6 rounded-xl mb-6">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Sparkles size={20} className="text-primary"/> Análise Tática (IA)
          </h3>
          <p className="text-slate-300 mb-2">{aiAnalysis.summary}</p>
          <p className="text-slate-400 text-sm">
            <span className="font-bold">Recomendação:</span> {aiAnalysis.recommendation}
          </p>
          <p className="text-slate-400 text-sm">
            <span className="font-bold">Tendência:</span>{' '}
            <span className={`font-bold ${aiAnalysis.trend === 'up' ? 'text-emerald-400' : aiAnalysis.trend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
              {aiAnalysis.trend === 'up' ? 'Em Alta' : aiAnalysis.trend === 'down' ? 'Em Baixa' : 'Estável'}
            </span>
          </p>
        </div>
      )}

      {/* Bento Grid Layout */}
      <div className="flex flex-col md:grid md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6 auto-rows-[minmax(140px,auto)]">
        
        {/* Total Revenue - Large Card */}
        <div className="col-span-1 bg-slate-800 backdrop-blur-xl border border-white/5 p-6 rounded-xl relative overflow-hidden group hover:border-primary/20 transition-colors">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
             <DollarSign size={100} />
          </div>
          <div className="flex flex-col h-full justify-between relative z-10">
            <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest">
              <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_#06b6d4]"></div>
              Receita Total
            </div>
            <div>
              <p className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold text-white tracking-tighter">{formatKz(totalRevenueWithLegacy)}</p>
              <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 font-bold bg-emerald-400/10 w-fit px-2 py-1 rounded-lg">
                 <TrendingUp size={12} /> +12.5% vs ontem
              </div>
            </div>
          </div>
        </div>

        {/* Total Profit - Large Card */}
        <div className="col-span-1 bg-slate-800 backdrop-blur-xl border border-white/5 p-6 rounded-xl relative overflow-hidden group hover:border-emerald-500/20 transition-colors">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
             <TrendingUp size={100} />
          </div>
          <div className="flex flex-col h-full justify-between relative z-10">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
              <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
              Lucro do Dia
            </div>
            <div>
              <p className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold text-white tracking-tighter">{formatKz(todayStats?.totalProfit ?? 0)}</p>
              <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 font-bold bg-emerald-400/10 w-fit px-2 py-1 rounded-lg">
                 <TrendingUp size={12} /> Estimado
              </div>
            </div>
          </div>
        </div>

        {/* Active Orders - Standard Card */}
        <div className="col-span-1 bg-slate-800 backdrop-blur-xl border border-white/5 p-6 rounded-xl relative overflow-hidden group hover:border-blue-500/20 transition-colors">
          <div className="absolute -bottom-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
             <ShoppingBag size={100} />
          </div>
          <div className="flex flex-col h-full justify-between relative z-10">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-black uppercase tracking-widest">
              <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></div>
              Pedidos Ativos
            </div>
            <div className="flex items-end justify-between">
              <p className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold text-white tracking-tighter">{activeOrderCount}</p>
              <div className="flex -space-x-2">
                {[...Array(Math.min(3, activeOrderCount))].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-xs">
                    <Utensils size={14} className="text-slate-400"/>
                  </div>
                ))}
                {activeOrderCount > 3 && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-400">
                    +{activeOrderCount - 3}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions / Status - Tall Card */}
        <div className="col-span-1 row-span-2 bg-slate-800 border border-white/5 p-6 rounded-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-white text-xs font-black uppercase tracking-widest mb-6">
              <Sparkles size={14} className="text-primary"/>
              Status do Sistema
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings.kdsEnabled ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
                    <ChefHat size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">KDS Cozinha</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{settings.kdsEnabled ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${settings.kdsEnabled ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-slate-700'}`}></div>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Clientes</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{customers.length} Registados</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-white">{customers.filter((c: Customer) => c.balance > 0).length} c/ Dívida</div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="col-span-3 row-span-2 bg-slate-800 backdrop-blur-xl border border-white/5 p-6 rounded-xl relative overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Performance Semanal</h3>
            <select
              value={performanceRange}
              onChange={(e) => setPerformanceRange(e.target.value as 'SEMANA' | '30D')}
              className="bg-slate-800 text-white text-sm rounded-lg px-3 py-1 focus:ring-primary focus:border-primary"
            >
              <option value="SEMANA">Esta Semana</option>
              <option value="30D">Últimos 30 Dias</option>
            </select>
          </div>
          <div className="flex-1 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  labelStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Area type="monotone" dataKey="vendas" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUv)" />
                <Area type="monotone" dataKey="lucro" stroke="#82ca9d" fillOpacity={1} fill="url(#colorPv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Payments by Day */}
      <div className="bg-slate-900 backdrop-blur-xl border border-white/5 p-6 rounded-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h3 className="text-lg font-bold text-white mb-2 md:mb-0">Pagamentos por Dia</h3>
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-lg border border-slate-700">
              {['DIA', 'SEMANA', 'MES', 'ANO'].map(period => (
                <button
                  key={period}
                  onClick={() => setPaymentPeriod(period as 'DIA' | 'SEMANA' | 'MES' | 'ANO')}
                  className={`px-4 py-2 text-sm font-medium ${
                    paymentPeriod === period
                      ? 'bg-primary text-slate-950'
                      : 'text-slate-400 hover:bg-slate-800'
                  } first:rounded-l-lg last:rounded-r-lg transition-colors`}
                >
                  {period}
                </button>
              ))}
            </div>
            <div className="flex rounded-lg border border-slate-700">
              {['VENDAS', 'LUCRO'].map(metric => (
                <button
                  key={metric}
                  onClick={() => setPaymentMetric(metric as 'VENDAS' | 'LUCRO')}
                  className={`px-4 py-2 text-sm font-medium ${
                    paymentMetric === metric
                      ? 'bg-primary text-slate-950'
                      : 'text-slate-400 hover:bg-slate-800'
                  } first:rounded-l-lg last:rounded-r-lg transition-colors`}
                >
                  {metric}
                </button>
              ))}
            </div>
            {paymentPeriod === 'ANO' && (
              <select
                value={paymentYear}
                onChange={(e) => setPaymentYear(parseInt(e.target.value))}
                className="bg-slate-800 text-white text-sm rounded-lg px-3 py-1 focus:ring-primary focus:border-primary border border-slate-700"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            )}
            <ExportButton 
              data={paymentExportData}
              columns={paymentExportColumns}
              fileName={`pagamentos_${paymentPeriod}_${new Date().toISOString().split('T')[0]}`}
              title={`Relatório de Pagamentos - ${paymentPeriod}`}
            />
          </div>
        </div>
        <div ref={paymentChartRef} className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={paymentChartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                labelStyle={{ color: 'hsl(var(--primary))' }}
                formatter={(value: number) => formatKz(value)}
              />
              {paymentMethods.map(method => (
                <Bar key={method} dataKey={method} stackId="a" fill={
                  method === 'NUMERARIO' ? '#facc15' : // yellow-400
                  method === 'TPA' ? '#3b82f6' :      // blue-500
                  method === 'TRANSFERENCIA' ? '#10b981' : // emerald-500
                  method === 'QR_CODE' ? '#ef4444' :    // red-500
                  method === 'SPLIT' ? '#ec4899' :     // pink-500
                  '#64748b' // slate-500
                } />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


