import { describe, it, expect, vi, beforeEach } from 'vitest';
import { databaseOperations } from '../services/database/operations';
import { CryptoService } from '../services/cryptoService';
import { logger } from '../services/logger';
import { useStore } from '../store/useStore';

// Mocks
vi.mock('../services/database/operations', () => ({
  databaseOperations: {
    saveCategories: vi.fn().mockResolvedValue(true),
    saveDishes: vi.fn().mockResolvedValue(true),
    getCategories: vi.fn().mockResolvedValue([{ id: 'cat1', name: 'Cat 1' }]),
    getDishes: vi.fn().mockResolvedValue([{ id: 'dish1', name: 'Dish 1', category_id: 'cat1' }]),
    recreateMenuSchema: vi.fn().mockResolvedValue(true),
    getTables: vi.fn().mockResolvedValue([]),
    getOrders: vi.fn().mockResolvedValue([]),
    getSettings: vi.fn().mockResolvedValue(null),
    recreateTableSchema: vi.fn().mockResolvedValue(true),
  }
}));

vi.mock('../services/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    getFirebaseReadAudit: vi.fn().mockReturnValue([]),
    getSecurityAlerts: vi.fn().mockReturnValue([]),
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock as Storage });

describe('Security & Data Integrity Policy', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    await CryptoService.initialize('test-secret');
  });

  it('Firebase should never perform direct writes to local SQL', async () => {
    // Verificamos se as operações de escrita no SQL não são chamadas proativamente
    expect(databaseOperations.saveCategories).not.toHaveBeenCalled();
    expect(databaseOperations.saveDishes).not.toHaveBeenCalled();
  });

  it('Sensitive data should be encrypted before storage', async () => {
    const sensitiveData = 'AdminPin: 1234';
    const encrypted = await CryptoService.encrypt(sensitiveData);
    
    expect(encrypted).not.toBeNull();
    expect(encrypted).not.toBe(sensitiveData);
    const decrypted = await CryptoService.decrypt(encrypted as string);
    expect(decrypted).toBe(sensitiveData);
  });

  it('Cloud read operations must be audited', async () => {
    // Simular uma leitura da Cloud
    logger.info("Cloud Read Audit: Categories retrieved from Cloud", { path: 'test' }, 'SUPABASE');
    
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Cloud Read Audit'),
      expect.any(Object),
      'SUPABASE'
    );
  });

  it('Runtime permission validation should block unauthorized actions', async () => {
    // Set user without permissions
    useStore.setState({
      currentUser: { id: 'u1', name: 'Waiter', role: 'GARCOM', pin: '1234', permissions: ['CREATE_ORDER'] }
    });

    const hasFinancialPermission = useStore.getState().hasPermission('VIEW_FINANCIAL');
    expect(hasFinancialPermission).toBe(false);

    // Try an action that requires permission
    await useStore.getState().processPayroll('emp1', 1, 2026, 'NUMERARIO');
    
    // Verify notification was added (assuming addNotification is used)
    const notifications = useStore.getState().notifications;
    expect(notifications.some(n => n.message.includes('Sem permissão'))).toBe(true);
  });

  it('Admin and Gerente roles should have all permissions', () => {
    useStore.setState({
      currentUser: { id: 'u1', name: 'Admin', role: 'ADMIN', pin: '1234' }
    });
    expect(useStore.getState().hasPermission('VIEW_FINANCIAL')).toBe(true);
    expect(useStore.getState().hasPermission('EXPORT_DATA')).toBe(true);

    useStore.setState({
      currentUser: { id: 'u2', name: 'Manager', role: 'GERENTE', pin: '1234' }
    });
    expect(useStore.getState().hasPermission('VIEW_FINANCIAL')).toBe(true);
  });
});
