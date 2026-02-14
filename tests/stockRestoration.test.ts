import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';
import { Dish, StockItem, User } from '../types';

// Mock database operations
vi.mock('../services/database/operations', () => ({
  databaseOperations: {
    saveOrder: vi.fn().mockResolvedValue(true),
    deleteOrder: vi.fn().mockResolvedValue(true),
    saveStockItems: vi.fn().mockResolvedValue(true),
  }
}));

describe('Stock Restoration Integration', () => {
  const mockUser: User = {
    id: 'user-1',
    name: 'Test Admin',
    role: 'ADMIN',
    pin: '1234',
    permissions: ['ADMIN']
  };

  const mockStockItem: StockItem = {
    id: 'stock-1',
    name: 'Cerveja',
    quantity: 10,
    unit: 'un',
    minThreshold: 2
  };

  const mockDish: Dish = {
    id: 'dish-1',
    name: 'Cerveja Gela',
    price: 500,
    categoryId: 'cat-1',
    stockItemId: 'stock-1'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset store state
    useStore.setState({
      currentUser: mockUser,
      activeOrders: [],
      stock: [mockStockItem],
      menu: [mockDish],
      tables: [{ id: 1, name: 'Mesa 1', status: 'LIVRE' }],
      currentShiftId: 'shift-1'
    });
  });

  it('should restore stock when an item is removed from an order', async () => {
    const store = useStore.getState();
    
    // 1. Add item to order (should deduct stock)
    const orderId = 'order-1';
    useStore.setState({ activeOrders: [{
        id: orderId,
        tableId: 1,
        items: [],
        status: 'ABERTO',
        timestamp: new Date(),
        total: 0,
        taxTotal: 0,
        shiftId: 'shift-1'
    }], activeOrderId: orderId });

    store.addToOrder(1, mockDish, 2);
    
    let currentStock = useStore.getState().stock.find(s => s.id === 'stock-1');
    expect(currentStock?.quantity).toBe(8); // 10 - 2

    // 2. Remove item from order (should restore stock)
    store.removeFromOrder(orderId, 0);

    currentStock = useStore.getState().stock.find(s => s.id === 'stock-1');
    expect(currentStock?.quantity).toBe(10); // 8 + 2
  });

  it('should restore stock when an entire order is removed', async () => {
    const store = useStore.getState();
    const orderId = 'order-2';
    
    // Setup order with items
    useStore.setState({ activeOrders: [{
        id: orderId,
        tableId: 1,
        items: [{
            dishId: mockDish.id,
            quantity: 3,
            unitPrice: 500,
            taxAmount: 70,
            status: 'PENDENTE'
        }],
        status: 'ABERTO',
        timestamp: new Date(),
        total: 1570,
        taxTotal: 70,
        shiftId: 'shift-1'
    }], stock: [{ ...mockStockItem, quantity: 7 }] }); // 10 - 3

    // Remove order
    await store.removeOrder(orderId);

    const currentStock = useStore.getState().stock.find(s => s.id === 'stock-1');
    expect(currentStock?.quantity).toBe(10); // 7 + 3
  });

  it('should restore stock when a table is closed without orders', async () => {
    const store = useStore.getState();
    const tableId = 1;
    
    // Setup orders for table
    useStore.setState({ 
        activeOrders: [{
            id: 'order-3',
            tableId: tableId,
            items: [{
                dishId: mockDish.id,
                quantity: 5,
                unitPrice: 500,
                taxAmount: 0,
                status: 'PENDENTE'
            }],
            status: 'ABERTO',
            timestamp: new Date(),
            total: 2500,
            taxTotal: 0,
            shiftId: 'shift-1'
        }], 
        stock: [{ ...mockStockItem, quantity: 5 }], // 10 - 5
        tables: [{ id: tableId, name: 'Mesa 1', status: 'OCUPADO' }]
    });

    // Close table without orders
    store.closeTableWithoutOrders(tableId);

    const currentStock = useStore.getState().stock.find(s => s.id === 'stock-1');
    expect(currentStock?.quantity).toBe(10); // 5 + 5
    
    const activeOrders = useStore.getState().activeOrders;
    expect(activeOrders.length).toBe(0);
  });
});
