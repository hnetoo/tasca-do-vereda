'use server'

import 'server-only';
import { client } from '../../db';
import { logger } from '../logger';

const convertQuery = (query: string): string => {
  let i = 1;
  return query.replace(/\?/g, () => `$${i++}`);
};

export async function executeSQL(query: string, params: any[] = []) {
  try {
    const pgQuery = convertQuery(query);
    // Serialize params if needed (Server Actions limitations)
    // But basic types (string, number, boolean, null) are fine.
    // Date objects might need conversion to string/ISO.
    const safeParams = params.map(p => p instanceof Date ? p.toISOString() : p);
    
    const result = await client.unsafe(pgQuery, safeParams);
    return { 
      rowsAffected: result.count, 
      lastInsertId: 0 
    };
  } catch (error: any) {
    console.error('Execute SQL failed:', error);
    throw new Error(error.message);
  }
}

export async function selectSQL<T>(query: string, params: any[] = []) {
  try {
    const pgQuery = convertQuery(query);
    const safeParams = params.map(p => p instanceof Date ? p.toISOString() : p);
    
    const result = await client.unsafe(pgQuery, safeParams);
    // Plain objects are needed for Server Actions return
    return JSON.parse(JSON.stringify(result));
  } catch (error: any) {
    console.error('Select SQL failed:', error);
    throw new Error(error.message);
  }
}
