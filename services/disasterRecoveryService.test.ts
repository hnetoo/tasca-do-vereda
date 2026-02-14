import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStore } from '../store/useStore';
import { FullApplicationState } from '../types';

// Mock dependencies
vi.mock('../store/useStore', () => {
  const mockStore = {
    _state: {},
    getState: vi.fn(() => mockStore._state),
    setState: vi.fn((newState: Partial<FullApplicationState>) => {
      mockStore._state = { ...mockStore._state, ...newState };
    }),
  };
  return {
    useStore: mockStore,
  };
});

vi.mock('./database/operations', () => ({
  databaseOperations: {
    loadAllData: vi.fn(),
    saveAllData: vi.fn(),
    getCategories: vi.fn(() => []),
    getDishes: vi.fn(() => []),
    getSettings: vi.fn(() => null),
    getOrders: vi.fn(() => []),
    getEmployees: vi.fn(() => []),
    getStockItems: vi.fn(() => []),
    getExpenses: vi.fn(() => []),
    getRevenues: vi.fn(() => []),
    getShifts: vi.fn(() => []),
    getPayrollRecords: vi.fn(() => []),
    getTables: vi.fn(() => []),
    getUsers: vi.fn(() => []),
    getAttendance: vi.fn(() => []),
    getCustomers: vi.fn(() => []),
    clearAllData: vi.fn(),
    saveCategories: vi.fn(),
    saveDishes: vi.fn(),
    saveEmployees: vi.fn(),
    saveStockItems: vi.fn(),
    saveExpenses: vi.fn(),
    saveSettings: vi.fn(),
    saveCustomers: vi.fn(),
    saveAttendance: vi.fn(),
    saveUsers: vi.fn(),
    saveTables: vi.fn(),
    saveOrders: vi.fn(),
    saveShifts: vi.fn(),
    saveRevenues: vi.fn(),
    savePayrolls: vi.fn(),
  },
}));

vi.mock('./logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    audit: vi.fn(),
  },
}));

vi.mock('./validationService', () => ({
  validationService: {
    validateFullState: vi.fn(() => ({ isValid: true, errors: [] })),
    yield: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('./dlpAlertService', () => ({
  dlpAlertService: {
    trigger: vi.fn(),
  },
}));

// Re-import disasterRecoveryService after mocking dependencies
import { disasterRecoveryService } from './disasterRecoveryService';
import { logger } from './logger';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('disasterRecoveryService', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: vi.fn() },
    });

    vi.spyOn(disasterRecoveryService, 'applyState').mockImplementation(async () => {});
    vi.spyOn(disasterRecoveryService, 'captureFullState').mockImplementation(async () => ({} as FullApplicationState));
    vi.spyOn(disasterRecoveryService, 'loadBackup').mockImplementation(async () => null);
    
    // Reset the store state before each test
    useStore.setState({
      currentUser: null,
      login: vi.fn(),
      logout: vi.fn(),
      categories: [],
      menu: [], // Added menu
      orders: [],
      employees: [], // Added employees
      stock: [], // Added stock
      expenses: [],
      revenues: [], // Added revenues
      shifts: [],
      payrollRecords: [], // Added payrollRecords
      settings: { // Updated settings to match SystemSettings
        restaurantName: 'Tasca Do VEREDA',
        currency: 'KZ',
        taxRate: 0.14,
        apiToken: 'mock-api-token',
        webhookEnabled: false,
        nif: '000000000',
        address: 'Rua Principal',
        phone: '900000000',
      },
      activeOrders: [],
      tables: [],
      users: [], // Added users
      attendance: [], // Added attendance
      customers: [],
      ideConfigs: {}, // Added ideConfigs
      assets: [], // Added assets
      timestamp: new Date().toISOString(), // Added timestamp
      notifications: [],
      addNotification: vi.fn(),
      removeNotification: vi.fn(),
      clearNotifications: vi.fn(),
      syncState: vi.fn(),
      resetState: vi.fn(),
      initializeStore: vi.fn(),
      addCategory: vi.fn(),
      updateCategory: vi.fn(),
      deleteCategory: vi.fn(),
      addDish: vi.fn(),
      updateDish: vi.fn(),
      deleteDish: vi.fn(),
      fetchMenu: vi.fn(),
      fetchDailyAnalytics: vi.fn(),
      processPayroll: vi.fn(),
      getDailySalesAnalytics: vi.fn(() => [{ date: '2024-01-01', totalSales: 0, totalProfit: 0, totalOrders: 0, avgOrderValue: 0, topDish: 'N/A', peakHour: 0 }]),
      fetchTables: vi.fn(),
      addTable: vi.fn(),
      updateTable: vi.fn(),
      deleteTable: vi.fn(),
      fetchActiveOrders: vi.fn(),
      fetchOrderHistory: vi.fn(),
      addOrder: vi.fn(),
      updateOrder: vi.fn(),
      deleteOrder: vi.fn(),
      fetchCustomers: vi.fn(),
      addCustomer: vi.fn(),
      updateCustomer: vi.fn(),
      deleteCustomer: vi.fn(),
      updateSettings: vi.fn(),
      fetchSettings: vi.fn(),
    } as any);


  });

  afterEach(() => {
    // Restore original window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('should create a snapshot of the current state', async () => {
    const mockState = {
      auth: { currentUser: { id: 'test-user' } },
      menu: { categories: [{ id: 'cat1', name: 'Category 1' }] },
    } as any;

    // Mock internal methods that createSnapshot calls
    vi.spyOn(disasterRecoveryService, 'captureFullState').mockResolvedValueOnce(mockState);
    localStorageMock.getItem.mockReturnValueOnce('[]'); // No existing snapshots

    const backupId = await disasterRecoveryService.createSnapshot('Test Snapshot');

    expect(disasterRecoveryService.captureFullState).toHaveBeenCalled();
    expect(localStorageMock.getItem).toHaveBeenCalledWith('dlp_pitr_snapshots');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'dlp_pitr_snapshots',
      expect.stringContaining(JSON.stringify(mockState))
    );
    expect(backupId).toMatch(/^[a-z0-9]{9}$/); // Check if a valid ID is returned
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('DLP: PITR Snapshot created'), undefined, 'DLP');
  });

  it('should restore the system from a specific snapshot', async () => {
    const backupState = {
      auth: { currentUser: { id: 'restored-user' } },
      menu: { categories: [{ id: 'cat2', name: 'Category 2' }] },
    } as any;
    const mockSnapshot = {
      id: 'snapshot-id-456',
      timestamp: new Date().toISOString(),
      label: 'Test Restore',
      state: backupState,
    };

    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify([mockSnapshot]));
    vi.spyOn(disasterRecoveryService, 'applyState').mockResolvedValueOnce(undefined);

    const success = await disasterRecoveryService.restoreToPointInTime('snapshot-id-456');

    expect(localStorageMock.getItem).toHaveBeenCalledWith('dlp_pitr_snapshots');
    expect(disasterRecoveryService.applyState).toHaveBeenCalledWith(backupState);
    expect(success).toBe(true);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Initiating PITR Restore'), undefined, 'DLP');
  });

  it('should return false and log an error if snapshot not found during restore', async () => {
    localStorageMock.getItem.mockReturnValueOnce('[]');


    const success = await disasterRecoveryService.restoreToPointInTime('non-existent-snapshot');

    expect(localStorageMock.getItem).toHaveBeenCalledWith('dlp_pitr_snapshots');
    expect(disasterRecoveryService.applyState).not.toHaveBeenCalled();
    expect(success).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('PITR Restore failed. Snapshot non-existent-snapshot not found.'), undefined, 'DLP');
  });

  it('should return false and log an error if applyState fails during snapshot restore', async () => {
    const errorMessage = 'Failed to apply state';
    const mockSnapshot = {
      id: 'snapshot-id-789',
      timestamp: new Date().toISOString(),
      label: 'Test Restore',
      state: {} as any,
    };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify([mockSnapshot]));
    vi.spyOn(disasterRecoveryService, 'applyState').mockRejectedValueOnce(new Error(errorMessage));

    const success = await disasterRecoveryService.restoreToPointInTime('snapshot-id-789');

    expect(localStorageMock.getItem).toHaveBeenCalledWith('dlp_pitr_snapshots');
    expect(disasterRecoveryService.applyState).toHaveBeenCalledWith(mockSnapshot.state);
    expect(success).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('PITR Restore error'), { error: errorMessage }, 'DLP');
  });

  it('should restore the system from a specific backup', async () => {
    const backupState = {
      auth: { currentUser: { id: 'restored-user' } },
      menu: { categories: [{ id: 'cat2', name: 'Category 2' }] },
    } as any;

    vi.spyOn(disasterRecoveryService, 'loadBackup').mockResolvedValueOnce(backupState);
    vi.spyOn(disasterRecoveryService, 'applyState').mockResolvedValueOnce(undefined);

    const success = await disasterRecoveryService.restoreSystem('backup-id-456');

    expect(disasterRecoveryService.loadBackup).toHaveBeenCalledWith('backup-id-456');
    expect(disasterRecoveryService.applyState).toHaveBeenCalledWith(backupState);
    expect(success).toBe(true);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('System restore completed successfully'), undefined, 'DLP');
  });

  it('should return false and log an error if backup not found during restoreSystem', async () => {
    vi.spyOn(disasterRecoveryService, 'loadBackup').mockResolvedValueOnce(null);

    const success = await disasterRecoveryService.restoreSystem('non-existent-backup');

    expect(disasterRecoveryService.loadBackup).toHaveBeenCalledWith('non-existent-backup');
    expect(disasterRecoveryService.applyState).not.toHaveBeenCalled();
    expect(success).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Backup non-existent-backup not found or corrupted'), undefined, 'DLP');
  });

  it('should return false and log an error if restoreSystem fails', async () => {
    const errorMessage = 'Failed to load backup data';
    vi.spyOn(disasterRecoveryService, 'loadBackup').mockRejectedValueOnce(new Error(errorMessage));

    const success = await disasterRecoveryService.restoreSystem('backup-id-789');

    expect(disasterRecoveryService.loadBackup).toHaveBeenCalledWith('backup-id-789');
    expect(disasterRecoveryService.applyState).not.toHaveBeenCalled();
    expect(success).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Restore failed'), { error: errorMessage }, 'DLP');
  });
});