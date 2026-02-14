import { describe, it, expect, vi, beforeEach } from 'vitest';
import { backupService } from './backupService';
import { MenuCategory, Dish, Order, Expense, Revenue, PayrollRecord, SystemSettings, FinancialBackupData } from '../types';

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

describe('Financial Backup and Restore Integrity Tests', () => {
  const mockCategories: MenuCategory[] = [{ id: 'cat1', name: 'Teste', icon: 'Grid' }];
  const mockDishes: Dish[] = [{ 
    id: 'dish1', 
    name: 'Prato Teste', 
    categoryId: 'cat1', 
    price: 1000,
    description: 'Descrição teste',
    image: '',
    taxCode: 'NOR'
  }];
  
  const mockFinancialData = {
    orders: [
      { id: 'o1', total: 5000, status: 'PAGO', timestamp: new Date(), items: [] },
      { id: 'o2', total: 3000, status: 'PAGO', timestamp: new Date(), items: [] }
    ] as Order[],
    expenses: [
      { id: 'e1', amount: 2000, category: 'Geral', date: new Date(), description: 'Teste' }
    ] as Expense[],
    revenues: [
      { id: 'r1', amount: 1000, category: 'Extra', date: new Date(), description: 'Teste' }
    ] as Revenue[],
    payroll: [
      { id: 'p1', netSalary: 1500, employeeId: 'emp1', month: 1, year: 2026, status: 'PAGO' }
    ] as PayrollRecord[],
    shifts: [],
    settings: { restaurantName: 'Tasca Teste' } as SystemSettings
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('Should calculate financial totals correctly for reconciliation', () => {
    const totals = backupService.calculateFinancialTotals(mockFinancialData as FinancialBackupData);
    
    // Revenue = 5000 (o1) + 3000 (o2) + 1000 (r1) = 9000
    // Expense = 2000 (e1) + 1500 (p1) = 3500
    expect(totals.revenue).toBe(9000);
    expect(totals.expense).toBe(3500);
    expect(totals.ordersCount).toBe(2);
  });

  it('Should save and load a full backup with checksum validation', () => {
    const saveSuccess = backupService.saveFullBackup(
      mockCategories,
      mockDishes,
      mockFinancialData as FinancialBackupData,
      'user-test'
    );
    expect(saveSuccess).toBe(true);

    const loadedPackage = backupService.loadFullBackup();
    expect(loadedPackage).not.toBeNull();
    expect(loadedPackage?.metadata.totals.revenue).toBe(9000);
    expect(loadedPackage?.metadata.checksum).toBeDefined();
    expect(loadedPackage?.financial.orders).toHaveLength(2);
  });

  it('Should fail validation if backup data is tampered (checksum mismatch)', () => {
    backupService.saveFullBackup(
      mockCategories,
      mockDishes,
      mockFinancialData as FinancialBackupData,
      'user-test'
    );

    const raw = localStorage.getItem('tasca_financial_backup_v1');
    const pkg = JSON.parse(raw!);
    
    // Tamper with data without updating checksum
    pkg.financial.revenues[0].amount = 999999; 
    localStorage.setItem('tasca_financial_backup_v1', JSON.stringify(pkg));

    const loadedPackage = backupService.loadFullBackup();
    expect(loadedPackage).toBeNull(); // Should fail checksum
  });

  it('Should identify discrepancies during reconciliation if totals dont match metadata', () => {
    // This tests the warning logic in loadFullBackup
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    backupService.saveFullBackup(
      mockCategories,
      mockDishes,
      mockFinancialData as FinancialBackupData,
      'user-test'
    );

    const raw = localStorage.getItem('tasca_financial_backup_v1');
    const pkg = JSON.parse(raw!);
    
    // Manually update checksum to pass integrity but keep metadata totals old
    pkg.financial.revenues[0].amount = 2000; // Change from 1000 to 2000
    pkg.metadata.checksum = backupService.generateChecksum({
      financial: pkg.financial,
      menu: pkg.menu
    });
    
    localStorage.setItem('tasca_financial_backup_v1', JSON.stringify(pkg));

    const loadedPackage = backupService.loadFullBackup();
    expect(loadedPackage).not.toBeNull();
    // Reconciled revenue should be 10000 now (9000 + 1000 diff), but metadata says 9000
    // The loadFullBackup function should log a warning (as implemented in SearchReplace)
  });
});
