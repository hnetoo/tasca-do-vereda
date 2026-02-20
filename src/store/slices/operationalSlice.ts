import { StateCreator } from 'zustand';
import { Table, Customer, Reservation, StockItem, CashShift, StoreState, Delivery, UUID } from '../../types';
import { 
  saveTableAction, 
  deleteTableAction, 
  saveCustomerAction, 
  deleteCustomerAction,
  saveReservationAction,
  deleteReservationAction,
  saveStockItemAction,
  deleteStockItemAction,
  saveDeliveryAction,
  deleteDeliveryAction
} from '@/app/actions/operational';
import { logger } from '../../services/logger';

export interface OperationalSlice {
  tables: Table[];
  activeTableId: string | null;
  saveStatus: 'SAVING' | 'SAVED' | 'ERROR' | 'IDLE';
  customers: Customer[];
  reservations: Reservation[];
  stock: StockItem[];
  shifts: CashShift[];
  currentShiftId: UUID | null;
  deliveries: Delivery[];
  
  setActiveTable: (id: string | null) => void;
  addTable: (table: Table) => void;
  updateTable: (table: Table) => void;
  removeTable: (id: string) => void;
  updateTableStatus: (id: string, status: string) => void;
  
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  removeCustomer: (id: UUID) => void;
  
  addReservation: (res: Reservation) => void;
  updateReservation: (res: Reservation) => void;
  removeReservation: (id: UUID) => void;
  
  addStockItem: (item: StockItem) => void;
  updateStockItem: (item: StockItem) => void;
  removeStockItem: (id: UUID) => void;
  
  openShift: (amount: number) => void;
  closeShift: (closingAmount: number) => void;
  backupLayout: () => void;
  createNewOrder: (tableId: string, name: string) => UUID;
  updateStockQuantity: (id: UUID, quantity: number) => void;
  
  closeTableWithoutOrders: (tableId: string) => void;
  transferTable: (fromTableId: string, toTableId: string) => void;

  addDelivery: (delivery: Delivery) => void;
  updateDelivery: (delivery: Delivery) => void;
  removeDelivery: (id: UUID) => void;
  setDeliveries: (deliveries: Delivery[]) => void;
  setShifts: (shifts: CashShift[]) => void;
  addAuditLog: (log: any) => void;
  auditLogs: any[];
  settleCustomerDebt: (customerId: UUID, amount: number) => void;
}

export const createOperationalSlice: StateCreator<
  StoreState,
  [['zustand/persist', unknown]],
  [],
  OperationalSlice
> = (set, get) => ({
  tables: [],
  activeTableId: null,
  saveStatus: 'IDLE',
  customers: [],
  reservations: [],
  stock: [],
  shifts: [],
  currentShiftId: null,
  deliveries: [],
  auditLogs: [],
  
  settleCustomerDebt: (customerId: UUID, amount: number) => {
    const state = get();
    const customer = state.customers.find(c => c.id === customerId);
    if (customer) {
      const newBalance = (customer.balance || 0) - amount;
      const updatedCustomer = { ...customer, balance: newBalance };
      state.updateCustomer(updatedCustomer);
      
      // Log the transaction
      state.addAuditLog({
        id: crypto.randomUUID(),
        action: 'PAYMENT_RECEIVED',
        details: { customerId, amount, newBalance },
        timestamp: new Date().toISOString(),
        userId: state.currentUser?.id || 'system'
      });
    }
  },

  setActiveTable: (id: string | null) => set({ activeTableId: id }),
  
  addTable: (table: Table) => {
    set({ saveStatus: 'SAVING' });
    set((state: OperationalSlice) => ({ tables: [...state.tables, table] }));
    saveTableAction(table).then(res => {
      if (!res.success) {
        set({ saveStatus: 'ERROR' });
        logger.error('Failed to persist new table to SQL', { id: table.id, error: res.error }, 'DATABASE');
      } else {
        set({ saveStatus: 'SAVED' });
        setTimeout(() => set({ saveStatus: 'IDLE' }), 2000);
      }
    }).catch(e => {
      set({ saveStatus: 'ERROR' });
      logger.error('Failed to persist new table to SQL', { id: table.id, error: e.message }, 'DATABASE')
    });
  },
  
  updateTable: (table: Table) => {
    set({ saveStatus: 'SAVING' });
    set((state: OperationalSlice) => ({
      tables: state.tables.map((t: Table) => t.id === table.id ? table : t)
    }));
    saveTableAction(table).then(res => {
      if (!res.success) {
        set({ saveStatus: 'ERROR' });
        logger.error('Failed to persist updated table to SQL', { id: table.id, error: res.error }, 'DATABASE');
      } else {
        set({ saveStatus: 'SAVED' });
        setTimeout(() => set({ saveStatus: 'IDLE' }), 2000);
      }
    }).catch(e => {
      set({ saveStatus: 'ERROR' });
      logger.error('Failed to persist updated table to SQL', { id: table.id, error: e.message }, 'DATABASE')
    });
  },
  
  removeTable: (id: string) => {
    set({ saveStatus: 'SAVING' });
    set((state: OperationalSlice) => ({
      tables: state.tables.filter((t: Table) => t.id !== id)
    }));
    deleteTableAction(id).then(res => {
      if (!res.success) {
        set({ saveStatus: 'ERROR' });
        logger.error('Failed to delete table from SQL', { id, error: res.error }, 'DATABASE');
      } else {
        set({ saveStatus: 'SAVED' });
        setTimeout(() => set({ saveStatus: 'IDLE' }), 2000);
      }
    }).catch(e => {
      set({ saveStatus: 'ERROR' });
      logger.error('Failed to delete table from SQL', { id, error: e.message }, 'DATABASE')
    });
  },

  updateTableStatus: (id: string, status: string) => {
    const table = get().tables.find((t: Table) => t.id === id);
    if (table) {
      const updatedTable = { ...table, status };
      get().updateTable(updatedTable);
    }
  },
  
  addCustomer: (customer: Customer) => {
    set((state: OperationalSlice) => ({ customers: [...state.customers, customer] }));
    saveCustomerAction(customer).then(res => {
      if (!res.success) logger.error('Failed to persist new customer to SQL', { id: customer.id, error: res.error }, 'DATABASE');
    }).catch(e => 
      logger.error('Failed to persist new customer to SQL', { id: customer.id, error: e.message }, 'DATABASE')
    );
  },
  
  updateCustomer: (customer: Customer) => {
    set((state: OperationalSlice) => ({
      customers: state.customers.map((c: Customer) => c.id === customer.id ? customer : c)
    }));
    saveCustomerAction(customer).then(res => {
      if (!res.success) logger.error('Failed to persist updated customer to SQL', { id: customer.id, error: res.error }, 'DATABASE');
    }).catch(e => 
      logger.error('Failed to persist updated customer to SQL', { id: customer.id, error: e.message }, 'DATABASE')
    );
  },
  
  removeCustomer: (id: UUID) => {
    set((state: OperationalSlice) => ({
      customers: state.customers.filter((c: Customer) => c.id !== id)
    }));
    deleteCustomerAction(id).then(res => {
      if (!res.success) logger.error('Failed to delete customer from SQL', { id, error: res.error }, 'DATABASE');
    }).catch(e => 
      logger.error('Failed to delete customer from SQL', { id, error: e.message }, 'DATABASE')
    );
  },
  
  addReservation: (res: Reservation) => set((state: OperationalSlice) => ({ reservations: [...state.reservations, res] })),
  
  updateReservation: (res: Reservation) => set((state: OperationalSlice) => ({
    reservations: state.reservations.map((r: Reservation) => r.id === res.id ? res : r)
  })),
  
  removeReservation: (id: UUID) => set((state: OperationalSlice) => ({
    reservations: state.reservations.filter((r: Reservation) => r.id !== id)
  })),
  
  addStockItem: (item: StockItem) => {
    set((state: OperationalSlice) => ({ stock: [...state.stock, item] }));
    saveStockItemAction(item).then(res => {
      if (!res.success) logger.error('Failed to persist new stock item to SQL', { id: item.id, error: res.error }, 'DATABASE');
    }).catch(e => 
      logger.error('Failed to persist new stock item to SQL', { id: item.id, error: e.message }, 'DATABASE')
    );
  },
  
  updateStockItem: (item: StockItem) => {
    set((state: OperationalSlice) => ({
      stock: state.stock.map((s: StockItem) => s.id === item.id ? item : s)
    }));
    saveStockItemAction(item).then(res => {
      if (!res.success) logger.error('Failed to persist updated stock item to SQL', { id: item.id, error: res.error }, 'DATABASE');
    }).catch(e => 
      logger.error('Failed to persist updated stock item to SQL', { id: item.id, error: e.message }, 'DATABASE')
    );
  },
  
  removeStockItem: (id: UUID) => {
    set((state: OperationalSlice) => ({
      stock: state.stock.filter((s: StockItem) => s.id !== id)
    }));
    deleteStockItemAction(id).then(res => {
      if (!res.success) logger.error('Failed to delete stock item from SQL', { id, error: res.error }, 'DATABASE');
    }).catch(e => 
      logger.error('Failed to delete stock item from SQL', { id, error: e.message }, 'DATABASE')
    );
  },
  
  openShift: (amount: number) => {
    const shiftId = `shift-${Date.now()}`;
    set({ currentShiftId: shiftId });
    get().addNotification?.('success', `Turno aberto com sucesso: ${amount} Kz`);
  },
  
  closeShift: (closingAmount: number) => {
    set({ currentShiftId: null });
    get().addNotification?.('success', `Turno fechado com sucesso: ${closingAmount} Kz`);
  },

  backupLayout: () => {
    const { tables } = get();
    logger.info('Backup de layout de mesas realizado localmente', { count: tables.length }, 'UI');
    get().addNotification?.('success', 'Layout de mesas guardado!');
  },

  createNewOrder: (tableId: string, name: string) => {
    const orderId = `order-${Date.now()}`;
    const newOrder: any = {
      id: orderId,
      tableId,
      customerName: name,
      items: [],
      status: 'OPEN',
      total: 0,
      subtotal: 0,
      tax: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPaid: false
    };
    
    // Adicionar à lista de pedidos (presumindo que existe no financeSlice ou similar)
    // Como estamos num slice diferente, usamos o set do StoreState global se necessário,
    // mas aqui apenas retornamos o ID para quem chamou criar o pedido no local certo
    // ou usamos get().addOrder se estiver disponível no StoreState
    if ('addOrder' in get()) {
      (get() as any).addOrder(newOrder);
    }
    
    return orderId;
  },
  
  closeTableWithoutOrders: (tableId: string) => {
    set((state: OperationalSlice) => ({
      tables: state.tables.map((t: Table) => t.id === tableId ? { ...t, status: 'AVAILABLE' } : t),
      activeTableId: state.activeTableId === tableId ? null : state.activeTableId
    }));
  },

  transferTable: (fromTableId: string, toTableId: string) => {
    const state = get();
    // Update tables
    set((state: OperationalSlice) => ({
      tables: state.tables.map((t: Table) => {
        if (t.id === fromTableId) return { ...t, status: 'AVAILABLE' };
        if (t.id === toTableId) return { ...t, status: 'OCCUPADO' };
        return t;
      }),
      activeTableId: toTableId
    }));
    
    // Move orders
    // We need to access orders from FinanceSlice part of state
    const orders = (state as any).orders || []; // Assuming orders is in StoreState
    const activeOrders = (state as any).activeOrders || [];
    
    const updatedOrders = orders.map((o: any) => o.tableId === fromTableId ? { ...o, tableId: toTableId } : o);
    const updatedActiveOrders = activeOrders.map((o: any) => o.tableId === fromTableId ? { ...o, tableId: toTableId } : o);
    
    set({ orders: updatedOrders, activeOrders: updatedActiveOrders } as any);
  },

  updateStockQuantity: (id: UUID, quantity: number) => {
    set((state: OperationalSlice) => ({
      stock: state.stock.map((item: StockItem) => 
        item.id === id ? { ...item, quantity, lastUpdated: new Date() } : item
      )
    }));
    
    const item = get().stock.find((s: StockItem) => s.id === id);
    if (item) {
      saveStockItemAction(item).then(res => {
        if (!res.success) logger.error('Failed to update stock quantity in SQL', { id, error: res.error }, 'DATABASE');
      }).catch(e => 
        logger.error('Failed to update stock quantity in SQL', { id, error: e.message }, 'DATABASE')
      );
    }
  },

  addDelivery: (delivery: Delivery) => {
    set((state: OperationalSlice) => ({ deliveries: [...state.deliveries, delivery] }));
    get().addAuditLog({
      action: 'DELIVERY_ADD',
      details: `Entrega adicionada para o pedido: ${delivery.orderId}`,
      metadata: { deliveryId: delivery.id },
      userId: get().currentUser?.id
    });
  },

  updateDelivery: (delivery: Delivery) => {
    set((state: OperationalSlice) => ({
      deliveries: state.deliveries.map((d: Delivery) => d.id === delivery.id ? delivery : d)
    }));
    get().addAuditLog({
      action: 'DELIVERY_UPDATE',
      details: `Entrega atualizada: ${delivery.id}`,
      metadata: { deliveryId: delivery.id, status: delivery.status },
      userId: get().currentUser?.id
    });
  },

  removeDelivery: (id: UUID) => {
    set((state: OperationalSlice) => ({
      deliveries: state.deliveries.filter((d: Delivery) => d.id !== id)
    }));
    get().addAuditLog({
      action: 'DELIVERY_REMOVE',
      details: `Entrega removida: ${id}`,
      metadata: { deliveryId: id },
      userId: get().currentUser?.id
    });
  },

  setDeliveries: (deliveries: Delivery[]) => set({ deliveries }),
  setShifts: (shifts: CashShift[]) => set({ shifts }),
  addAuditLog: (log: any) => {
    logger.info('AUDIT LOG', log, 'AUDIT');
    set((state: OperationalSlice) => ({ 
      auditLogs: [
        { 
          ...log, 
          id: log.id || `log-${Date.now()}`, 
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString() 
        }, 
        ...state.auditLogs
      ].slice(0, 50) 
    }));
  }
});
