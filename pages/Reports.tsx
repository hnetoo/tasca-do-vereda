
import { useState, useMemo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { generateMonthlyReport } from '../services/geminiService';
import { AIMonthlyReport, PaymentMethod } from '../types';
import { 
  Sparkles, TrendingUp, BarChart3, 
  Loader2, Activity,
  ShoppingBag, CreditCard, ChevronRight, ArrowUpRight, RefreshCw, ChevronLeft, FileDown
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, AreaChart, Area
} from 'recharts';
import { exportChartToPDF } from '../services/exportService';

const Reports = () => {
  const { activeOrders, menu, expenses, revenues, triggerSync } = useStore();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AIMonthlyReport | null>(null);
  const [activeMetricTab, setActiveMetricTab] = useState<'VENDAS' | 'PRODUTOS' | 'PAGAMENTOS'>('VENDAS');
  const [salesView, setSalesView] = useState<'SEMANA' | 'MES'>('SEMANA');
  const [selectedMonthDate, setSelectedMonthDate] = useState(new Date());
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [paymentPeriod, setPaymentPeriod] = useState<'DIA' | 'SEMANA' | 'MES' | 'ANO'>('SEMANA');
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear());
  const [paymentMetric, setPaymentMetric] = useState<'VENDAS' | 'LUCRO'>('VENDAS');
  const paymentChartRef = useRef<HTMLDivElement | null>(null);

  const closedOrders = useMemo(() => activeOrders.filter(o => o.status === 'FECHADO'), [activeOrders]);

  // --- CÁLCULO DE DADOS ---
  const formatKz = (val: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(val);

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

  const extractPayments = (order: typeof closedOrders[number]) => {
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

  const salesDateRange = useMemo(() => {
    const now = new Date();
    if (salesView === 'SEMANA') {
      const end = normalizeDate(now);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      return { start, end };
    }
    const start = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth(), 1);
    const end = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() + 1, 0);
    return { start, end };
  }, [salesView, selectedMonthDate]);

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

  // 1. Dados de Vendas Diárias
  const dailySalesData = useMemo(() => {
    const { start, end } = salesDateRange;
    const days = buildDateRange(start, end);
    return days.map(date => {
      const dayKey = normalizeDate(date).getTime();
      const dayTotal = closedOrders
        .filter(o => normalizeDate(getOrderDate(o.timestamp || o.createdAt || o.updatedAt)).getTime() === dayKey)
        .reduce((acc, o) => acc + o.total, 0);
      const label = salesView === 'SEMANA'
        ? date.toLocaleDateString('pt-AO', { weekday: 'short' })
        : date.toLocaleDateString('pt-AO', { day: '2-digit' });
      return { name: label, value: dayTotal, date };
    });
  }, [closedOrders, salesDateRange, salesView]);

  const monthlyComparison = useMemo(() => {
    const currentStart = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth(), 1);
    const currentEnd = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() + 1, 0);
    const prevStart = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() - 1, 1);
    const prevEnd = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth(), 0);
    const sumByRange = (start: Date, end: Date) => closedOrders.reduce((acc, order) => {
      const d = normalizeDate(getOrderDate(order.timestamp || order.createdAt || order.updatedAt));
      return d >= start && d <= end ? acc + order.total : acc;
    }, 0);
    const currentTotal = sumByRange(currentStart, currentEnd);
    const prevTotal = sumByRange(prevStart, prevEnd);
    const growth = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : currentTotal > 0 ? 100 : 0;
    return { currentTotal, prevTotal, growth };
  }, [closedOrders, selectedMonthDate]);

  const paymentDailyData = useMemo(() => {
    const { start, end } = paymentDateRange;
    const days = buildDateRange(start, end);
    const profitByDay = new Map<number, number>();
    days.forEach(date => {
      const dayKey = normalizeDate(date).getTime();
      const daySales = closedOrders.reduce((acc, order) => {
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
      closedOrders.forEach(order => {
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
      const label = paymentPeriod === 'ANO'
        ? date.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })
        : date.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
      return {
        date,
        label,
        totalSales,
        totalProfit,
        salesByMethod,
        profitByMethod
      };
    });
  }, [paymentDateRange, closedOrders, expenses, revenues, paymentMethods, paymentPeriod]);

  const paymentChartData = useMemo(() => {
    return paymentDailyData.map(row => {
      const base: Record<string, number | string> = { name: row.label };
      paymentMethods.forEach(method => {
        base[method] = paymentMetric === 'VENDAS' ? row.salesByMethod[method] : row.profitByMethod[method];
      });
      return base;
    });
  }, [paymentDailyData, paymentMethods, paymentMetric]);

  // 2. Produtos Mais Vendidos
  const bestSellersData = useMemo(() => {
    const counts: Record<string, number> = {};
    closedOrders.forEach(order => {
      order.items.forEach(item => {
        counts[item.dishId] = (counts[item.dishId] || 0) + item.quantity;
      });
    });

    return Object.entries(counts)
      .map(([id, quantity]) => ({
        name: menu.find(d => d.id === id)?.name || 'Desconhecido',
        quantity
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [closedOrders, menu]);

  const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  const handleGenerateReport = async () => {
    setLoading(true);
    const result = await generateMonthlyReport(activeOrders, menu, new Date().toLocaleString('pt-AO', { month: 'long' }));
    setReport(result);
    setLoading(false);
  };

  const handleRefreshSales = async () => {
    if (refreshStatus === 'loading') return;
    setRefreshStatus('loading');
    try {
      await triggerSync();
      setRefreshStatus('success');
      setTimeout(() => setRefreshStatus('idle'), 2000);
    } catch {
      setRefreshStatus('error');
      setTimeout(() => setRefreshStatus('idle'), 3000);
    }
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

  const canNavigateNextMonth = selectedMonthDate < new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  return (
    <div className="p-8 h-full overflow-y-auto no-scrollbar bg-background text-slate-200">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
             <Activity size={18} className="animate-pulse" />
             <span className="text-xs font-mono font-bold tracking-[0.3em] uppercase">Business Intelligence</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight italic uppercase">Centro de Análise</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleGenerateReport}
            disabled={loading}
            className="px-6 py-3 bg-primary text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-glow hover:brightness-110 disabled:opacity-70 transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            Insights IA
          </button>
        </div>
      </header>

      {/* Tabs de Métricas */}
      <div className="flex gap-4 mb-8 overflow-x-auto no-scrollbar">
         {[
           { id: 'VENDAS', label: 'Rendimento', icon: TrendingUp },
           { id: 'PRODUTOS', label: 'Produtos', icon: ShoppingBag },
           { id: 'PAGAMENTOS', label: 'Pagamentos', icon: CreditCard }
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveMetricTab(tab.id as 'VENDAS' | 'PRODUTOS' | 'PAGAMENTOS')}
             className={`px-8 py-4 rounded-3xl border transition-all flex items-center gap-3 whitespace-nowrap
               ${activeMetricTab === tab.id ? 'bg-primary/20 border-primary text-primary shadow-glow' : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'}
             `}
           >
             <tab.icon size={20} />
             <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Gráfico Principal Dinâmico */}
        <div className="lg:col-span-2 glass-panel rounded-[3rem] p-8 border-white/5 flex flex-col min-h-[450px]">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <h3 className="text-lg font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                 <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                 Visualização de {activeMetricTab}
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                 {activeMetricTab === 'VENDAS' && (
                   <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1">
                     <button
                       onClick={() => setSalesView('SEMANA')}
                       className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                         salesView === 'SEMANA' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'
                       }`}
                     >
                       Semana
                     </button>
                     <button
                       onClick={() => setSalesView('MES')}
                       className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                         salesView === 'MES' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'
                       }`}
                     >
                       Mês
                     </button>
                   </div>
                 )}
                 {activeMetricTab === 'VENDAS' && salesView === 'MES' && (
                   <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2">
                     <button
                       onClick={() => setSelectedMonthDate(new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() - 1, 1))}
                       className="text-slate-400 hover:text-white"
                     >
                       <ChevronLeft size={16} />
                     </button>
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                       {selectedMonthDate.toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })}
                     </span>
                     <button
                       onClick={() => setSelectedMonthDate(new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() + 1, 1))}
                       className={`text-slate-400 hover:text-white ${!canNavigateNextMonth ? 'opacity-40 pointer-events-none' : ''}`}
                     >
                       <ChevronRight size={16} />
                     </button>
                   </div>
                 )}
                 <button
                   onClick={handleRefreshSales}
                   className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white"
                 >
                   <RefreshCw size={14} className={refreshStatus === 'loading' ? 'animate-spin' : ''} />
                 </button>
              </div>
           </div>
           {activeMetricTab === 'VENDAS' && refreshStatus !== 'idle' && (
             <div className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${
               refreshStatus === 'success' ? 'text-emerald-400' :
               refreshStatus === 'error' ? 'text-red-400' : 'text-slate-400'
             }`}>
               {refreshStatus === 'loading' ? 'Atualizando dados em tempo real...' :
                refreshStatus === 'success' ? 'Atualização concluída com sucesso.' :
                'Erro ao atualizar dados. Tente novamente.'}
             </div>
           )}

           <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 {activeMetricTab === 'VENDAS' ? (
                   <AreaChart data={dailySalesData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(val) => `${val/1000}k`} />
                      <Tooltip 
                        contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '16px', border: '1px solid #ffffff10'}}
                        formatter={(val: number) => [formatKz(val), 'Vendas']}
                      />
                      <Area type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                   </AreaChart>
                 ) : activeMetricTab === 'PRODUTOS' ? (
                   <BarChart data={bestSellersData} layout="vertical" margin={{ left: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff10" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} width={100} />
                      <Tooltip 
                        cursor={{fill: '#ffffff05'}}
                        contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '16px'}}
                      />
                      <Bar dataKey="quantity" fill="#06b6d4" radius={[0, 10, 10, 0]} barSize={30} />
                   </BarChart>
                 ) : (
                   <div className="flex flex-col h-full" ref={paymentChartRef}>
                     <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
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
                       <div className="flex items-center gap-2">
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
                           <FileDown size={14} /> Exportar PDF
                         </button>
                       </div>
                     </div>
                     <div className="flex-1 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={paymentChartData}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(val) => `${val/1000}k`} />
                           <Tooltip
                             contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '16px', border: '1px solid #ffffff10'}}
                             formatter={(val: number, name: string) => [formatKz(val), paymentLabels[name as PaymentMethod] || name]}
                           />
                           {paymentMethods.map((method, index) => (
                             <Bar key={method} dataKey={method} stackId="a" fill={COLORS[index % COLORS.length]} radius={[6, 6, 0, 0]} />
                           ))}
                         </BarChart>
                       </ResponsiveContainer>
                     </div>
                   </div>
                 )}
              </ResponsiveContainer>
           </div>
           {activeMetricTab === 'VENDAS' && salesView === 'MES' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
               <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total do Mês</p>
                 <p className="text-xl font-mono font-bold text-white">{formatKz(monthlyComparison.currentTotal)}</p>
               </div>
               <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Mês Anterior</p>
                 <p className="text-xl font-mono font-bold text-slate-300">{formatKz(monthlyComparison.prevTotal)}</p>
               </div>
               <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Crescimento</p>
                 <p className={`text-xl font-mono font-bold ${monthlyComparison.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                   {monthlyComparison.growth >= 0 ? '+' : ''}{monthlyComparison.growth.toFixed(1)}%
                 </p>
               </div>
             </div>
           )}
        </div>

        {/* IA Sidebar Report */}
        <div className="glass-panel rounded-[3rem] p-8 border-primary/20 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center gap-4 mb-8 z-10">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-blue-600 shadow-glow">
                <Sparkles className="text-white" size={24} />
            </div>
            <div>
               <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Chef IA Analyst</h3>
               <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Consultoria Estratégica</p>
            </div>
          </div>
          
          {!report ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-center gap-4 z-10">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/5 flex items-center justify-center animate-pulse">
                    <Activity size={32} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">Solicite uma análise para<br/>obter insights do Chef</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 z-10 overflow-y-auto no-scrollbar">
               <div className="bg-slate-800/50 p-6 rounded-3xl border-l-4 border-primary">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-3">Diagnóstico Operacional</p>
                  <p className="text-sm text-slate-200 leading-relaxed italic">"{report.strategicAdvice}"</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                     <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">Eficiência</p>
                     <p className="text-sm font-black text-green-400">{report.operationalEfficiency}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                     <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">Sentiment</p>
                     <p className="text-sm font-black text-blue-400">{report.customerSentiment}</p>
                  </div>
               </div>

               <div className="pt-4 border-t border-white/5">
                  <p className="text-[10px] text-slate-500 font-black uppercase mb-4 tracking-widest">Previsão de Produto</p>
                  <div className="flex items-center justify-between bg-primary/10 p-4 rounded-2xl border border-primary/20">
                     <span className="text-xs font-bold text-white uppercase">{report.topSellingItem}</span>
                     <ArrowUpRight size={18} className="text-primary" />
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Top Vendas Detalhada */}
      <div className="glass-panel rounded-[3rem] overflow-hidden border-white/5 mb-12">
         <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3">
               <BarChart3 size={22} className="text-primary" /> 
               Inventário em Movimento
            </h3>
            <button className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white flex items-center gap-2">
               Ver Tudo <ChevronRight size={14}/>
            </button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-white/5 border-b border-white/5">
                  <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                     <th className="px-8 py-6">Produto</th>
                     <th className="px-8 py-6">Categoria</th>
                     <th className="px-8 py-6">Qtd. Vendida</th>
                     <th className="px-8 py-6">Preço Médio</th>
                     <th className="px-8 py-6 text-right">Rendimento Total</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {bestSellersData.map((item, idx) => {
                     const dish = menu.find(d => d.name === item.name);
                     return (
                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors">
                                    <img src={dish?.image} className="w-full h-full object-cover" />
                                 </div>
                                 <span className="font-bold text-white text-sm">{item.name}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-[9px] font-black uppercase">
                                 {dish?.categoryId || 'Geral'}
                              </span>
                           </td>
                           <td className="px-8 py-6 font-mono text-sm font-bold text-white">
                              {item.quantity} un.
                           </td>
                           <td className="px-8 py-6 font-mono text-xs text-slate-500">
                              {formatKz(dish?.price || 0)}
                           </td>
                           <td className="px-8 py-6 text-right font-mono font-black text-primary">
                              {formatKz((dish?.price || 0) * item.quantity)}
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default Reports;
