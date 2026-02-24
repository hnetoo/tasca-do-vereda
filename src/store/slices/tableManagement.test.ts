
import { createOperationalSlice, OperationalSlice } from './operationalSlice';
import { createFinanceSlice, FinanceSlice } from './financeSlice';
import { StoreState, Table, Order, Customer, Reservation, StockItem } from '@/types';
import { logger } from '@/services/logger';
import { generateUUID } from '../../utils/uuid';

// Mock logger
jest.mock('@/services/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock uuid generator
jest.mock('../../utils/uuid', () => ({
  generateUUID: jest.fn(() => 'mock-uuid'),
}));

// Mock actions
jest.mock('@/app/actions/operational', () => ({
  saveTableAction: jest.fn().mockResolvedValue({ success: true }),
  getTablesAction: jest.fn().mockResolvedValue({ success: true, data: [] }),
  saveReservationAction: jest.fn().mockResolvedValue({ success: true }),
  deleteReservationAction: jest.fn().mockResolvedValue({ success: true }),
  saveOrderAction: jest.fn().mockResolvedValue({ success: true }),
  deleteOrderAction: jest.fn().mockResolvedValue({ success: true }),
  saveStockItemAction: jest.fn().mockResolvedValue({ success: true }),
  deleteStockItemAction: jest.fn().mockResolvedValue({ success: true }),
  saveDeliveryAction: jest.fn().mockResolvedValue({ success: true }),
  deleteDeliveryAction: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/app/actions/finance', () => ({
  saveShiftsAction: jest.fn().mockResolvedValue({ success: true }),
}));

describe('Table Management Logic', () => {
  let set: jest.Mock;
  let get: jest.Mock;
  let operationalSlice: OperationalSlice;
  let financeSlice: FinanceSlice;
  let state: any;

  beforeEach(() => {
    state = {
      tables: [
        { id: 'table-1', status: 'OCCUPADO', label: 'Mesa 1' },
        { id: 'table-2', status: 'AVAILABLE', label: 'Mesa 2' },
      ] as Table[],
      activeOrders: [
        { 
          id: 'order-1', 
          table_id: 'table-1', 
          status: 'ABERTO', 
          total: 1000,
          items: [] 
        } as unknown as Order
      ],
      orders: [],
      auditLogs: [],
      revenues: [],
      currentUser: { id: 'user-1', name: 'Test User' },
      
      // Mock methods needed by slices
      updateTable: jest.fn((table) => {
        state.tables = state.tables.map((t: Table) => t.id === table.id ? table : t);
      }),
      updateOrder: jest.fn((order) => {
        state.activeOrders = state.activeOrders.map((o: Order) => o.id === order.id ? order : o);
      }),
      addAuditLog: jest.fn((log) => {
        state.auditLogs.unshift(log);
      }),
      addRevenue: jest.fn((rev) => {
        state.revenues.push(rev);
      }),
      addNotification: jest.fn(), // Mock addNotification
      updateTableStatus: jest.fn((id, status) => {
        // We will replace this with the actual implementation during test setup if testing operationalSlice
        // But for financeSlice test, we might want to mock it to verify call, 
        // OR we want to test the integration.
        // Let's implement it similar to the real one for integration feeling
        const table = state.tables.find((t: Table) => t.id === id);
        if (table) {
             state.updateTable({ ...table, status });
             state.addAuditLog({
                action: 'TABLE_STATUS_CHANGE',
                details: `Mesa ${table.id} status changed to ${status}`,
                metadata: { tableId: id, newStatus: status }
             });
        }
      }),
    };

    set = jest.fn((partial) => {
      if (typeof partial === 'function') {
        const partialState = partial(state);
        Object.assign(state, partialState);
      } else {
        Object.assign(state, partial);
      }
    });

    get = jest.fn(() => state);

    // Initialize slices
    // We bind the slice functions to the state
    const opSlice = createOperationalSlice(set, get, {} as any);
    const finSlice = createFinanceSlice(set, get, {} as any);

    Object.assign(state, opSlice, finSlice);
    
    // Restore mock data that was overwritten by slice initialization
    state.tables = [
        { id: 'table-1', status: 'OCCUPADO', label: 'Mesa 1' },
        { id: 'table-2', status: 'AVAILABLE', label: 'Mesa 2' },
    ];
    state.activeOrders = [
        { 
          id: 'order-1', 
          table_id: 'table-1',
          tableId: 'table-1',
          status: 'ABERTO', 
          total: 1000,
          items: [] 
        } as unknown as Order
    ];
    
    // Update local references
    operationalSlice = state;
    financeSlice = state;
  });

  describe('Initial State', () => {
    it('should return the initial state correctly', () => {
      // The beforeEach block already initializes the state,
      // so we can directly assert on the state object after initialization.
      expect(state.tables).toEqual([
        { id: 'table-1', status: 'OCCUPADO', label: 'Mesa 1' },
        { id: 'table-2', status: 'AVAILABLE', label: 'Mesa 2' },
      ]);
      expect(state.activeOrders).toEqual([
        { 
          id: 'order-1', 
          table_id: 'table-1',
          tableId: 'table-1',
          status: 'ABERTO', 
          total: 1000,
          items: [] 
        }
      ]);
      expect(state.activeTableId).toBeNull();
      expect(state.customers).toEqual([]);
      expect(state.reservations).toEqual([]);
      expect(state.stock).toEqual([]);
      expect(state.shifts).toEqual([]);
      expect(state.currentShiftId).toBeNull();
      expect(state.deliveries).toEqual([]);
      expect(state.auditLogs).toEqual([]);
      expect(state.saveStatus).toBe('IDLE');
    });
  });

  describe('Table Fetching', () => {
    it('should fetch tables successfully and update state', async () => {
      const fetchedTables = [
        { id: 'ft-1', status: 'AVAILABLE', label: 'Fetched Table 1' },
        { id: 'ft-2', status: 'OCCUPADO', label: 'Fetched Table 2' },
      ];
      require('@/app/actions/operational').getTablesAction.mockResolvedValueOnce({ success: true, data: fetchedTables });

      await operationalSlice.fetchTables();

      expect(require('@/app/actions/operational').getTablesAction).toHaveBeenCalled();
      expect(state.tables).toEqual(fetchedTables);
      expect(logger.info).toHaveBeenCalledWith(
        `Tables fetched successfully: ${fetchedTables.length}`,
        undefined,
        'DATABASE'
      );
    });

    it('should log an error if fetching tables fails', async () => {
      const errorMessage = 'Failed to connect to DB';
      require('@/app/actions/operational').getTablesAction.mockResolvedValueOnce({ success: false, error: errorMessage });

      await operationalSlice.fetchTables();

      expect(require('@/app/actions/operational').getTablesAction).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch tables',
        { error: errorMessage },
        'DATABASE'
      );
      // State should remain unchanged or revert to initial if fetch fails
      expect(state.tables).toEqual([
        { id: 'table-1', status: 'OCCUPADO', label: 'Mesa 1' },
        { id: 'table-2', status: 'AVAILABLE', label: 'Mesa 2' },
      ]);
    });
  });

  describe('transferTable', () => {
    it('should transfer table and update statuses', () => {
      // Setup: table-1 is OCCUPADO, table-2 is AVAILABLE
      expect(state.tables.find((t: Table) => t.id === 'table-1').status).toBe('OCCUPADO');
      expect(state.tables.find((t: Table) => t.id === 'table-2').status).toBe('AVAILABLE');

      // Action
      operationalSlice.transferTable('table-1', 'table-2');

      // Assert
      expect(state.tables.find((t: Table) => t.id === 'table-1').status).toBe('AVAILABLE');
      expect(state.tables.find((t: Table) => t.id === 'table-2').status).toBe('OCCUPADO');
      
      // Check Audit Log
      // expect(state.addAuditLog).toHaveBeenCalled(); // Removed because it's overwritten by slice implementation
      const logs = state.auditLogs.filter((l: any) => l.action === 'TABLE_TRANSFER');
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].metadata).toEqual(expect.objectContaining({
        fromTableId: 'table-1',
        toTableId: 'table-2'
      }));
    });
  });

  describe('checkoutTable', () => {
    it('should checkout order and liberate table', async () => {
      // Setup
      const orderId = 'order-1';
      const payments = [{ method: 'NUMERARIO', amount: 1000 }] as any[];
      const userId = 'user-1';
      
      expect(state.activeOrders[0].status).toBe('ABERTO');
      expect(state.tables.find((t: Table) => t.id === 'table-1').status).toBe('OCCUPADO');

      // Action
      await financeSlice.checkoutTable(orderId, payments, undefined, undefined, userId);

      // Assert
      // Order closed
      expect(state.activeOrders[0].status).toBe('FECHADO');
      
      // Table liberated
      // Note: checkoutTable calls get().updateTableStatus. 
      // In our mock state, we implemented updateTableStatus to update state.tables.
      expect(state.tables.find((t: Table) => t.id === 'table-1').status).toBe('AVAILABLE');
      
      // Audit Logs
      const checkoutLogs = state.auditLogs.filter((l: any) => l.action === 'ORDER_CHECKOUT');
      expect(checkoutLogs.length).toBe(1);
      expect(checkoutLogs[0].userId).toBe(userId);
      
      const statusLogs = state.auditLogs.filter((l: any) => l.action === 'TABLE_STATUS_CHANGE');
      expect(statusLogs.length).toBe(1);
      expect(statusLogs[0].metadata.newStatus).toBe('AVAILABLE');
    });
  });

  describe('updateTableStatus', () => {
    it('should update status and log', () => {
      // Action
      operationalSlice.updateTableStatus('table-2', 'DIRTY');

      // Assert
      expect(state.tables.find((t: Table) => t.id === 'table-2').status).toBe('DIRTY');
      
      const logs = state.auditLogs.filter((l: any) => l.action === 'TABLE_STATUS_CHANGE');
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].metadata.newStatus).toBe('DIRTY');
    });
  });

  describe('addTable and removeTable', () => {
    it('should add a new table and call saveTableAction', async () => {
      const newTable: Table = { id: 'table-3', status: 'AVAILABLE', label: 'Mesa 3' };
      await operationalSlice.addTable(newTable);

      expect(state.tables).toContainEqual(newTable);
      expect(require('@/app/actions/operational').saveTableAction).toHaveBeenCalledWith(newTable);
      expect(state.saveStatus).toBe('SAVED');
    });

    it('should remove a table and call deleteTableAction', async () => {
      const tableToRemoveId = 'table-1';
      await operationalSlice.removeTable(tableToRemoveId);

      expect(state.tables.some((t: Table) => t.id === tableToRemoveId)).toBeFalsy();
      expect(require('@/app/actions/operational').deleteTableAction).toHaveBeenCalledWith(tableToRemoveId);
      expect(state.saveStatus).toBe('SAVED');
    });
  });

  describe('Customer Management', () => {
    it('should add a new customer and call saveCustomerAction', async () => {
      const newCustomer: Customer = { id: 'cust-1', name: 'Test Customer', email: 'test@example.com', phone: '123456789', balance: 0 };
      await operationalSlice.addCustomer(newCustomer);

      expect(state.customers).toContainEqual(newCustomer);
      expect(require('@/app/actions/operational').saveCustomerAction).toHaveBeenCalledWith(newCustomer);
    });

    it('should update an existing customer and call saveCustomerAction', async () => {
      const existingCustomer: Customer = { id: 'cust-2', name: 'Existing Customer', email: 'existing@example.com', phone: '987654321', balance: 50 };
      await operationalSlice.addCustomer(existingCustomer); // Add it first
      
      const updatedCustomer = { ...existingCustomer, balance: 100 };
      await operationalSlice.updateCustomer(updatedCustomer);

      expect(state.customers).toContainEqual(updatedCustomer);
      expect(state.customers).not.toContainEqual(existingCustomer);
      expect(require('@/app/actions/operational').saveCustomerAction).toHaveBeenCalledWith(updatedCustomer);
    });

    it('should remove a customer and call deleteCustomerAction', async () => {
      const customerToRemove: Customer = { id: 'cust-3', name: 'Customer to Remove', email: 'remove@example.com', phone: '111222333', balance: 0 };
      await operationalSlice.addCustomer(customerToRemove); // Add it first

      await operationalSlice.removeCustomer(customerToRemove.id);

      expect(state.customers.some((c: Customer) => c.id === customerToRemove.id)).toBeFalsy();
      expect(require('@/app/actions/operational').deleteCustomerAction).toHaveBeenCalledWith(customerToRemove.id);
    });
  });

  describe('Reservation Management', () => {
    it('should add a new reservation and call saveReservationAction', async () => {
      const newReservation: Reservation = { id: 'res-1', tableId: 'table-1', customerName: 'Res Customer', date: '2026-03-01', time: '19:00', guests: 2, status: 'PENDING' };
      await operationalSlice.addReservation(newReservation);

      expect(state.reservations).toContainEqual(newReservation);
      expect(require('@/app/actions/operational').saveReservationAction).toHaveBeenCalledWith(newReservation);
    });

    it('should update an existing reservation and call saveReservationAction', async () => {
      const existingReservation: Reservation = { id: 'res-2', tableId: 'table-2', customerName: 'Existing Res', date: '2026-03-02', time: '20:00', guests: 4, status: 'PENDING' };
      await operationalSlice.addReservation(existingReservation); // Add it first

      const updatedReservation = { ...existingReservation, status: 'CONFIRMED', guests: 5 };
      await operationalSlice.updateReservation(updatedReservation);

      expect(state.reservations).toContainEqual(updatedReservation);
      expect(state.reservations).not.toContainEqual(existingReservation);
      expect(require('@/app/actions/operational').saveReservationAction).toHaveBeenCalledWith(updatedReservation);
    });

    it('should remove a reservation and call deleteReservationAction', async () => {
      const reservationToRemove: Reservation = { id: 'res-3', tableId: 'table-1', customerName: 'Res to Remove', date: '2026-03-03', time: '18:00', guests: 3, status: 'PENDING' };
      await operationalSlice.addReservation(reservationToRemove); // Add it first

      await operationalSlice.removeReservation(reservationToRemove.id);

      expect(state.reservations.some((r: Reservation) => r.id === reservationToRemove.id)).toBeFalsy();
      expect(require('@/app/actions/operational').deleteReservationAction).toHaveBeenCalledWith(reservationToRemove.id);
    });
  });

  describe('Order Management', () => {
    it('should add a new order and call saveOrderAction', async () => {
      const newOrder: Order = { id: 'order-2', tableId: 'table-1', status: 'ABERTO', total: 500, items: [{ id: 'item-1', name: 'Dish 1', price: 250, quantity: 2 }] };
      await operationalSlice.addOrder(newOrder);

      expect(state.activeOrders).toContainEqual(newOrder);
      expect(require('@/app/actions/operational').saveOrderAction).toHaveBeenCalledWith(newOrder);
    });

    it('should update an existing order and call saveOrderAction', async () => {
      const existingOrder: Order = { id: 'order-3', tableId: 'table-2', status: 'ABERTO', total: 300, items: [{ id: 'item-2', name: 'Dish 2', price: 150, quantity: 2 }] };
      await operationalSlice.addOrder(existingOrder); // Add it first

      const updatedOrder = { ...existingOrder, total: 400, items: [{ id: 'item-2', name: 'Dish 2', price: 100, quantity: 4 }] };
      await operationalSlice.updateOrder(updatedOrder);

      expect(state.activeOrders).toContainEqual(updatedOrder);
      expect(state.activeOrders).not.toContainEqual(existingOrder);
      expect(require('@/app/actions/operational').saveOrderAction).toHaveBeenCalledWith(updatedOrder);
    });

    it('should remove an order and call deleteOrderAction', async () => {
      const orderToRemove: Order = { id: 'order-4', tableId: 'table-1', status: 'ABERTO', total: 100, items: [{ id: 'item-3', name: 'Dish 3', price: 100, quantity: 1 }] };
      await operationalSlice.addOrder(orderToRemove); // Add it first

      await operationalSlice.removeOrder(orderToRemove.id);

      expect(state.activeOrders.some((o: Order) => o.id === orderToRemove.id)).toBeFalsy();
      expect(require('@/app/actions/operational').deleteOrderAction).toHaveBeenCalledWith(orderToRemove.id);
    });

    it('should create a new order, add it to active orders, and persist it', async () => {
      const tableId = 'table-1';
      const customerName = 'New Customer';
      const expectedOrderId = 'mock-uuid'; // From generateUUID mock

      require('../../utils/uuid').generateUUID.mockReturnValueOnce(expectedOrderId);

      const createdOrderId = operationalSlice.createNewOrder(tableId, customerName);

      expect(createdOrderId).toBe(expectedOrderId);
      expect(require('../../utils/uuid').generateUUID).toHaveBeenCalled();

      const newOrder = state.activeOrders.find((o: Order) => o.id === expectedOrderId);
      expect(newOrder).toBeDefined();
      expect(newOrder.tableId).toBe(tableId);
      expect(newOrder.customerName).toBe(customerName);
      expect(newOrder.status).toBe('ABERTO');
      expect(newOrder.items).toEqual([]);
      expect(newOrder.total).toBe(0);
      expect(newOrder.isPaid).toBe(false);

      expect(require('@/app/actions/operational').saveOrderAction).toHaveBeenCalledWith(expect.objectContaining({
        id: expectedOrderId,
        tableId: tableId,
        customerName: customerName,
      }));

      expect(state.addAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        action: 'ORDER_CREATE',
        details: `Novo pedido criado para a mesa ${tableId} pelo cliente ${customerName}`,
        metadata: { orderId: expectedOrderId, tableId: tableId, customerName: customerName },
      }));
    });
  });

  describe('Stock Management', () => {
    it('should add a new stock item and call saveStockItemAction', async () => {
      const newStockItem: StockItem = { id: 'stock-1', name: 'Item 1', quantity: 10, unit: 'units', price: 50 };
      await operationalSlice.addStockItem(newStockItem);

      expect(state.stock).toContainEqual(newStockItem);
      expect(require('@/app/actions/operational').saveStockItemAction).toHaveBeenCalledWith(newStockItem);
    });

    it('should update an existing stock item and call saveStockItemAction', async () => {
      const existingStockItem: StockItem = { id: 'stock-2', name: 'Item 2', quantity: 20, unit: 'kg', price: 100 };
      await operationalSlice.addStockItem(existingStockItem); // Add it first

      const updatedStockItem = { ...existingStockItem, quantity: 25, price: 110 };
      await operationalSlice.updateStockItem(updatedStockItem);

      expect(state.stock).toContainEqual(updatedStockItem);
      expect(state.stock).not.toContainEqual(existingStockItem);
      expect(require('@/app/actions/operational').saveStockItemAction).toHaveBeenCalledWith(updatedStockItem);
    });

    it('should remove a stock item and call deleteStockItemAction', async () => {
      const stockItemToRemove: StockItem = { id: 'stock-3', name: 'Item 3', quantity: 5, unit: 'liters', price: 20 };
      await operationalSlice.addStockItem(stockItemToRemove); // Add it first

      await operationalSlice.removeStockItem(stockItemToRemove.id);

      expect(state.stock.some((s: StockItem) => s.id === stockItemToRemove.id)).toBeFalsy();
      expect(require('@/app/actions/operational').deleteStockItemAction).toHaveBeenCalledWith(stockItemToRemove.id);
    });

    it('should update stock quantity and call saveStockItemAction', async () => {
      const existingStockItem: StockItem = { id: 'stock-4', name: 'Item 4', quantity: 10, unit: 'units', price: 50 };
      await operationalSlice.addStockItem(existingStockItem); // Add it first

      const updatedQuantity = 15;
      await operationalSlice.updateStockQuantity(existingStockItem.id, updatedQuantity);

      const updatedItemInState = state.stock.find((s: StockItem) => s.id === existingStockItem.id);
      expect(updatedItemInState).toBeDefined();
      expect(updatedItemInState.quantity).toBe(updatedQuantity);
      expect(updatedItemInState.lastUpdated).toBeInstanceOf(Date);
      expect(require('@/app/actions/operational').saveStockItemAction).toHaveBeenCalledWith(expect.objectContaining({
        id: existingStockItem.id,
        quantity: updatedQuantity,
      }));
    });

    it('should log an error if updating stock quantity fails to persist', async () => {
      const existingStockItem: StockItem = { id: 'stock-5', name: 'Item 5', quantity: 20, unit: 'units', price: 60 };
      await operationalSlice.addStockItem(existingStockItem);

      const errorMessage = 'Failed to save stock item';
      require('@/app/actions/operational').saveStockItemAction.mockResolvedValueOnce({ success: false, error: errorMessage });

      await operationalSlice.updateStockQuantity(existingStockItem.id, 25);

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to update stock quantity in SQL',
        { id: existingStockItem.id, error: errorMessage },
        'DATABASE'
      );
    });
  });

  describe('closeTableWithoutOrders', () => {
    it('should set table status to AVAILABLE and clear activeTableId if it matches', () => {
      // Setup: table-1 is OCCUPADO and activeTableId is set to table-1
      state.activeTableId = 'table-1';
      expect(state.tables.find((t: Table) => t.id === 'table-1').status).toBe('OCCUPADO');
      expect(state.activeTableId).toBe('table-1');

      // Action
      operationalSlice.closeTableWithoutOrders('table-1');

      // Assert
      expect(state.tables.find((t: Table) => t.id === 'table-1').status).toBe('AVAILABLE');
      expect(state.activeTableId).toBeNull();
    });

    it('should set table status to AVAILABLE and not clear activeTableId if it does not match', () => {
      // Setup: table-1 is OCCUPADO, table-2 is active
      state.activeTableId = 'table-2';
      expect(state.tables.find((t: Table) => t.id === 'table-1').status).toBe('OCCUPADO');
      expect(state.activeTableId).toBe('table-2');

      // Action
      operationalSlice.closeTableWithoutOrders('table-1');

      // Assert
      expect(state.tables.find((t: Table) => t.id === 'table-1').status).toBe('AVAILABLE');
      expect(state.activeTableId).toBe('table-2'); // Should remain unchanged
    });
  });

  describe('Shift Management', () => {
    beforeEach(() => {
      // Reset mocks before each test in this describe block
      require('../../utils/uuid').generateUUID.mockClear();
      state.addNotification.mockClear();
    });

    it('should open a new shift and set currentShiftId', () => {
      const initialAmount = 100;
      require('../../utils/uuid').generateUUID.mockReturnValueOnce('new-shift-uuid');

      operationalSlice.openShift(initialAmount);

      expect(state.currentShiftId).toBe('new-shift-uuid');
      expect(state.addNotification).toHaveBeenCalledWith('success', `Turno aberto com sucesso: ${initialAmount} Kz`);
    });

    it('should close the current shift and clear currentShiftId', () => {
      // First, open a shift to have a currentShiftId
      require('../../utils/uuid').generateUUID.mockReturnValueOnce('existing-shift-uuid');
      operationalSlice.openShift(500);
      expect(state.currentShiftId).toBe('existing-shift-uuid');

      const closingAmount = 600;
      operationalSlice.closeShift(closingAmount);

      expect(state.currentShiftId).toBeNull();
      expect(state.addNotification).toHaveBeenCalledWith('success', `Turno fechado com sucesso: ${closingAmount} Kz`);
    });

    it('should replace the shifts array with the provided array', () => {
      const newShifts = [
        { id: 'new-shift-1', openingAmount: 200, status: 'OPEN', openedAt: new Date(), closedAt: null, closingAmount: null, userId: 'user-2' },
        { id: 'new-shift-2', openingAmount: 300, status: 'CLOSED', openedAt: new Date(), closedAt: new Date(), closingAmount: 350, userId: 'user-3' },
      ];

      operationalSlice.setShifts(newShifts);

      expect(state.shifts).toEqual(newShifts);
      expect(state.shifts).toHaveLength(2);
    });
  });

  describe('Audit Log Management', () => {
    it('should add an audit log entry and call logger.info', () => {
      const logEntry = { action: 'TEST_ACTION', details: 'Test details' };
      operationalSlice.addAuditLog(logEntry);

      expect(state.auditLogs).toHaveLength(1);
      expect(state.auditLogs[0]).toMatchObject({
        action: 'TEST_ACTION',
        details: 'Test details',
      });
      expect(state.auditLogs[0].id).toBeDefined();
      expect(state.auditLogs[0].timestamp).toBeDefined();
      expect(state.auditLogs[0].created_at).toBeDefined();
      expect(logger.info).toHaveBeenCalledWith('AUDIT LOG', expect.objectContaining(logEntry), 'AUDIT');
    });

    it('should limit audit logs to 50 entries', () => {
      // Clear existing logs
      state.auditLogs = [];

      for (let i = 0; i < 60; i++) {
        operationalSlice.addAuditLog({ action: `ACTION_${i}`, details: `Details ${i}` });
      }

      expect(state.auditLogs).toHaveLength(50);
      expect(state.auditLogs[0].action).toBe('ACTION_59'); // Most recent
      expect(state.auditLogs[49].action).toBe('ACTION_10'); // Oldest retained
    });
  });

  describe('Customer Debt Management', () => {
    it('should settle customer debt, update balance, and add audit log', () => {
      const customerId = 'cust-debt-1';
      const initialBalance = 1000;
      const paymentAmount = 300;
      const expectedBalance = initialBalance - paymentAmount;

      // Add a customer with initial debt
      operationalSlice.addCustomer({ id: customerId, name: 'Debt Customer', email: 'debt@example.com', phone: '123', balance: initialBalance });

      // Mock updateCustomer and addAuditLog as they are called internally
      const originalUpdateCustomer = state.updateCustomer;
      const originalAddAuditLog = state.addAuditLog;
      state.updateCustomer = jest.fn(originalUpdateCustomer);
      state.addAuditLog = jest.fn(originalAddAuditLog);

      operationalSlice.settleCustomerDebt(customerId, paymentAmount);

      // Verify customer balance is updated
      const updatedCustomer = state.customers.find((c: Customer) => c.id === customerId);
      expect(updatedCustomer).toBeDefined();
      expect(updatedCustomer.balance).toBe(expectedBalance);

      // Verify updateCustomer was called
      expect(state.updateCustomer).toHaveBeenCalledWith(expect.objectContaining({
        id: customerId,
        balance: expectedBalance,
      }));

      // Verify audit log was added
      expect(state.addAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        action: 'PAYMENT_RECEIVED',
        details: { customerId, amount: paymentAmount, newBalance: expectedBalance },
      }));
    });

    it('should not change balance or add log if customer not found', () => {
      const nonExistentCustomerId = 'non-existent-cust';
      const paymentAmount = 100;

      // Clear mocks to ensure they are not called
      state.updateCustomer.mockClear();
      state.addAuditLog.mockClear();

      operationalSlice.settleCustomerDebt(nonExistentCustomerId, paymentAmount);

      expect(state.updateCustomer).not.toHaveBeenCalled();
      expect(state.addAuditLog).not.toHaveBeenCalled();
    });
  });

  describe('Delivery Management', () => {
    it('should add a new delivery', async () => {
      const newDelivery = { id: 'del-1', orderId: 'order-1', address: 'Test Address', status: 'PENDING', deliveryFee: 500 };
      await operationalSlice.addDelivery(newDelivery);

      expect(state.deliveries).toContainEqual(newDelivery);
      expect(state.addAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        action: 'DELIVERY_ADD',
        details: `Entrega adicionada para o pedido: ${newDelivery.orderId}`,
        metadata: { deliveryId: newDelivery.id },
      }));
    });

    it('should update an existing delivery', async () => {
      const existingDelivery = { id: 'del-2', orderId: 'order-2', address: 'Existing Address', status: 'PENDING', deliveryFee: 300 };
      await operationalSlice.addDelivery(existingDelivery);

      const updatedDelivery = { ...existingDelivery, status: 'DELIVERED', deliveryFee: 0 };
      await operationalSlice.updateDelivery(updatedDelivery);

      expect(state.deliveries).toContainEqual(updatedDelivery);
      expect(state.deliveries).not.toContainEqual(existingDelivery);
      expect(state.addAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        action: 'DELIVERY_UPDATE',
        details: `Entrega atualizada: ${updatedDelivery.id}`,
        metadata: { deliveryId: updatedDelivery.id, status: updatedDelivery.status },
      }));
    });

    it('should remove a delivery', async () => {
      const deliveryToRemove = { id: 'del-3', orderId: 'order-3', address: 'Remove Address', status: 'PENDING', deliveryFee: 100 };
      await operationalSlice.addDelivery(deliveryToRemove);

      await operationalSlice.removeDelivery(deliveryToRemove.id);

      expect(state.deliveries.some((d: any) => d.id === deliveryToRemove.id)).toBeFalsy();
      expect(state.addAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        action: 'DELIVERY_REMOVE',
        details: `Entrega removida: ${deliveryToRemove.id}`,
        metadata: { deliveryId: deliveryToRemove.id },
      }));
    });
  });

  describe('setDeliveries', () => {
    it('should replace the deliveries array with the provided array', () => {
      const newDeliveries = [
        { id: 'del-new-1', orderId: 'order-new-1', address: 'New Address 1', status: 'PENDING', deliveryFee: 100 },
        { id: 'del-new-2', orderId: 'order-new-2', address: 'New Address 2', status: 'DELIVERED', deliveryFee: 0 },
      ];

      operationalSlice.setDeliveries(newDeliveries);

      expect(state.deliveries).toEqual(newDeliveries);
      expect(state.deliveries).toHaveLength(2);
    });

    it('should set an empty array if an empty array is provided', () => {
      operationalSlice.setDeliveries([]);
      expect(state.deliveries).toEqual([]);
    });
  });

  describe('Save Status Management', () => {
    it('should set the save status correctly', () => {
      operationalSlice.setSaveStatus('SAVING');
      expect(state.saveStatus).toBe('SAVING');

      operationalSlice.setSaveStatus('SAVED');
      expect(state.saveStatus).toBe('SAVED');

      operationalSlice.setSaveStatus('ERROR');
      expect(state.saveStatus).toBe('ERROR');

      operationalSlice.setSaveStatus('IDLE');
      expect(state.saveStatus).toBe('IDLE');
    });
  });

  describe('Layout Management', () => {
    it('should backup layout and show success notification', () => {
      // Clear mocks to ensure we only capture calls from this test
      logger.info.mockClear();
      state.addNotification.mockClear();

      operationalSlice.backupLayout();

      expect(logger.info).toHaveBeenCalledWith(
        'Backup de layout de mesas realizado localmente',
        { count: state.tables.length },
        'UI'
      );
      expect(state.addNotification).toHaveBeenCalledWith('success', 'Layout de mesas guardado!');
    });
  });
});
