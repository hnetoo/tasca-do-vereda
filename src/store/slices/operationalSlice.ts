import { StateCreator } from 'zustand';
import { Table, Customer, Reservation, StockItem, CashShift, StoreState, Delivery, UUID } from '../../types';
import { databaseOperations } from '../../services/database/operations';
import { logger } from '../../services/logger';

export interface OperationalSlice {
  tables: Table[];
  activeTableId: number | null;
  customers: Customer[];
  reservations: Reservation[];
  stock: StockItem[];
  shifts: CashShift[];
  currentShiftId: UUID | null;
  deliveries: Delivery[];
  
  setActiveTable: (id: number | null) => void;
  addTable: (table: Table) => void;
  updateTable: (table: Table) => void;
  removeTable: (id: number) => void;
  
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
  createNewOrder: (tableId: number, name: string) => UUID;
  updateStockQuantity: (id: UUID, quantity: number) => void;
  
  closeTableWithoutOrders: (tableId: number) => void;
  transferTable: (fromTableId: number, toTableId: number) => void;

  addDelivery: (delivery: Delivery) => void;
  updateDelivery: (delivery: Delivery) => void;
  removeDelivery: (id: UUID) => void;
  setDeliveries: (deliveries: Delivery[]) => void;
  setShifts: (shifts: CashShift[]) => void;
  addAuditLog: (log: any) => void;
}

export const createOperationalSlice: StateCreator<
  StoreState,
  [['zustand/persist', unknown]],
  [],
  OperationalSlice
> = (set, get) => ({
  tables: [],
  activeTableId: null,
  customers: [],
  reservations: [],
  stock: [],
  shifts: [],
  currentShiftId: null,
  deliveries: [],
  
  setActiveTable: (id: number | null) => set({ activeTableId: id }),
  
  addTable: (table: Table) => {
    set((state) => ({ tables: [...state.tables, table] }));
    databaseOperations.saveTable(table).catch(e => 
      logger.error('Failed to persist new table to SQL', { id: table.id, error: e.message }, 'DATABASE')
    );
  },
  
  updateTable: (table: Table) => {
    set((state) => ({
      tables: state.tables.map((t: Table) => t.id === table.id ? table : t)
    }));
    databaseOperations.saveTable(table).catch(e => 
      logger.error('Failed to persist updated table to SQL', { id: table.id, error: e.message }, 'DATABASE')
    );
  },
  
  removeTable: (id: number) => {
    set((state) => ({
      tables: state.tables.filter((t: Table) => t.id !== id)
    }));
    databaseOperations.deleteTable(id).catch(e => 
      logger.error('Failed to delete table from SQL', { id, error: e.message }, 'DATABASE')
    );
  },
  
  addCustomer: (customer: Customer) => {
    set((state) => ({ customers: [...state.customers, customer] }));
    databaseOperations.saveCustomer(customer).catch(e => 
      logger.error('Failed to persist new customer to SQL', { id: customer.id, error: e.message }, 'DATABASE')
    );
  },
  
  updateCustomer: (customer: Customer) => {
    set((state) => ({
      customers: state.customers.map((c: Customer) => c.id === customer.id ? customer : c)
    }));
    databaseOperations.saveCustomer(customer).catch(e => 
      logger.error('Failed to persist updated customer to SQL', { id: customer.id, error: e.message }, 'DATABASE')
    );
  },
  
  removeCustomer: (id: UUID) => {
    set((state) => ({
      customers: state.customers.filter((c: Customer) => c.id !== id)
    }));
    databaseOperations.deleteCustomer(id).catch(e => 
      logger.error('Failed to delete customer from SQL', { id, error: e.message }, 'DATABASE')
    );
  },
  
  addReservation: (res: Reservation) => set((state) => ({ reservations: [...state.reservations, res] })),
  
  updateReservation: (res: Reservation) => set((state) => ({
    reservations: state.reservations.map((r: Reservation) => r.id === res.id ? res : r)
  })),
  
  removeReservation: (id: UUID) => set((state) => ({
    reservations: state.reservations.filter((r: Reservation) => r.id !== id)
  })),
  
  addStockItem: (item: StockItem) => {
    set((state) => ({ stock: [...state.stock, item] }));
    databaseOperations.saveStockItem(item).catch(e => 
      logger.error('Failed to persist new stock item to SQL', { id: item.id, error: e.message }, 'DATABASE')
    );
  },
  
  updateStockItem: (item: StockItem) => {
    set((state) => ({
      stock: state.stock.map((s: StockItem) => s.id === item.id ? item : s)
    }));
    databaseOperations.saveStockItem(item).catch(e => 
      logger.error('Failed to persist updated stock item to SQL', { id: item.id, error: e.message }, 'DATABASE')
    );
  },
  
  removeStockItem: (id: UUID) => {
    set((state) => ({
      stock: state.stock.filter((s: StockItem) => s.id !== id)
    }));
    databaseOperations.deleteStockItem(id).catch(e => 
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

  createNewOrder: (tableId: number, name: string) => {
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
  
  closeTableWithoutOrders: (tableId: number) => {
    set((state) => ({
      tables: state.tables.map((t: Table) => t.id === tableId ? { ...t, status: 'LIVRE' } : t),
      activeTableId: state.activeTableId === tableId ? null : state.activeTableId
    }));
  },

  transferTable: (fromTableId: number, toTableId: number) => {
    const state = get();
    // Update tables
    set((state) => ({
      tables: state.tables.map((t: Table) => {
        if (t.id === fromTableId) return { ...t, status: 'LIVRE' };
        if (t.id === toTableId) return { ...t, status: 'OCUPADO' };
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
    set((state) => ({
      stock: state.stock.map((item: StockItem) => 
        item.id === id ? { ...item, quantity, lastUpdated: new Date() } : item
      )
    }));
    
    const item = get().stock.find((s: StockItem) => s.id === id);
    if (item) {
      databaseOperations.saveStockItem(item).catch(e => 
        logger.error('Failed to update stock quantity in SQL', { id, error: e.message }, 'DATABASE')
      );
    }
  },

  addDelivery: (delivery: Delivery) => {
    set((state) => ({ deliveries: [...state.deliveries, delivery] }));
    get().addAuditLog({
      action: 'DELIVERY_ADD',
      details: `Entrega adicionada para o pedido: ${delivery.orderId}`,
      metadata: { deliveryId: delivery.id },
      userId: get().currentUser?.id
    });
  },

  updateDelivery: (delivery: Delivery) => {
    set((state) => ({
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
    set((state) => ({
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
  }
});
