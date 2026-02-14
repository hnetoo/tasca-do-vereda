import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { supabaseService } from '../services/supabaseService';
import { SystemSettings, Expense, Revenue, User } from '../types';
import {
  TrendingUp, Users, ShoppingBag, Clock, AlertTriangle,
  Smartphone, LogOut, Settings, Bell, BarChart3,
  Calendar, CalendarDays, ChevronLeft, Delete
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { thesisData } from '../data/thesisData';

export interface RemoteDashboardData {
  summary?: {
    total_revenue?: number;
    total_orders?: number;
    active_orders_count?: number;
  };
  analytics?: {
    totalCustomers?: number;
    retentionRate?: number;
    menu?: Array<{ dishName: string; sold: number }>;
  };
  settings?: SystemSettings;
  expenses?: Expense[];
  revenues?: Revenue[];
  menu?: Array<{ dishName: string; sold: number }>;
  users?: User[];
}

export type AlertConfig = {
  revenueDropPercent: number;
  prepTimeLimit: number;
  activeOrdersLimit: number;
};

export type WidgetConfig = {
  showRetention: boolean;
  showPrepTime: boolean;
  showTables: boolean;
  showExpenses: boolean;
  showCashFlow: boolean;
  showNetProfit: boolean;
};

export const buildMobileAlerts = (params: {
  todaySales: number;
  avg7Days: number;
  averagePreparationTime: number;
  liveActiveOrders: number;
  config: AlertConfig;
}) => {
  const { todaySales, avg7Days, averagePreparationTime, liveActiveOrders, config } = params;
  const list: Array<{ type: 'warning' | 'error' | 'info'; title: string; message: string }> = [];
  const dropThreshold = 1 - config.revenueDropPercent / 100;
  if (avg7Days > 0 && todaySales > 0 && todaySales < avg7Days * dropThreshold) {
    list.push({
      type: 'warning',
      title: 'Faturamento Baixo',
      message: `Vendas de hoje estão ${((1 - todaySales / avg7Days) * 100).toFixed(0)}% abaixo da média.`
    });
  }
  if (averagePreparationTime > config.prepTimeLimit) {
    list.push({
      type: 'error',
      title: 'Atraso na Cozinha',
      message: `Tempo médio de preparo elevado: ${averagePreparationTime} min.`
    });
  }
  if (liveActiveOrders > config.activeOrdersLimit) {
    list.push({
      type: 'info',
      title: 'Alta Demanda',
      message: `${liveActiveOrders} mesas ativas. Considere reforçar a equipa.`
    });
  }
  return list;
};

export const calculateTodayFinance = (params: { todaySales: number; todayExpenses: number; grossProfitToday: number }) => {
  const { todaySales, todayExpenses, grossProfitToday } = params;
  return {
    cashFlowToday: todaySales - todayExpenses,
    netProfitToday: grossProfitToday - todayExpenses
  };
};

const MobileDashboard = () => {
  const {
    activeOrders: localActiveOrders, employees: localEmployees, attendance: localAttendance, customers: localCustomers, expenses: localExpenses, revenues: localRevenues,
    workShifts: localShifts, reservations: localReservations, tables: localTables, orders: localOrders, menu: localMenu,
    logout, currentUser, settings, getMenuAnalytics,
    getCustomerRetention, users: localUsers, getDailySalesAnalytics
  } = useStore();
  
  type DashboardMetric = 'sales' | 'orders' | 'finance' | 'analytics' | 'shifts' | 'reservations' | 'system';
  
  const retention = useMemo(() => {
    if (!getCustomerRetention || typeof getCustomerRetention !== 'function') {
      return 0;
    }
    try {
      return getCustomerRetention();
    } catch (error) {
      console.error('Error getting customer retention:', error);
      return 0;
    }
  }, [getCustomerRetention]);

  // Auth State
  const [authStep, setAuthStep] = useState<'USER_SELECTION' | 'PIN_ENTRY' | 'AUTHENTICATED'>('USER_SELECTION');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [accessPin, setAccessPin] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  
  // Remote Data State
  const [remoteData, setRemoteData] = useState<RemoteDashboardData | null>(null);
  const [isRemote, setIsRemote] = useState(false);
  const lastRemoteUpdateAt = useRef(0);
  const isDemoMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('demo') === '1';
  }, []);

  const isThesisMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('thesis') === '1';
  }, []);

  const demoData = useMemo<RemoteDashboardData>(() => {
    const today = new Date();
    const day = today.toISOString().split('T')[0];
    return {
      summary: {
        total_revenue: 1284500,
        total_orders: 86,
        active_orders_count: 7
      },
      analytics: {
        totalCustomers: 312,
        retentionRate: 0.42,
        menu: [
          { dishName: 'Francesinha Vereda', sold: 48 },
          { dishName: 'Bife à Casa', sold: 34 },
          { dishName: 'Risotto de Camarão', sold: 29 },
          { dishName: 'Picanha Premium', sold: 22 },
          { dishName: 'Sopa do Dia', sold: 19 }
        ]
      },
      settings: {
        ...settings,
        restaurantName: settings.restaurantName || 'Tasca Do VEREDA',
        currency: settings.currency || 'AOA',
        taxRate: Number.isFinite(settings.taxRate) ? settings.taxRate : 14,
        invoiceSeries: settings.invoiceSeries || 'A',
        retencaoFonte: Number.isFinite(settings.retencaoFonte) ? settings.retencaoFonte : 0,
        regimeIVA: settings.regimeIVA || 'Normal',
        kdsEnabled: Boolean(settings.kdsEnabled),
        isSidebarCollapsed: Boolean(settings.isSidebarCollapsed),
        apiToken: settings.apiToken || '',
        webhookEnabled: Boolean(settings.webhookEnabled),
        adminPin: settings.adminPin || '1234'
      } as SystemSettings,
      expenses: [
        { id: 'exp-1', amount: 45200, description: 'Fornecedor carnes', date: day, category: 'COZINHA' },
        { id: 'exp-2', amount: 12500, description: 'Logística', date: day, category: 'OPERACIONAL' },
        { id: 'exp-3', amount: 8200, description: 'Marketing digital', date: day, category: 'MARKETING' }
      ],
      revenues: [
        { id: 'rev-1', amount: 210000, description: 'Almoço', date: day, category: 'VENDAS' },
        { id: 'rev-2', amount: 460000, description: 'Jantar', date: day, category: 'VENDAS' },
        { id: 'rev-3', amount: 61500, description: 'Takeaway', date: day, category: 'VENDAS' }
      ],
      menu: [
        { dishName: 'Francesinha Vereda', sold: 48 },
        { dishName: 'Bife à Casa', sold: 34 },
        { dishName: 'Risotto de Camarão', sold: 29 }
      ],
      users: [
        { id: 'owner-demo', name: 'Owner Demo', role: 'OWNER', pin: '1234' },
        { id: 'admin-demo', name: 'Admin Demo', role: 'ADMIN', pin: '1234' }
      ]
    };
  }, [settings]);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>(() => {
    const defaults = { revenueDropPercent: 30, prepTimeLimit: 30, activeOrdersLimit: 10 };
    if (typeof window === 'undefined') return defaults;
    const raw = localStorage.getItem('mobile_alert_config');
    if (!raw) return defaults;
    try {
      const parsed = JSON.parse(raw) as Partial<AlertConfig>;
      return {
        revenueDropPercent: Number(parsed.revenueDropPercent ?? defaults.revenueDropPercent),
        prepTimeLimit: Number(parsed.prepTimeLimit ?? defaults.prepTimeLimit),
        activeOrdersLimit: Number(parsed.activeOrdersLimit ?? defaults.activeOrdersLimit)
      };
    } catch {
      return defaults;
    }
  });
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>(() => {
    const defaults = {
      showRetention: true,
      showPrepTime: true,
      showTables: true,
      showExpenses: true,
      showCashFlow: true,
      showNetProfit: true
    };
    if (typeof window === 'undefined') return defaults;
    const raw = localStorage.getItem('mobile_widget_config');
    if (!raw) return defaults;
    try {
      const parsed = JSON.parse(raw) as Partial<WidgetConfig>;
      return {
        showRetention: Boolean(parsed.showRetention ?? defaults.showRetention),
        showPrepTime: Boolean(parsed.showPrepTime ?? defaults.showPrepTime),
        showTables: Boolean(parsed.showTables ?? defaults.showTables),
        showExpenses: Boolean(parsed.showExpenses ?? defaults.showExpenses),
        showCashFlow: Boolean(parsed.showCashFlow ?? defaults.showCashFlow),
        showNetProfit: Boolean(parsed.showNetProfit ?? defaults.showNetProfit)
      };
    } catch {
      return defaults;
    }
  });

  // Lockout Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLocked && lockoutEndTime) {
      timer = setInterval(() => {
        const remaining = lockoutEndTime - Date.now();
        if (remaining <= 0) {
          setIsLocked(false);
          setLockoutEndTime(null);
          setLoginAttempts(0);
          setAuthError(null);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockoutEndTime]);

  useEffect(() => {
     if (isThesisMode) {
        setIsRemote(true);
        setRemoteData(thesisData);
        return;
     }
     if (isDemoMode) {
        setIsRemote(true);
        setRemoteData(demoData);
        return;
     }
     if (settings.supabaseConfig?.enabled && settings.supabaseConfig?.url && settings.supabaseConfig?.key) {
        setTimeout(() => {
          setIsRemote(true);
          if (!supabaseService.isConnected()) {
              supabaseService.initialize(settings.supabaseConfig.url, settings.supabaseConfig.key);
          }
          
          // Fetch data independently so one failure doesn't block the other
          supabaseService.fetchDashboard().then(dashRes => {
              if (dashRes.success && dashRes.data) {
                  lastRemoteUpdateAt.current = Date.now();
                  setRemoteData(prev => ({ ...prev, ...dashRes.data }));
              }
          }).catch(console.error);

          supabaseService.fetchUsers().then(usersRes => {
              if (usersRes.success && usersRes.data) {
                  lastRemoteUpdateAt.current = Date.now();
                  setRemoteData(prev => ({ 
                    ...prev, 
                    users: usersRes.data as User[]
                  }));
              }
          }).catch(console.error);
        }, 0);
     } else {
         setTimeout(() => setIsRemote(false), 0);
      }
  }, [demoData, isDemoMode, isThesisMode, thesisData, settings.supabaseConfig]);

  useEffect(() => {
    if (!isRemote || !settings.supabaseConfig?.enabled || !supabaseService.isConnected()) {
      return;
    }

    const handleRevenueChange = (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: Record<string, unknown>; old: Record<string, unknown> }) => {
      setRemoteData(prev => {
        lastRemoteUpdateAt.current = Date.now();
        const previous = prev || {};
        const currentRevenues = Array.isArray(previous.revenues) ? previous.revenues : [];
        const mapped: Revenue = {
          id: String(payload.new?.id || payload.old?.id || crypto.randomUUID()),
          amount: Number(payload.new?.amount || 0),
          description: String(payload.new?.description || ''),
          date: String(payload.new?.date || payload.old?.date || ''),
          category: String(payload.new?.category || 'VENDAS')
        };
        if (payload.eventType === 'INSERT') {
          return { ...previous, revenues: [...currentRevenues, mapped] };
        }
        if (payload.eventType === 'UPDATE') {
          return { ...previous, revenues: currentRevenues.map(r => r.id === mapped.id ? mapped : r) };
        }
        if (payload.eventType === 'DELETE') {
          return { ...previous, revenues: currentRevenues.filter(r => r.id !== String(payload.old?.id)) };
        }
        return previous;
      });
    };

    const handleExpenseChange = (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: Record<string, unknown>; old: Record<string, unknown> }) => {
      setRemoteData(prev => {
        lastRemoteUpdateAt.current = Date.now();
        const previous = prev || {};
        const currentExpenses = Array.isArray(previous.expenses) ? previous.expenses : [];
        const mapped: Expense = {
          id: String(payload.new?.id || payload.old?.id || crypto.randomUUID()),
          amount: Number(payload.new?.amount || 0),
          description: String(payload.new?.description || ''),
          date: String(payload.new?.date || payload.old?.date || ''),
          category: String(payload.new?.category || 'OUTROS')
        } as Expense;
        if (payload.eventType === 'INSERT') {
          return { ...previous, expenses: [...currentExpenses, mapped] };
        }
        if (payload.eventType === 'UPDATE') {
          return { ...previous, expenses: currentExpenses.map(e => e.id === mapped.id ? mapped : e) };
        }
        if (payload.eventType === 'DELETE') {
          return { ...previous, expenses: currentExpenses.filter(e => e.id !== String(payload.old?.id)) };
        }
        return previous;
      });
    };

    const handleSummaryChange = (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: Record<string, unknown>; old: Record<string, unknown> }) => {
      if (payload.eventType === 'DELETE') return;
      lastRemoteUpdateAt.current = Date.now();
      setRemoteData(prev => ({
        ...(prev || {}),
        summary: {
          total_revenue: Number(payload.new?.total_revenue || 0),
          total_orders: Number(payload.new?.total_orders || 0),
          active_orders_count: Number(payload.new?.active_orders_count || 0)
        }
      }));
    };

    const unsubscribeRevenues = supabaseService.subscribeToTableChanges('revenues', handleRevenueChange);
    const unsubscribeExpenses = supabaseService.subscribeToTableChanges('expenses', handleExpenseChange);
    const unsubscribeSummary = supabaseService.subscribeToTableChanges('dashboard_summary', handleSummaryChange);

    return () => {
      unsubscribeRevenues();
      unsubscribeExpenses();
      unsubscribeSummary();
    };
  }, [isRemote, settings.supabaseConfig?.enabled]);

  useEffect(() => {
    if (isDemoMode) {
      return;
    }
    if (!isRemote || !settings.supabaseConfig?.enabled || !supabaseService.isConnected()) {
      return;
    }
    if (!isRemote || !settings.supabaseConfig?.enabled || !supabaseService.isConnected()) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastRemoteUpdateAt.current < 1800) {
        return;
      }
      supabaseService.fetchDashboard().then(dashRes => {
        if (dashRes.success && dashRes.data) {
          lastRemoteUpdateAt.current = Date.now();
          setRemoteData(prev => ({ ...prev, ...dashRes.data }));
        }
      }).catch(console.error);

      supabaseService.fetchUsers().then(usersRes => {
        if (usersRes.success && usersRes.data) {
          lastRemoteUpdateAt.current = Date.now();
          setRemoteData(prev => ({
            ...prev,
            users: usersRes.data as User[]
          }));
        }
      }).catch(console.error);
    }, 2000);

    return () => clearInterval(interval);
  }, [isDemoMode, isRemote, settings.supabaseConfig?.enabled]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mobile_alert_config', JSON.stringify(alertConfig));
  }, [alertConfig]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mobile_widget_config', JSON.stringify(widgetConfig));
  }, [widgetConfig]);

  // Use remote users if available and not empty, otherwise local users
  const users = (remoteData?.users && remoteData.users.length > 0) ? remoteData.users : localUsers;

  // Filter users who can access this dashboard (ADMIN and OWNER)
  const authorizedUsers = useMemo(() => {
    return users.filter(u => ['ADMIN', 'OWNER', 'GERENTE'].includes(u.role));
  }, [users]);

  // Derived state for display
  const customers = localCustomers;
  const employees = localEmployees;
  const shifts = localShifts;
  const reservations = localReservations;

  useEffect(() => {
    // Force clear any legacy localStorage auth to fix the bypass issue reported by user
    if (localStorage.getItem('mobile_dashboard_auth')) {
      localStorage.removeItem('mobile_dashboard_auth');
    }
    
    // Use sessionStorage for temporary persistence within the same tab/session
    const mobileAuth = sessionStorage.getItem('mobile_dashboard_auth');
    if (mobileAuth === 'true') {
        setTimeout(() => setAuthStep('AUTHENTICATED'), 0);
    }
  }, []);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setAuthStep('PIN_ENTRY');
    setAccessPin('');
    setAuthError(null);
  };

  const handleBackToUsers = () => {
    setAuthStep('USER_SELECTION');
    setSelectedUser(null);
    setAccessPin('');
    setAuthError(null);
  };

  const handlePinDigit = (digit: string) => {
    if (isLocked) return;
    if (accessPin.length < 6) {
      setAccessPin(prev => prev + digit);
      setAuthError(null);
    }
  };

  const handleBackspace = () => {
    setAccessPin(prev => prev.slice(0, -1));
    setAuthError(null);
  };

  const handleSubmitPin = async () => {
    if (!selectedUser || isLocked) return;

    // PIN Validation Logic
    const cleanPin = accessPin.trim();
    const effectiveSettings = (isRemote && remoteData?.settings) ? remoteData.settings : settings;
    
    console.log('MobileDashboard Auth Attempt:', { 
        user: selectedUser.name,
        isRemote,
        isLocked
    });

    let isCorrectPin = false;

    // Check if stored PIN is a Hash (SHA-256 is 64 chars) or Plain Text
    if (selectedUser.pin.length === 64) {
        // Secure comparison against Hash
        try {
            const hashedInput = await supabaseService.calculateHash(cleanPin);
            isCorrectPin = selectedUser.pin === hashedInput;
        } catch (e) {
            console.error('Hash calculation failed', e);
            isCorrectPin = false;
        }
    } else {
        // Legacy/Local Plain Text comparison
        isCorrectPin = selectedUser.pin === cleanPin;
    }

    const isMasterPin = cleanPin === '1234'; // Emergency Master PIN
    const isSettingsPin = effectiveSettings.adminPin && cleanPin === effectiveSettings.adminPin;

    if (isCorrectPin || isMasterPin || isSettingsPin) {
       setAuthStep('AUTHENTICATED');
       sessionStorage.setItem('mobile_dashboard_auth', 'true');
       setAccessPin('');
       setLoginAttempts(0);
       return;
    }

    // Failed attempt
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    setAccessPin('');
    
    if (newAttempts >= 3) {
        setIsLocked(true);
        setLockoutEndTime(Date.now() + 30000); // 30 seconds
        setAuthError('Conta bloqueada por 30s devido a múltiplas tentativas falhadas.');
    } else {
        setAuthError(`PIN incorreto. Tentativas restantes: ${3 - newAttempts}`);
    }
  };

  // Auto-submit logic with support for Hashed PINs and variable length (4-6)
  useEffect(() => {
    const checkAndSubmit = async () => {
      if (!selectedUser) return;
      
      const cleanPin = accessPin.trim();
      if (cleanPin.length < 4) return;

      const effectiveSettings = (isRemote && remoteData?.settings) ? remoteData.settings : settings;
      
      let isCorrectPin = false;
      // Check if stored PIN is Hashed (SHA-256 = 64 chars)
      if (selectedUser.pin.length === 64) {
          const hashedInput = await supabaseService.calculateHash(cleanPin);
          isCorrectPin = selectedUser.pin === hashedInput;
      } else {
          isCorrectPin = selectedUser.pin === cleanPin;
      }

      const isMasterPin = cleanPin === '1234';
      const isSettingsPin = effectiveSettings.adminPin && cleanPin === effectiveSettings.adminPin;
      
      // Auto-submit if correct
      if (isCorrectPin || isMasterPin || isSettingsPin) {
          handleSubmitPin();
          return;
      }

      // If we reached max length (6) and it's still wrong, submit to trigger error/lockout
      if (cleanPin.length >= 6) {
          handleSubmitPin();
      }
    };

    checkAndSubmit();
     
  }, [accessPin, selectedUser, isRemote, remoteData, settings]);

  const handleBiometricAuth = () => {
    if (isLocked) return;
    setAuthError(null);
    
    // Simular autenticação biométrica (FaceID/Fingerprint)
    // Em produção, isto usaria a Web Authentication API ou plugins nativos (Tauri/Capacitor)
    const simulateBiometric = window.confirm("Simular autenticação biométrica para " + selectedUser?.name + "?");
    
    if (simulateBiometric) {
        setAuthStep('AUTHENTICATED');
        sessionStorage.setItem('mobile_dashboard_auth', 'true');
        setLoginAttempts(0);
    } else {
        setAuthError('Autenticação biométrica falhou.');
    }
  };

  const handleForgotPin = () => {
      alert("Para recuperar o acesso:\n\n1. Contacte o Administrador do Sistema\n2. Utilize o PIN Mestre se autorizado\n3. Verifique se está no perfil correto");
  };

  const handleLogout = () => {
    setAuthStep('USER_SELECTION');
    sessionStorage.removeItem('mobile_dashboard_auth');
    logout();
  };

  const [selectedMetric, setSelectedMetric] = useState<DashboardMetric>('sales');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Get Menu Analytics for the last 30 days
  const menuAnalytics = useMemo(() => {
    if (!getMenuAnalytics || typeof getMenuAnalytics !== 'function') {
      return [];
    }
    try {
      const analytics = getMenuAnalytics(30);
      return Array.isArray(analytics) ? analytics : [];
    } catch (error) {
      console.error('Error getting menu analytics:', error);
      return [];
    }
  }, [getMenuAnalytics]);

  // Use local data or remote data
  const data = useMemo(() => {
    if (isRemote && remoteData) {
      return {
        dailySales: remoteData.summary?.total_revenue || 0,
        ordersToday: remoteData.summary?.total_orders || 0,
        activeOrdersCount: remoteData.summary?.active_orders_count || 0,
        topDishes: [],
        occupancyRate: 0,
        totalRevenue: remoteData.summary?.total_revenue || 0,
        activeOrders: remoteData.summary?.active_orders_count || 0,
      };
    }

    const safeToISO = (dateStr: string | number | Date) => {
      try {
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
      } catch (_e) {
        return null;
      }
    };

    const todayStr = new Date().toISOString().split('T')[0];
    
    const closedToday = localOrders.filter(o => {
      if (o.status !== 'FECHADO') return false;
      const orderDate = safeToISO(o.timestamp);
      return orderDate === todayStr;
    });

    const activeOrdersCount = localActiveOrders.filter(o => o.status === 'ABERTO').length;

    const totalSales = closedToday.reduce((acc, o) => acc + (o.total || 0), 0);
    const dishCostMap = new Map<string, number>();
    for (const d of localMenu) {
      const cost = typeof d.precoCusto === 'number' ? d.precoCusto : (typeof d.cost === 'number' ? d.cost : 0);
      dishCostMap.set(d.id, cost || 0);
    }
    const cogsToday = closedToday.reduce((acc, o) => {
      const cogs = o.items.reduce((sum, it) => {
        const unitCost = dishCostMap.get(it.dishId) || 0;
        return sum + unitCost * it.quantity;
      }, 0);
      return acc + cogs;
    }, 0);
    const grossProfitToday = totalSales - cogsToday;

    return {
      dailySales: totalSales,
      ordersToday: closedToday.length,
      activeOrdersCount,
      topDishes: [],
      occupancyRate: 0,
      totalRevenue: totalSales,
      activeOrders: activeOrdersCount,
      grossProfitToday,
    };
  }, [isRemote, remoteData, localActiveOrders, localMenu, localOrders]);

  const averagePreparationTime = useMemo(() => {
    const completedOrders = localActiveOrders.filter(o =>
      (o.status === 'FECHADO' || o.status === 'PAGO') && o.timestamp && o.completed_at
    );

    if (completedOrders.length === 0) {
      return 0;
    }

    const totalPreparationTime = completedOrders.reduce((sum, order) => {
      const start = new Date(order.timestamp).getTime();
      const end = new Date(order.completed_at!).getTime();
      return sum + (end - start);
    }, 0);

    // Retorna o tempo médio em minutos
    return Math.round(totalPreparationTime / completedOrders.length / 60000);
  }, [localActiveOrders]);

  const availableTablesCount = useMemo(() => {
    return localTables.filter(table => (table.status as string) === 'DISPONIVEL').length;
  }, [localTables]);

  const remoteAnalytics = isRemote && remoteData ? remoteData.analytics : null;
  const remoteExpenses = isRemote && remoteData ? remoteData.expenses || [] : [];
  const remoteRevenues = isRemote && remoteData ? remoteData.revenues || [] : [];
  const dashboardAnalytics = null;

  const liveActiveOrders = data.activeOrdersCount;
  const activeOrders = localActiveOrders;

  const employeesWorking = useMemo(() => {
    if (isRemote) {
      return []; // Remote staff not yet synced
    }
    const safeToISO = (dateStr: string | number | Date) => {
      try {
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
      } catch (_e) {
        return null;
      }
    };
    const today = safeToISO(new Date());
    if (!today) return [];

    return localEmployees.filter(emp => {
      const todayAttendance = localAttendance.find(
        a => a.employeeId === emp.id && a.date === today
      );
      return todayAttendance?.clockIn && !todayAttendance?.clockOut;
    });
  }, [isRemote, localEmployees, localAttendance]);

  const profitMetrics = useMemo(() => {
    const closedStatuses = new Set(['FECHADO', 'PAGO']);
    const closedOrders = localOrders.filter(o => closedStatuses.has(o.status));
    const totalSalesAllTime = closedOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const costMap = new Map<string, number>();
    for (const d of localMenu) {
      const cost = typeof d.precoCusto === 'number' ? d.precoCusto : (typeof d.cost === 'number' ? d.cost : 0);
      costMap.set(d.id, cost || 0);
    }
    const totalCOGS = closedOrders.reduce((acc, o) => {
      const cogs = o.items.reduce((sum, it) => {
        const unitCost = costMap.get(it.dishId) || 0;
        return sum + unitCost * it.quantity;
      }, 0);
      return acc + cogs;
    }, 0);
    const grossProfitAllTime = totalSalesAllTime - totalCOGS;
    const totalExpensesAllTime = localExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const netProfitAllTime = grossProfitAllTime - totalExpensesAllTime;
    return { totalSalesAllTime, grossProfitAllTime, netProfitAllTime };
  }, [localOrders, localMenu, localExpenses]);

  // Auto-refresh a cada 10 segundos
  useEffect(() => {
    if (isDemoMode || !autoRefresh) return;
    const interval = setInterval(() => {
      // Refresh remote data if enabled
      if (isRemote && settings.supabaseConfig?.enabled) {
          supabaseService.fetchDashboard().then(res => {
            if (res.success && res.data) {
                setRemoteData(prev => prev ? ({ ...prev, ...res.data }) : res.data);
            }
        });
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, isDemoMode, isRemote, settings.supabaseConfig]);

  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      handleManualSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
     
  }, []);

  const { triggerSync } = useStore();
  const [syncing, setSyncing] = useState(false);

  const handleManualSync = async () => {
    if (!navigator.onLine) {
      return;
    }
    setSyncing(true);
    try {
      await triggerSync();
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const formatKz = (val: number) => 
    new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(val);

  // Dados em tempo real (Adaptado para usar dados remotos ou locais)
  const todayAnalytics = {
    totalSales: data.dailySales || data.totalRevenue || 0,
    totalOrders: data.ordersToday || data.activeOrders || 0,
    avgOrder: (data.ordersToday || data.activeOrders) > 0 ? (data.dailySales || data.totalRevenue || 0) / (data.ordersToday || data.activeOrders) : 0
  };

  const last7DaysAnalytics = useMemo(() => {
    if (!getDailySalesAnalytics || typeof getDailySalesAnalytics !== 'function') {
      return [];
    }
    try {
      const analytics = getDailySalesAnalytics(7);
      if (!Array.isArray(analytics)) {
        return [];
      }
      return analytics.map(d => ({
        ...d,
        formattedDate: new Date(d.date).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })
      }));
    } catch (error) {
      console.error('Error getting daily sales analytics:', error);
      return [];
    }
  }, [getDailySalesAnalytics, currentTime]);

  const last7DaysSales = useMemo(() => {
    if (!Array.isArray(last7DaysAnalytics)) {
      return [];
    }
    return last7DaysAnalytics.map(d => ({
      date: d?.formattedDate || '',
      totalSales: d?.totalSales || 0
    }));
  }, [last7DaysAnalytics]);

  const todayKey = useMemo(() => new Date(currentTime).toISOString().split('T')[0], [currentTime]);
  const todayExpenses = useMemo(() => {
    const source = isRemote ? remoteExpenses : localExpenses;
    return source.reduce((acc, exp) => {
      const expDate = exp.date instanceof Date ? exp.date : new Date(exp.date);
      const key = expDate.toISOString().split('T')[0];
      return key === todayKey ? acc + (exp.amount || 0) : acc;
    }, 0);
  }, [isRemote, remoteExpenses, localExpenses, todayKey]);
  const todayRevenue = useMemo(() => {
    const source = isRemote ? remoteRevenues : localRevenues;
    return source.reduce((acc, rev) => (rev.date === todayKey ? acc + (rev.amount || 0) : acc), 0);
  }, [isRemote, remoteRevenues, localRevenues, todayKey]);
  const { cashFlowToday, netProfitToday } = useMemo(
    () => calculateTodayFinance({ todaySales: todayAnalytics.totalSales || todayRevenue, todayExpenses, grossProfitToday: data.grossProfitToday || 0 }),
    [todayAnalytics.totalSales, todayRevenue, todayExpenses, data.grossProfitToday]
  );
  const alerts = useMemo(() => {
    const avg7Days = last7DaysSales.length > 0
      ? last7DaysSales.reduce((acc, d) => acc + d.totalSales, 0) / last7DaysSales.length
      : 0;
    return buildMobileAlerts({
      todaySales: todayAnalytics.totalSales,
      avg7Days,
      averagePreparationTime,
      liveActiveOrders,
      config: alertConfig
    });
  }, [todayAnalytics.totalSales, last7DaysSales, averagePreparationTime, liveActiveOrders, alertConfig]);

  return (
    <>
      {authStep !== 'AUTHENTICATED' ? (
        <div className="min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]" />
          </div>

          <div className="w-full max-w-sm relative z-10">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 mb-5 shadow-lg shadow-primary/10">
                <Smartphone size={36} className="text-primary" />
              </div>
              <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-2">
                {settings.restaurantName || 'Tasca do Vereda'}
              </h1>
              <p className="text-[13px] font-bold text-slate-500 uppercase tracking-[0.2em]">Mobile Dashboard</p>
            </div>

            {authStep === 'USER_SELECTION' ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-white">Quem está a aceder?</h2>
                  <p className="text-base text-slate-400">Selecione o seu perfil</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {authorizedUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="group relative flex flex-col items-center justify-center p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 hover:scale-[1.02] transition-all duration-200"
                    >
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center mb-3 group-hover:border-primary/50 transition-colors">
                        <span className="text-xl font-black text-slate-300 group-hover:text-primary">
                          {user.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-base font-bold text-white group-hover:text-primary transition-colors truncate w-full text-center">
                        {user.name}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 uppercase mt-1">
                        {user.role}
                      </span>
                    </button>
                  ))}
                  
                  {authorizedUsers.length === 0 && (
                    <div className="col-span-2 text-center p-8 border border-dashed border-white/10 rounded-xl bg-white/5">
                      <p className="text-sm text-slate-400 mb-2">Nenhum utilizador autorizado encontrado.</p>
                      <p className="text-xs text-slate-500">Verifique a conexão ou contacte o administrador.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <button 
                  onClick={handleBackToUsers}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-base font-bold uppercase tracking-wider mb-5"
                >
                  <ChevronLeft size={16} /> Voltar
                </button>

                <div className="text-center mb-9">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-4 ring-4 ring-black/50">
                    <span className="text-3xl font-black text-primary">
                      {selectedUser?.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">{selectedUser?.name}</h2>
                  <p className="text-base text-slate-400 mt-1">Digite seu PIN de acesso</p>
                </div>

                {/* PIN Display */}
                <div className="flex justify-center gap-5 mb-9">
                  {[...Array(6)].map((_, i) => (
                    <div 
                      key={i}
                      className={`w-5 h-5 rounded-full transition-all duration-200 ${
                        i < accessPin.length 
                          ? 'bg-primary scale-110 shadow-[0_0_10px_rgba(var(--primary),0.5)]' 
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>

                {authError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center animate-shake">
                    {authError}
                  </div>
                )}

                <div className="flex justify-center">
                    <button 
                        onClick={handleForgotPin}
                        className="text-[11px] text-slate-500 hover:text-primary underline transition-colors"
                    >
                        Esqueci o PIN
                    </button>
                </div>

                {/* Numeric Keypad */}
                <div className="grid grid-cols-3 gap-5 max-w-[320px] mx-auto">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                      key={num}
                      onClick={() => handlePinDigit(num.toString())}
                      disabled={isLocked}
                      className="h-[72px] rounded-2xl bg-white/5 border border-white/10 text-3xl font-bold text-white hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {num}
                    </button>
                  ))}
                  <div className="col-start-2">
                    <button
                      onClick={() => handlePinDigit('0')}
                      disabled={isLocked}
                      className="w-full h-[72px] rounded-2xl bg-white/5 border border-white/10 text-3xl font-bold text-white hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      0
                    </button>
                  </div>
                  <div className="col-start-3">
                    <button
                      onClick={handleBackspace}
                      className="w-full h-[72px] rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 active:scale-95 transition-all flex items-center justify-center"
                    >
                      <Delete size={24} />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-12 text-center">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                v1.0.0 • Secured by TASCA OS
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-[100dvh] bg-gradient-to-br from-slate-900 via-background to-slate-900 text-white">
          {/* Header Mobile */}
          <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {settings.appLogoUrl ? (
                  <img src={settings.appLogoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white/5" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    <Smartphone size={20} />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-primary uppercase tracking-wider leading-none">{settings.restaurantName || 'TASCA DO VEREDA'}</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">Dashboard Owner</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {Array.isArray(alerts) && alerts.length > 0 && (
                  <div className="relative mr-1">
                    <Bell size={20} className="text-yellow-500 animate-bounce" />
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white">
                      {alerts.length}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-2 rounded-lg transition-all ${
                    autoRefresh ? 'bg-primary text-black' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <BarChart3 size={16} />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-black uppercase tracking-tighter">{isRemote ? 'Remote View' : (currentUser?.name || 'Admin')}</p>
                <p className="text-sm text-slate-400">Dashboard em Tempo Real {isRemote && '(Nuvem)'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">{new Date().toLocaleTimeString('pt-AO')}</p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500 animate-pulse'}`} />
                  <p className={`text-[11px] font-bold ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </p>
                  {isOnline && (
                    <button 
                      onClick={handleManualSync}
                      disabled={syncing}
                      className={`p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors ${syncing ? 'animate-spin opacity-50' : ''}`}
                    >
                      <TrendingUp size={12} className={syncing ? 'text-primary' : 'text-slate-400'} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Alerts Section */}
          {Array.isArray(alerts) && alerts.length > 0 && (
            <div className="p-3 sm:p-5 pb-0">
              <div className="space-y-2">
                {Array.isArray(alerts) ? alerts.map((alert, i) => {
                  if (!alert) return null;
                  return (
                    <div 
                      key={i} 
                      className={`p-3 rounded-xl border flex items-start gap-3 animate-in slide-in-from-top-2 duration-300 ${
                        alert?.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                        alert?.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      }`}
                    >
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider">{alert?.title || ''}</p>
                        <p className="text-[10px] font-bold opacity-80">{alert?.message || ''}</p>
                      </div>
                    </div>
                  );
                }) : null}
              </div>
            </div>
          )}

          {/* KPI Cards - Visão Resumida */}
          <div className="p-3 sm:p-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Faturamento Hoje */}
            <div className="glass-panel rounded-lg sm:rounded-xl p-3 sm:p-4 border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/40 transition-all">
              <div className="flex items-start justify-between mb-1">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Hoje</span>
                <TrendingUp size={14} className="text-primary sm:w-3.5 sm:h-3.5" />
              </div>
              <p className="text-lg sm:text-2xl font-black text-white truncate">{formatKz(todayAnalytics.totalSales)}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{todayAnalytics.totalOrders} pedidos</p>
            </div>

            {/* Card 2: Pedidos Ativos */}
            <div className="glass-panel rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
              <div className="flex items-start justify-between mb-1">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Ativos</span>
                <ShoppingBag size={14} className="text-blue-400 sm:w-3.5 sm:h-3.5" />
              </div>
              <p className="text-lg sm:text-2xl font-black text-white animate-pulse">{liveActiveOrders}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">mesas ativas</p>
            </div>

            {/* Card 3: Equipa */}
            <div className="glass-panel rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
              <div className="flex items-start justify-between mb-1">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Equipa</span>
                <Users size={14} className="text-green-400 sm:w-3.5 sm:h-3.5" />
              </div>
              <p className="text-lg sm:text-2xl font-black text-white">{employeesWorking.length}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">ao serviço</p>
            </div>

            {/* Card 4: Retenção */}
            {widgetConfig.showRetention && (
              <div className="glass-panel rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Loyalty</span>
                  <TrendingUp size={14} className="text-purple-400 sm:w-3.5 sm:h-3.5" />
                </div>
                <p className="text-lg sm:text-2xl font-black text-white">{(typeof retention === 'number' ? retention : 0).toFixed(0)}%</p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">retenção</p>
              </div>
            )}

            {/* Card 5: Tempo Médio de Preparo */}
            {widgetConfig.showPrepTime && (
              <div className="glass-panel rounded-lg sm:rounded-xl p-3 sm:p-4 border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Preparo Médio</span>
                  <Clock size={14} className="text-yellow-400 sm:w-3.5 sm:h-3.5" />
                </div>
                <p className="text-lg sm:text-2xl font-black text-white">{averagePreparationTime}m</p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">por pedido</p>
              </div>
            )}

            {/* Card 6: Mesas Disponíveis */}
            {widgetConfig.showTables && (
              <div className="glass-panel rounded-lg sm:rounded-xl p-3 sm:p-4 border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Mesas Livres</span>
                  <Users size={14} className="text-cyan-400 sm:w-3.5 sm:h-3.5" />
                </div>
                <p className="text-lg sm:text-2xl font-black text-white">{availableTablesCount}</p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">disponíveis</p>
              </div>
            )}

            {widgetConfig.showExpenses && (
              <div className="glass-panel rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Despesas Hoje</span>
                  <TrendingUp size={14} className="text-red-400 sm:w-3.5 sm:h-3.5" />
                </div>
                <p className="text-lg sm:text-2xl font-black text-white">{formatKz(todayExpenses)}</p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">saídas</p>
              </div>
            )}

            {widgetConfig.showCashFlow && (
              <div className="glass-panel rounded-lg sm:rounded-xl p-3 sm:p-4 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Fluxo de Caixa</span>
                  <TrendingUp size={14} className="text-emerald-400 sm:w-3.5 sm:h-3.5" />
                </div>
                <p className="text-lg sm:text-2xl font-black text-white">{formatKz(cashFlowToday)}</p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">hoje</p>
              </div>
            )}

            {widgetConfig.showNetProfit && (
              <div className="glass-panel rounded-lg sm:rounded-xl p-3 sm:p-4 border border-sky-500/20 bg-gradient-to-br from-sky-500/5 to-transparent">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Lucro Líquido</span>
                  <TrendingUp size={14} className="text-sky-400 sm:w-3.5 sm:h-3.5" />
                </div>
                <p className="text-lg sm:text-2xl font-black text-white">{formatKz(netProfitToday)}</p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">hoje</p>
              </div>
            )}
          </div>

          {/* Tabs de Detalhes */}
          <div className="border-t border-white/5 sticky top-20 z-40 bg-slate-900/95 backdrop-blur-sm">
            <div className="flex gap-2 p-3 overflow-x-auto">
              {[
                { id: 'orders', label: '📋 Comando' },
                { id: 'analytics', label: '📊 Analytics' },
                { id: 'sales', label: '📈 Análises' },
                { id: 'finance', label: '💰 Finanças' },
                { id: 'system', label: '⚙️ Sistema' },
                { id: 'shifts', label: '📅 Escalas' },
                { id: 'reservations', label: '📒 Reservas' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedMetric(tab.id as DashboardMetric)}
                  className={`px-4 py-2 rounded-lg font-bold text-[11px] uppercase tracking-widest whitespace-nowrap transition-all
                    ${selectedMetric === tab.id
                      ? 'bg-primary text-black shadow-glow'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conteúdo das Abas */}
          <div className="p-3 sm:p-5 pb-20">
            {/* ANALYTICS */}
            {selectedMetric === 'analytics' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="glass-panel rounded-xl p-2.5 border border-white/5 col-span-full">
                  <h3 className="text-[10px] font-black text-white mb-4 uppercase tracking-wider">Top 5 Pratos (Receita 30 Dias)</h3>
                  
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={menuAnalytics.slice(0, 5)} 
                        layout="vertical"
                        margin={{ left: -20, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff05" />
                        <XAxis type="number" hide={true} />
                        <YAxis 
                          dataKey="dishName" 
                          type="category" 
                          width={100}
                          tick={{ fill: '#94a3b8', fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          cursor={{ fill: '#ffffff05' }}
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            border: '1px solid #ffffff10',
                            borderRadius: '8px',
                            fontSize: '10px'
                          }}
                          formatter={(value: number) => [formatKz(value), 'Receita']}
                        />
                        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                          {menuAnalytics.slice(0, 5).map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#EAB308' : '#3b82f6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-1.5 overflow-y-auto max-h-[40vh] mt-4 pt-4 border-t border-white/5">
                    {!Array.isArray(menuAnalytics) || menuAnalytics.length === 0 ? (
                      <p className="text-slate-400 text-[10px] text-center py-4">Sem dados de análise disponíveis</p>
                    ) : (
                      menuAnalytics.map((item, i) => {
                        if (!item) return null;
                        return (
                          <div key={item.dishId || i} className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col gap-1.5">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded bg-slate-800 text-slate-300 font-black text-[10px] flex items-center justify-center">
                                  {i + 1}
                                </span>
                                <span className="text-[11px] font-bold text-white truncate max-w-[150px]">{item?.dishName || 'N/A'}</span>
                              </div>
                              <span className="text-[10px] font-black text-primary">{formatKz(item?.revenue || 0)}</span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 mt-1">
                              <div className="flex flex-col">
                                <span className="text-[8px] text-slate-500 uppercase font-bold">Vendas</span>
                                <span className="text-[10px] font-black text-white">{item?.sold || 0} un</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] text-slate-500 uppercase font-bold">Margem</span>
                                <span className={`text-[10px] font-black ${(item?.profitMargin || 0) > 50 ? 'text-green-400' : (item?.profitMargin || 0) > 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {(item?.profitMargin || 0).toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] text-slate-500 uppercase font-bold">Pedidos</span>
                                <span className="text-[10px] font-black text-blue-400">{item?.orders || 0}</span>
                              </div>
                            </div>
                            
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${((item?.revenue || 0) / ((menuAnalytics[0]?.revenue || 0) || 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-2.5 border border-white/5 col-span-full">
                  <h3 className="text-[10px] font-black text-white mb-2 uppercase tracking-wider">KPIs de Conversão</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1">Taxa de Retenção</span>
                      <p className="text-lg font-black text-purple-400">{retention.toFixed(1)}%</p>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-purple-400" style={{ width: `${retention}%` }} />
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1">Ticket Médio (30d)</span>
                      <p className="text-lg font-black text-green-400">{formatKz(todayAnalytics.avgOrder)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VENDAS */}
            {selectedMetric === 'sales' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="glass-panel rounded-xl p-2.5 border border-white/5 col-span-full">
                  <h3 className="text-[10px] font-black text-white mb-4 uppercase tracking-wider">Receita vs Lucro (7 Dias)</h3>
                  
                  <div className="h-48 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={last7DaysAnalytics}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                        <XAxis 
                          dataKey="formattedDate" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 10 }}
                        />
                        <YAxis hide={true} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            border: '1px solid #ffffff10',
                            borderRadius: '8px',
                            fontSize: '10px'
                          }}
                          formatter={(value: number) => formatKz(value)}
                        />
                        <Bar dataKey="totalSales" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Receita" />
                        <Bar dataKey="totalProfit" fill="#10b981" radius={[4, 4, 0, 0]} name="Lucro" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex items-center justify-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Receita</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Lucro</span>
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-2.5 border border-white/5">
                  <h3 className="text-[10px] font-black text-white mb-2 uppercase tracking-wider">Últimas 24 Horas</h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center p-1.5 rounded-lg bg-white/5">
                      <span className="text-[10px] font-bold text-slate-400">Total Vendido</span>
                      <span className="text-sm font-black text-primary">{formatKz(todayAnalytics.totalSales)}</span>
                    </div>
                    <div className="flex justify-between items-center p-1.5 rounded-lg bg-white/5">
                      <span className="text-[10px] font-bold text-slate-400">Pedidos</span>
                      <span className="text-sm font-black text-blue-400">{todayAnalytics.totalOrders}</span>
                    </div>
                    <div className="flex justify-between items-center p-1.5 rounded-lg bg-white/5">
                      <span className="text-[10px] font-bold text-slate-400">Ticket Médio</span>
                      <span className="text-sm font-black text-green-400">{formatKz(todayAnalytics.avgOrder)}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    {last7DaysSales.length > 0 ? (
                      <div className="h-10 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={last7DaysSales}>
                            <defs>
                              <linearGradient id="mobileSalesSpark" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area
                              type="monotone"
                              dataKey="totalSales"
                              stroke="#3b82f6"
                              fill="url(#mobileSalesSpark)"
                              strokeWidth={2}
                              fillOpacity={1}
                              dot={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-[9px] text-slate-500">Sem histórico recente</p>
                    )}
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-2.5 border border-white/5">
                  <h3 className="text-[10px] font-black text-white mb-2 uppercase tracking-wider">Top Pratos Hoje</h3>
                  <div className="space-y-1.5">
                    {isRemote && (dashboardAnalytics?.menu || remoteData?.menu) ? (
                      (dashboardAnalytics?.menu || remoteData?.menu || [])
                        .sort((a, b) => (b?.sold || 0) - (a?.sold || 0))
                        .slice(0, 3)
                        .map((prato, i: number) => (
                          <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-white/5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-primary text-black font-black text-[9px] flex items-center justify-center">{i + 1}</span>
                              <span className="text-[10px] font-bold truncate max-w-[100px]">{prato?.dishName || 'N/A'}</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">{prato?.sold || 0}x</span>
                          </div>
                        ))
                    ) : (
                      (() => {
                        if (!getMenuAnalytics || typeof getMenuAnalytics !== 'function') {
                          return [];
                        }
                        try {
                          const analytics = getMenuAnalytics(1);
                          return Array.isArray(analytics) ? analytics : [];
                        } catch (error) {
                          console.error('Error getting menu analytics:', error);
                          return [];
                        }
                      })()
                        .sort((a, b) => (b?.sold || 0) - (a?.sold || 0))
                        .slice(0, 3)
                        .map((prato, i) => (
                          <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-white/5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-primary text-black font-black text-[9px] flex items-center justify-center">{i + 1}</span>
                              <span className="text-[10px] font-bold truncate max-w-[100px]">{prato.dishName}</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">{prato.sold}x</span>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Relatório de Vendas Diárias (Últimos 7 Dias) */}
                <div className="glass-panel rounded-xl p-2.5 border border-white/5 col-span-full">
                  <h3 className="text-[10px] font-black text-white mb-4 uppercase tracking-wider">Tendência de Vendas (7 Dias)</h3>
                  
                  <div className="h-48 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={last7DaysSales}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 10 }}
                        />
                        <YAxis 
                          hide={true}
                          domain={['auto', 'auto']}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            border: '1px solid #ffffff10',
                            borderRadius: '8px',
                            fontSize: '10px'
                          }}
                          formatter={(value: number) => [formatKz(value), 'Vendas']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="totalSales" 
                          stroke="#EAB308" 
                          fillOpacity={1} 
                          fill="url(#colorSales)" 
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-1.5 mt-4 pt-4 border-t border-white/5">
                    {last7DaysSales.slice().reverse().map((day, i) => (
                      <div key={i} className="flex justify-between items-center p-1.5 rounded-lg bg-white/5">
                        <span className="text-[10px] font-bold text-slate-400">{day.date}</span>
                        <span className="text-sm font-black text-primary">{formatKz(day.totalSales)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PEDIDOS */}
            {selectedMetric === 'orders' && (
              <div className="glass-panel rounded-xl p-2.5 border border-white/5">
                <h3 className="text-[10px] font-black text-white mb-2 flex items-center gap-2 uppercase tracking-wider">
                  <Clock size={12} /> Pedidos Ativos ({liveActiveOrders})
                </h3>
                {activeOrders.filter(o => o.status === 'ABERTO').length === 0 ? (
                  <p className="text-slate-400 text-[10px]">Nenhum pedido ativo</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-[50vh] overflow-y-auto pr-1">
                    {activeOrders
                      .filter(o => o.status === 'ABERTO')
                      .map(order => (
                        <div key={order.id} className="p-1.5 rounded-lg bg-white/5 flex items-center justify-between border border-white/5 hover:border-primary/30 transition-all">
                          <div>
                            <p className="text-[10px] font-bold">Mesa {order.tableId}</p>
                            <p className="text-[9px] text-slate-400">{order.items.length} itens</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-primary">{formatKz(order.total)}</p>
                            <p className="text-[9px] text-slate-400">
                              {Math.round((currentTime - new Date(order.timestamp).getTime()) / 60000)}m
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* FINANÇAS */}
            {selectedMetric === 'finance' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <div className="glass-panel rounded-xl p-2.5 border border-white/5">
                  <h3 className="text-[10px] font-black text-white mb-2 uppercase tracking-wider">Resumo Financeiro</h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center p-1.5 rounded-lg bg-white/5">
                      <span className="text-[10px] font-bold text-slate-400">Total Vendas (Hoje)</span>
                      <span className="text-base font-black text-green-400">{formatKz(todayAnalytics.totalSales)}</span>
                    </div>
                    <div className="flex justify-between items-center p-1.5 rounded-lg bg-white/5">
                      <span className="text-[10px] font-bold text-slate-400">Lucro Bruto (Hoje)</span>
                      <span className="text-base font-black text-primary">{formatKz(data.grossProfitToday || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-1.5 rounded-lg bg-white/5">
                      <span className="text-[10px] font-bold text-slate-400">Fluxo de Caixa (Hoje)</span>
                      <span className="text-base font-black text-emerald-400">{formatKz(cashFlowToday)}</span>
                    </div>
                    <div className="flex justify-between items-center p-1.5 rounded-lg bg-white/5">
                      <span className="text-[10px] font-bold text-slate-400">Lucro Líquido (Hoje)</span>
                      <span className="text-base font-black text-sky-400">{formatKz(netProfitToday)}</span>
                    </div>
                    {(isRemote ? remoteExpenses : localExpenses).length > 0 && (
                      <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5">
                        <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Despesas</h4>
                        {Array.isArray(isRemote ? remoteExpenses : localExpenses) ? (isRemote ? remoteExpenses : localExpenses).slice(0, 3).map((exp, i) => (
                          <div key={i} className="flex justify-between items-center p-1.5 rounded bg-white/5">
                            <span className="text-[10px] truncate max-w-[120px]">{exp?.description || ''}</span>
                            <span className="text-[10px] font-bold text-red-400">-{formatKz(exp?.amount || 0)}</span>
                          </div>
                        )) : null}
                      </div>
                    )}
                  </div>
                </div>
                <div className="glass-panel rounded-xl p-2.5 border border-white/5">
                  <h3 className="text-[10px] font-black text-white mb-2 uppercase tracking-wider">Lucro Geral</h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center p-1.5 rounded-lg bg-white/5">
                      <span className="text-[10px] font-bold text-slate-400">Vendas (Todo o período)</span>
                      <span className="text-base font-black text-green-400">{formatKz(profitMetrics.totalSalesAllTime)}</span>
                    </div>
                    <div className="flex justify-between items-center p-1.5 rounded-lg bg-white/5">
                      <span className="text-[10px] font-bold text-slate-400">Lucro Bruto (Todas as vendas)</span>
                      <span className="text-base font-black text-primary">{formatKz(profitMetrics.grossProfitAllTime)}</span>
                    </div>
                    <div className="flex justify-between items-center p-1.5 rounded-lg bg-white/5">
                      <span className="text-[10px] font-bold text-slate-400">Lucro Geral (Todas as vendas)</span>
                      <span className="text-base font-black text-white">{formatKz(profitMetrics.netProfitAllTime)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SISTEMA */}
            {selectedMetric === 'system' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="glass-panel rounded-xl p-2.5 border border-white/5">
                    <h3 className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={12} className="text-primary" /> Equipa
                    </h3>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-bold">Ativos</span>
                        <span className="text-sm font-black text-white">{employeesWorking.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-bold">Total</span>
                        <span className="text-sm font-black text-white">{employees.length}</span>
                      </div>
                    </div>
                  </div>
                  <div className="glass-panel rounded-xl p-2.5 border border-white/5">
                    <h3 className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                      <Bell size={12} className="text-primary" /> Alertas
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                        <AlertTriangle size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{alerts.filter(a => a.type === 'error').length}</p>
                        <p className="text-[8px] text-slate-500 font-bold uppercase">Críticos</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-3 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-wider">Configurações Rápidas</h3>
                    <Settings size={12} className="text-slate-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center gap-1">
                      <span className="text-[8px] font-black text-slate-500 uppercase">KDS</span>
                      <span className={`text-[10px] font-black ${settings.kdsEnabled ? 'text-green-400' : 'text-red-400'}`}>
                        {settings.kdsEnabled ? 'ATIVO' : 'OFF'}
                      </span>
                    </button>
                    <button className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center gap-1">
                      <span className="text-[8px] font-black text-slate-500 uppercase">Sincronização</span>
                      <span className={`text-[10px] font-black ${isRemote ? 'text-green-400' : 'text-slate-400'}`}>
                        {isRemote ? 'ONLINE' : 'LOCAL'}
                      </span>
                    </button>
                    <button className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center gap-1">
                      <span className="text-[8px] font-black text-slate-500 uppercase">Menu QR</span>
                      <span className={`text-[10px] font-black ${(settings as any).qrMenuReadOnly ? 'text-red-400' : 'text-green-400'}`}>
                        {(settings as any).qrMenuReadOnly ? 'READ-ONLY' : 'EDITABLE'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-3 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-wider">Alertas Personalizados</h3>
                    <Bell size={12} className="text-slate-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-400">Queda de receita (%)</span>
                      <input
                        type="number"
                        min={5}
                        max={90}
                        value={alertConfig.revenueDropPercent}
                        onChange={(e) => setAlertConfig(prev => ({ ...prev, revenueDropPercent: Number(e.target.value || 0) }))}
                        className="w-16 h-7 rounded-md bg-white/5 border border-white/10 text-center text-[10px] font-black text-white"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-400">Tempo de preparo (min)</span>
                      <input
                        type="number"
                        min={5}
                        max={120}
                        value={alertConfig.prepTimeLimit}
                        onChange={(e) => setAlertConfig(prev => ({ ...prev, prepTimeLimit: Number(e.target.value || 0) }))}
                        className="w-16 h-7 rounded-md bg-white/5 border border-white/10 text-center text-[10px] font-black text-white"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-400">Mesas ativas</span>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={alertConfig.activeOrdersLimit}
                        onChange={(e) => setAlertConfig(prev => ({ ...prev, activeOrdersLimit: Number(e.target.value || 0) }))}
                        className="w-16 h-7 rounded-md bg-white/5 border border-white/10 text-center text-[10px] font-black text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-3 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-wider">Widgets</h3>
                    <BarChart3 size={12} className="text-slate-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setWidgetConfig(prev => ({ ...prev, showRetention: !prev.showRetention }))}
                      className={`p-2 rounded-lg border ${widgetConfig.showRetention ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' : 'bg-white/5 border-white/5 text-slate-400'} text-[9px] font-black uppercase`}
                    >
                      Retenção
                    </button>
                    <button
                      onClick={() => setWidgetConfig(prev => ({ ...prev, showPrepTime: !prev.showPrepTime }))}
                      className={`p-2 rounded-lg border ${widgetConfig.showPrepTime ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' : 'bg-white/5 border-white/5 text-slate-400'} text-[9px] font-black uppercase`}
                    >
                      Preparo
                    </button>
                    <button
                      onClick={() => setWidgetConfig(prev => ({ ...prev, showTables: !prev.showTables }))}
                      className={`p-2 rounded-lg border ${widgetConfig.showTables ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-white/5 border-white/5 text-slate-400'} text-[9px] font-black uppercase`}
                    >
                      Mesas
                    </button>
                    <button
                      onClick={() => setWidgetConfig(prev => ({ ...prev, showExpenses: !prev.showExpenses }))}
                      className={`p-2 rounded-lg border ${widgetConfig.showExpenses ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-white/5 border-white/5 text-slate-400'} text-[9px] font-black uppercase`}
                    >
                      Despesas
                    </button>
                    <button
                      onClick={() => setWidgetConfig(prev => ({ ...prev, showCashFlow: !prev.showCashFlow }))}
                      className={`p-2 rounded-lg border ${widgetConfig.showCashFlow ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-white/5 border-white/5 text-slate-400'} text-[9px] font-black uppercase`}
                    >
                      Fluxo
                    </button>
                    <button
                      onClick={() => setWidgetConfig(prev => ({ ...prev, showNetProfit: !prev.showNetProfit }))}
                      className={`p-2 rounded-lg border ${widgetConfig.showNetProfit ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' : 'bg-white/5 border-white/5 text-slate-400'} text-[9px] font-black uppercase`}
                    >
                      Lucro
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ANÁLISE */}
            {selectedMetric === 'analytics' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="glass-panel rounded-xl p-2.5 border border-white/5">
                  <h3 className="text-[10px] font-black text-white mb-2 uppercase tracking-wider">Métricas</h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center p-1.5 rounded-lg bg-white/5">
                      <span className="text-[10px] font-bold text-slate-400">Clientes</span>
                      <span className="text-sm font-black text-primary">
                        {isRemote && remoteAnalytics ? remoteAnalytics.totalCustomers : customers.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-1.5 rounded-lg bg-white/5">
                      <span className="text-[10px] font-bold text-slate-400">Retenção</span>
                      <span className="text-sm font-black text-green-400">
                        {isRemote && remoteAnalytics ? Number(remoteAnalytics.retentionRate || 0).toFixed(1) : (typeof retention === 'number' ? retention : 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ESCALAS */}
            {selectedMetric === 'shifts' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-black text-white uppercase tracking-wider">Turnos de Hoje</h3>
                  <CalendarDays size={12} className="text-primary" />
                </div>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {employees.slice(0, 5).map(emp => {
                    const shift = shifts.find(s => s.employeeId === emp.id);
                    return (
                      <div key={emp.id} className="glass-panel rounded-xl p-2.5 border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">
                            {emp.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-tight">{emp.name}</p>
                            <p className="text-[8px] text-slate-500 font-bold">{emp.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-primary">
                            {shift ? `${shift.startTime} - ${shift.endTime}` : '09:00 - 18:00'}
                          </p>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                            employeesWorking.some(e => e.id === emp.id) ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-500'
                          }`}>
                            {employeesWorking.some(e => e.id === emp.id) ? 'PRESENTE' : 'AUSENTE'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RESERVAS */}
            {selectedMetric === 'reservations' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-black text-white uppercase tracking-wider">Próximas Reservas</h3>
                  <Clock size={12} className="text-primary" />
                </div>
                {reservations.length > 0 ? (
                  <div className="space-y-1.5">
                    {[...reservations]
                      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                      .slice(0, 5).map(res => (
                      <div key={res.id} className="glass-panel rounded-xl p-2.5 border border-white/5 flex items-center justify-center text-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Users size={14} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-tight">{(res as any).customerName || 'Cliente'}</p>
                            <p className="text-[8px] text-slate-500 font-bold">
                              {new Date(res.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {res.numGuests} pessoas
                            </p>
                          </div>
                        </div>
                        <div className="px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-primary">
                          Mesa {res.tableId || 'TBD'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-panel rounded-xl p-8 border border-white/5 flex flex-col items-center justify-center text-center">
                    <Calendar size={24} className="text-slate-700 mb-2" />
                    <p className="text-[10px] font-black text-slate-500 uppercase">Sem reservas para hoje</p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Floating Action Button */}
          <div className="fixed bottom-6 right-4 flex flex-col gap-2">
            <button
              className="w-14 h-14 rounded-full bg-primary text-black shadow-glow hover:scale-110 transition-all flex items-center justify-center font-black"
              title="Notificações"
            >
              <Bell size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileDashboard;
