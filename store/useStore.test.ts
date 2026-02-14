import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

// Import store after mocks
import { useStore } from './useStore';

describe('useStore - Category Validation', () => {
  beforeEach(() => {
    useStore.setState({
      categories: [],
      deletedCategoryIds: [],
      notifications: []
    });
  });

  it('should add a valid category', () => {
    const validCat = { id: 'cat1', name: 'Bebidas', isActive: true, order: 1 };
    useStore.getState().addCategory(validCat);
    
    const categories = useStore.getState().categories;
    expect(categories).toHaveLength(1);
    expect(categories[0]).toEqual(validCat);
  });

  it('should not add a category with empty name', () => {
    const invalidCat = { id: 'cat2', name: '', isActive: true, order: 2 };
    useStore.getState().addCategory(invalidCat);
    
    const categories = useStore.getState().categories;
    const notifications = useStore.getState().notifications;
    
    expect(categories).toHaveLength(0);
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0].type).toBe('error');
    expect(notifications[0].message).toContain('obrigatório');
  });

  it('should generate ID if missing', () => {
    const noIdCat = { id: '', name: 'Sobremesas', isActive: true, order: 3 }; // Empty ID
    useStore.getState().addCategory(noIdCat);
    
    const categories = useStore.getState().categories;
    expect(categories).toHaveLength(1);
    expect(categories[0].name).toBe('Sobremesas');
    expect(categories[0].id).toBeDefined();
    expect(categories[0].id).not.toBe('');
  });

  it('should prevent duplicate IDs', () => {
    const cat1 = { id: 'dup1', name: 'Primeira', isActive: true, order: 1 };
    const cat2 = { id: 'dup1', name: 'Segunda', isActive: true, order: 2 };
    
    useStore.getState().addCategory(cat1);
    useStore.getState().addCategory(cat2);
    
    const categories = useStore.getState().categories;
    const notifications = useStore.getState().notifications;
    
    expect(categories).toHaveLength(1);
    expect(categories[0].name).toBe('Primeira');
    expect(notifications.some(n => n.message.includes('já existe'))).toBe(true);
  });

  it('should prevent duplicate Names (case insensitive)', () => {
    const cat1 = { id: 'id1', name: 'Vinhos', isActive: true, order: 1 };
    const cat2 = { id: 'id2', name: 'vinhos', isActive: true, order: 2 }; // Lowercase
    
    useStore.getState().addCategory(cat1);
    useStore.getState().addCategory(cat2);
    
    const categories = useStore.getState().categories;
    const notifications = useStore.getState().notifications;
    
    expect(categories).toHaveLength(1);
    expect(notifications.some(n => n.message.includes('já existe'))).toBe(true);
  });

  it('should remove a category and track its ID for sync', () => {
    const cat = { id: 'cat-to-remove', name: 'Remover', isActive: true, order: 1 };
    useStore.getState().addCategory(cat);
    expect(useStore.getState().categories).toHaveLength(1);

    useStore.getState().removeCategory('cat-to-remove');
    
    expect(useStore.getState().categories).toHaveLength(0);
    expect(useStore.getState().deletedCategoryIds).toContain('cat-to-remove');
    
    // Check audit log
    const logs = useStore.getState().auditLogs;
    expect(logs.some(l => l.action === 'CATEGORY_DELETED')).toBe(true);
  });

  it('should recover a category from a recovered object', () => {
    const cat = { id: 'recovered-1', name: 'Recuperada', isActive: true, order: 1 };
    useStore.getState().recoverDeletedCategory(cat);
    
    expect(useStore.getState().categories).toHaveLength(1);
    expect(useStore.getState().categories[0].name).toBe('Recuperada');
  });

  it('should prevent mass deletion bug (cascade)', () => {
    const cat1 = { id: 'c1', name: 'Cat1', isActive: true, order: 1 };
    const cat2 = { id: 'c2', name: 'Cat2', isActive: true, order: 2 };
    useStore.getState().addCategory(cat1);
    useStore.getState().addCategory(cat2);

    // Filter non-existent ID should keep both
    useStore.getState().removeCategory('non-existent');
    expect(useStore.getState().categories).toHaveLength(2);
  });
});
