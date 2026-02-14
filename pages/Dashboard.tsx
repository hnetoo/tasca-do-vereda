import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, BarChart, Bar } from 'recharts';
import { DollarSign, ShoppingBag, Users, TrendingUp, Sparkles, Loader2, Activity, ChefHat, QrCode, ArrowRight, Utensils, Clock, Download } from 'lucide-react';
import { analyzeBusinessPerformance } from '../services/geminiService';
import { AIAnalysisResult, PaymentMethod } from '../types';
import { useNavigate } from 'react-router-dom';
import ExportButton from '../components/ExportButton';
import { exportChartToPDF } from '../services/exportService';

const Dashboard = () => {
  const { 
    activeOrders, orders, customers, menu, settings, expenses, revenues,
    getDailySalesAnalytics, getMenuAnalytics, saveStatus 
  } = useStore();
  
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [performanceRange, setPerformanceRange] = useState<'SEMANA' | '30D'>('SEMANA');
  const [paymentPeriod, setPaymentPeriod] = useState<'DIA' | 'SEMANA' | 'MES' | 'ANO'>('SEMANA');
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear());
  const [paymentMetric, setPaymentMetric] = useState<'VENDAS' | 'LUCRO'>('VENDAS');
  const paymentChartRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // Métricas em Tempo Real
  const closedOrders = useMemo(() => orders.filter(o => o.status === 'FECHADO'), [orders]);
  const activeOrderCount = useMemo(() => activeOrders.filter(o => o.status === 'ABERTO').length, [activeOrders]);
  
  const dailyAnalytics = useMemo(() => getDailySalesAnalytics(7), [getDailySalesAnalytics]);
  const performanceAnalytics = useMemo(() => getDailySalesAnalytics(performanceRange === 'SEMANA' ? 7 : 30), [getDailySalesAnalytics, performanceRange]);
  const todayStats = useMemo(() => dailyAnalytics[dailyAnalytics.length - 1] || { totalSales: 0, totalProfit: 0, totalOrders: 0 }, [dailyAnalytics]);
  
  const totalSales = useMemo(() => closedOrders.reduce((acc, o) => acc + o.total, 0), [closedOrders]);
  const totalProfit = useMemo(() => dailyAnalytics.reduce((acc, d) => acc + (d.totalProfit || 0), 0), [dailyAnalytics]);
  const avgMargin = useMemo(() => totalSales > 0 ? (totalProfit / totalSales) * 100 : 0, [totalSales, totalProfit]);
  const chartData = performanceAnalytics.map(d => ({
    name: new Date(d.date).toLocaleDateString('pt-AO', { weekday: 'short' }),
    vendas: d.totalSales,
    lucro: d.totalProfit
  }));

  const paymentMethods: PaymentMethod[] = ['NUMERARIO', 'TPA', 'TRANSFERENCIA', 'QR_CODE', 'CONTA_CORRENTE'];
  const paymentLabels: Record<PaymentMethod, string> = {
    NUMERARIO: 'Numerário',
    TPA: 'Cartão',
    TRANSFERENCIA: 'Transferência',
    QR_CODE: 'QR Code',
    CONTA_CORRENTE: 'Conta Corrente',
    MBWAY: 'MBWay',
    OUTROS: 'Outros',
    Cash: 'Dinheiro',
    Card: 'Cartão',
    MBWay: 'MBWay',
    Other: 'Outros'
  };

  const handleAIAnalysis = async () => {
    setLoadingAi(true);
    const result = await analyzeBusinessPerformance(activeOrders, menu);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(val);
  };

  const getOrderDate = (timestamp?: string | number | Date) => {
    const d = timestamp ? new Date(timestamp) : new Date(0);
    return isNaN(d.getTime()) ? new Date(0) : d;
  };

  const normalizeDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const buildDateRange = (start: Date, end: Date) => {
    const dates: Date[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      dates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  };

  const extractPayments = (order: typeof orders[number]) => {
    if (order.splitPayments && order.splitPayments.length > 0) {
      return order.splitPayments.map(p => ({ method: p.method, amount: p.amount }));
    }
    if (order.payments && order.payments.length > 0) {
      return order.payments.map(p => ({ method: p.method, amount: p.amount }));
    }
    if (order.paymentMethod) {
      return [{ method: order.paymentMethod, amount: order.total }];
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
    const closed = orders.filter(o => o.status === 'FECHADO' || o.status === 'PAGO');
    const { start, end } = paymentDateRange;
    const days = buildDateRange(start, end);
    const profitByDay = new Map<number, number>();
    days.forEach(date => {
      const dayKey = normalizeDate(date).getTime();
      const daySales = closed.reduce((acc, order) => {
        const d = normalizeDate(getOrderDate(order.timestamp || order.createdAt || order.updatedAt));
        return d.getTime() === dayKey ? acc + order.total : acc;
      }, 0);
      const dayExpenses = (expenses || []).reduce((acc, exp) => {
        const d = normalizeDate(getOrderDate(exp.date));
        return d.getTime() === dayKey ? acc + exp.amount : acc;
      }, 0);
      const dayRevenues = (revenues || []).reduce((acc, rev) => {
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
        CONTA_CORRENTE: 0,
        MBWAY: 0,
        OUTROS: 0,
        Cash: 0,
        Card: 0,
        MBWay: 0,
        Other: 0
      };
      closed.forEach(order => {
        const orderDate = normalizeDate(getOrderDate(order.timestamp || order.createdAt || order.updatedAt));
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
  }, [orders, expenses, revenues, paymentDateRange, paymentMethods]);

  const paymentChartData = useMemo(() => {
    return paymentDailyData.map(row => {
      const base: Record<string, number | string> = { name: row.label };
      paymentMethods.forEach(method => {
        base[method] = paymentMetric === 'VENDAS' ? row.salesByMethod[method] : row.profitByMethod[method];
      });
      return base;
    });
  }, [paymentDailyData, paymentMethods, paymentMetric]);

  const exportConfig = {
    data: dailyAnalytics.map(d => ({
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

  const handleExportPayments = async () => {
    const periodLabel = paymentPeriod === 'ANO'
      ? `Ano ${paymentYear}`
      : paymentPeriod === 'MES'
      ? new Date().toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })
      : paymentPeriod === 'SEMANA'
      ? 'Últimos 7 dias'
      : 'Hoje';

    const data = paymentDailyData.map(row => {
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
    <div className="p-4 md:p-6 h-full overflow-y-auto no-scrollbar bg-slate-950 text-white">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
             <Activity size={16} className="animate-pulse"/>
             <span className="text-xs font-mono font-bold tracking-widest uppercase">Sistema Operativo v2.0</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase italic">Painel de Comando</h2>
          <p className="text-slate-400 text-sm mt-1">Visão geral em tempo real</p>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          {settings.supabaseConfig?.enabled && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              saveStatus === 'SAVING' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
              saveStatus === 'ERROR' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
              'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                saveStatus === 'SAVING' ? 'bg-blue-500 animate-pulse' :
                saveStatus === 'ERROR' ? 'bg-red-500' :
                'bg-emerald-500 shadow-[0_0_8px_#10b981]'
              }`} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
                {saveStatus === 'SAVING' ? 'Sincronizando...' : 
                 saveStatus === 'ERROR' ? 'Erro Sinc' : 'Cloud Link'}
              </span>
            </div>
          )}

          <button 
            onClick={() => navigate('/qr-scanner')}
            className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-primary/50 text-slate-300 hover:text-white transition-all flex items-center gap-2 group flex-1 md:flex-none justify-center"
          >
            <QrCode size={18} className="group-hover:text-primary transition-colors"/>
            <span className="text-xs font-bold uppercase tracking-wide">Ler QR Code</span>
          </button>
          
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

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6 auto-rows-[minmax(140px,auto)]">
        
        {/* Total Revenue - Large Card */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-1 bg-slate-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-primary/20 transition-colors">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
             <DollarSign size={100} />
          </div>
          <div className="flex flex-col h-full justify-between relative z-10">
            <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest">
              <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_#06b6d4]"></div>
              Receita Total
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-mono font-bold text-white tracking-tighter">{formatKz(totalSales)}</p>
              <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 font-bold bg-emerald-400/10 w-fit px-2 py-1 rounded-lg">
                 <TrendingUp size={12} /> +12.5% vs ontem
              </div>
            </div>
          </div>
        </div>

        {/* Total Profit - Large Card */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-1 bg-slate-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-emerald-500/20 transition-colors">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
             <TrendingUp size={100} />
          </div>
          <div className="flex flex-col h-full justify-between relative z-10">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
              <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
              Lucro do Dia
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-mono font-bold text-white tracking-tighter">{formatKz(todayStats?.totalProfit ?? 0)}</p>
              <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 font-bold bg-emerald-400/10 w-fit px-2 py-1 rounded-lg">
                 <TrendingUp size={12} /> Estimado
              </div>
            </div>
          </div>
        </div>

        {/* Active Orders - Standard Card */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-1 bg-slate-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-blue-500/20 transition-colors">
          <div className="absolute -bottom-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
             <ShoppingBag size={100} />
          </div>
          <div className="flex flex-col h-full justify-between relative z-10">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-black uppercase tracking-widest">
              <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></div>
              Pedidos Ativos
            </div>
            <div className="flex items-end justify-between">
              <p className="text-4xl md:text-5xl font-mono font-bold text-white tracking-tighter">{activeOrderCount}</p>
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
        <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-gradient-to-br from-primary/10 to-slate-900 border border-primary/20 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between">
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
                <div className="text-xs font-bold text-white">{customers.filter(c => c.balance > 0).length} c/ Dívida</div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/pos')}
            className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-wider hover:bg-primary transition-colors flex items-center justify-center gap-2 shadow-lg mt-4"
          >
            Abrir POS <ArrowRight size={18} />
          </button>
        </div>

        {/* Sales Chart - Wide Card */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 row-span-2 bg-slate-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl relative">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest">
              <Activity size={14} />
              {performanceRange === 'SEMANA' ? 'Performance Semanal' : 'Performance 30 Dias'}
            </div>
            <select
              value={performanceRange}
              onChange={(e) => setPerformanceRange(e.target.value as 'SEMANA' | '30D')}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2 py-1 outline-none"
            >
              <option value="SEMANA">Esta Semana</option>
              <option value="30D">Últimos 30 dias</option>
            </select>
          </div>
          
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff'}}
                  itemStyle={{color: '#06b6d4'}}
                  formatter={(value: number) => [formatKz(value), 'Vendas']}
                  labelStyle={{display: 'none'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="#06b6d4" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorVendas)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-1 md:col-span-4 lg:col-span-6 row-span-2 bg-slate-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl" ref={paymentChartRef}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest">
              <ShoppingBag size={14} />
              Pagamentos por Dia
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1">
                {(['DIA', 'SEMANA', 'MES', 'ANO'] as const).map(period => (
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
                  {[0, 1, 2, 3, 4].map(offset => {
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
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff'}}
                  formatter={(value: number, name: string) => [formatKz(value), paymentLabels[name as PaymentMethod] || name]}
                  labelStyle={{display: 'none'}}
                />
                {paymentMethods.map((method, index) => (
                  <Bar key={method} dataKey={method} stackId="a" fill={['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'][index % 5]} radius={[6, 6, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Weather/Time Widget - Small Card */}
        <div className="col-span-1 row-span-1 bg-slate-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl flex flex-col justify-center items-center text-center">
          <Clock size={32} className="text-slate-500 mb-2" />
          <p className="text-2xl font-black text-white">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">
            {new Date().toLocaleDateString('pt-AO', {weekday: 'long'})}
          </p>
        </div>

        {/* AI Insight - Wide Low Card */}
        {aiAnalysis && (
          <div className="col-span-1 md:col-span-4 lg:col-span-6 row-span-auto bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-6 rounded-3xl relative overflow-hidden animate-in slide-in-from-bottom duration-500">
             <div className="flex items-start gap-4">
                <div className="bg-indigo-500/20 p-3 rounded-xl text-indigo-400 shrink-0">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-2">Insight Tático (IA)</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">{aiAnalysis.summary}</p>
                  
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 text-sm text-slate-300">
                      <span className="text-primary font-bold mr-2">Recomendação:</span>
                      {aiAnalysis.recommendation}
                    </div>
                  </div>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
