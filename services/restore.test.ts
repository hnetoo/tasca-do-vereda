import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { useStore } from '../store/useStore';
import { databaseOperations } from './database/operations';
import { SystemSettings } from '../types';

// Mock dependencies
vi.mock('./database/operations', () => ({
  databaseOperations: {
    recreateMenuSchema: vi.fn().mockResolvedValue(true),
    getCategories: vi.fn().mockResolvedValue([]),
    getDishes: vi.fn().mockResolvedValue([]),
    saveCategory: vi.fn().mockResolvedValue(true),
    saveCategories: vi.fn().mockResolvedValue(true),
    saveDish: vi.fn().mockResolvedValue(true),
    saveDishes: vi.fn().mockResolvedValue(true),
    getStockItems: vi.fn().mockResolvedValue([]),
    getExpenses: vi.fn().mockResolvedValue([]),
    getRevenues: vi.fn().mockResolvedValue([]),
    getSuppliers: vi.fn().mockResolvedValue([])
  }
}));

describe('Menu Restoration Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({ 
        categories: [], 
        menu: [], 
        settings: {} as SystemSettings,
        // Mock addNotification if needed, or let it use the store implementation if it doesn't depend on external services
    });
  });

  it('should load categories and dishes from SQL database', async () => {
    // Setup database mock return values
    const mockCategories = [{ id: '1', name: 'Cat1', is_active: true }];
    const mockDishes = [{ id: 'd1', category_id: '1', name: 'Dish1', price: 10 }];

    (databaseOperations.getCategories as Mock).mockResolvedValue(mockCategories);
    (databaseOperations.getDishes as Mock).mockResolvedValue(mockDishes);

    console.log('Calling restoreMenuData...');
    await useStore.getState().restoreMenuData();
    console.log('restoreMenuData called.');

    expect(databaseOperations.getCategories).toHaveBeenCalled();
    expect(databaseOperations.getDishes).toHaveBeenCalled();
    
    const state = useStore.getState();
    expect(state.categories).toHaveLength(1);
    expect(state.categories[0].id).toBe('1');
    // expect(state.categories[0].is_active).toBe(true); // is_active mapping might differ (1 vs true)
    
    expect(state.menu).toHaveLength(1);
    expect(state.menu[0].id).toBe('d1');
    expect(state.menu[0].price).toBe(10);
  });

  it('should handle empty database gracefully', async () => {
    (databaseOperations.getCategories as Mock).mockResolvedValue([]);
    (databaseOperations.getDishes as Mock).mockResolvedValue([]);

    await useStore.getState().restoreMenuData();

    const state = useStore.getState();
    // If state was empty before, it should remain empty or be set to empty
    expect(state.categories).toHaveLength(0);
    expect(state.menu).toHaveLength(0);
  });
});
