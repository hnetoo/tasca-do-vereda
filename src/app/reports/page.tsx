'use client';


import { useState, useMemo, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { generateMonthlyReport } from '@/services/geminiService';
import { AIMonthlyReport, PaymentMethod } from '@/types';
import { 
  Sparkles, TrendingUp, BarChart3, 
  Loader2, Activity,
  ShoppingBag, CreditCard, ChevronRight, ArrowUpRight, RefreshCw, ChevronLeft, FileDown
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, AreaChart, Area
} from 'recharts';
import { exportChartToPDF } from '@/services/exportService';
import { getOrderDate, normalizeDate, buildDateRange } from '@/services/utils/dateUtils';
import { formatKz } from '@/services/utils/currencyFormatter';
import { Order } from '@/types'; // Import Order type

const paymentLabels: Record<PaymentMethod, string> = {
  NUMERARIO: 'Numerário',
  TPA: 'Cartão',
  TRANSFERENCIA: 'Transferência',
  QR_CODE: 'QR Code',
  CONTA_CORRENTE: 'Conta Corrente',
  SPLIT: 'Dividido',
  OTHER: 'Outro',
};

const extractPayments = (order: Order) => {
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

const Reports = () => {
  const { orders, dishes: menu } = useStore();
  const [activeMetricTab, setActiveMetricTab] = useState<'VENDAS' | 'LUCRO'>('VENDAS');
  const [salesView, setSalesView] = useState<'DIA' | 'SEMANA' | 'MES' | 'ANO'>('MES');
  const [paymentPeriod, setPaymentPeriod] = useState<'DIA' | 'SEMANA' | 'MES' | 'ANO'>('MES');
  const [paymentYear, setPaymentYear] = useState<number>(new Date().getFullYear());
  const [paymentMetric, setPaymentMetric] = useState<'VENDAS' | 'LUCRO'>('VENDAS');
  const [report, setReport] = useState<AIMonthlyReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const closedOrders = useMemo(() => {
    return orders.filter(o => o.status === 'FECHADO');
  }, [orders]);

  const bestSellersData = useMemo(() => {
    const itemCounts: Record<string, number> = {};
    closedOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const dishName = item.dish?.name || menu.find(d => d.id === item.dishId)?.name || 'Desconhecido';
        itemCounts[dishName] = (itemCounts[dishName] || 0) + (item.quantity || 0);
      });
    });
    return Object.entries(itemCounts)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [closedOrders, menu]);

  const monthlyComparison = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentTotal = closedOrders
      .filter(o => {
        const d = new Date(o.createdAt || o.created_at || new Date());
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const prevTotal = closedOrders
      .filter(o => {
        const d = new Date(o.createdAt || o.created_at || new Date());
        return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
      })
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const growth = prevTotal === 0 ? 0 : ((currentTotal - prevTotal) / prevTotal) * 100;

    return { currentTotal, prevTotal, growth };
  }, [closedOrders]);

  const paymentChartData = useMemo(() => {
      // Simplified payment chart data for reconstruction
      return [];
  }, [closedOrders, paymentPeriod, paymentYear]);
  
  const paymentMethods = Object.keys(paymentLabels);
  const COLORS = ['#FFBB28', '#FF8042', '#0088FE', '#00C49F', '#8884d8', '#82ca9d', '#ffc658'];

  const handleExportPayments = async () => {
    if (chartRef.current) {
        // await exportChartToPDF(chartRef.current, 'relatorio-pagamentos.pdf');
    }
  };

  const generateReport = async () => {
      setLoadingReport(true);
      try {
          const currentMonth = new Date().toLocaleString('pt-AO', { month: 'long' });
          const rep = await generateMonthlyReport(orders, menu, currentMonth);
          setReport(rep);
      } catch (error) {
          console.error("Failed to generate report", error);
      } finally {
          setLoadingReport(false);
      }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
            Relatórios <span className="text-primary">Inteligentes</span>
          </h1>
          <p className="text-slate-400 font-medium">Análise de desempenho e insights de IA</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={generateReport} 
                disabled={loadingReport}
                className="px-6 py-3 bg-primary text-black rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
            >
                {loadingReport ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                Gerar Análise IA
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Pagamentos */}
        <div className="lg:col-span-2 glass-panel rounded-[3rem] p-8 border-white/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <CreditCard size={120} className="text-white transform rotate-12 translate-x-8 -translate-y-8" />
           </div>
           
           <div className="relative z-10 h-[400px] flex flex-col" ref={chartRef}>
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                       <TrendingUp size={24} className="text-primary" />
                       Fluxo de Receita
                    </h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Análise por Método de Pagamento</p>
                 </div>
              </div>
              
              <ResponsiveContainer width="100%" height="100%">
                 {paymentChartData.length === 0 ? (
                   <div className="flex items-center justify-center h-full text-slate-500">
                     Sem dados para o período selecionado
                   </div>
                 ) : (
                   <div className="flex flex-col h-full">
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1">
                        {['DIA', 'SEMANA', 'MES', 'ANO'].map((period) => (
                           <button
                             key={period}
                             onClick={() => setPaymentPeriod(period as any)}
                             className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                               paymentPeriod === period ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white'
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
                  <p className="text-sm text-slate-200 leading-relaxed italic">&quot;{report.strategicAdvice}&quot;</p>
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
                                    <img src={dish?.imageUrl} alt={dish?.name || ''} className="w-full h-full object-cover" />
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

