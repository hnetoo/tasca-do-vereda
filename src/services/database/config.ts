
import { getStoredDatabaseConfigSync } from '@/lib/config-manager';

const stored = getStoredDatabaseConfigSync();

export const dbConfig = {
  type: stored.type,
  connectionString: stored.connectionString || process.env.DATABASE_URL,
  database: stored.connectionString || process.env.DATABASE_URL || 'tasca-postgres',
  tables: [
    'menu_categories',
    'dishes',
    'orders',
    'order_items',
    'expenses',
    'revenues',
    'users',
    'employees',
    'attendance',
    'stock_items',
    'suppliers',
    'settings'
  ],
  hardReset: async (): Promise<boolean> => {
    // This function should be implemented to perform a hard reset
    // For now, returning false as it is not implemented in the current context
    return false;
  }
};
