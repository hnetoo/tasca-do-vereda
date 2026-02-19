'use server';

import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function getTodayRevenue() {
  try {
    const result: any = await db.execute(sql`
      SELECT SUM(amount) as total 
      FROM revenues 
      WHERE date = CURRENT_DATE
    `);
    
    // Return formatted as number, default to 0
    return Number(result[0]?.total || 0);
  } catch (error) {
    console.error('Error fetching today revenue:', error);
    return 0;
  }
}

export async function getTodayExpenses() {
  try {
    const result: any = await db.execute(sql`
      SELECT SUM(amount) as total 
      FROM expenses 
      WHERE date = CURRENT_DATE
    `);
    
    // Return formatted as number, default to 0
    return Number(result[0]?.total || 0);
  } catch (error) {
    console.error('Error fetching today expenses:', error);
    return 0;
  }
}

export async function getLatestTransactions() {
  try {
    const result: any = await db.execute(sql`
      SELECT amount, description, payment_method 
      FROM transactions 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    // Return as any[] to bypass TS strictness as requested
    return result as any[];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}
