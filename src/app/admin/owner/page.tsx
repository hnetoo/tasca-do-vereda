'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, CartesianGrid, LineChart, Line, Legend
} from 'recharts';
import { 
  DollarSign, TrendingUp, CreditCard, Activity, 
  ArrowUpRight, ArrowDownRight, Calendar, Users, Clock, 
  Utensils, AlertCircle, Wifi, Wallet, 
  Banknote, TrendingDown, Layers
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { formatAOA } from '@/utils/format';
import { useStore } from '@/store/useStore';
import KPICard from '@/components/KPICard';
import { Order, Transaction } from '@/types';

export default function OwnerDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { employees, tables, currentUser } = useStore(); 

  // Admin Verification
  useEffect(() => {
    // If we have a currentUser but they are not admin/owner/manager, redirect
    // We wait for currentUser to be populated (it might be null initially)
    if (currentUser) {
       if (currentUser.role !== 'ADMIN' && currentUser.role !== 'OWNER' && currentUser.role !== 'MANAGER') {
          router.push('/pos'); 
       }
    }
    // Note: If currentUser is null, we might be loading or not logged in. 
    // Ideally we should have a loading state for auth.
  }, [currentUser, router]);

  // Initial Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch Orders (Today)
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .gte('created_at', today.toISOString())
          .order('created_at', { ascending: false });

        // Fetch Transactions
        const { data: transData } = await supabase
          .from('transactions')
          .select('*')
          .gte('created_at', today.toISOString())
          .order('created_at', { ascending: false });

        if (ordersData) setOrders(ordersData);
        if (transData) setTransactions(transData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Realtime Subscriptions
    const ordersChannel = supabase
      .channel('owner-dashboard-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new as Order, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
        }
      })
      .subscribe();

    const transactionsChannel = supabase
      .channel('owner-dashboard-transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTransactions(prev => [payload.new as Transaction, ...prev]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, []);

  // Metrics Calculation
  const metrics = useMemo(() => {
    const totalSales = orders
      .filter(o => o.status === 'FECHADO' || o.status === 'PAID')
      .reduce((acc, o) => acc + Number(o.total || 0), 0);

    const activeOrders = orders.filter(o => o.status && ['PENDENTE', 'PREPARANDO', 'PRONTO'].includes(o.status)).length;
    
    // Expenses (Mock if no transactions)
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const netProfit = totalSales - totalExpenses;
    const cashFlow = totalSales - totalExpenses; // Simplified for now

    // Staff active (Mock logic or use store)
    const activeStaff = employees?.filter((e: any) => e.status === 'ATIVO').length || 0;

    // Free tables
    const freeTables = tables?.filter((t: any) => t.status === 'LIVRE').length || 0;

    // Hourly Data for Chart
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: i, sales: 0, profit: 0 }));
    orders.forEach(order => {
      const dateStr = order.createdAt ? new Date(order.createdAt).toISOString() : null;
      if (!dateStr) return;
      const hour = new Date(dateStr).getHours();
      if (hourlyData[hour]) {
        hourlyData[hour].sales += (order.total || 0);
        // Assume 30% profit margin for simplicity if no expense data per order
        hourlyData[hour].profit += (order.total || 0) * 0.3;
      }
    });
    
    // Filter out future hours or empty leading hours if desired, but keeping 24h format is fine
    const chartData = hourlyData.filter(h => h.sales > 0 || h.hour <= new Date().getHours());

    return { 
      totalSales, 
      activeOrders, 
      totalOrders: orders.length,
      activeStaff,
      freeTables,
      totalExpenses,
      cashFlow,
      netProfit,
      chartData,
      avgPrepTime: '15m', // Mock
      loyalty: '85%' // Mock
    };
  }, [orders, transactions, employees, tables]);

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 md:pb-8">
      {/* Top Header - Remote View */}
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-blue-400 tracking-wider">REMOTE VIEW</h2>
              <span className="animate-pulse h-2 w-2 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-xs text-slate-500">Dashboard em Tempo Real (Nuvem)</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end mr-2 hidden md:flex">
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                <Wifi size={12} /> Online
              </span>
              <span className="text-[10px] text-slate-500">{format(new Date(), 'HH:mm:ss')}</span>
            </div>
            <button className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-blue-400 hover:bg-slate-800">
              <Activity size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-6">
        {/* KPI Grid - 3 Columns Layout as per screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Row 1 */}
          <KPICard 
            title="HOJE" 
            value={formatAOA(metrics.totalSales)} 
            subtitle={`${metrics.totalOrders} pedidos`}
            icon={<DollarSign size={16} className="text-blue-400" />}
            trend="up"
          />
          <KPICard 
            title="ATIVOS" 
            value={metrics.activeOrders.toString()} 
            subtitle="mesas ativas"
            icon={<Layers size={16} className="text-slate-400" />}
          />
          <KPICard 
            title="EQUIPA" 
            value={metrics.activeStaff.toString()} 
            subtitle="ao serviço"
            icon={<Users size={16} className="text-emerald-500" />}
          />

          {/* Row 2 */}
          <KPICard 
            title="LOYALTY" 
            value={metrics.loyalty} 
            subtitle="retenção"
            icon={<TrendingUp size={16} className="text-purple-500" />}
            trend="up"
          />
          <KPICard 
            title="PREPARO MÉDIO" 
            value={metrics.avgPrepTime} 
            subtitle="por pedido"
            icon={<Clock size={16} className="text-amber-500" />}
          />
          <KPICard 
            title="MESAS LIVRES" 
            value={metrics.freeTables.toString()} 
            subtitle="disponíveis"
            icon={<Utensils size={16} className="text-blue-400" />}
          />

          {/* Row 3 */}
          <KPICard 
            title="DESPESAS HOJE" 
            value={formatAOA(metrics.totalExpenses)} 
            subtitle="saídas"
            icon={<TrendingDown size={16} className="text-red-500" />}
            color="text-red-400"
          />
          <KPICard 
            title="FLUXO DE CAIXA" 
            value={formatAOA(metrics.cashFlow)} 
            subtitle="hoje"
            icon={<Wallet size={16} className="text-emerald-500" />}
            color="text-emerald-400"
          />
          <KPICard 
            title="LUCRO LÍQUIDO" 
            value={formatAOA(metrics.netProfit)} 
            subtitle="hoje"
            icon={<Banknote size={16} className="text-blue-500" />}
            color="text-blue-400"
          />
        </div>

        {/* Navigation Tabs (Visual only as per design, could be functional links) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar md:justify-start">
          {['COMANDO', 'ANALYTICS', 'ANÁLISES', 'FINANÇAS', 'SISTEMA', 'ESCALAS', 'RESERVAS'].map((tab, i) => (
            <button 
              key={tab}
              className={`
                px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors
                ${i === 2 ? 'bg-cyan-500 text-black' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'}
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart - Revenue vs Profit */}
          <div className="lg:col-span-2 bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm min-h-[350px]">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Receita vs Lucro (Hoje)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#64748b" 
                    fontSize={10}
                    tickFormatter={(value) => `${value}h`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10}
                    tickFormatter={(value) => new Intl.NumberFormat('en', { notation: "compact" }).format(value)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    name="Vendas"
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    name="Lucro"
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorProfit)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods Chart */}
          <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Métodos de Pagamento</h3>
             {/* Simple Bar Chart for payment methods */}
             <div className="h-[300px] w-full flex items-center justify-center text-slate-500 text-sm">
                <p>Gráfico de métodos em breve...</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
