
import { createOperationalSlice, OperationalSlice } from './operationalSlice';
import { createFinanceSlice, FinanceSlice } from './financeSlice';
import { StoreState, Table, Order } from '@/types';
import { logger } from '@/services/logger';

// Mock logger
jest.mock('@/services/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock actions
jest.mock('@/app/actions/operational', () => ({
  saveTableAction: jest.fn().mockResolvedValue({ success: true }),
  getTablesAction: jest.fn().mockResolvedValue({ success: true, data: [] }),
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
});
