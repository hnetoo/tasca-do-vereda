import { StateCreator } from 'zustand';
import { Order, Expense, Revenue, PayrollRecord, PaymentMethod, PaymentCorrection, DailyAnalytics, DashboardSummary, UUID, Dish, OrderItemDetail, User } from '@/types';
import { logger } from '@/services/logger';
import { backupService } from '@/services/backupService';
import { adminOperations_fixed } from '@/services/database/adminOperations_fixed';
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
  revenues: Revenue[];
  payroll: PayrollRecord[];
  paymentMethods: PaymentMethod[];
  paymentCorrections: PaymentCorrection[];
  dailySalesAnalytics: DailyAnalytics[];
  dashboardSummary: DashboardSummary | null;
  currentShiftId: UUID | null;
  currentShift: any;
  
  // Order actions
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  removeOrder: (orderId: UUID) => void;
  setActiveOrders: (orders: Order[]) => void;
  syncOrders: (orders: Order[]) => Promise<void>;
  
  // Expense actions
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  removeExpense: (expenseId: UUID) => void;
  
  // Revenue actions
  addRevenue: (revenue: Revenue) => void;
  updateRevenue: (revenue: Revenue) => void;
  removeRevenue: (revenueId: UUID) => void;
  
  // Payroll actions
  addPayroll: (payroll: PayrollRecord) => void;
  updatePayroll: (payroll: PayrollRecord) => void;
  removePayroll: (payrollId: UUID) => void;
  
  // Analytics actions
  generateDailySalesAnalytics: (date: string) => Promise<void>;
  generateMenuAnalytics: (startDate: string, endDate: string) => Promise<void>;
  generateDashboardSummary: () => Promise<void>;
  
  // Shift actions
  startShift: (shiftId: UUID, openingAmount: number) => void;
  endShift: (shiftId: UUID, closingAmount: number) => Promise<void>;
  
  // Backup actions
  createBackup: () => Promise<void>;
  restoreBackup: (backupId: string) => Promise<void>;
  
  // Payment actions
  addOrderPayment: (payment: any) => void;
  correctPayment: (correction: PaymentCorrection) => void;
  
  // Clear data
  clearFinancialData: () => Promise<void>;
}

export const createFinanceSlice: StateCreator<any, [], [], FinanceSlice> = (set, get) => ({
  orders: [],
  activeOrders: [],
  activeOrderIds: [],
  expenses: [],
  fixedExpenses: [],
  revenues: [],
  payroll: [],
  paymentMethods: [],
  financialClearanceReports: [],
  financialBackups: [],
  orderPayments: [],
  paymentCorrections: [],
  dailySalesAnalytics: [],
  menuAnalytics: [],
  dashboardSummary: null,
  analytics: null,
  currentShiftId: null,
  currentShift: null,

  // Order actions
  addOrder: (order: Order) => {
    set((state: any) => ({ orders: [...state.orders, order] }));
    
    // Sync with Supabase
    const { tableId, userId, userName, customerNif, customerId, shiftId, subAccountName, invoiceNumber, created_at, updated_at, paymentMethod, splitPayments, customerName, ...rest } = order;
    const supabaseOrder = { 
      ...order, 
      table_id: tableId ? String(tableId) : null, 
      user_id: userId || null, 
      user_name: userName || null,
      customer_nif: customerNif || null, 
      customer_id: customerId || null, 
      shift_id: shiftId || null, 
      sub_account_name: subAccountName || null, 
      invoice_number: invoiceNumber || null, 
      created_at: created_at || null, 
      updated_at: updated_at || null, 
      payment_method: paymentMethod || null, 
      split_payments: splitPayments || null, 
      customer_name: customerName || null 
    };
    
    // Usar adminOperations_fixed em vez de integrationAPIService
    adminOperations_fixed.saveOrder(supabaseOrder as any).then((res: any) => {
      if (!res.success) {
        logger.error('Failed to sync new order to Supabase', { id: order.id, error: res.error }, 'CLOUD');
        get().addNotification('error', 'Pedido guardado localmente, mas falhou a sincronização.');
      } else {
        logger.info('Order saved successfully to Supabase', { id: order.id, data: res.data }, 'CLOUD');
      }
    });
  },

  updateOrder: (order: Order) => {
    set((state: any) => ({
      orders: state.orders.map((o: any) => o.id === order.id ? order : o),
      activeOrders: state.activeOrders.map((o: any) => o.id === order.id ? order : o),
    }));
    
    // Sync with Supabase usando adminOperations_fixed
    adminOperations_fixed.saveOrder(order).then((res: any) => {
      if (!res.success) {
        logger.error('Failed to sync updated order to Supabase', { id: order.id, error: res.error }, 'CLOUD');
        get().addNotification('error', 'Pedido atualizado localmente, mas falhou a sincronização.');
      } else {
        logger.info('Order updated successfully to Supabase', { id: order.id, data: res.data }, 'CLOUD');
      }
    });
  },

  removeOrder: (orderId: UUID) => {
    set((state: any) => ({
      orders: state.orders.filter((o: any) => o.id !== orderId),
      activeOrders: state.activeOrders.filter((o: any) => o.id !== orderId),
      activeOrderIds: state.activeOrderIds.filter((id: any) => id !== orderId),
    }));
    
    // Remover do Supabase
    // Nota: Método deleteRecord não existe, implementar se necessário
    logger.info('Order removed locally', { orderId }, 'FINANCE');
  },

  setActiveOrders: (orders: Order[]) => {
    const orderIds = orders.map((o: any) => o.id);
    set((state: any) => ({
      activeOrders: orders,
      activeOrderIds: orderIds,
    }));
  },

  syncOrders: async (orders: Order[]): Promise<void> => {
    try {
      // Sincronizar cada pedido individualmente com adminOperations_fixed
      const results = await Promise.all(
        orders.map(async (order) => {
          const result = await adminOperations_fixed.saveOrder(order);
          return { orderId: order.id, success: result.success, error: result.error };
        })
      );
      
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      if (errorCount > 0) {
        logger.error('Failed to sync some orders', { 
          total: orders.length, 
          success: successCount, 
          errors: errorCount 
        }, 'FINANCE');
      } else {
        logger.info('All orders synced successfully', { count: orders.length }, 'FINANCE');
      }
    } catch (error: any) {
      logger.error('Error syncing orders', { error: error.message }, 'FINANCE');
    }
  },

  // Expense actions
  addExpense: (expense: Expense) => {
    set((state: any) => ({ expenses: [...state.expenses, expense] }));
    
    // TODO: Implementar sync com Supabase quando método estiver disponível
    logger.info('Expense added locally', { id: expense.id }, 'FINANCE');
  },

  updateExpense: (expense: Expense) => {
    set((state: any) => ({
      expenses: state.expenses.map((e: any) => e.id === expense.id ? expense : e),
    }));
    
    // TODO: Implementar sync com Supabase quando método estiver disponível
    logger.info('Expense updated locally', { id: expense.id }, 'FINANCE');
  },

  removeExpense: (expenseId: UUID) => {
    set((state: any) => ({
      expenses: state.expenses.filter((e: any) => e.id !== expenseId),
    }));
    
    // TODO: Implementar remoção do Supabase quando método estiver disponível
    logger.info('Expense removed locally', { expenseId }, 'FINANCE');
  },

  // Revenue actions
  addRevenue: (revenue: Revenue) => {
    set((state: any) => ({ revenues: [...state.revenues, revenue] }));
    
    // TODO: Implementar sync com Supabase quando método estiver disponível
    logger.info('Revenue added locally', { id: revenue.id }, 'FINANCE');
  },

  updateRevenue: (revenue: Revenue) => {
    set((state: any) => ({
      revenues: state.revenues.map((r: any) => r.id === revenue.id ? revenue : r),
    }));
    
    // TODO: Implementar sync com Supabase quando método estiver disponível
    logger.info('Revenue updated locally', { id: revenue.id }, 'FINANCE');
  },

  removeRevenue: (revenueId: UUID) => {
    set((state: any) => ({
      revenues: state.revenues.filter((r: any) => r.id !== revenueId),
    }));
    
    // TODO: Implementar remoção do Supabase quando método estiver disponível
    logger.info('Revenue removed locally', { revenueId }, 'FINANCE');
  },

  // Payroll actions
  addPayroll: (payroll: PayrollRecord) => {
    set((state: any) => ({ payroll: [...state.payroll, payroll] }));
    
    // TODO: Implementar sync com Supabase quando método estiver disponível
    logger.info('Payroll added locally', { id: payroll.id }, 'FINANCE');
  },

  updatePayroll: (payroll: PayrollRecord) => {
    set((state: any) => ({
      payroll: state.payroll.map((p: any) => p.id === payroll.id ? payroll : p),
    }));
    
    // TODO: Implementar sync com Supabase quando método estiver disponível
    logger.info('Payroll updated locally', { id: payroll.id }, 'FINANCE');
  },

  removePayroll: (payrollId: UUID) => {
    set((state: any) => ({
      payroll: state.payroll.filter((p: any) => p.id !== payrollId),
    }));
    
    // TODO: Implementar remoção do Supabase quando método estiver disponível
    logger.info('Payroll removed locally', { payrollId }, 'FINANCE');
  },

  // Analytics actions
  generateDailySalesAnalytics: async (date: string) => {
    try {
      const orders = get().orders.filter((o: any) => {
        const createdAt = o.created_at;
        if (typeof createdAt === 'string') {
          return createdAt.startsWith(date);
        } else if (createdAt instanceof Date) {
          return createdAt.toISOString().startsWith(date);
        }
        return false;
      });
      const totalSales = orders.reduce((sum: any, order: any) => sum + (order.total || 0), 0);
      const totalOrders = orders.length;
      
      // Simplificar analytics para evitar erros de tipo
      const analytics = {
        date,
        totalSales,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
        generatedAt: new Date().toISOString(),
      };
      
      // TODO: Implementar storage de analytics quando tipo estiver definido
      logger.info('Daily sales analytics generated', analytics, 'FINANCE');
    } catch (error: any) {
      logger.error('Failed to generate daily sales analytics', { error: error.message }, 'FINANCE');
    }
  },

  getTotalRevenue: (startDate?: string, endDate?: string) => {
    const { revenues } = get();
    return revenues
      .filter((r: any) => {
        const createdAt = r.created_at;
        if (typeof createdAt === 'string' && startDate && endDate) {
          return createdAt >= startDate && createdAt <= endDate;
        } else if ((createdAt as any) instanceof Date && startDate && endDate) {
          const isoString = (createdAt as any).toISOString();
          return isoString >= startDate && isoString <= endDate;
        }
        return false;
      })
      .reduce((sum: any, revenue: any) => sum + revenue.amount, 0);
  },

  generateMenuAnalytics: async (startDate: string, endDate: string) => {
    try {
      const orders = get().orders.filter((o: any) => {
        const createdAt = o.created_at;
        if (typeof createdAt === 'string') {
          return createdAt >= startDate && createdAt <= endDate;
        } else if (createdAt instanceof Date) {
          const isoString = createdAt.toISOString();
          return isoString >= startDate && isoString <= endDate;
        }
        return false;
      });
      
      // Simplificar analytics para evitar erros de tipo
      const dishSales = new Map<string, { count: number; revenue: number }>();
      
      orders.forEach((order: any) => {
        order.items?.forEach((item: any) => {
          const dishId = item.dishId || 'unknown';
          if (!dishSales.has(dishId)) {
            dishSales.set(dishId, { count: 0, revenue: 0 });
          }
          const sales = dishSales.get(dishId)!;
          sales.count += item.quantity || 1;
          sales.revenue += (item.unit_price || 0) * (item.quantity || 1);
        });
      });
      
      const analytics = {
        startDate,
        endDate,
        dishSales: Array.from(dishSales.entries()).map(([dishId, sales]) => ({
          dishId,
          count: sales.count,
          revenue: sales.revenue,
        })),
        generatedAt: new Date().toISOString(),
      };
      
      // TODO: Implementar storage de analytics quando tipo estiver definido
      logger.info('Menu analytics generated', analytics, 'FINANCE');
    } catch (error: any) {
      logger.error('Failed to generate menu analytics', { error: error.message }, 'FINANCE');
    }
  },

  generateDashboardSummary: async () => {
    try {
      const today = getAngolaToday();
      const orders = get().orders;
      const expenses = get().expenses;
      
      const todayOrders = orders.filter((o: any) => {
        const createdAt = o.created_at;
        if (typeof createdAt === 'string') {
          return createdAt.startsWith(today);
        } else if (createdAt instanceof Date) {
          return createdAt.toISOString().startsWith(today);
        }
        return false;
      });
      
      const todayRevenue = todayOrders.reduce((sum: any, order: any) => sum + (order.total || 0), 0);
      const todayExpenses = expenses.filter((e: any) => e.date === today).reduce((sum: any, expense: any) => sum + expense.amount, 0);
      
      // Simplificar summary para evitar erros de tipo
      const summary = {
        totalRevenue: todayRevenue,
        totalExpenses: todayExpenses,
        todayOrders: todayOrders.length,
        totalOrders: orders.length,
        generatedAt: new Date().toISOString(),
      };
      
      set({ dashboardSummary: summary as any });
      logger.info('Dashboard summary generated', summary, 'FINANCE');
    } catch (error: any) {
      logger.error('Failed to generate dashboard summary', { error: error.message }, 'FINANCE');
    }
  },

  // Shift actions
  startShift: (shiftId: UUID, openingAmount: number) => {
    // Simplificar shift actions para evitar erros de tipo
    set({ currentShiftId: shiftId });
    logger.info('Shift started', { shiftId, openingAmount }, 'FINANCE');
  },

  endShift: async (shiftId: UUID, closingAmount: number) => {
    try {
      // Simplificar shift end
      set({ currentShiftId: null });
      logger.info('Shift ended', { shiftId, closingAmount }, 'FINANCE');
    } catch (error: any) {
      logger.error('Failed to end shift', { error: error.message }, 'FINANCE');
    }
  },

  // Backup actions - simplificadas
  createBackup: async () => {
    try {
      // TODO: Implementar backup quando método estiver disponível
      logger.info('Backup creation requested', {}, 'FINANCE');
    } catch (error: any) {
      logger.error('Failed to create backup', { error: error.message }, 'FINANCE');
    }
  },

  restoreBackup: async (backupId: string) => {
    try {
      // TODO: Implementar restore quando método estiver disponível
      logger.info('Backup restore requested', { backupId }, 'FINANCE');
    } catch (error: any) {
      logger.error('Failed to restore backup', { error: error.message }, 'FINANCE');
    }
  },

  // Payment actions - simplificadas
  addOrderPayment: (payment: any) => {
    // TODO: Implementar storage quando tipo estiver definido
    logger.info('Order payment added', { paymentId: payment.id }, 'FINANCE');
  },

  correctPayment: (correction: PaymentCorrection) => {
    // Aplicar correção
    const order = get().orders.find((o: any) => o.id === correction.orderId);
    if (order && correction.newTotal !== undefined) {
      get().updateOrder({
        ...order,
        total: correction.newTotal,
        updated_at: new Date().toISOString(),
      });
    }
    // TODO: Implementar storage quando tipo estiver definido
    logger.info('Payment correction applied', { correctionId: correction.id }, 'FINANCE');
  },

  // Clear data
  clearFinancialData: async () => {
    try {
      // Simplificar clear data
      set({
        orders: [],
        activeOrders: [],
        activeOrderIds: [],
        expenses: [],
        revenues: [],
        payroll: [],
        dashboardSummary: null,
        currentShiftId: null,
      });
      logger.info('Financial data cleared', {}, 'FINANCE');
    } catch (error: any) {
      logger.error('Failed to clear financial data', { error: error.message }, 'FINANCE');
    }
  },
});
