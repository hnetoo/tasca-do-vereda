import Database from '@tauri-apps/plugin-sql';
import { dbConfig } from './config';
import { DATABASE_SCHEMA } from './schema';
import { logger } from '../logger';

let dbInstance: Database | null = null;

export const getDatabase = async (): Promise<Database | null> => {
  if (dbConfig.type === 'local_storage') {
    return null;
  }

  const isTauriEnv = typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
  if (!isTauriEnv) {
    logger.warn('Ambiente sem Tauri detectado. Usando LocalStorage.', {}, 'DATABASE');
    return null;
  }

  if (dbInstance) {
    return dbInstance;
  }

  if (!dbConfig.connectionString) {
    throw new Error(`Connection string is required for database type ${dbConfig.type}`);
  }

  try {
    dbInstance = await Database.load(dbConfig.connectionString);
    logger.info(`Connected to ${dbConfig.type} database`, { type: dbConfig.type }, 'DATABASE');
    
    // Initialize schema if needed
    if (dbConfig.type === 'sqlite') {
        try {
            await dbInstance.execute(DATABASE_SCHEMA);
            logger.info('Database schema initialized successfully', {}, 'DATABASE');
        } catch (e: unknown) {
            const schemaError = e as Error;
            logger.error('Failed to initialize database schema', { error: schemaError.message }, 'DATABASE');
        }
    }
    
    return dbInstance;
  } catch (e: unknown) {
    const error = e as Error;
    // Check for common Tauri missing API error (running in browser)
    if (error?.message && (
      error.message.includes("reading 'invoke'") ||
      error.message.includes("not allowed by ACL") ||
      error.message.includes("plugin:sql|load")
    )) {
        logger.warn(`Tauri environment not detected or SQL plugin not allowed. Falling back to LocalStorage (Browser Mode).`, { error: error.message }, 'DATABASE');
        return null;
    }
    logger.error(`Failed to connect to ${dbConfig.type}`, { error: error.message, type: dbConfig.type }, 'DATABASE');
    // Don't throw in browser mode - gracefully fallback
    if (typeof window !== 'undefined' && !('__TAURI_INTERNALS__' in window || '__TAURI__' in window)) {
      return null;
    }
    throw error;
  }
};

export const executeQuery = async (query: string, values?: unknown[]) => {
  const db = await getDatabase();
  if (!db) {
    logger.warn('Database not configured for SQL execution (using LocalStorage)', { query }, 'DATABASE');
    return null;
  }
  return await db.execute(query, values);
};

export const selectQuery = async <T>(query: string, values?: unknown[]): Promise<T[]> => {
  const db = await getDatabase();
  if (!db) {
    logger.warn('Database not configured for SQL execution (using LocalStorage)', { query }, 'DATABASE');
    return [];
  }
  return await db.select<T[]>(query, values);
};
