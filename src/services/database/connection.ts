import { executeSQL, selectSQL } from './actions';
import { logger } from '../logger';

export const executeQuery = async (query: string, params: any[] = []): Promise<any> => {
  try {
    // Ensure params are serializable for Server Action
    const safeParams = params.map(p => p instanceof Date ? p.toISOString() : p);
    return await executeSQL(query, safeParams);
  } catch (error: any) {
    logger.error('Query execution failed', { query, error: error.message }, 'DATABASE');
    throw error;
  }
};

export const selectQuery = async <T>(query: string, params: any[] = []): Promise<T[]> => {
  try {
    const safeParams = params.map(p => p instanceof Date ? p.toISOString() : p);
    const result = await selectSQL<T>(query, safeParams);
    return result as T[];
  } catch (error: any) {
    logger.error('Select query failed', { query, error: error.message }, 'DATABASE');
    throw error;
  }
};

// Deprecated or Mock for compatibility
export const getDatabase = async (): Promise<any> => {
  return {
    execute: executeQuery,
    select: selectQuery
  };
};
