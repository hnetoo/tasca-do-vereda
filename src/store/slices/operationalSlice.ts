import { StateCreator } from 'zustand';
import { Table, Customer, Reservation, StockItem, CashShift, StoreState, Delivery } from '../../types';
import { databaseOperations } from '../../services/database/operations';
import { logger } from '../../services/logger';

export interface OperationalSlice {
  tables: Table[];
  activeTableId: number | null;
  customers: Customer[];
  reservations: Reservation[];
  stock: StockItem[];
  shifts: CashShift[];
  currentShiftId: string | null;
  deliveries: Delivery[];
  
  setActiveTable: (id: number | null) => void;
  addTable: (table: Table) => void;
  updateTable: (table: Table) => void;
  removeTable: (id: number) => void;
  
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  removeCustomer: (id: string) => void;
  
  addReservation: (res: Reservation) => void;
  updateReservation: (res: Reservation) => void;
  removeReservation: (id: string) => void;
  
  addStockItem: (item: StockItem) => void;
  updateStockItem: (item: StockItem) => void;
  removeStockItem: (id: string) => void;
  
  openShift: (amount: number) => void;
  closeShift: (closingAmount: number) => void;
  backupLayout: () => void;
  createNewOrder: (tableId: number, name: string) => string;
  updateStockQuantity: (id: string, quantity: number) => void;

  addDelivery: (delivery: Delivery) => void;
  updateDelivery: (delivery: Delivery) => void;
  removeDelivery: (id: string) => void;
  setDeliveries: (deliveries: Delivery[]) => void;
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
  
  setActiveTable: (id) => set({ activeTableId: id }),
  
  addTable: (table) => {
    set((state) => ({ tables: [...state.tables, table] }));
    databaseOperations.saveTable(table).catch(e => 
      logger.error('Failed to persist new table to SQL', { id: table.id, error: e.message }, 'DATABASE')
    );
  },
  
  updateTable: (table) => {
    set((state) => ({
      tables: state.tables.map((t) => t.id === table.id ? table : t)
    }));
    databaseOperations.saveTable(table).catch(e => 
      logger.error('Failed to persist updated table to SQL', { id: table.id, error: e.message }, 'DATABASE')
    );
  },
  
  removeTable: (id) => {
    set((state) => ({
      tables: state.tables.filter((t) => t.id !== id)
    }));
    databaseOperations.deleteTable(id).catch(e => 
      logger.error('Failed to delete table from SQL', { id, error: e.message }, 'DATABASE')
    );
  },
  
  addCustomer: (customer) => {
    set((state) => ({ customers: [...state.customers, customer] }));
    databaseOperations.saveCustomer(customer).catch(e => 
      logger.error('Failed to persist new customer to SQL', { id: customer.id, error: e.message }, 'DATABASE')
    );
  },
  
  updateCustomer: (customer) => {
    set((state) => ({
      customers: state.customers.map((c) => c.id === customer.id ? customer : c)
    }));
    databaseOperations.saveCustomer(customer).catch(e => 
      logger.error('Failed to persist updated customer to SQL', { id: customer.id, error: e.message }, 'DATABASE')
    );
  },
  
  removeCustomer: (id) => {
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id)
    }));
    databaseOperations.deleteCustomer(id).catch(e => 
      logger.error('Failed to delete customer from SQL', { id, error: e.message }, 'DATABASE')
    );
  },
  
  addReservation: (res) => set((state) => ({ reservations: [...state.reservations, res] })),
  
  updateReservation: (res) => set((state) => ({
    reservations: state.reservations.map((r) => r.id === res.id ? res : r)
  })),
  
  removeReservation: (id) => set((state) => ({
    reservations: state.reservations.filter((r) => r.id !== id)
  })),
  
  addStockItem: (item) => {
    set((state) => ({ stock: [...state.stock, item] }));
    databaseOperations.saveStockItem(item).catch(e => 
      logger.error('Failed to persist new stock item to SQL', { id: item.id, error: e.message }, 'DATABASE')
    );
  },
  
  updateStockItem: (item) => {
    set((state) => ({
      stock: state.stock.map((s) => s.id === item.id ? item : s)
    }));
    databaseOperations.saveStockItem(item).catch(e => 
      logger.error('Failed to persist updated stock item to SQL', { id: item.id, error: e.message }, 'DATABASE')
    );
  },
  
  removeStockItem: (id) => {
    set((state) => ({
      stock: state.stock.filter((s) => s.id !== id)
    }));
    databaseOperations.deleteStockItem(id).catch(e => 
      logger.error('Failed to delete stock item from SQL', { id, error: e.message }, 'DATABASE')
    );
  },
  
  openShift: (amount) => {
    const shiftId = `shift-${Date.now()}`;
    set({ currentShiftId: shiftId });
    get().addNotification?.('success', `Turno aberto com sucesso: ${amount} Kz`);
  },
  
  closeShift: (closingAmount) => {
    set({ currentShiftId: null });
    get().addNotification?.('success', `Turno fechado com sucesso: ${closingAmount} Kz`);
  },

  backupLayout: () => {
    const { tables } = get();
    logger.info('Backup de layout de mesas realizado localmente', { count: tables.length }, 'UI');
    get().addNotification?.('success', 'Layout de mesas guardado!');
  },

  createNewOrder: (tableId, name) => {
    const orderId = `order-${Date.now()}`;
    const newOrder = {
      id: orderId,
      tableId,
      customerName: name,
      items: [],
      status: 'OPEN' as const,
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

  updateStockQuantity: (id, quantity) => {
    set((state) => ({
      stock: state.stock.map((item) => 
        item.id === id ? { ...item, quantity, lastUpdated: new Date() } : item
      )
    }));
    
    const item = get().stock.find(s => s.id === id);
    if (item) {
      databaseOperations.saveStockItem(item).catch(e => 
        logger.error('Failed to update stock quantity in SQL', { id, error: e.message }, 'DATABASE')
      );
    }
  },

  addDelivery: (delivery) => {
    set((state) => ({ deliveries: [...state.deliveries, delivery] }));
    get().addAuditLog({
      action: 'DELIVERY_ADD',
      details: `Entrega adicionada para o pedido: ${delivery.orderId}`,
      metadata: { deliveryId: delivery.id },
      userId: get().currentUser?.id
    });
  },

  updateDelivery: (delivery) => {
    set((state) => ({
      deliveries: state.deliveries.map((d) => d.id === delivery.id ? delivery : d)
    }));
    get().addAuditLog({
      action: 'DELIVERY_UPDATE',
      details: `Entrega atualizada: ${delivery.id}`,
      metadata: { deliveryId: delivery.id, status: delivery.status },
      userId: get().currentUser?.id
    });
  },

  removeDelivery: (id) => {
    set((state) => ({
      deliveries: state.deliveries.filter((d) => d.id !== id)
    }));
    get().addAuditLog({
      action: 'DELIVERY_REMOVE',
      details: `Entrega removida: ${id}`,
      metadata: { deliveryId: id },
      userId: get().currentUser?.id
    });
  },

  setDeliveries: (deliveries) => set({ deliveries })
});
