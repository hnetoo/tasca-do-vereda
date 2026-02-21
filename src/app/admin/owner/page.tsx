'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  DollarSign, TrendingUp, Users, Clock, 
  Utensils, Wallet, Banknote, TrendingDown, Layers, Activity, Wifi,
  Lock, Mail, AlertTriangle, Loader2
} from 'lucide-react';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { formatAOA } from '@/utils/format';
import { useStore } from '@/store/useStore';
import KPICard from '@/components/KPICard';
import { Order, Transaction, PaymentMethod } from '@/types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockUntil, setBlockUntil] = useState<Date | null>(null);
  const { loginWithPassword, currentUser, logout } = useStore();
  const router = useRouter();

  // Load block state from localStorage
  useEffect(() => {
    const savedBlockUntil = localStorage.getItem('admin_block_until');
    const savedAttempts = localStorage.getItem('admin_login_attempts');

    if (savedBlockUntil) {
      const blockDate = new Date(savedBlockUntil);
      if (blockDate > new Date()) {
        setBlockUntil(blockDate);
        setIsBlocked(true);
      } else {
        localStorage.removeItem('admin_block_until');
        localStorage.removeItem('admin_login_attempts');
      }
    }
    
    if (savedAttempts) {
        setAttempts(parseInt(savedAttempts, 10));
    }
  }, []);

  // Handle Lockout Timer
  useEffect(() => {
    if (blockUntil) {
      const interval = setInterval(() => {
        if (new Date() > blockUntil) {
          setIsBlocked(false);
          setBlockUntil(null);
          setAttempts(0);
          setError('');
          localStorage.removeItem('admin_block_until');
          localStorage.removeItem('admin_login_attempts');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [blockUntil]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) return;
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await loginWithPassword(email, password);

      if (result.success) {
        // Verify role immediately
        const user = useStore.getState().currentUser;
        const role = user?.role?.toUpperCase();
        
        if (role !== 'OWNER' && role !== 'ADMIN') {
            await logout();
            setError('Acesso negado. Permissão insuficiente.');
            return;
        }

        // Clear block state on success
        localStorage.removeItem('admin_block_until');
        localStorage.removeItem('admin_login_attempts');
        setAttempts(0);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem('admin_login_attempts', newAttempts.toString());
        
        if (newAttempts >= 3) {
          setIsBlocked(true);
          const blockDate = new Date(Date.now() + 60 * 1000); // 1 minute block
          setBlockUntil(blockDate);
          localStorage.setItem('admin_block_until', blockDate.toISOString());
          setError('Muitas tentativas falhadas. Acesso bloqueado temporariamente.');
        } else {
          setError(result.error || 'Credenciais inválidas.');
        }
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar entrar.');
    } finally {
      setIsLoading(false);
    }
  };

  // If we are blocked, calculate time remaining
  const timeRemaining = blockUntil ? Math.ceil((blockUntil.getTime() - new Date().getTime()) / 1000) : 0;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
            <Lock className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Administrativo</h1>
          <p className="text-slate-400">Área restrita a Owner e Admin</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
            <AlertTriangle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {isBlocked ? (
           <div className="text-center p-6 bg-slate-800 rounded-xl border border-slate-700">
             <Clock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
             <h3 className="text-lg font-medium text-white mb-2">Acesso Bloqueado</h3>
             <p className="text-slate-400 mb-4">Muitas tentativas falhadas.</p>
             <p className="text-2xl font-bold text-amber-500">{timeRemaining}s</p>
             <p className="text-xs text-slate-500 mt-2">Aguarde para tentar novamente</p>
           </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="admin@exemplo.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Verificando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        )}
        
        <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Voltar ao Menu Principal
            </Link>
        </div>
      </div>
    </div>
  );
}

export default function OwnerDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [yesterdaySales, setYesterdaySales] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { employees, tables, currentUser, logout } = useStore(); 
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Auth Check
  useEffect(() => {
    // Only proceed if store is initialized or we have a user
    if (currentUser) {
        const role = (currentUser.role || '').toUpperCase();
        if (role === 'OWNER' || role === 'ADMIN') {
            setIsAuthorized(true);
        } else {
            setIsAuthorized(false);
        }
    } else {
        setIsAuthorized(false);
    }
    setAuthChecked(true);
  }, [currentUser]);

  // Auth Check
  useEffect(() => {
    // Only proceed if store is initialized or we have a user
    if (currentUser) {
        const role = (currentUser.role || '').toUpperCase();
        if (role === 'OWNER' || role === 'ADMIN') {
            setIsAuthorized(true);
        } else {
            setIsAuthorized(false);
        }
    } else {
        setIsAuthorized(false);
    }
    setAuthChecked(true);
  }, [currentUser]);

  // Initial Fetch
  useEffect(() => {
    if (!isAuthorized) return; // Don't fetch if not authorized

    const fetchData = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Fetch Orders (Today)
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .gte('created_at', today.toISOString())
          .order('created_at', { ascending: false });

        // Fetch Orders (Yesterday) for trend
        const { data: yesterdayData } = await supabase
          .from('orders')
          .select('total, status')
          .gte('created_at', yesterday.toISOString())
          .lt('created_at', today.toISOString());

        // Calculate Yesterday Sales
        if (yesterdayData) {
            const total = yesterdayData
                .filter(o => o.status === 'FECHADO' || o.status === 'PAID')
                .reduce((acc, o) => acc + Number(o.total || 0), 0);
            setYesterdaySales(total);
        }

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
  }, [isAuthorized]);

  // Metrics Calculation
  const metrics = useMemo(() => {
    const closedOrders = orders.filter(o => o.status === 'FECHADO' || o.status === 'PAID');
    
    const totalSales = closedOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);

    // Sales Trend Calculation
    let salesTrend: 'up' | 'down' | 'neutral' = 'neutral';
    let salesTrendValue = '0%';
    
    if (yesterdaySales > 0) {
        const diff = totalSales - yesterdaySales;
        const percentage = (diff / yesterdaySales) * 100;
        salesTrend = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
        salesTrendValue = `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`;
    } else if (totalSales > 0) {
        salesTrend = 'up';
        salesTrendValue = '+100%'; // First day or no sales yesterday
    }

    const activeOrders = orders.filter(o => o.status && ['PENDENTE', 'PREPARANDO', 'PRONTO'].includes(o.status)).length;
    
    // Expenses (from transactions table)
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const netProfit = totalSales - totalExpenses;
    const cashFlow = totalSales - totalExpenses; 
    
    // Active Staff (filtering only if employees exists)
    const activeStaff = employees ? employees.filter((e: any) => e.status === 'ATIVO').length : 0;

    // Free tables
    const freeTables = tables ? tables.filter((t: any) => t.status === 'LIVRE').length : 0;

    // Prep Time Calculation
    let totalPrepTime = 0;
    let prepCount = 0;
    closedOrders.forEach(order => {
        if (order.created_at && order.updated_at) {
            const start = parseISO(order.created_at as string);
            const end = parseISO(order.updated_at as string);
            const diff = differenceInMinutes(end, start);
            if (diff > 0 && diff < 120) { // Filter out outliers > 2 hours
                totalPrepTime += diff;
                prepCount++;
            }
        }
    });
    const avgPrepTime = prepCount > 0 ? `${Math.round(totalPrepTime / prepCount)}m` : '15m'; // Default to 15m if no data

    // Hourly Data for Chart
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: i, sales: 0, profit: 0 }));
    orders.forEach(order => {
      if (!order.created_at) return;
      const dateObj = new Date(order.created_at);
      if (isNaN(dateObj.getTime())) return;
      const hour = dateObj.getHours();
      if (hourlyData[hour]) {
        hourlyData[hour].sales += (order.total || 0);
        // Assume 30% profit margin for simplicity if no expense data per order
        hourlyData[hour].profit += (order.total || 0) * 0.3;
      }
    });
    
    const chartData = hourlyData.filter(h => h.sales > 0 || h.hour <= new Date().getHours());

    // Payment Methods Distribution
    const paymentMethodsMap: Record<string, number> = {};
    
    closedOrders.forEach(order => {
        // Check split payments first
        if (order.split_payments && order.split_payments.length > 0) {
            order.split_payments.forEach(split => {
                const method = split.method || 'OTHER';
                paymentMethodsMap[method] = (paymentMethodsMap[method] || 0) + (split.amount || 0);
            });
        } else if (order.payment_method) {
            const method = order.payment_method;
            paymentMethodsMap[method] = (paymentMethodsMap[method] || 0) + (order.total || 0);
        }
    });

    const paymentMethodsData = Object.entries(paymentMethodsMap).map(([name, value], index) => ({
        name: name.replace('_', ' '), // Format name (e.g. QR_CODE -> QR CODE)
        value
    }));

    // If empty, add a placeholder for visualization
    if (paymentMethodsData.length === 0) {
        paymentMethodsData.push({ name: 'Nenhum', value: 1 });
    }

    return { 
      totalSales, 
      salesTrend,
      salesTrendValue,
      activeOrders, 
      totalOrders: orders.length,
      activeStaff,
      freeTables,
      totalExpenses,
      cashFlow,
      netProfit,
      chartData,
      avgPrepTime,
      loyalty: '85%', // Mock for now as requested
      paymentMethodsData
    };
  }, [orders, transactions, employees, tables, yesterdaySales]);

  // If not authorized, show login form
  if (authChecked && !isAuthorized) {
    if (currentUser) {
        // User is logged in but not authorized
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
                    <p className="text-slate-400 mb-6">O utilizador {currentUser.name} ({currentUser.role}) não tem permissão para aceder a esta área.</p>
                    <button 
                        onClick={() => { logout(); window.location.href = '/admin/owner'; }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors w-full"
                    >
                        Terminar Sessão
                    </button>
                </div>
            </div>
        );
    }
    return <AdminLoginForm />;
  }

  // While checking, show loading or nothing (to avoid flicker)
  // But if we are client side and waiting for useStore, it might take a moment.
  // We can default to Login Form if no user is present immediately?
  // But useStore persistence might load user quickly.
  // Let's show a loader only if we are truly waiting for something, 
  // but "authChecked" handles the initial render.
  
  if (!authChecked) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        </div>
      );
  }

  // --- DASHBOARD LOGIC BELOW ---

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
              <span className="text-xs text-slate-500">{format(new Date(), 'HH:mm:ss')}</span>
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
            trend={metrics.salesTrend}
            trendValue={metrics.salesTrendValue}
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar md:justify-start">
            <Link href="/pos" className="px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                COMANDO
            </Link>
            <button className="px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                ANALYTICS
            </button>
            <button className="px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap bg-cyan-500 text-black transition-colors">
                ANÁLISES
            </button>
            <button className="px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                FINANÇAS
            </button>
            <Link href="/settings" className="px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                SISTEMA
            </Link>
            <button className="px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                ESCALAS
            </button>
            <button className="px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                RESERVAS
            </button>
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
                    formatter={(value: number) => formatAOA(value)}
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
             <div className="h-[300px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={metrics.paymentMethodsData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {metrics.paymentMethodsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number) => formatAOA(value)}
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
