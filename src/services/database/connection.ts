import Database from '@tauri-apps/plugin-sql';
import { logger } from '../logger';

// Check if running in Tauri environment
const isTauri = () => {
  return typeof window !== 'undefined' && 
         (!!(window as any).__TAURI_INTERNALS__ || !!(window as any).__TAURI__);
};

// Mock database for web environment
class MockDatabase {
  async execute(query: string, params: any[] = []): Promise<any> {
    logger.warn('MockDatabase: execute called (Web Environment)', { query }, 'DATABASE');
    return { rowsAffected: 0, lastInsertId: 0 };
  }
  
  async select<T>(query: string, params: any[] = []): Promise<T[]> {
    logger.warn('MockDatabase: select called (Web Environment)', { query }, 'DATABASE');
    return [];
  }
}

// Define interface compatible with both
interface IDatabase {
  execute(query: string, params?: any[]): Promise<any>;
  select<T>(query: string, params?: any[]): Promise<T[]>;
}

let db: IDatabase | null = null;

export const getDatabase = async (): Promise<IDatabase> => {
  if (db) return db;
  
  try {
    if (isTauri()) {
      const storedUrl = localStorage.getItem('db_url');
      const dbUrl = storedUrl || 'sqlite:tasca.db';
      
      db = await Database.load(dbUrl);
      logger.info(`Connected to database (${dbUrl})`, null, 'DATABASE');
    } else {
      logger.info('Using Mock Database (Web Environment)', null, 'DATABASE');
      db = new MockDatabase();
    }
    return db;
  } catch (error: any) {
    logger.error('Failed to load database', { error: error.message }, 'DATABASE');
    // Fallback to mock even if load fails (e.g. partial Tauri env)
    if (!db) {
       logger.warn('Falling back to Mock Database due to error', null, 'DATABASE');
       db = new MockDatabase();
       return db;
    }
    throw error;
  }
};

export const executeQuery = async (query: string, params: any[] = []): Promise<any> => {
  try {
    const database = await getDatabase();
    return await database.execute(query, params);
  } catch (error: any) {
    logger.error('Query execution failed', { query, error: error.message }, 'DATABASE');
    throw error;
  }
};

export const selectQuery = async <T>(query: string, params: any[] = []): Promise<T[]> => {
  try {
    const database = await getDatabase();
    return await database.select<T>(query, params);
  } catch (error: any) {
    logger.error('Select query failed', { query, error: error.message }, 'DATABASE');
    throw error;
  }
};
