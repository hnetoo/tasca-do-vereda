import { describe, it, expect, vi, beforeEach } from 'vitest';
import { webcrypto } from 'node:crypto';
import { useStore } from '../store/useStore';
import { Order, OrderPayment, User } from '../types';

// Mock localStorage and crypto
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });
Object.defineProperty(globalThis, 'window', { value: { crypto: webcrypto, localStorage: localStorageMock } });
Object.defineProperty(globalThis, 'crypto', { value: webcrypto });

// Mock database operations
vi.mock('../services/database/operations', () => ({
  databaseOperations: {
    saveOrder: vi.fn().mockResolvedValue(true),
    saveOrders: vi.fn().mockResolvedValue(true),
    saveShifts: vi.fn().mockResolvedValue(true),
    saveTable: vi.fn().mockResolvedValue(true),
  }
}));

vi.mock('../services/database/connection', () => ({
  getDatabase: vi.fn().mockResolvedValue({
    execute: vi.fn().mockResolvedValue(true),
  }),
  executeQuery: vi.fn().mockResolvedValue(true),
}));

describe('Cash Closure and Payment Correction Integration', () => {
  const mockUser: User = {
    id: 'user-1',
    name: 'Test Admin',
    role: 'ADMIN',
    pin: '1234',
    permissions: ['CORRECT_PAYMENT_PRE_PRINT', 'CORRECT_PAYMENT_POST_PRINT', 'CLOSE_SHIFT']
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    
    // Reset store state
    useStore.setState({
      currentUser: mockUser,
      activeOrders: [],
      shifts: [],
      currentShiftId: null,
      notifications: [],
      auditLogs: []
    });
  });

  it('should update cash shift breakdown when a payment is corrected', async () => {
    const store = useStore.getState();
    
    // 1. Open a shift
    store.openShift(1000); // 1000 Kz opening balance
    const shiftId = useStore.getState().currentShiftId;
    expect(shiftId).not.toBeNull();

    // 2. Create and pay an order
    const orderId = 'order-1';
    const initialOrder: Order = {
      id: orderId,
      tableId: 1,
      items: [],
      status: 'FECHADO',
      timestamp: new Date(),
      total: 5000,
      taxTotal: 700,
      shiftId: shiftId!,
      userId: mockUser.id,
      userName: mockUser.name,
      paymentMethod: 'NUMERARIO',
      payments: [
        { id: 'p1', method: 'NUMERARIO', amount: 5000, timestamp: new Date() }
      ]
    };

    useStore.setState({ activeOrders: [initialOrder] });

    // Verify initial breakdown
    let currentShift = useStore.getState().shifts.find(s => s.id === shiftId);
    expect(currentShift?.salesBreakdown.NUMERARIO).toBe(0); // It's 0 because we just added the order to state, not through a payment process that updates the shift

    // Manually trigger a correction to see if it updates correctly
    // Since the order was already "legacy" or added, we want to change it to TPA
    const newPayments: OrderPayment[] = [
      { id: 'p2', method: 'TPA', amount: 5000, timestamp: new Date() }
    ];

    const success = await useStore.getState().correctPayment(orderId, newPayments, 'Change method to TPA');
    expect(success).toBe(true);

    // Verify shift breakdown after correction
    currentShift = useStore.getState().shifts.find(s => s.id === shiftId);
    
    // The logic in correctPayment does:
    // breakdown[oldMethod] -= oldAmount
    // breakdown[newMethod] += newAmount
    // Since NUMERARIO was 0 initially (in the breakdown object of the shift), 0 - 5000 = -5000
    // And TPA was 0, 0 + 5000 = 5000
    
    expect(currentShift?.salesBreakdown.TPA).toBe(5000);
    expect(currentShift?.salesBreakdown.NUMERARIO).toBe(-5000);
  });

  it('should handle split payment corrections and maintain consistency', async () => {
    const store = useStore.getState();
    
    // 1. Open a shift
    store.openShift(0);
    const shiftId = useStore.getState().currentShiftId;

    // 2. Create an order that was paid in full with NUMERARIO
    const orderId = 'order-split';
    const order: Order = {
      id: orderId,
      tableId: 2,
      items: [],
      status: 'FECHADO',
      timestamp: new Date(),
      total: 10000,
      taxTotal: 1400,
      shiftId: shiftId!,
      userId: mockUser.id,
      userName: mockUser.name,
      paymentMethod: 'NUMERARIO',
      payments: [
        { id: 'p-orig', method: 'NUMERARIO', amount: 10000, timestamp: new Date() }
      ]
    };

    useStore.setState({ activeOrders: [order] });

    // 3. Correct to split payment: 4000 NUMERARIO, 6000 TPA
    const newPayments: OrderPayment[] = [
      { id: 'p-split-1', method: 'NUMERARIO', amount: 4000, timestamp: new Date() },
      { id: 'p-split-2', method: 'TPA', amount: 6000, timestamp: new Date() }
    ];

    await useStore.getState().correctPayment(orderId, newPayments, 'Split payment');

    const currentShift = useStore.getState().shifts.find(s => s.id === shiftId);
    
    // Expected: 
    // NUMERARIO: 0 - 10000 + 4000 = -6000
    // TPA: 0 + 6000 = 6000
    expect(currentShift?.salesBreakdown.NUMERARIO).toBe(-6000);
    expect(currentShift?.salesBreakdown.TPA).toBe(6000);
    
    // Total sales in breakdown should sum up to 0 (since it's a correction of a 0-based breakdown)
    const totalBreakdown = Object.values(currentShift?.salesBreakdown || {}).reduce((a, b) => a + b, 0);
    expect(totalBreakdown).toBe(0);
  });

  it('should calculate correct breakdown during closeShift with multi-payments', async () => {
    const store = useStore.getState();
    
    // 1. Open a shift
    store.openShift(1000);
    const shiftId = useStore.getState().currentShiftId;

    // 2. Create and pay an order with split payment
    const order: Order = {
      id: 'order-multi',
      tableId: 3,
      items: [],
      status: 'FECHADO',
      timestamp: new Date(),
      total: 10000,
      taxTotal: 1400,
      shiftId: shiftId!,
      userId: mockUser.id,
      userName: mockUser.name,
      payments: [
        { id: 'p1', method: 'NUMERARIO', amount: 3000, timestamp: new Date() },
        { id: 'p2', method: 'TPA', amount: 7000, timestamp: new Date() }
      ]
    };

    useStore.setState({ activeOrders: [order] });

    // 3. Close shift
    store.closeShift(11000); // 1000 (opening) + 10000 (sales) = 11000 expected

    const closedShift = useStore.getState().shifts.find(s => s.id === shiftId);
    expect(closedShift?.status).toBe('CLOSED');
    expect(closedShift?.salesBreakdown.NUMERARIO).toBe(3000);
    expect(closedShift?.salesBreakdown.TPA).toBe(7000);
    expect(closedShift?.expectedBalance).toBe(11000);
    expect(closedShift?.closingBalance).toBe(11000);
  });
});
