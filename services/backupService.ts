/**
 * DATA LOSS PREVENTION STRATEGY (V2)
 * 1. Dual-Layer Persistence: Uses Zustand Persist (localStorage) + Custom Backup Service.
 * 2. Automated Backups: autoBackup runs on every significant state change (categories/dishes).
 * 3. Integrity Protection: checkIntegrity heuristic prevents backing up corrupted/empty states.
 * 4. Manual Restoration: restoreMenuData in useStore.ts allows manual recovery from Local or Cloud.
 * 5. Cloud Reconciliation: Real-time sync pulls fresh data, but integrity checks prevent local data wipeouts if cloud is empty.
 */
import { MenuCategory, Dish, Order, Expense, Revenue, PayrollRecord, CashShift, SystemSettings } from "../types";
import { logger } from "./logger";

export const BACKUP_KEY = 'tasca_categories_backup_v3_user_only';
export const AUTO_BACKUP_KEY = 'tasca_categories_auto_backup_v3_user_only';
export const DISHES_BACKUP_KEY = 'tasca_dishes_backup_v3_user_only';
export const FINANCIAL_BACKUP_KEY = 'tasca_financial_backup_v1';

export interface FinancialBackupData {
  orders: Order[];
  expenses: Expense[];
  revenues: Revenue[];
  payroll: PayrollRecord[];
  shifts: CashShift[];
  settings: SystemSettings;
}

export interface BackupMetadata {
  timestamp: string;
  count: number;
  checksum: string;
  totals: {
    revenue: number;
    expense: number;
    ordersCount: number;
  };
  version: string;
}

export interface FullBackupPackage {
  metadata: BackupMetadata;
  financial: FinancialBackupData;
  menu: {
    categories: MenuCategory[];
    dishes: Dish[];
  };
}

export const backupService = {
  // Gera um checksum simples para validação de integridade
  generateChecksum: (data: unknown): string => {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  },

  // Calcula totais financeiros para reconciliação
  calculateFinancialTotals: (data: FinancialBackupData) => {
    const revenue = data.orders
      .filter(o => o.status === 'PAGO' || o.status === 'FECHADO')
      .reduce((sum, o) => sum + o.total, 0) +
      data.revenues.reduce((sum, r) => sum + r.amount, 0);
    
    const expense = data.expenses.reduce((sum, e) => sum + e.amount, 0) +
      data.payroll.reduce((sum, p) => sum + p.netSalary, 0);

    return {
      revenue,
      expense,
      ordersCount: data.orders.length
    };
  },

  // Save a complete financial and menu backup
  saveFullBackup: (
    categories: MenuCategory[], 
    dishes: Dish[], 
    financialData: FinancialBackupData,
    userId: string = 'system'
  ): boolean => {
    if (typeof localStorage === 'undefined') return false;
    try {
      const totals = backupService.calculateFinancialTotals(financialData);
      const payload = {
        financial: financialData,
        menu: { categories, dishes }
      };
      
      const metadata: BackupMetadata = {
        timestamp: new Date().toISOString(),
        count: categories.length + dishes.length + financialData.orders.length,
        checksum: backupService.generateChecksum(payload),
        totals,
        version: '2.0.0'
      };

      const fullPackage: FullBackupPackage = {
        metadata,
        ...payload
      };

      localStorage.setItem(FINANCIAL_BACKUP_KEY, JSON.stringify(fullPackage));
      
      logger.info("Backup financeiro completo realizado", { 
        timestamp: metadata.timestamp,
        totals,
        userId 
      }, 'BACKUP');

      return true;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error("Falha ao salvar backup completo", { error: error.message }, 'BACKUP');
      return false;
    }
  },

  // Alias for backward compatibility or specific financial backups
  saveFinancialBackup: async (data: FinancialBackupData): Promise<boolean> => {
    if (typeof localStorage === 'undefined') return false;
    try {
      localStorage.setItem(FINANCIAL_BACKUP_KEY + '_financial_only', JSON.stringify({
        timestamp: new Date().toISOString(),
        data
      }));
      return true;
    } catch (e: unknown) {
      logger.error("Falha ao salvar backup financeiro", { error: (e as Error).message }, 'BACKUP');
      return false;
    }
  },

  loadFinancialBackup: async (): Promise<FinancialBackupData | null> => {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(FINANCIAL_BACKUP_KEY + '_financial_only');
      if (!raw) return null;
      return JSON.parse(raw).data;
    } catch (e: unknown) {
      logger.error("Erro ao carregar backup financeiro", { error: (e as Error).message }, 'BACKUP');
      return null;
    }
  },

  // Realiza backup automático (apenas menu para performance, ou financeiro se solicitado)
  autoBackup: (categories: MenuCategory[], dishes?: Dish[]) => {
    if (typeof localStorage === 'undefined') return;
    try {
      if (categories && categories.length > 0) {
        const validCategories = categories.filter(c => c.id && String(c.id).trim() !== '');
        if (validCategories.length > 0) {
          localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify({
              timestamp: new Date().toISOString(),
              data: validCategories,
              count: validCategories.length
          }));
        }
      }
      
      if (dishes && dishes.length > 0) {
        localStorage.setItem(DISHES_BACKUP_KEY + '_auto', JSON.stringify({
            timestamp: new Date().toISOString(),
            data: dishes,
            count: dishes.length
        }));
      }
    } catch (e: unknown) {
      const error = e as Error;
      logger.error("Failed to auto-backup", { error: error.message }, 'BACKUP');
    }
  },

  loadFullBackup: (): FullBackupPackage | null => {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(FINANCIAL_BACKUP_KEY);
      if (!raw) return null;
      
      const pkg: FullBackupPackage = JSON.parse(raw);
      
      // Validação de Integridade (Checksum)
      const currentChecksum = backupService.generateChecksum({
        financial: pkg.financial,
        menu: pkg.menu
      });

      if (currentChecksum !== pkg.metadata.checksum) {
        logger.error("Integridade do backup comprometida: Checksum mismatch", {
          expected: pkg.metadata.checksum,
          actual: currentChecksum
        }, 'SECURITY');
        return null;
      }

      // Reconciliação Automática
      const calculatedTotals = backupService.calculateFinancialTotals(pkg.financial);
      const isConsistent = Math.abs(calculatedTotals.revenue - pkg.metadata.totals.revenue) < 0.01 &&
                         Math.abs(calculatedTotals.expense - pkg.metadata.totals.expense) < 0.01;

      if (!isConsistent) {
        logger.warn("Discrepância detectada na reconciliação financeira durante o carregamento", {
          expected: pkg.metadata.totals,
          calculated: calculatedTotals
        }, 'FINANCIAL');
        
        // Se a discrepância for crítica, poderíamos retornar null, mas por agora apenas logamos
        // para permitir a recuperação com aviso.
      }
  
      return pkg;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error("Erro ao carregar backup completo", { error: error.message }, 'BACKUP');
      return null;
    }
  },

  loadBackup: (): { categories: MenuCategory[] | null, dishes: Dish[] | null } => {
    if (typeof localStorage === 'undefined') return { categories: null, dishes: null };
    try {
      const catRaw = localStorage.getItem(BACKUP_KEY);
      const dishRaw = localStorage.getItem(DISHES_BACKUP_KEY);
      return {
        categories: catRaw ? JSON.parse(catRaw).data : null,
        dishes: dishRaw ? JSON.parse(dishRaw).data : null
      };
    } catch (e: unknown) {
      const error = e as Error;
      logger.error("Failed to load backup", { error: error.message }, 'BACKUP');
      return { categories: null, dishes: null };
    }
  },

  loadAutoBackup: (): { categories: MenuCategory[] | null, dishes: Dish[] | null } => {
    if (typeof localStorage === 'undefined') return { categories: null, dishes: null };
    try {
      const catRaw = localStorage.getItem(AUTO_BACKUP_KEY);
      const dishRaw = localStorage.getItem(DISHES_BACKUP_KEY + '_auto');
      return {
        categories: catRaw ? JSON.parse(catRaw).data : null,
        dishes: dishRaw ? JSON.parse(dishRaw).data : null
      };
    } catch (e: unknown) {
      const error = e as Error;
      logger.error("Failed to load auto-backup", { error: error.message }, 'BACKUP');
      return { categories: null, dishes: null };
    }
  },

  // Validate if the current state looks corrupted compared to backup
  checkIntegrity: (currentCategories: MenuCategory[], currentDishes: Dish[]): { 
    status: 'OK' | 'CORRUPTED' | 'EMPTY', 
    suggestedCategories?: MenuCategory[],
    suggestedDishes?: Dish[] 
  } => {
    const auto = backupService.loadAutoBackup();
    const manual = backupService.loadBackup();
    
    const bestCategories = auto.categories || manual.categories;
    const bestDishes = auto.dishes || manual.dishes;

    let status: 'OK' | 'CORRUPTED' | 'EMPTY' = 'OK';
    let suggestedCategories: MenuCategory[] | undefined;
    let suggestedDishes: Dish[] | undefined;

    // Check Categories
    if (!currentCategories || currentCategories.length === 0) {
      if (bestCategories && bestCategories.length > 0) {
        status = 'EMPTY';
        suggestedCategories = bestCategories;
      }
    } else if (bestCategories && bestCategories.length > currentCategories.length * 2 && bestCategories.length > 5) {
        // If backup is more than double the size and significant (>5)
        status = 'CORRUPTED';
        suggestedCategories = bestCategories;
    }
    
    // Check Dishes
    if (status === 'OK') {
        if (!currentDishes || currentDishes.length === 0) {
          if (bestDishes && bestDishes.length > 0) {
            status = 'EMPTY';
            suggestedDishes = bestDishes;
          }
        } else if (bestDishes && bestDishes.length > currentDishes.length * 2 && bestDishes.length > 10) {
            status = 'CORRUPTED';
            suggestedDishes = bestDishes;
        }
    }

    return { status, suggestedCategories, suggestedDishes };
  }
};
