'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, Target, Users, ShoppingBag, AlertTriangle,
  Calendar, Filter, Download, ChefHat, Clock, Star, Zap, CreditCard
} from 'lucide-react';
import ExportButton from '@/components/ExportButton';
import { exportChartToPDF } from '@/services/exportService';
import { PaymentMethod, DailyAnalytics } from '@/types';
import { getOrderDate, normalizeDate, buildDateRange } from '@/services/utils/dateUtils';
import { formatKz } from '@/services/utils/currencyFormatter';

interface PaymentDailyDataRow {
  date: Date;
  label: string;
  totalSales: number;
  totalProfit: number;
  salesByMethod: Record<PaymentMethod, number>;
  profitByMethod: Record<PaymentMethod, number>;
}

const Analytics = () => {
  const {
    activeOrders, employees, expenses, revenues, settings
  } = useStore();

  const [selectedPeriod, setSelectedPeriod] = useState<30 | 7 | 90>(30);
  type TabType = 'vendas' | 'menu' | 'estoque' | 'funcionarios';
  const [activeTab, setActiveTab] = useState<TabType>('vendas');
  const [paymentPeriod, setPaymentPeriod] = useState<'DIA' | 'SEMANA' | 'MES' | 'ANO'>('SEMANA');
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear());
  const [paymentMetric, setPaymentMetric] = useState<'VENDAS' | 'LUCRO'>('VENDAS');
  const paymentChartRef = useRef<HTMLDivElement | null>(null);

  // TODO: Implementar analytics quando métodos estiverem disponíveis
  const dailyAnalytics = useMemo(() => [], []);
  const menuAnalytics = useMemo(() => [], []);
  const stockAnalytics = useMemo(() => [], []);
  const employeePerf = useMemo(() => [], []);
  const peakHours = useMemo(() => [], []);
  const topDishes = useMemo(() => [], []);
  const avgOrderValue = useMemo(() => 0, []);
  const retention = useMemo(() => [], []);

  const totalRevenue = useMemo(() => dailyAnalytics.reduce((acc: number, d: DailyAnalytics) => acc + d.totalRevenue, 0) + (settings?.legacyTotalRevenue || 0), [dailyAnalytics, settings?.legacyTotalRevenue]);
  const totalProfit = useMemo(() => dailyAnalytics.reduce((acc: number, d: DailyAnalytics) => acc + (d.totalProfit || 0), 0), [dailyAnalytics]);
  const totalOrders = useMemo(() => dailyAnalytics.reduce((acc: number, d: DailyAnalytics) => acc + (d.orderCount || d.totalOrders || 0), 0), [dailyAnalytics]);
  const avgDaily = useMemo(() => totalRevenue / (selectedPeriod || 1), [totalRevenue, selectedPeriod]);

  const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];
  const paymentMethods: PaymentMethod[] = useMemo(
    () => ['NUMERARIO', 'TPA', 'TRANSFERENCIA', 'QR_CODE', 'SPLIT'],
    []
  );
  const paymentLabels: Record<PaymentMethod, string> = {
    NUMERARIO: 'Numerário',
    TPA: 'Cartão',
    TRANSFERENCIA: 'Transferência',
    QR_CODE: 'QR Code',
    SPLIT: 'Split',
  };

  const extractPayments = useCallback((order: typeof activeOrders[number]) => {
    if (order.splitPayments && order.splitPayments.length > 0) {
      return order.splitPayments.map((p: any) => ({ method: p.method, amount: p.amount }));
    }
    if (order.payments && order.payments.length > 0) {
      return order.payments.map((p: any) => ({ method: p.method, amount: p.amount }));
    }
    if (order.paymentMethod) {
      return [{ method: order.paymentMethod, amount: order.total }];
    }
    return [];
  }, []);

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
    const closedOrders = activeOrders.filter((o: any) => o.status === 'FECHADO' || o.status === 'PAGO');
    const { start, end } = paymentDateRange;
    const days = buildDateRange(start, end);
    const profitByDay = new Map<number, number>();
    days.forEach(date => {
      const dayKey = normalizeDate(date).getTime();
      const daySales = closedOrders.reduce((acc: number, order: any) => {
        const d = normalizeDate(getOrderDate((order.timestamp || order.createdAt || order.updatedAt) || undefined));
        return d.getTime() === dayKey ? acc + (order.total || 0) : acc;
      }, 0);
      const dayExpenses = (expenses || []).reduce((acc: number, exp: any) => {
        const d = normalizeDate(getOrderDate(exp.date));
        return d.getTime() === dayKey ? acc + exp.amount : acc;
      }, 0);
      const dayRevenues = (revenues || []).reduce((acc: number, rev: any) => {
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
        SPLIT: 0
      };
      closedOrders.forEach((order: any) => {
        const orderDate = normalizeDate(getOrderDate(order.timestamp || order.createdAt || order.updatedAt));
        if (orderDate.getTime() !== dayKey) return;
        extractPayments(order).forEach((payment: any) => {
          if (salesByMethod[payment.method as PaymentMethod] !== undefined) {
            salesByMethod[payment.method as PaymentMethod] += payment.amount;
          }
        });
      });
      const totalSales = paymentMethods.reduce((acc, method) => acc + salesByMethod[method], 0);
      const totalProfit = profitByDay.get(dayKey) || 0;
      const profitByMethod = paymentMethods.reduce((acc: any, method) => {
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
  }, [paymentDateRange, activeOrders, expenses, revenues, paymentMethods, extractPayments]);

  const paymentChartData = useMemo(() => {
    return paymentDailyData.map(row => {
      const base: Record<string, number | string> = { name: row.label };
      paymentMethods.forEach(method => {
        base[method] = paymentMetric === 'VENDAS' ? row.salesByMethod[method] : row.profitByMethod[method];
      });
      return base;
    });
  }, [paymentDailyData, paymentMethods, paymentMetric]);

  const lowStockItems = stockAnalytics.filter((s: any) => s.currentStock <= s.minThreshold);
  const criticalStockItems = stockAnalytics.filter((s: any) => s.daysToRunOut < 3 && s.daysToRunOut > 0);

  const getExportConfig = () => {
    switch (activeTab) {
      case 'vendas':
        return {
          data: dailyAnalytics.map((d: any) => ({
            ...d,
            totalSales: formatKz(d.totalSales),
            averageOrder: formatKz(d.totalSales / (d.totalOrders || 1))
          })),
          columns: [
            { header: 'Data', dataKey: 'date' },
            { header: 'Vendas Totais', dataKey: 'totalSales' },
            { header: 'Total Pedidos', dataKey: 'totalOrders' },
            { header: 'Valor Médio', dataKey: 'averageOrder' }
          ],
          fileName: `vendas_${selectedPeriod}d`,
          title: `Relatório de Vendas (${selectedPeriod} dias)`
        };
      case 'menu':
        return {
          data: menuAnalytics.map((m: any) => ({
            ...m,
            revenue: formatKz(m.revenue),
            profitMargin: `${m.profitMargin.toFixed(1)}%`
          })),
          columns: [
            { header: 'Prato', dataKey: 'dishName' },
            { header: 'Vendas (Qtd)', dataKey: 'sold' },
            { header: 'Receita', dataKey: 'revenue' },
            { header: 'Margem', dataKey: 'profitMargin' }
          ],
          fileName: 'performance_menu',
          title: 'Performance do Menu'
        };
      case 'estoque':
        return {
          data: stockAnalytics,
          columns: [
            { header: 'Item', dataKey: 'itemName' },
            { header: 'Estoque Atual', dataKey: 'currentStock' },
            { header: 'Mínimo', dataKey: 'minThreshold' },
            { header: 'Dias Restantes', dataKey: 'daysToRunOut' }
          ],
          fileName: 'relatorio_estoque',
          title: 'Relatório de Estoque'
        };
      case 'funcionarios':
        return {
          data: employeePerf.map((p: any) => ({
            ...p,
            name: employees.find((e: any) => e.id === p.employeeId)?.name || 'N/A',
            efficiency: `${p.efficiency.toFixed(1)}%`
          })),
          columns: [
            { header: 'Funcionário', dataKey: 'name' },
            { header: 'Eficiência', dataKey: 'efficiency' },
            { header: 'Avaliação', dataKey: 'rating' }
          ],
          fileName: 'performance_equipa',
          title: 'Performance da Equipa'
        };
      default:
        return { data: [], columns: [], fileName: 'relatorio', title: 'Relatório' };
    }
  };

  const exportConfig = getExportConfig();

  const handleExportPayments = async () => {
    const periodLabel = paymentPeriod === 'ANO'
      ? `Ano ${paymentYear}`
      : paymentPeriod === 'MES'
      ? new Date().toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })
      : paymentPeriod === 'SEMANA'
      ? 'Últimos 7 dias'
      : 'Hoje';

    const data = paymentDailyData.map((row: PaymentDailyDataRow) => {
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

    const columns = [
      { header: 'Data', dataKey: 'data' },
      { header: 'Total', dataKey: 'total' },
      { header: 'Lucro', dataKey: 'lucro' },
      ...paymentMethods.map(method => ({ header: paymentLabels[method], dataKey: paymentLabels[method] }))
    ];

    await exportChartToPDF({
      fileName: `pagamentos_diarios_${new Date().toISOString().split('T')[0]}`,
      title: 'Pagamentos por Dia',
      subtitle: paymentMetric === 'VENDAS' ? 'Vendas por método' : 'Lucro bruto por método',
      periodLabel,
      columns,
      data,
      chartElement: paymentChartRef.current
    });
  };

  return (
    <div className="p-8 h-full overflow-y-auto no-scrollbar bg-background">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Análise Avançada</h1>
            <p className="text-slate-400 text-sm">Insights detalhados e métricas de performance</p>
          </div>
          <div className="flex gap-2">
            <ExportButton {...exportConfig} />
            {[7, 30, 90].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period as 7 | 30 | 90)}
                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all
                  ${selectedPeriod === period
                    ? 'bg-primary text-black shadow-glow'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
              >
                {period}D
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Faturamento Total', value: totalRevenue, icon: ShoppingBag, trend: 'up', suffix: undefined },
            { label: 'Lucro Total Estimado', value: totalProfit, icon: TrendingUp, trend: 'up', suffix: undefined },
            { label: 'Valor Médio', value: avgOrderValue, icon: Target, trend: 'stable', suffix: undefined },
            { label: 'Total Pedidos', value: totalOrders, icon: Zap, trend: 'up', isCurrency: false, suffix: undefined }
          ].map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={i} className="glass-panel rounded-2xl p-6 border border-white/10">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                  <Icon size={20} className={`${kpi.trend === 'up' ? 'text-green-500' : kpi.trend === 'down' ? 'text-red-500' : 'text-slate-500'}`} />
                </div>
                <p className="text-3xl font-black text-white">
                  {kpi.isCurrency === false ? kpi.value.toFixed(0) : formatKz(kpi.value as number)}
                  {kpi.suffix && <span className="text-lg">{kpi.suffix}</span>}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/5 overflow-x-auto">
        {[
          { id: 'vendas', label: '📊 Vendas' },
          { id: 'menu', label: '🍽️ Menu' },
          { id: 'estoque', label: '📦 Estoque' },
          { id: 'funcionarios', label: '👥 Equipa' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all whitespace-nowrap
              ${activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'vendas' && (
        <div className="space-y-6">
          {/* Revenue Trend */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} /> Tendência de Vendas
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyAnalytics}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(value) => formatKz(value)} />
                <Tooltip  
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem' }}
                  formatter={(value) => formatKz(value as number)}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Area type="monotone" dataKey="totalSales" name="Vendas" stroke="#06b6d4" fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="totalProfit" name="Lucro" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders & Peak Hours */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-black text-white mb-4">Pedidos por Dia</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="totalOrders" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-panel rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <Clock size={20} /> Horários de Pico
              </h3>
              <div className="space-y-2">
                {peakHours.length > 0 ? (
                  peakHours.map((hour: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <span className="font-black text-primary text-lg">{hour.toString().padStart(2, '0')}:00</span>
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-purple-500" style={{ width: `${(i + 1) / peakHours.length * 100}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">Sem dados</p>
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/10" ref={paymentChartRef}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <CreditCard size={20} /> Pagamentos por Dia
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1">
                  {(['DIA', 'SEMANA', 'MES', 'ANO'] as const).map((period: any) => (
                    <button
                      key={period}
                      onClick={() => setPaymentPeriod(period)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        paymentPeriod === period ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {period === 'DIA' ? 'Dia' : period === 'SEMANA' ? 'Semana' : period === 'MES' ? 'Mês' : 'Ano'}
                    </button>
                  ))}
                </div>
                {paymentPeriod === 'ANO' && (
                  <select
                    value={paymentYear}
                    onChange={(e) => setPaymentYear(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 outline-none"
                  >
                    {[0, 1, 2, 3, 4].map((offset: number) => {
                      const year = new Date().getFullYear() - offset;
                      return (
                        <option key={year} value={year}>{year}</option>
                      );
                    })}
                  </select>
                )}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1">
                  <button
                    onClick={() => setPaymentMetric('VENDAS')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      paymentMetric === 'VENDAS' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Vendas
                  </button>
                  <button
                    onClick={() => setPaymentMetric('LUCRO')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      paymentMetric === 'LUCRO' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Lucro
                  </button>
                </div>
                <button
                  onClick={handleExportPayments}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white flex items-center gap-2"
                >
                  <Download size={14} /> Exportar PDF
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={paymentChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem' }}
                  formatter={(val: number, name: string) => [formatKz(val), paymentLabels[name as PaymentMethod] || name]}
                />
                {paymentMethods.map((method: any, index: number) => (
                  <Bar
                    key={method}
                    dataKey={method}
                    name={method}
                    stackId="a"
                    fill={COLORS[index % COLORS.length]}
                    radius={index === paymentMethods.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="space-y-6">
          {/* Top Dishes */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <ChefHat size={20} /> Pratos Mais Vendidos
            </h3>
            <div className="space-y-3">
              {topDishes.map((dish: any, i: number) => {
                const analytics = menuAnalytics.find((m: any) => m.dishId === dish.id);
                return (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center font-black text-primary">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">{dish.name}</p>
                      <p className="text-xs text-slate-400">0 unidades vendidas</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary">{formatKz(0)}</p>
                      <p className="text-xs text-slate-400">0% lucro</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Menu Analytics Chart */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-black text-white mb-4">Distribuição de Vendas</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={menuAnalytics.slice(0, 6)}
                  dataKey="revenue"
                  nameKey="dishName"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {menuAnalytics.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem' }}
                  formatter={(value) => formatKz(value as number)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'estoque' && (
        <div className="space-y-6">
          {/* Critical Alerts */}
          {(lowStockItems.length > 0 || criticalStockItems.length > 0) && (
            <div className="glass-panel rounded-2xl p-6 border border-red-500/30 bg-red-500/5">
              <h3 className="text-lg font-black text-red-400 mb-4 flex items-center gap-2">
                <AlertTriangle size={20} /> Alertas de Estoque
              </h3>
              <div className="space-y-2">
                {criticalStockItems.map((item: any) => (
                  <div key={item.itemId} className="p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                    <p className="font-bold text-red-200">{item.itemName}</p>
                    <p className="text-xs text-red-300">{item.daysToRunOut} dias até esgotar | {item.currentStock} unidades</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock Levels */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-black text-white mb-4">Estado do Estoque</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stockAnalytics.map((item: any) => {
                const status = item.currentStock <= item.minThreshold ? 'CRÍTICO' : item.daysToRunOut < 7 ? 'ATENÇÃO' : 'OK';
                const statusColor = status === 'CRÍTICO' ? 'red' : status === 'ATENÇÃO' ? 'yellow' : 'green';

                return (
                  <div key={item.itemId} className="p-3 rounded-lg bg-white/5 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-white text-sm">{item.itemName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden max-w-xs">
                          <div 
                            className={`h-full bg-${statusColor}-500`}
                            style={{ width: `${Math.min(100, (item.currentStock / (item.minThreshold * 2)) * 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold text-${statusColor}-400`}>{status}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-white text-sm">{item.currentStock}</p>
                      <p className="text-xs text-slate-400">Min: {item.minThreshold}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'funcionarios' && (
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <Star size={20} /> Performance da Equipa
          </h3>
          <div className="space-y-4">
            {employeePerf.map((perf: any, i: number) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-white">{employees.find((e: any) => e.id === perf.employeeId)?.name || 'Desconhecido'}</p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, j) => (
                      <span key={j} className={j < Math.floor(perf.rating) ? 'text-yellow-400' : 'text-slate-600'}>★</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-slate-400 mb-1">Eficiência</div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-cyan-400" style={{ width: `${perf.efficiency}%` }} />
                    </div>
                  </div>
                  <span className="font-bold text-primary text-sm">{perf.efficiency.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;

