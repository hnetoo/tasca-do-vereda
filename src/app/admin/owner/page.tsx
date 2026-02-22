'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  DollarSign, TrendingUp, Users, Clock, 
  Utensils, Wallet, Banknote, TrendingDown, Layers, Activity, Wifi,
  Lock, Mail, AlertTriangle, Loader2, RefreshCw
} from 'lucide-react';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { formatAOA } from '@/utils/format';
import { useStore } from '@/store/useStore';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '@/store/slices/authSlice';
import KPICard from '@/components/KPICard';

import { Order, Transaction, PaymentMethod, User } from '@/types';

interface RealtimePostgresPayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function OwnerDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [monthOrders, setMonthOrders] = useState<Order[]>([]); // New state for monthly data
  const [yesterdaySales, setYesterdaySales] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [revenues, setRevenues] = useState<any[]>([]);
  const [cashShifts, setCashShifts] = useState<any[]>([]);
  const [localEmployees, setLocalEmployees] = useState<any[]>([]);
  const [localTables, setLocalTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'>('CONNECTING');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { employees, tables } = useStore(); 
  const user = useSelector((state: any) => state.auth.user) as User | null;
  const dispatch = useDispatch();
  const supabase = createClient();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showUpdateIndicator, setShowUpdateIndicator] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Helper to trigger update indicator
  const triggerUpdate = () => {
    setLastUpdated(new Date());
    setShowUpdateIndicator(true);
    setTimeout(() => setShowUpdateIndicator(false), 2000);
  };

  // Auth Check
  useEffect(() => {
    // Only proceed if store is initialized or we have a user
    if (user) {
        const role = (user.role || '').toUpperCase();
        if (role === 'OWNER' || role === 'ADMIN') {
            setIsAuthorized(true);
        } else {
            setIsAuthorized(false);
        }
    } else {
        setIsAuthorized(false);
    }
    setAuthChecked(true);
  }, [user]);

  // Initial Fetch
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Use Angola Time (WAT) which is UTC+1 all year round
      // Create date object for "Now" in Angola
      const now = new Date();
      // Adjust to Angola Timezone manually if needed, but since we compare with ISO strings from DB which are UTC,
      // we need to construct the 'start of day' in Angola Time, then convert that specific moment to UTC ISO string for the query.
      
      // Angola is UTC+1. 
      // Midnight in Angola (00:00 WAT) is 23:00 UTC previous day.
      // 1. Get current time in Angola
      const angolaOffset = 1 * 60; // +1 hour in minutes
      const localOffset = now.getTimezoneOffset(); // in minutes (e.g., -60 for UTC+1, 0 for UTC)
      // Note: getTimezoneOffset returns positive if local is behind UTC, negative if ahead.
      // e.g. UTC+1 -> -60.
      
      // We want to find the start of the day in Angola.
      // Let's use string manipulation to be safe and avoid browser timezone issues.
      // Format: YYYY-MM-DDT00:00:00+01:00
      
      const getAngolaDateString = (date: Date) => {
        // Create a date object shifted to Angola time
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        const angolaTime = new Date(utc + (3600000 * 1)); // Add 1 hour
        return angolaTime;
      };

      const angolaNow = getAngolaDateString(new Date());
      
      // Start of Today (Angola)
      const startOfTodayAngola = new Date(angolaNow);
      startOfTodayAngola.setHours(0, 0, 0, 0);
      // Convert back to UTC for query
      // 00:00 Angola = 23:00 UTC prev day
      const startOfTodayUTC = new Date(startOfTodayAngola.getTime() - 3600000);

      // Start of Yesterday (Angola)
      const startOfYesterdayAngola = new Date(startOfTodayAngola);
      startOfYesterdayAngola.setDate(startOfYesterdayAngola.getDate() - 1);
      const startOfYesterdayUTC = new Date(startOfYesterdayAngola.getTime() - 3600000);
      
      // Start of Month (Angola)
      const startOfMonthAngola = new Date(angolaNow.getFullYear(), angolaNow.getMonth(), 1, 0, 0, 0, 0);
      const startOfMonthUTC = new Date(startOfMonthAngola.getTime() - 3600000);

      // Fetch Orders (Today)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startOfTodayUTC.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch Orders (Month) for Total Arrecadado
      const { data: monthOrdersData, error: monthError } = await supabase
        .from('orders')
        .select('total, status, created_at')
        .gte('created_at', startOfMonthUTC.toISOString())
        .order('created_at', { ascending: false });

      if (monthError) console.error('Error fetching month orders:', monthError);
      
      if (monthOrdersData) setMonthOrders(monthOrdersData as Order[]);

      // Fetch Orders (Yesterday) for trend
      const { data: yesterdayData } = await supabase
        .from('orders')
        .select('total, status')
        .gte('created_at', startOfYesterdayUTC.toISOString())
        .lt('created_at', startOfTodayUTC.toISOString());

      // Calculate Yesterday Sales
      if (yesterdayData) {
          const total = yesterdayData
              .filter((o: Order) => o.status === 'FECHADO' || o.status === 'PAID')
              .reduce((acc: number, o: Order) => acc + Number(o.total || 0), 0);
          setYesterdaySales(total);
      }

      // Fetch Transactions
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', startOfTodayUTC.toISOString())
        .order('created_at', { ascending: false });

      if (transError) throw transError;

      // Fetch Expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .gte('created_at', startOfTodayUTC.toISOString())
        .order('created_at', { ascending: false });

      if (expensesError) console.error('Error fetching expenses:', expensesError);

      // Fetch Revenues
      const { data: revenuesData, error: revenuesError } = await supabase
        .from('revenues')
        .select('*')
        .gte('created_at', startOfTodayUTC.toISOString())
        .order('created_at', { ascending: false });

      if (revenuesError) console.error('Error fetching revenues:', revenuesError);

      // Fetch Cash Shifts
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('cash_shifts')
        .select('*')
        .gte('created_at', startOfTodayUTC.toISOString())
        .order('created_at', { ascending: false });

      if (shiftsError) console.error('Error fetching shifts:', shiftsError);
      
      // Fetch Employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*');

      if (employeesError) console.error('Error fetching employees:', employeesError);

      // Fetch Tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('restaurant_tables')
        .select('*');

      if (tablesError) console.error('Error fetching tables:', tablesError);

      if (ordersData) setOrders(ordersData);
      if (transData) setTransactions(transData);
      if (expensesData) setExpenses(expensesData);
      if (revenuesData) setRevenues(revenuesData);
      if (shiftsData) setCashShifts(shiftsData);
      if (employeesData) setLocalEmployees(employeesData);
      if (tablesData) setLocalTables(tablesData);
      
      triggerUpdate();
      setConnectionStatus('CONNECTED');
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setConnectionStatus('DISCONNECTED');
      // Force connection status to show error if possible, but the UI logic currently only shows Offline.
      // We could add a toast or alert here for debugging.
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
        fetchDashboardData();
    }
  }, [isAuthorized]);

  // Realtime Subscriptions
  useEffect(() => {
    if (!isAuthorized) return;

    const channel = supabase.channel('dashboard-realtime-channel');
    
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
        triggerUpdate();
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new as Order, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id));
        }
      })
      // Transactions
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload: any) => {
        triggerUpdate();
        if (payload.eventType === 'INSERT') {
          setTransactions(prev => [payload.new as Transaction, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTransactions(prev => prev.map(t => t.id === payload.new.id ? payload.new as Transaction : t));
        } else if (payload.eventType === 'DELETE') {
          setTransactions(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      // Expenses
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload: any) => {
        triggerUpdate();
        if (payload.eventType === 'INSERT') {
          setExpenses(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setExpenses(prev => prev.map(e => e.id === payload.new.id ? payload.new : e));
        } else if (payload.eventType === 'DELETE') {
          setExpenses(prev => prev.filter(e => e.id !== payload.old.id));
        }
      })
      // Revenues
      .on('postgres_changes', { event: '*', schema: 'public', table: 'revenues' }, (payload: any) => {
        triggerUpdate();
        if (payload.eventType === 'INSERT') {
          setRevenues(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setRevenues(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
        } else if (payload.eventType === 'DELETE') {
          setRevenues(prev => prev.filter(r => r.id !== payload.old.id));
        }
      })
      // Cash Shifts
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_shifts' }, (payload: any) => {
        triggerUpdate();
        if (payload.eventType === 'INSERT') {
          setCashShifts(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setCashShifts(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
        }
      })
      // Employees
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, (payload: any) => {
        triggerUpdate();
        if (payload.eventType === 'INSERT') {
          setLocalEmployees(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setLocalEmployees(prev => prev.map(e => e.id === payload.new.id ? payload.new : e));
        } else if (payload.eventType === 'DELETE') {
          setLocalEmployees(prev => prev.filter(e => e.id !== payload.old.id));
        }
      })
      // Tables
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_tables' }, (payload: any) => {
        triggerUpdate();
        if (payload.eventType === 'INSERT') {
          setLocalTables(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setLocalTables(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
        } else if (payload.eventType === 'DELETE') {
          setLocalTables(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      // System Events
      .on('system', { event: '*' }, (payload: any) => {
        if (payload.event === 'subscribed') {
            setConnectionStatus('CONNECTED');
        } else if (payload.event === 'unsubscribed') {
            setConnectionStatus('DISCONNECTED');
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('CONNECTED');
        } else if (status === 'CLOSED') {
          setConnectionStatus('DISCONNECTED');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('DISCONNECTED');
        } else {
          setConnectionStatus('CONNECTING');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthorized]);

  // Metrics Calculation
  const metrics = useMemo(() => {
    const closedOrders = orders.filter(o => o.status === 'FECHADO' || o.status === 'PAID');
    const closedMonthOrders = monthOrders.filter(o => o.status === 'FECHADO' || o.status === 'PAID');
    
    const todaySales = closedOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);
    const totalMonthSales = closedMonthOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);

    // Sales Trend Calculation
    let salesTrend: 'up' | 'down' | 'neutral' = 'neutral';
    let salesTrendValue = '0%';
    
    if (yesterdaySales > 0) {
        const diff = todaySales - yesterdaySales;
        const percentage = (diff / yesterdaySales) * 100;
        salesTrend = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
        salesTrendValue = `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`;
    } else if (todaySales > 0) {
        salesTrend = 'up';
        salesTrendValue = '+100%'; // First day or no sales yesterday
    }

    const activeOrders = orders.filter(o => o.status && ['PENDENTE', 'PREPARANDO', 'PRONTO'].includes(o.status)).length;
    
    // Expenses (from transactions table)
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const netProfit = totalMonthSales - totalExpenses; // Profit based on monthly sales for better view? Or daily? Let's stick to daily for netProfit consistent with transactions fetch
    // Actually, transactions fetch is daily based on 'gte today'.
    // If we want consistent daily profit, use todaySales.
    const dailyProfit = todaySales - totalExpenses;
    
    // Active Staff (using localEmployees if available, else store)
    const staffList = localEmployees.length > 0 ? localEmployees : (employees || []);
    const activeStaff = staffList.filter((e: any) => e.status === 'ATIVO').length;

    // Free tables (using localTables if available, else store)
    const tablesList = localTables.length > 0 ? localTables : (tables || []);
    const freeTables = tablesList.filter((t: any) => t.status === 'LIVRE').length;

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
        const splits = Array.isArray(order.split_payments) ? (order.split_payments as any[]) : [];
        if (splits.length > 0) {
            splits.forEach((split: any) => {
                const method = (split && split.method) ? split.method : 'OTHER';
                const amount = (split && typeof split.amount === 'number') ? split.amount : 0;
                paymentMethodsMap[method] = (paymentMethodsMap[method] || 0) + amount;
            });
        } else if (order.payment_method) {
            const method = order.payment_method as string;
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

    const periods = {
      'Manhã': 0,
      'Almoço': 0,
      'Tarde': 0,
      'Jantar': 0,
      'Madrugada': 0
    };

    orders.forEach(order => {
      if (!order.created_at) return;
      const dateObj = new Date(order.created_at);
      if (isNaN(dateObj.getTime())) return;
      const hour = dateObj.getHours();
      const amount = Number(order.total || 0);

      if (hour >= 6 && hour < 12) periods['Manhã'] += amount;
      else if (hour >= 12 && hour < 16) periods['Almoço'] += amount;
      else if (hour >= 16 && hour < 19) periods['Tarde'] += amount;
      else if (hour >= 19 && hour <= 23) periods['Jantar'] += amount;
      else periods['Madrugada'] += amount;
    });

    const salesByPeriodData = Object.entries(periods).map(([name, value]) => ({ name, value }));

    return { 
      todaySales,
      totalMonthSales, // Export monthly sales
      salesTrend,
      salesTrendValue,
      activeOrders, 
      totalOrders: orders.length,
      activeStaff,
      freeTables,
      totalExpenses,
      cashFlow: todaySales - totalExpenses,
      netProfit: dailyProfit,
      chartData,
      salesByPeriodData,
      avgPrepTime,
      loyalty: '85%', // Mock for now as requested
      paymentMethodsData
    };
  }, [orders, monthOrders, transactions, employees, tables, yesterdaySales, localEmployees, localTables]);

  // If not authorized, redirect to login
  if (authChecked && !isAuthorized) {
    if (user) {
        // User is logged in but not authorized
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
                    <p className="text-slate-400 mb-6">O utilizador {user.name} ({user.role}) não tem permissão para aceder a esta área.</p>
                    <button 
                        onClick={async () => { dispatch(logoutUser()); router.push('/admin/owner/login'); }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors w-full"
                    >
                        Terminar Sessão
                    </button>
                </div>
            </div>
        );
    }
    // Not logged in -> Redirect
    if (typeof window !== 'undefined') {
        router.push('/admin/owner/login');
    }
    return null;
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
              <div className="flex items-center gap-2">
                 {showUpdateIndicator && (
                    <span className="text-[10px] font-bold text-emerald-400 animate-pulse bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                        ATUALIZADO
                    </span>
                 )}
                 <span className={`text-xs font-bold flex items-center gap-1 ${
                    connectionStatus === 'CONNECTED' ? 'text-emerald-500' : 
                    connectionStatus === 'CONNECTING' ? 'text-amber-500' : 'text-red-500'
                 }`}>
                    <Wifi size={12} /> 
                    {connectionStatus === 'CONNECTED' ? 'Online' : 
                     connectionStatus === 'CONNECTING' ? 'Conectando...' : 'Offline'}
                 </span>
              </div>
              <span className="text-[10px] text-slate-500">
                {lastUpdated ? `Atualizado: ${format(lastUpdated, 'HH:mm:ss')}` : 'Aguardando dados...'}
              </span>
            </div>
            <button 
              onClick={fetchDashboardData}
              className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-blue-400 hover:bg-slate-800 transition-colors relative"
              title="Forçar atualização de dados"
              disabled={isLoading}
            >
              <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-6">
        {/* KPI Grid - 3 Columns Layout as per screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Row 1 */}
          <KPICard 
            title="TOTAL ARRECADADO" 
            value={formatAOA(metrics.totalMonthSales)} 
            subtitle="Este Mês"
            icon={<DollarSign size={16} className="text-emerald-400" />}
            trend={metrics.salesTrend}
            trendValue={metrics.salesTrendValue}
            color="text-emerald-400"
          />
          <KPICard 
            title="HOJE" 
            value={formatAOA(metrics.todaySales)} 
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
          
          {/* Row 2 */}
          <KPICard 
            title="EQUIPA" 
            value={metrics.activeStaff.toString()} 
            subtitle="ao serviço"
            icon={<Users size={16} className="text-emerald-500" />}
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

          {/* Sales by Period Chart */}
          <div className="lg:col-span-3 bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm min-h-[350px]">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Vendas por Período</h3>
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.salesByPeriodData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            stroke="#64748b" 
                            fontSize={12}
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
                        <Bar dataKey="value" name="Vendas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
