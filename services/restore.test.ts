
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { useStore } from '../store/useStore';
import { backupService } from './backupService';
import { databaseOperations } from './database/operations';
import { SystemSettings, MenuCategory, Dish } from '../types';

// Mock dependencies
vi.mock('./backupService', () => ({
  backupService: {
    checkIntegrity: vi.fn(),
    autoBackup: vi.fn()
  }
}));

vi.mock('./database/operations', () => ({
  databaseOperations: {
    recreateMenuSchema: vi.fn().mockResolvedValue(true),
    saveCategories: vi.fn().mockResolvedValue(true),
    saveDishes: vi.fn().mockResolvedValue(true)
  }
}));



interface CheckIntegrityResult {
  status: string;
  suggestedCategories: MenuCategory[];
  suggestedDishes: Dish[];
}

describe('Secure Restore Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({ 
        categories: [], 
        menu: [], 
        settings: {} as SystemSettings,
        addNotification: vi.fn() 
    });
  });

  it('should wipe database and state before restoring', async () => {
    // Setup backup mock
    (backupService.checkIntegrity as unknown as Mock<() => CheckIntegrityResult>).mockReturnValue({
        status: 'OK',
        suggestedCategories: [{ id: '1', name: 'Cat1' }],
        suggestedDishes: [{ id: 'd1', categoryId: '1', name: 'Dish1', description: 'Test Dish 1', price: 10, image: '', taxCode: 'IVA' }]
    });

    await useStore.getState().restoreMenuData();

    expect(databaseOperations.recreateMenuSchema).toHaveBeenCalled();
    // Cannot easily check intermediate state "set({ categories: [] })" without subscribing
    // But we can check the final state
    expect(useStore.getState().categories).toHaveLength(1);
    expect(useStore.getState().menu).toHaveLength(1);
  });

  it('should assign uncategorized products to "uncategorized" category instead of "Bebidas"', async () => {
    // Setup backup with orphan dish
    (backupService.checkIntegrity as unknown as Mock<() => CheckIntegrityResult>).mockReturnValue({
        status: 'OK',
        suggestedCategories: [{ id: '1', name: 'Cat1' }],
        suggestedDishes: [
            { id: 'd1', categoryId: '1', name: 'Valid Dish', description: 'Valid Test Dish', price: 15, image: '', taxCode: 'IVA' },
            { id: 'd2', categoryId: 'missing_id', name: 'Orphan Dish', description: 'Orphan Test Dish', price: 5, image: '', taxCode: 'ISE' }
        ]
    });

    await useStore.getState().restoreMenuData();

    const menu = useStore.getState().menu;
    const categories = useStore.getState().categories;

    const orphan = menu.find(d => d.id === 'd2');
    expect(orphan?.categoryId).toBe('uncategorized');

    const uncategorizedCat = categories.find(c => c.id === 'uncategorized');
    expect(uncategorizedCat).toBeDefined();
    expect(uncategorizedCat?.name).toBe('Sem Categoria');
    
    // Ensure "Bebidas" was NOT created
    expect(categories.find(c => c.name.toLowerCase().includes('bebidas'))).toBeUndefined();
  });

});
