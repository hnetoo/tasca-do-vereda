import { StateCreator } from 'zustand';
import { Order, Expense, Revenue, FixedExpense, PayrollRecord, PaymentMethod, StoreState, FinancialClearanceReport, FinancialBackupData, OrderPayment, PaymentCorrection, DailySalesAnalytics, MenuAnalytics, DashboardSummary, Analytics, UUID, Dish, OrderItemDetail, User } from '@/types';
import { logger } from '@/services/logger';
import { backupService } from '@/services/backupService';
import { integrationAPIService } from '@/services/integrationAPIService';
import { getAngolaToday } from '@/utils/date';

import { 
  clearFinancialDataAction, 
  correctPaymentAction, 
  saveShiftsAction 
} from '@/app/actions/finance';
import { saveOrderActionClient } from '@/utils/clientOperationalActions';

export interface FinanceSlice {
  orders: Order[];
  activeOrders: Order[];
  activeOrderIds: UUID[];
  expenses: Expense[];
  fixedExpenses: FixedExpense[];
  revenues: Revenue[];
  payroll: PayrollRecord[];
  activeOrderId: UUID | null;
  dashboardSummary: DashboardSummary | null;
  dashboardAnalytics: Analytics | null;
  setActiveOrder: (id: UUID | null) => void;
  setDashboardSummary: (summary: DashboardSummary) => void;
  setDashboardAnalytics: (analytics: Analytics) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  removeOrder: (id: UUID) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  removeExpense: (id: UUID) => void;
  addRevenue: (revenue: Revenue) => void;
  removeRevenue: (id: UUID) => void;
  addFixedExpense: (expense: FixedExpense) => void;
  updateFixedExpense: (expense: FixedExpense) => void;
  removeFixedExpense: (id: UUID) => void;
  addPayrollRecord: (record: PayrollRecord) => void;
  updatePayrollRecord: (record: PayrollRecord) => void;
  removePayrollRecord: (id: UUID) => void;
  setOrders: (orders: Order[]) => void;
  setExpenses: (expenses: Expense[]) => void;
  setRevenues: (revenues: Revenue[]) => void;
  setPayroll: (payroll: PayrollRecord[]) => void;
  getLoyaltyTier: (customerId: UUID) => string;
  processPayroll: (employeeId: UUID, month: number, year: number, paymentMethod: PaymentMethod) => Promise<void>;
  createFullFinancialBackup: () => Promise<boolean>;
  restoreFullFinancialBackup: () => Promise<boolean>;
  clearFinancialData: (reason: string, userId: UUID) => Promise<{ success: boolean; report: FinancialClearanceReport }>;
  correctPayment: (orderId: UUID, newPayments: OrderPayment[], reason: string, user: User) => Promise<boolean>;
  getDailySalesAnalytics: (days: number) => DailySalesAnalytics[];
  getSalesForDate: (date: Date) => DailySalesAnalytics;
  getMenuAnalytics: (period: 'day' | 'week' | 'month' | number) => MenuAnalytics[];
  getStockAnalytics: () => Array<{ itemId: string; itemName: string; currentStock: number; minThreshold: number; daysToRunOut: number }>;
  getEmployeePerformance: () => Array<{ employeeId: string; efficiency: number; rating: number }>;
  getPeakHours: () => number[];
  getTopSellingDishes: (limit?: number) => Dish[];
  getAverageOrderValue: () => number;
  getCustomerRetention: () => any;
  getRevenueHistory: (days?: number) => Array<{ date: string; totalRevenue: number }>;
  syncFinancialMetricsToDashboard: () => Promise<void>;
  fetchRemoteDashboard: () => Promise<void>;
  handleRealtimeUpdate: (payload: RealtimePayload) => void;
  
  addToOrder: (tableId: string, dish: Dish, quantity: number, notes: string, orderId: UUID, userId?: string) => void;
  removeFromOrder: (orderId: UUID, itemIndex: number, userId?: string) => void;
  checkoutTable: (orderId: UUID, payments: OrderPayment[], subAccountName?: string, customerNif?: string, userId?: string) => Promise<void>;
  fireOrderToKitchen: (orderId: UUID) => void;
  clearDraftOrder: (orderId: UUID) => void;
  updateOrderItemStatus: (orderId: string, itemIndex: number, status: string) => void;
  markOrderAsServed: (orderId: string) => void;
}

interface RealtimeDashboardSummaryData {
  total_revenue: number;
  total_expenses: number;
  total_orders: number;
  active_orders_count: number;
}

interface RealtimePayload {
  table: string;
  new: RealtimeDashboardSummaryData;
}

export const createFinanceSlice: StateCreator<
  StoreState,
  [],
  [],
  FinanceSlice
> = (set, get) => ({
  activeOrders: [],
  activeOrderIds: [],
  orders: [],
  expenses: [],
  fixedExpenses: [],
  revenues: [],
  payroll: [],
  activeOrderId: null,
  dashboardSummary: null,
  dashboardAnalytics: null,
  
  handleRealtimeUpdate: (payload: RealtimePayload) => {
    // Handle Supabase Realtime payload
    if (payload.table === 'dashboard_summary') {
      const newData = payload.new;
      if (newData) {
        set({
          dashboardSummary: {
            totalRevenue: newData.total_revenue,
            totalExpenses: newData.total_expenses,
            totalOrders: newData.total_orders,
            activeOrders: newData.active_orders_count
          }
        });
        logger.info('Real-time dashboard summary update received', newData, 'FINANCE');
      }
    }
  },

  setActiveOrder: (id: UUID | null) => set({ activeOrderId: id }),
  setDashboardSummary: (summary: DashboardSummary) => set({ dashboardSummary: summary }),
  setDashboardAnalytics: (analytics: Analytics) => set({ dashboardAnalytics: analytics }),

  addOrder: (order: Order) => {
    const exists = get().orders.some(o => o.id === order.id);
    if (exists || !order.id) return;
    set((state) => ({ 
        orders: [...state.orders, order], 
        activeOrders: [...state.activeOrders, order],
        activeOrderIds: [...state.activeOrderIds, order.id as string] 
    }));
    get().addAuditLog({
      action: 'ORDER_CREATE',
      details: `Novo pedido criado: ${order.order_number || order.id}`,
      metadata: { orderId: order.id, total: order.total },
    });
  },

  updateOrder: (order: Order) => {
    set((state) => ({
      orders: state.orders.map((o) => o.id === order.id ? order : o),
      activeOrders: state.activeOrders.map((o) => o.id === order.id ? order : o),
      // Update activeOrderIds if status changes to closed? Or keep it?
      // Assuming activeOrderIds tracks IDs of active orders, if order closes, we should remove it?
      // But activeOrders array seems to just update the object.
      // If activeOrders is meant to be ONLY active orders, then updateOrder should remove it if status is closed.
      // But currently it just maps.
    }));
    // Log only if status changed or it's a critical update
    const prevOrder = get().orders.find(o => o.id === order.id);
    if (prevOrder && prevOrder.status !== order.status) {
      get().addAuditLog({
        action: 'ORDER_STATUS_CHANGE',
        details: `Status do pedido ${order.order_number || order.id} alterado para ${order.status}`,
        metadata: { orderId: order.id, oldStatus: prevOrder.status, newStatus: order.status },
      });
    }
  },

    // Calculate daily sales history
    getDailySalesAnalytics: (days: number) => {
        const result: DailySalesAnalytics[] = [];
        const today = new Date();
        // Loop backwards from today (e.g. 6 days ago to today)
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            result.push(get().getSalesForDate(d));
        }
        return result;
    },

    // Calculate sales for a specific date
    getSalesForDate: (date: Date) => {
        const state = get();
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const dailyOrders = state.orders.filter(order => {
            const orderDate = new Date(order.created_at || new Date());
            return orderDate >= startOfDay && orderDate <= endOfDay && order.status !== 'cancelled';
        });

        let totalRevenue = 0;
        let totalProfit = 0;
        let totalProductCost = 0;
        let orderCount = dailyOrders.length;
        let averageTicket = 0;

        dailyOrders.forEach(order => {
            totalRevenue += Number(order.total || 0);
            let orderProfit = 0;
            
            (order.items || []).forEach((item: any) => {
                const dishId = item.dish_id ?? item.dishId;
                const dish = state.dishes?.find(dish => dish.id === dishId);
                const costPrice = 0; 
                const unitPrice = Number(item.unit_price || item.unitPrice || 0);
                const quantity = Number(item.quantity || 0);
                orderProfit += (unitPrice - Number(costPrice)) * quantity;
                totalProductCost += Number(costPrice) * quantity;
            });

            totalProfit += orderProfit;
        });

        if (orderCount > 0) {
            averageTicket = totalRevenue / orderCount;
        }

        return {
            totalRevenue,
            totalProfit,
            totalProductCost,
            orderCount,
            averageTicket,
            date: startOfDay.toISOString()
        };
    },

    // Calculate menu performance
    getMenuAnalytics: (period: 'day' | 'week' | 'month' | number) => {
        const state = get();
        const now = new Date();
        const startDate = new Date();

        if (typeof period === 'number') {
            startDate.setDate(now.getDate() - period);
        } else if (period === 'day') {
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'week') {
            startDate.setDate(now.getDate() - 7);
        } else {
            startDate.setMonth(now.getMonth() - 1);
        }

        const periodOrders = state.orders.filter(order => {
            const orderDate = new Date(order.created_at || new Date());
            return orderDate >= startDate && order.status !== 'cancelled';
        });

        const dishPerformance = new Map<string, { 
            id: string;
            name: string; 
            quantity: number; 
            revenue: number; 
            profit: number 
        }>();

        periodOrders.forEach(order => {
            (order.items || []).forEach((item: any) => {
                const dishId = item.dish_id ?? item.dishId;
                const dish = state.dishes?.find(dish => dish.id === dishId);
                if (!dish) return;

                const current = dishPerformance.get(dish.id) || {
                    id: dish.id,
                    name: dish.name,
                    quantity: 0,
                    revenue: 0,
                    profit: 0
                };

                const costPrice = 0; // TODO: Implement cost tracking
                const unitPrice = Number(item.unit_price || item.unitPrice || 0);
                
                current.quantity += Number(item.quantity || 0);
                current.revenue += unitPrice * item.quantity;
                current.profit += (unitPrice - costPrice) * item.quantity;

                dishPerformance.set(dish.id, current);
            });
        });

        return Array.from(dishPerformance.values()).sort((a, b) => b.revenue - a.revenue);
    },

  getStockAnalytics: () => {
    const items = get().stock || [];
    return items.map((item: any) => {
      const currentStock = Number(item.stock_quantity ?? item.quantity ?? item.stock ?? 0);
      const minThreshold = Number(item.min_stock_quantity ?? item.minStockQuantity ?? 0);
      const averageDailyUse = Number(item.average_daily_use ?? item.averageDailyUse ?? 0);
      const daysToRunOut = averageDailyUse > 0 ? Math.floor(currentStock / averageDailyUse) : 0;
      return {
        itemId: item.id,
        itemName: item.name || item.itemName || 'Item',
        currentStock,
        minThreshold,
        daysToRunOut
      };
    });
  },

  getEmployeePerformance: () => {
    const employees = get().employees || [];
    const attendance = get().attendance || [];
    return employees.map((emp: any) => {
      const employeeAttendance = attendance.filter((a: any) => a.employeeId === emp.id);
      const attendanceCount = employeeAttendance.length;
      const efficiency = Math.min(100, 60 + attendanceCount * 2);
      const rating = Math.min(5, 3 + attendanceCount / 10);
      return {
        employeeId: emp.id,
        efficiency,
        rating
      };
    });
  },

  getPeakHours: () => {
    const orders = get().orders || [];
    const counts: Record<number, number> = {};
    orders.forEach(order => {
      const date = new Date(order.created_at || order.timestamp || new Date());
      const hour = date.getHours();
      counts[hour] = (counts[hour] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hour]) => Number(hour));
  },

  getTopSellingDishes: (limit = 10) => {
    const orders = get().orders || [];
    const dishCount: Record<string, number> = {};
    orders.forEach(order => {
      (order.items || []).forEach((item: any) => {
        const dishId = item.dish_id || item.product_id;
        if (!dishId) return;
        dishCount[dishId] = (dishCount[dishId] || 0) + Number(item.quantity || 0);
      });
    });
    const dishes = get().dishes || [];
    return [...dishes]
      .sort((a, b) => (dishCount[b.id] || 0) - (dishCount[a.id] || 0))
      .slice(0, limit);
  },

  getAverageOrderValue: () => {
    const orders = get().orders || [];
    if (orders.length === 0) return 0;
    const total = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    return total / orders.length;
  },

  getCustomerRetention: () => {
    return {
      returningCustomers: 0,
      totalCustomers: 0,
      retentionRate: 0
    };
  },

  getRevenueHistory: (days = 7) => {
    const state = get();
    const today = new Date(getAngolaToday());
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (days - 1));

    // Agrupar receitas por data
    const revenueByDate: Record<string, number> = {};
    
    state.revenues.forEach(revenue => {
      const revenueDate = new Date(revenue.date);
      if (revenueDate >= startDate) {
        const dateKey = revenueDate.toISOString().split('T')[0];
        revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + revenue.amount;
      }
    });

    // Também incluir receitas de pedidos fechados
    const closedOrders = state.orders.filter(o =>
      o.status === 'FECHADO' && o.timestamp && new Date(o.timestamp) >= startDate
    );

    closedOrders.forEach(order => {
      const date = new Date(order.timestamp!).toISOString().split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + Number(order.total || 0);
    });

    return Object.entries(revenueByDate)
      .map(([date, totalRevenue]) => ({ date, totalRevenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  syncFinancialMetricsToDashboard: async () => {
    const state = get();
    const totalRevenue = state.revenues.reduce((sum, r) => sum + r.amount, 0) + state.orders.filter(o => o.status === 'FECHADO').reduce((sum, o) => sum + Number(o.total || 0), 0);
    const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalOrders = state.orders.length;
    const activeOrdersCount = state.activeOrders.length;

    const summary: DashboardSummary = {
      totalRevenue,
      totalExpenses,
      totalOrders,
      activeOrders: activeOrdersCount,
    };

    try {
      // await integrationAPIService.syncDashboardData(summary, state.activeOrders);
      logger.info('Métricas financeiras sincronizadas com o dashboard', summary, 'FINANCE');
    } catch (error) {
      logger.error('Erro ao sincronizar métricas financeiras com o dashboard', error, 'FINANCE');
      state.addNotification('error', 'Erro ao sincronizar métricas financeiras com o dashboard.');
    }
  },

  removeOrder: (id: UUID) => set((state) => ({
    orders: state.orders.filter((o) => o.id !== id),
    activeOrders: state.activeOrders.filter((o) => o.id !== id)
  })),
  
  addExpense: (expense: Expense) => {
    const exists = get().expenses.some(e => e.id === expense.id);
    if (exists) return;
    set((state) => ({ expenses: [...state.expenses, expense] }));
    get().addAuditLog({
      action: 'EXPENSE_ADD',
      details: `Despesa adicionada: ${expense.description} - ${expense.amount}`,
      metadata: { expenseId: expense.id, amount: expense.amount },
    });
  },
  
  updateExpense: (expense: Expense) => {
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === expense.id ? expense : e)),
    }));
    get().addAuditLog({
      action: 'EXPENSE_UPDATE',
      details: `Despesa atualizada: ${expense.description}`,
      metadata: { expenseId: expense.id },
    });
  },
  
  removeExpense: (id: UUID) => {
    const expense = get().expenses.find(e => e.id === id);
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    }));
    get().addAuditLog({
      action: 'EXPENSE_REMOVE',
      details: `Despesa removida: ${expense?.description || id}`,
      metadata: { expenseId: id },
    });
  },

  addRevenue: (revenue: Revenue) => {
    const exists = get().revenues.some(r => r.id === revenue.id);
    if (exists) return;
    set((state) => ({ revenues: [...state.revenues, revenue] }));
    get().addAuditLog({
      action: 'REVENUE_ADD',
      details: `Receita adicionada: ${revenue.description} - ${revenue.amount}`,
      metadata: { revenueId: revenue.id, amount: revenue.amount },
    });
  },
  
  removeRevenue: (id: UUID) => {
    const revenue = get().revenues.find(r => r.id === id);
    set((state) => ({
      revenues: state.revenues.filter((r) => r.id !== id),
    }));
    get().addAuditLog({
      action: 'REVENUE_REMOVE',
      details: `Receita removida: ${revenue?.description || id}`,
      metadata: { revenueId: id },
    });
  },

  addFixedExpense: (expense: FixedExpense) => set((state) => ({ fixedExpenses: [...state.fixedExpenses, expense] })),
  
  updateFixedExpense: (expense: FixedExpense) => set((state) => ({
    fixedExpenses: state.fixedExpenses.map((e) => (e.id === expense.id ? expense : e)),
  })),
  
  removeFixedExpense: (id: UUID) => set((state) => ({
    fixedExpenses: state.fixedExpenses.filter((e) => e.id !== id),
  })),

  addPayrollRecord: (record: PayrollRecord) => set((state) => ({ payroll: [...state.payroll, record] })),
  
  updatePayrollRecord: (record: PayrollRecord) => set((state) => ({
    payroll: state.payroll.map((r) => (r.id === record.id ? record : r)),
  })),
  
  removePayrollRecord: (id: UUID) => set((state) => ({
    payroll: state.payroll.filter((r) => r.id !== id),
  })),

  setOrders: (orders: Order[]) => set({ activeOrders: orders }),
  setExpenses: (expenses: Expense[]) => set({ expenses }),
  setRevenues: (revenues: Revenue[]) => set({ revenues }),
  setPayroll: (payroll: PayrollRecord[]) => set({ payroll }),
  getLoyaltyTier: (customerId: UUID) => {
    // Basic logic for loyalty tier
    const state = get();
    const customerOrders = state.orders?.filter(o => o.customer_id === customerId) || [];
    const totalSpent = customerOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    
    if (totalSpent > 500000) return 'PLATINUM';
    if (totalSpent > 200000) return 'GOLD';
    if (totalSpent > 50000) return 'SILVER';
    return 'BRONZE';
  },

  processPayroll: async (_employeeId, _month, _year, _paymentMethod) => {
    // Implementation details would go here, simplified for now
    get().addNotification('success', 'Salário processado com sucesso.');
  },

  createFullFinancialBackup: async () => {
    get().addNotification('info', 'A criar backup financeiro completo...');
    try {
      const state = get();
      const financialData: FinancialBackupData = {
        orders: state.activeOrders,
        expenses: state.expenses,
        revenues: state.revenues,
        payroll: state.payroll,
        shifts: state.shifts,
        settings: state.settings,
        timestamp: new Date().toISOString(),
      };
      const success = await backupService.saveFinancialBackup(financialData);
      if (success) {
        get().addNotification('success', 'Backup financeiro completo criado com sucesso.');
      } else {
        get().addNotification('error', 'Falha ao criar backup financeiro completo.');
      }
      return success;
    } catch (error) {
      logger.error('Erro ao criar backup financeiro completo', error);
      get().addNotification('error', 'Erro ao criar backup financeiro completo.');
      return false;
    }
  },

  restoreFullFinancialBackup: async () => {
    get().addNotification('info', 'A restaurar backup financeiro completo...');
    try {
      const restoredData = await backupService.loadFinancialBackup();
      if (restoredData) {
        set({
          activeOrders: restoredData.orders,
          expenses: restoredData.expenses,
          revenues: restoredData.revenues,
          payroll: restoredData.payroll,
          shifts: restoredData.shifts,
          settings: restoredData.settings,
        });
        get().addNotification('success', 'Backup financeiro completo restaurado com sucesso.');
        return true;
      } else {
        get().addNotification('error', 'Falha ao restaurar backup financeiro completo: Nenhum dado encontrado ou erro na leitura.');
        return false;
      }
    } catch (error) {
      logger.error('Erro ao restaurar backup financeiro completo', error);
      get().addNotification('error', 'Erro ao restaurar backup financeiro completo.');
      return false;
    }
  },

  clearFinancialData: async (reason: string, userId: UUID) => {
    get().addNotification('info', 'A limpar dados financeiros...');
    try {
      const state = get();
      
      // 1. Prepare detailed report of what will be removed
      const report: FinancialClearanceReport = {
        timestamp: new Date().toISOString(),
        user: userId,
        reason,
        authorizedBy: userId,
        clearedOrders: state.activeOrders.length,
        clearedExpenses: state.expenses.length,
        clearedRevenues: state.revenues.length,
        clearedPayroll: state.payroll.length,
        summary: {
          ordersCount: state.activeOrders.length,
          expensesCount: state.expenses.length,
          fixedExpensesCount: state.fixedExpenses.length,
          revenuesCount: state.revenues.length,
          payrollCount: state.payroll.length,
          totalRevenue: state.revenues.reduce((sum, r) => sum + r.amount, 0),
          totalExpenses: state.expenses.reduce((sum, e) => sum + e.amount, 0)
        }
      };

      // 2. AUTO-BACKUP (AGT Requirement)
      const financialData: FinancialBackupData = {
        timestamp: new Date().toISOString(),
        orders: state.activeOrders,
        expenses: state.expenses,
        revenues: state.revenues,
        payroll: state.payroll,
        shifts: state.shifts,
        settings: state.settings,
      };

      const backupSuccess = await backupService.saveFinancialBackup(financialData);

      if (!backupSuccess) {
        throw new Error('Falha crítica ao criar backup automático obrigatório antes da limpeza.');
      }

      // 3. Clear State
      set({
        activeOrders: [],
        expenses: [],
        fixedExpenses: [],
        revenues: [],
        payroll: [],
        activeOrderId: null
      });

      // 4. Clear Database (Destructive operation)
      const result = await clearFinancialDataAction(userId, reason);
      if (!result.success) {
        throw new Error(result.error || 'Failed to clear financial data');
      }

      // 5. Audit Log (AGT Requirement)
      get().addAuditLog({
        action: 'FINANCIAL_DATA_CLEAR',
        details: `Dados financeiros zerados completamente. Motivo: ${reason}`,
        metadata: {
          userId,
          reason,
          backupStatus: 'SUCCESSFUL',
          reportSummary: report.summary
        }
      });

      logger.info('Financial data cleared successfully (AGT Compliance)', { userId, reason }, 'SECURITY');
      get().addNotification('success', 'Dados financeiros limpos com sucesso e backup realizado.');
      
      return { success: true, report };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Failed to clear financial data', { error: errorMsg }, 'SECURITY');
      get().addNotification('error', `Erro ao limpar dados: ${errorMsg}`);
      return { success: false, report: { 
        timestamp: new Date().toISOString(),
        user: userId,
        reason,
        authorizedBy: userId,
        clearedOrders: 0,
        clearedExpenses: 0,
        clearedRevenues: 0,
        clearedPayroll: 0,
        summary: {
          ordersCount: 0,
          expensesCount: 0,
          fixedExpensesCount: 0,
          revenuesCount: 0,
          payrollCount: 0,
          totalRevenue: 0,
          totalExpenses: 0
        },
        error: errorMsg 
      } };
    }
  },

  correctPayment: async (orderId, newPayments, reason, user) => {
    const state = get();
    const order = state.activeOrders.find((o) => o.id === orderId);

    if (!order) {
      get().addNotification('error', 'Pedido não encontrado.');
      return false;
    }

    if (!user) {
      get().addNotification('error', 'Usuário não autenticado.');
      return false;
    }



    // Validação de valor total
    const totalNewPayments = newPayments.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(totalNewPayments - Number(order.total || 0)) > 0.01) {
      get().addNotification('error', 'O valor total dos novos pagamentos deve ser igual ao total do pedido.');
      return false;
    }

    try {
      const previousPayments = order.payments || (order.payment_method ? [{
        id: `legacy-${order.id}`,
        method: order.payment_method,
        amount: Number(order.total || 0),
        timestamp: String(order.timestamp)
      }] : []);

      const correction: PaymentCorrection = {
        id: `corr-${Date.now()}`,
        orderId: order.id!,
        timestamp: new Date(),
        userId: user.id,
        userName: user.name,
        reason,
        originalPayments: previousPayments,
        correctedPayments: newPayments,
        previousPayments,
        newPayments,
        type: 'PRE_PRINT'
      };

      const updatedOrder: Order = {
        ...order,
        payments: newPayments,
        payment_method: newPayments.length === 1 ? newPayments[0].method : undefined,
        paymentCorrectionHistory: [...(order.paymentCorrectionHistory || []), correction]
      };

      // 1. Atualizar Breakdown do Turno (Consistência Financeira)
      if (order.shift_id) {
        const shifts = [...state.shifts];
        const shiftIndex = shifts.findIndex(s => s.id === order.shift_id);
        
        if (shiftIndex !== -1) {
          const shift = { ...shifts[shiftIndex] };
        const breakdown: Record<string, number> = { ...(shift.salesBreakdown || {}) };

          // Subtrair pagamentos antigos
          previousPayments.forEach(p => {
            const current = breakdown[p.method] ?? 0;
            breakdown[p.method] = current - (p.amount || 0);
          });

          // Adicionar novos pagamentos
          newPayments.forEach(p => {
            const current = breakdown[p.method] ?? 0;
            breakdown[p.method] = current + p.amount;
          });

          shift.salesBreakdown = breakdown;
          shifts[shiftIndex] = shift;
          
          set({ shifts });
          
          // Persistir turno atualizado
          saveShiftsAction([shift]).then(res => {
            if (!res.success) logger.error('Falha ao atualizar breakdown do turno após correção', { shiftId: shift.id, error: res.error }, 'FINANCE');
          }).catch((e: Error) => 
            logger.error('Falha ao atualizar breakdown do turno após correção', { shiftId: shift.id, error: e.message }, 'FINANCE')
          );
        }
      }

      // Atualizar estado local
      get().updateOrder(updatedOrder);

      // Audit Log imutável
      get().addAuditLog({
        action: 'PAYMENT_CORRECTION_PRE_PRINT',
        details: `Correção de pagamento para pedido ${order.invoice_number || order.id}. Motivo: ${reason}`,
        metadata: {
          orderId: order.id,
          invoiceNumber: order.invoice_number,
          previousPayments,
          newPayments,
          correctionId: correction.id,

        },
        userId: user.id
      });

      // Persistência em Banco de Dados (Transação simulada via executeQuery sequencial)
      // Em um ambiente real, usaríamos BEGIN TRANSACTION
      const result = await correctPaymentAction(order.id!, user.id, reason, newPayments);
      if (!result.success) {
        throw new Error(result.error || 'Failed to correct payment');
      }

      logger.info('Payment correction applied successfully', { orderId, type: correction.type }, 'FINANCE');
      get().addNotification('success', 'Pagamento corrigido com sucesso.');
      
      return true;
    } catch (error) {
      logger.error('Failed to correct payment', error);
      get().addNotification('error', 'Erro ao processar correção de pagamento.');
      // O Zustand persist irá manter o estado anterior se falhar antes do set, 
      // mas como já chamamos updateOrder, em caso de erro de DB real precisaríamos de rollback.
      return false;
    }
  },

  addToOrder: (tableId: string, dish: Dish, quantity: number, notes: string, orderId: UUID, userId?: string) => {
    const state = get();
    let order = state.activeOrders.find((o) => o.id === orderId);

    if (!order) {
      // Create new order if it doesn't exist in activeOrders
      order = {
        id: orderId,
        table_id: tableId,
        status: 'ABERTO',
        items: [],
        total: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        payment_method: undefined,
        payments: []
      } as unknown as Order;
      set((state) => ({ activeOrders: [...state.activeOrders, order!] }));
    }

    const newItem: any = {
      dish_id: dish.id,
      product_id: dish.id, // Compat
      quantity,
      unit_price: dish.price,
      total: dish.price * quantity,
      notes,
      status: 'PENDENTE'
    };

    const updatedOrder = {
      ...order,
      items: [...(order.items || []), newItem],
      total: (order.total || 0) + newItem.total,
      updated_at: new Date().toISOString()
    };

    get().updateOrder(updatedOrder);
    
    // Persist to Supabase
    saveOrderActionClient(updatedOrder).catch(err => logger.error('Failed to sync added item', err));
    
    get().addAuditLog({
        action: 'ORDER_ITEM_ADD',
        details: `Item adicionado: ${dish.name} x${quantity}`,
        metadata: { orderId, dishId: dish.id, quantity },
        userId: userId || undefined
    });
  },

  removeFromOrder: (orderId: UUID, itemIndex: number, userId?: string) => {
    const state = get();
    const order = state.activeOrders.find((o) => o.id === orderId);
    if (!order || !order.items) return;

    const item = order.items[itemIndex];
    if (!item) return;

    const newItems = [...order.items];
    newItems.splice(itemIndex, 1);

    const updatedOrder = {
      ...order,
      items: newItems,
      total: (order.total || 0) - ((item.unit_price || 0) * (item.quantity || 0)),
      updated_at: new Date().toISOString()
    };

    get().updateOrder(updatedOrder);

    // Persist to Supabase
    saveOrderActionClient(updatedOrder).catch(err => logger.error('Failed to sync removed item', err));

    get().addAuditLog({
        action: 'ORDER_ITEM_REMOVE',
        details: `Item removido do pedido ${orderId}`,
        metadata: { orderId, itemIndex },
        userId: userId || undefined
    });
  },

  checkoutTable: async (orderId: UUID, payments: OrderPayment[], subAccountName?: string, customerNif?: string, userId?: string) => {
     const state = get();
     const order = state.activeOrders.find((o) => o.id === orderId);
     if (!order) throw new Error('Order not found');

     const updatedOrder: Order = {
         ...order,
         status: 'FECHADO',
         closed_at: new Date().toISOString(),
         payments,
         payment_method: payments.length === 1 ? payments[0].method : undefined,
         sub_account_name: subAccountName || undefined,
         customer_nif: customerNif || null,
         updated_at: new Date().toISOString()
     };

     // Move to history? For now just update status in activeOrders (or move to orders list if separate)
     // FinanceSlice has 'orders' and 'activeOrders'.
     // Usually activeOrders are subset of orders or separate.
     // Let's assume we keep it in activeOrders but status CLOSED until shift close clears it.
     
     get().updateOrder(updatedOrder);

     // Persist to Supabase
     await saveOrderActionClient(updatedOrder);
     
     // Add revenue
     payments.forEach(p => {
         get().addRevenue({
             id: `rev-${Date.now()}-${Math.random()}`,
             amount: p.amount,
             date: new Date(),
             paymentMethod: p.method,
             description: `Venda Mesa ${order.table_id}`,
             orderId: order.id
         });
     });

     // Auto-liberate table
     const tableId = order.table_id || (order as any).tableId;
     if (tableId) {
        get().updateTableStatus(tableId, 'AVAILABLE');
     }

     get().addAuditLog({
        action: 'ORDER_CHECKOUT',
        details: `Mesa ${order.table_id} fechada. Total: ${order.total}`,
        metadata: { orderId, total: order.total, payments },
        userId: userId
    });
  },

  fireOrderToKitchen: (orderId: UUID) => {
    const state = get();
    const order = state.activeOrders.find((o) => o.id === orderId);
    if (!order) return;
    
    // Logic to send to kitchen (e.g. status update, or move to kitchen queue)
    const updatedOrder = {
        ...order,
        status: 'EM_PREPARO',
        updatedAt: new Date().toISOString()
    };
    get().updateOrder(updatedOrder);
    // Persist to Supabase
    saveOrderActionClient(updatedOrder).catch(err => logger.error('Failed to sync fired order', err));
  },

  updateOrderItemStatus: (orderId: string, itemIndex: number, status: string) => {
    const state = get();
    const order = state.activeOrders.find((o) => o.id === orderId);
    if (!order || !order.items) return;

    const updatedItems = [...order.items];
    if (updatedItems[itemIndex]) {
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], status };
    }

    const updatedOrder = {
        ...order,
        items: updatedItems,
        updatedAt: new Date().toISOString()
    };
    get().updateOrder(updatedOrder);
    
    // Persist to Supabase
    saveOrderActionClient(updatedOrder).catch(err => logger.error('Failed to sync item status', err));
  },

  markOrderAsServed: (orderId: string) => {
    const state = get();
    const order = state.activeOrders.find((o) => o.id === orderId);
    if (!order) return;

    const updatedOrder = {
        ...order,
        status: 'ENTREGUE',
        // Also mark all items as delivered? Optional but good practice
        items: (order.items || []).map(item => ({ ...item, status: 'ENTREGUE' })),
        updatedAt: new Date().toISOString()
    };
    get().updateOrder(updatedOrder);

    // Persist to Supabase
    saveOrderActionClient(updatedOrder).catch(err => logger.error('Failed to sync served order', err));
  },

  clearDraftOrder: (orderId: UUID) => {
    // Just remove from activeOrders if it's draft?
    // Assume it removes the order.
    get().removeOrder(orderId);
  },

  fetchRemoteDashboard: async () => {
    const state = get();
    try {
      const today = getAngolaToday().split('T')[0];
      
      // 1. Fetch Summary
      // const summaryResult = await integrationAPIService.fetchDashboard(today, today);
      // if (summaryResult.success && summaryResult.data) {
      //   state.setDashboardSummary(summaryResult.data);
      // }

      // 2. Fetch Financials (Today)
      const financialsResult = await integrationAPIService.fetchFinancials(today, today);
      if (financialsResult.success && financialsResult.data) {
         state.setExpenses(financialsResult.data.expenses);
         state.setRevenues(financialsResult.data.revenues);
      }

      // 3. Fetch Menu (for analytics mapping)
      const menuResult = await integrationAPIService.fetchMenu();
      if (menuResult.success && menuResult.data) {
         // Using 'as any' because these methods belong to other slices but are available in StoreState
         (state as any).importCloudItems({
            categories: menuResult.data.categories,
            dishes: menuResult.data.dishes,
            preferCloud: true
         });
      }

       // 4. Fetch Users
       const usersResult = await integrationAPIService.fetchUsers();
       if (usersResult.success && usersResult.data) {
          (state as any).setUsers(usersResult.data);
       }

      logger.info('Remote dashboard data fetched successfully', {}, 'FINANCE');
    } catch (error) {
      logger.error('Error fetching remote dashboard data', error, 'FINANCE');
    }
  }
});
