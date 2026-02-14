 import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SystemSettings } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});
Object.defineProperty(global, 'window', {
  value: {
    localStorage: localStorageMock
  },
  writable: true
});

// Mock jspdf to avoid node environment issues
vi.mock('jspdf', () => ({
  default: class {
    text() {}
    save() {}
    autoTable() {}
  }
}));

// Mock the logger to ensure debug messages are visible in tests
vi.mock('../services/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    audit: vi.fn(),
    security: vi.fn(),
    auth: vi.fn(),
    debug: vi.fn((message, data, context) => {
      console.log(`[DEBUG MOCK] ${context ? `[${context}] ` : ''}${message}`, data);
    }),
  },
}));

vi.mock('../services/database/operations', () => ({
  databaseOperations: {
    recreateTableSchema: vi.fn(() => Promise.resolve()),
    getTables: vi.fn(() => Promise.resolve([])),
    getOrders: vi.fn(() => Promise.resolve([])),
    getSettings: vi.fn(() => Promise.resolve(null)),
    saveCategory: vi.fn(() => Promise.resolve(true)),
    saveCategories: vi.fn(() => Promise.resolve(true)),
    saveDishes: vi.fn(() => Promise.resolve(true)),
    saveTable: vi.fn(() => Promise.resolve(true)),
    saveSettings: vi.fn(() => Promise.resolve(true)),
    recreateMenuSchema: vi.fn(() => Promise.resolve()),
    recreateFinancialSchema: vi.fn(() => Promise.resolve()),
    saveOrders: vi.fn(() => Promise.resolve(true)),
    saveExpenses: vi.fn(() => Promise.resolve(true)),
    saveRevenues: vi.fn(() => Promise.resolve(true)),
    savePayrolls: vi.fn(() => Promise.resolve(true)),
    saveShifts: vi.fn(() => Promise.resolve(true)),
  },
}));

vi.mock('../services/database/connection', () => ({
  getDatabase: vi.fn(() => Promise.resolve({})),
}));

// Isolate modules between tests
beforeEach(async () => {
  localStorageMock.clear();
  vi.resetModules();
  const { useStore } = await import('../store/useStore');
  useStore.persist.clearStorage();
});
 
 describe('Persistência de categorias - reidratação e integridade', () => {
   it('mantém mapeamento categoria→produto após reinicialização', async () => {
     const { useStore } = await import('../store/useStore');
 
     // Setup: categorias e pratos com IDs válidos
     useStore.setState({
       categories: [
         { id: 'cat_bebidas', name: 'Bebidas' },
         { id: 'cat_pratos', name: 'Pratos Principais' },
       ],
       menu: [
         { id: 'd1', name: 'Cuca', description: '', price: 900, categoryId: 'cat_bebidas', image: '', taxCode: 'NOR', categoryName: 'Bebidas' },
         { id: 'd2', name: 'Moamba', description: '', price: 8200, categoryId: 'cat_pratos', image: '', taxCode: 'NOR', categoryName: 'Pratos Principais' },
       ],
       settings: {
         restaurantName: 'Tasca',
         currency: 'Kz',
         taxRate: 14,
         phone: '',
         address: '',
         nif: '',
         commercialReg: '',
         agtCertificate: '',
         invoiceSeries: '',
         regimeIVA: 'Regime Geral',
         kdsEnabled: true,
         isSidebarCollapsed: false,
         webhookEnabled: true,
       } as SystemSettings
     });
 
     // Force persist
     await useStore.persist.rehydrate();
 
     // Simular reinicialização do módulo
     vi.resetModules();
     const { useStore: rehydratedStore } = await import('../store/useStore');
 
     // Trigger integrity validation
     await rehydratedStore.getState().initializeStore();
 
     const cats = rehydratedStore.getState().categories;
     const menu = rehydratedStore.getState().menu;
 
     expect(cats.find(c => c.id === 'cat_bebidas')?.name).toBe('Bebidas');
     expect(menu.find(d => d.id === 'd1')?.categoryId).toBe('cat_bebidas');
     expect(menu.find(d => d.id === 'd2')?.categoryId).toBe('cat_pratos');
   });
 
  it('repara mapeamento quando categoryId inválido usando categoryName', async () => {
    const { useStore } = await import('../store/useStore');

    // Setup: categoria existe, mas prato tem ID de categoria errado mas nome certo
    useStore.setState({
      categories: [{ id: 'cat_bebidas', name: 'Bebidas' }],
      menu: [
        { id: 'd1', name: 'Cuca', description: '', price: 900, categoryId: 'wrong-id', image: '', taxCode: 'NOR', categoryName: 'Bebidas' }
      ]
    });

    // Forçar reparação manual via performSafeCleanup ou apenas reidratação se a lógica permitir
    // No nosso caso, o addDish usa validateDishCategory que resolveria, mas o estado inicial 
    // pode estar quebrado. O performSafeCleanup deve resolver isso.
    await useStore.getState().performSafeCleanup();
    
    expect(useStore.getState().menu[0].categoryId).toBe('cat_bebidas');
  });
 });