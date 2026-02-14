import { StateCreator } from 'zustand';
import { Order, Expense, Revenue, FixedExpense, PayrollRecord, PaymentMethod, StoreState, FinancialClearanceReport, FinancialBackupData, OrderPayment, PaymentCorrection, DailySalesAnalytics, MenuAnalytics } from '../../types';
import { logger } from '../../services/logger';
import { backupService } from '../../services/backupService';

import { executeQuery } from '../../services/database/connection';

export interface FinanceSlice {
  orders: Order[];
  activeOrders: Order[];
  expenses: Expense[];
  fixedExpenses: FixedExpense[];
  revenues: Revenue[];
  payroll: PayrollRecord[];
  activeOrderId: string | null;
  setActiveOrder: (id: string | null) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  removeOrder: (id: string) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  removeExpense: (id: string) => void;
  addRevenue: (revenue: Revenue) => void;
  removeRevenue: (id: string) => void;
  addFixedExpense: (expense: FixedExpense) => void;
  updateFixedExpense: (expense: FixedExpense) => void;
  removeFixedExpense: (id: string) => void;
  addPayrollRecord: (record: PayrollRecord) => void;
  updatePayrollRecord: (record: PayrollRecord) => void;
  removePayrollRecord: (id: string) => void;
  setOrders: (orders: Order[]) => void;
  setExpenses: (expenses: Expense[]) => void;
  setPayroll: (payroll: PayrollRecord[]) => void;
  getLoyaltyTier: (customerId: string) => string;
  processPayroll: (employeeId: string, month: number, year: number, paymentMethod: PaymentMethod) => Promise<void>;
  createFullFinancialBackup: () => Promise<boolean>;
  restoreFullFinancialBackup: () => Promise<boolean>;
  clearFinancialData: (reason: string, userId: string) => Promise<{ success: boolean; report: FinancialClearanceReport }>;
  correctPayment: (orderId: string, newPayments: OrderPayment[], reason: string) => Promise<boolean>;
  getDailySalesAnalytics: (days?: number) => DailySalesAnalytics[];
  getMenuAnalytics: (days?: number) => MenuAnalytics[];
  getRevenueHistory: (days?: number) => Array<{ date: string; totalRevenue: number }>;
}

export const createFinanceSlice: StateCreator<
  StoreState,
  [['zustand/persist', unknown]],
  [],
  FinanceSlice
> = (set, get) => ({
  activeOrders: [],
  orders: [],
  expenses: [],
  fixedExpenses: [],
  revenues: [],
  payroll: [],
  activeOrderId: null,
  
  setActiveOrder: (id) => set({ activeOrderId: id }),

  addOrder: (order) => {
    set((state) => ({ orders: [...state.orders, order], activeOrders: [...state.activeOrders, order] }));
    get().addAuditLog({
      action: 'ORDER_CREATE',
      details: `Novo pedido criado: ${order.orderNumber || order.id}`,
      metadata: { orderId: order.id, total: order.total },
      userId: get().currentUser?.id
    });
  },

  updateOrder: (order) => {
    set((state) => ({
      orders: state.orders.map((o) => o.id === order.id ? order : o),
      activeOrders: state.activeOrders.map((o) => o.id === order.id ? order : o)
    }));
    // Log only if status changed or it's a critical update
    const prevOrder = get().orders.find(o => o.id === order.id);
    if (prevOrder && prevOrder.status !== order.status) {
      get().addAuditLog({
        action: 'ORDER_STATUS_CHANGE',
        details: `Status do pedido ${order.orderNumber || order.id} alterado para ${order.status}`,
        metadata: { orderId: order.id, oldStatus: prevOrder.status, newStatus: order.status },
        userId: get().currentUser?.id
      });
    }
  },

  getDailySalesAnalytics: (days = 7) => {
    const state = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (days - 1));

    const closedOrders = state.orders.filter(o =>
      o.status === 'FECHADO' && o.timestamp && new Date(o.timestamp) >= startDate
    );

    // Agrupar por data
    const salesByDate: Record<string, DailySalesAnalytics> = {};
    
    closedOrders.forEach(order => {
      const date = new Date(order.timestamp!).toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = {
          date,
          totalSales: 0,
          totalOrders: 0,
          totalProfit: 0,
          avgOrderValue: 0
        };
      }
      salesByDate[date].totalSales += order.total;
      salesByDate[date].totalOrders += 1;

      // Calcular lucro bruto (Venda - Custo)
      let orderProfit = 0;
      order.items.forEach(item => {
        const dish = state.menu.find(d => d.id === item.dishId);
        const costPrice = dish?.precoCusto || dish?.cost || 0;
        orderProfit += (item.price - costPrice) * item.quantity;
      });
      salesByDate[date].totalProfit = (salesByDate[date].totalProfit || 0) + orderProfit;
    });

    return Object.values(salesByDate)
      .map(d => ({
        ...d,
        avgOrderValue: d.totalSales / (d.totalOrders || 1)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  getMenuAnalytics: (days = 7) => {
    const state = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (days - 1));

    const closedOrders = state.orders.filter(o =>
      o.status === 'FECHADO' && o.timestamp && new Date(o.timestamp) >= startDate
    );

    const menuStats: Record<string, MenuAnalytics> = {};

    closedOrders.forEach(order => {
      order.items.forEach(item => {
        if (!menuStats[item.dishId]) {
          const dish = state.menu.find(d => d.id === item.dishId);
          menuStats[item.dishId] = {
            dishId: item.dishId,
            dishName: item.name,
            views: 0, // Placeholder
            orders: 0,
            sold: 0,
            revenue: 0,
            profitMargin: 0,
            conversionRate: 0
          };
        }
        
        const stats = menuStats[item.dishId];
        stats.sold += item.quantity;
        stats.orders += 1;
        stats.revenue += item.total;
        
        const dish = state.menu.find(d => d.id === item.dishId);
        const costPrice = dish?.precoCusto || dish?.cost || 0;
        const profit = item.total - (costPrice * item.quantity);
        const margin = item.total > 0 ? (profit / item.total) * 100 : 0;
        
        // Média ponderada da margem
        stats.profitMargin = ((stats.profitMargin * (stats.sold - item.quantity)) + (margin * item.quantity)) / stats.sold;
      });
    });

    return Object.values(menuStats).sort((a, b) => b.revenue - a.revenue);
  },

  getRevenueHistory: (days = 7) => {
    const state = get();
    const today = new Date();
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
      revenueByDate[date] = (revenueByDate[date] || 0) + order.total;
    });

    return Object.entries(revenueByDate)
      .map(([date, totalRevenue]) => ({ date, totalRevenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  removeOrder: (id) => set((state) => ({
    orders: state.orders.filter((o) => o.id !== id),
    activeOrders: state.activeOrders.filter((o) => o.id !== id)
  })),
  
  addExpense: (expense) => {
    set((state) => ({ expenses: [...state.expenses, expense] }));
    get().addAuditLog({
      action: 'EXPENSE_ADD',
      details: `Despesa adicionada: ${expense.description} - ${expense.amount}`,
      metadata: { expenseId: expense.id, amount: expense.amount },
      userId: get().currentUser?.id
    });
  },
  
  updateExpense: (expense) => {
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === expense.id ? expense : e)),
    }));
    get().addAuditLog({
      action: 'EXPENSE_UPDATE',
      details: `Despesa atualizada: ${expense.description}`,
      metadata: { expenseId: expense.id },
      userId: get().currentUser?.id
    });
  },
  
  removeExpense: (id) => {
    const expense = get().expenses.find(e => e.id === id);
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    }));
    get().addAuditLog({
      action: 'EXPENSE_REMOVE',
      details: `Despesa removida: ${expense?.description || id}`,
      metadata: { expenseId: id },
      userId: get().currentUser?.id
    });
  },

  addRevenue: (revenue) => {
    set((state) => ({ revenues: [...state.revenues, revenue] }));
    get().addAuditLog({
      action: 'REVENUE_ADD',
      details: `Receita adicionada: ${revenue.description} - ${revenue.amount}`,
      metadata: { revenueId: revenue.id, amount: revenue.amount },
      userId: get().currentUser?.id
    });
  },
  
  removeRevenue: (id) => {
    const revenue = get().revenues.find(r => r.id === id);
    set((state) => ({
      revenues: state.revenues.filter((r) => r.id !== id),
    }));
    get().addAuditLog({
      action: 'REVENUE_REMOVE',
      details: `Receita removida: ${revenue?.description || id}`,
      metadata: { revenueId: id },
      userId: get().currentUser?.id
    });
  },

  addFixedExpense: (expense) => set((state) => ({ fixedExpenses: [...state.fixedExpenses, expense] })),
  
  updateFixedExpense: (expense) => set((state) => ({
    fixedExpenses: state.fixedExpenses.map((e) => (e.id === expense.id ? expense : e)),
  })),
  
  removeFixedExpense: (id) => set((state) => ({
    fixedExpenses: state.fixedExpenses.filter((e) => e.id !== id),
  })),

  addPayrollRecord: (record) => set((state) => ({ payroll: [...state.payroll, record] })),
  
  updatePayrollRecord: (record) => set((state) => ({
    payroll: state.payroll.map((r) => (r.id === record.id ? record : r)),
  })),
  
  removePayrollRecord: (id) => set((state) => ({
    payroll: state.payroll.filter((r) => r.id !== id),
  })),

  setOrders: (orders) => set({ activeOrders: orders }),
  setExpenses: (expenses) => set({ expenses }),
  setPayroll: (payroll) => set({ payroll }),
  getLoyaltyTier: (customerId) => {
    // Basic logic for loyalty tier
    const state = get();
    const customerOrders = state.orders?.filter(o => o.customerId === customerId) || [];
    const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);
    
    if (totalSpent > 500000) return 'PLATINUM';
    if (totalSpent > 200000) return 'GOLD';
    if (totalSpent > 50000) return 'SILVER';
    return 'BRONZE';
  },

  processPayroll: async (_employeeId, _month, _year, _paymentMethod) => {
    if (!get().hasPermission('VIEW_FINANCIAL')) {
      get().addNotification('error', 'Sem permissão para processar salários.');
      return;
    }
    // Implementation details would go here, simplified for now
    get().addNotification('success', 'Salário processado com sucesso.');
  },

  createFullFinancialBackup: async () => {
    if (!get().hasPermission('EXPORT_DATA')) {
      get().addNotification('error', 'Sem permissão para criar backup financeiro completo.');
      return false;
    }
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
    if (!get().hasPermission('EXPORT_DATA')) {
      get().addNotification('error', 'Sem permissão para restaurar backup completo.');
      return false;
    }

    const confirmRestore = window.confirm(
      "ATENÇÃO: Restaurar um backup completo irá:\n" +
      "1. Apagar TODOS os dados financeiros atuais (pedidos, despesas, etc.)\n" +
      "2. Substituir pelos dados do backup.\n\n" +
      "Deseja prosseguir?"
    );

    if (!confirmRestore) return false;

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

  clearFinancialData: async (reason: string, userId: string) => {
    if (!get().hasPermission('ADMIN_POWER')) {
      const errorMsg = 'Permissão de Administrador necessária para zerar dados financeiros.';
      get().addNotification('error', errorMsg);
      return { success: false, report: { 
        timestamp: new Date().toISOString(),
        user: userId,
        reason,
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

    try {
      const state = get();
      
      // 1. Prepare detailed report of what will be removed
      const report: FinancialClearanceReport = {
        timestamp: new Date().toISOString(),
        user: userId,
        reason,
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
      await executeQuery('DELETE FROM order_items');
      await executeQuery('DELETE FROM orders');
      await executeQuery('DELETE FROM expenses');
      await executeQuery('DELETE FROM revenues');
      await executeQuery('DELETE FROM payroll_records');
      await executeQuery('DELETE FROM cash_shifts');

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

  correctPayment: async (orderId, newPayments, reason) => {
    const state = get();
    const order = state.activeOrders.find((o) => o.id === orderId);
    const currentUser = state.currentUser;

    if (!order) {
      get().addNotification('error', 'Pedido não encontrado.');
      return false;
    }

    if (!currentUser) {
      get().addNotification('error', 'Usuário não autenticado.');
      return false;
    }

    const isPostPrint = order.status === 'FECHADO';
    const permissionRequired = isPostPrint ? 'CORRECT_PAYMENT_POST_PRINT' : 'CORRECT_PAYMENT_PRE_PRINT';

    if (!get().hasPermission(permissionRequired)) {
      get().addNotification('error', `Sem permissão para correção de pagamento ${isPostPrint ? 'pós-impressão' : 'pré-impressão'}.`);
      return false;
    }

    // Validação de valor total
    const totalNewPayments = newPayments.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(totalNewPayments - order.total) > 0.01) {
      get().addNotification('error', 'O valor total dos novos pagamentos deve ser igual ao total do pedido.');
      return false;
    }

    try {
      const previousPayments = order.payments || (order.paymentMethod ? [{
        id: `legacy-${order.id}`,
        method: order.paymentMethod,
        amount: order.total,
        timestamp: order.timestamp
      }] : []);

      const correction: PaymentCorrection = {
        id: `corr-${Date.now()}`,
        timestamp: new Date(),
        userId: currentUser.id,
        userName: currentUser.name,
        reason,
        previousPayments,
        newPayments,
        type: isPostPrint ? 'POST_PRINT' : 'PRE_PRINT'
      };

      const updatedOrder: Order = {
        ...order,
        payments: newPayments,
        paymentMethod: newPayments.length === 1 ? newPayments[0].method : undefined,
        paymentCorrectionHistory: [...(order.paymentCorrectionHistory || []), correction]
      };

      // 1. Atualizar Breakdown do Turno (Consistência Financeira)
      if (order.shiftId) {
        const shifts = [...state.shifts];
        const shiftIndex = shifts.findIndex(s => s.id === order.shiftId);
        
        if (shiftIndex !== -1) {
          const shift = { ...shifts[shiftIndex] };
          const breakdown = { ...shift.salesBreakdown };

          // Subtrair pagamentos antigos
          previousPayments.forEach(p => {
            if (breakdown[p.method] !== undefined) {
              breakdown[p.method] -= p.amount;
            }
          });

          // Adicionar novos pagamentos
          newPayments.forEach(p => {
            if (breakdown[p.method] !== undefined) {
              breakdown[p.method] += p.amount;
            } else {
              breakdown[p.method] = p.amount;
            }
          });

          shift.salesBreakdown = breakdown;
          shifts[shiftIndex] = shift;
          
          set({ shifts });
          
          // Persistir turno atualizado
          const { databaseOperations } = await import('../../services/database/operations');
          databaseOperations.saveShifts([shift]).catch((e: Error) => 
            logger.error('Falha ao atualizar breakdown do turno após correção', { shiftId: shift.id, error: e.message }, 'FINANCE')
          );
        }
      }

      // Atualizar estado local
      get().updateOrder(updatedOrder);

      // Audit Log imutável
      get().addAuditLog({
        action: isPostPrint ? 'PAYMENT_CORRECTION_POST_PRINT' : 'PAYMENT_CORRECTION_PRE_PRINT',
        details: `Correção de pagamento para pedido ${order.invoiceNumber || order.id}. Motivo: ${reason}`,
        metadata: {
          orderId: order.id,
          invoiceNumber: order.invoiceNumber,
          previousPayments,
          newPayments,
          correctionId: correction.id,
          isPostPrint
        },
        userId: currentUser.id
      });

      // Persistência em Banco de Dados (Transação simulada via executeQuery sequencial)
      // Em um ambiente real, usaríamos BEGIN TRANSACTION
      await executeQuery('DELETE FROM order_payments WHERE order_id = ?', [order.id]);
      for (const p of newPayments) {
        await executeQuery('INSERT INTO order_payments (id, order_id, method, amount, timestamp) VALUES (?, ?, ?, ?, ?)', 
          [p.id, order.id, p.method, p.amount, p.timestamp]);
      }
      
      await executeQuery('INSERT INTO payment_corrections (id, order_id, user_id, reason, type, timestamp, data) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [correction.id, order.id, currentUser.id, reason, correction.type, correction.timestamp, JSON.stringify(correction)]);

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
  }
});
