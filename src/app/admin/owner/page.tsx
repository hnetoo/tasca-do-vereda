'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid 
} from 'recharts';
import { 
  DollarSign, TrendingUp, CreditCard, Activity, 
  ArrowUpRight, ArrowDownRight, Calendar 
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  payment_method: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  created_at: string;
}

export default function OwnerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

        // Fetch Transactions (if table exists, otherwise mock or use orders/expenses)
        // Assuming 'transactions' table exists as per prompt
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
      .filter(o => o.status === 'FECHADO' || o.status === 'PAID') // Adjust based on actual status values
      .reduce((acc, o) => acc + (o.total || 0), 0);

    const totalOrders = orders.length;
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    // Group by hour for chart
    const hourlyData = orders.reduce((acc: any[], order) => {
      const hour = new Date(order.created_at).getHours();
      const existingHour = acc.find(h => h.hour === hour);
      if (existingHour) {
        existingHour.sales += order.total;
      } else {
        acc.push({ hour, sales: order.total });
      }
      return acc;
    }, []).sort((a, b) => a.hour - b.hour);

    return { totalSales, totalOrders, averageTicket, hourlyData };
  }, [orders]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Owner</h1>
          <p className="text-sm text-slate-400">Visão geral em tempo real</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-800 w-fit">
          <Calendar size={16} className="text-primary" />
          <span className="text-sm font-medium">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: pt })}
          </span>
        </div>
      </header>

      {/* KPI Cards Grid - Responsive: 1 col mobile, 3 cols desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Faturação Hoje</h3>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <DollarSign size={20} className="text-emerald-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">€{metrics.totalSales.toFixed(2)}</span>
            <span className="text-xs text-emerald-500 flex items-center">
              <ArrowUpRight size={12} className="mr-1" />
              +12.5%
            </span>
          </div>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Total Pedidos</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <CreditCard size={20} className="text-blue-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{metrics.totalOrders}</span>
            <span className="text-xs text-slate-500">Hoje</span>
          </div>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Ticket Médio</h3>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Activity size={20} className="text-purple-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">€{metrics.averageTicket.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Charts Section - Responsive: Stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm min-h-[300px]">
          <h3 className="text-lg font-semibold mb-6">Vendas por Hora</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.hourlyData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="hour" 
                  stroke="#64748b" 
                  fontSize={12}
                  tickFormatter={(value) => `${value}h`}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12}
                  tickFormatter={(value) => `€${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-6">Últimos Pedidos</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">Pedido #{order.id.slice(0, 8)}</span>
                  <span className="text-xs text-slate-400">
                    {format(new Date(order.created_at), 'HH:mm')} • {order.payment_method || 'Dinheiro'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase
                    ${order.status === 'FECHADO' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}
                  `}>
                    {order.status}
                  </span>
                  <span className="font-bold text-white">€{order.total?.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                Sem pedidos hoje
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

