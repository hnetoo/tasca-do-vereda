import Database from '@tauri-apps/plugin-sql';
import { logger } from '../logger';

let db: Database | null = null;

export const getDatabase = async (): Promise<Database> => {
  if (db) return db;
  try {
    db = await Database.load('sqlite:tasca.db');
    return db;
  } catch (error: any) {
    logger.error('Failed to load database', { error: error.message }, 'DATABASE');
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
