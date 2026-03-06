

import { databaseOperations, executeQuery } from '@/services/database/operations';
import { CashShift, OrderPayment, UUID } from '@/types';
import { logger } from '@/services/logger';

export async function saveShiftsAction(shifts: CashShift[]) {
  try {
    const result = await databaseOperations.saveShifts(shifts);
    if (!result.success) {
      logger.error('Failed to save shifts via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception saving shifts via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function clearFinancialDataAction(userId: UUID, reason: string) {
  try {
    // Using databaseOperations for raw SQL execution
    const { supabase } = await import('@/lib/supabase');
    const { createClient } = await import('@/lib/supabase/server');
    const supabaseClient = await createClient();
    
    await executeQuery(supabaseClient, 'BEGIN TRANSACTION');
    try {
        await executeQuery(supabaseClient, 'DELETE FROM order_items');
        await executeQuery(supabaseClient, 'DELETE FROM orders');
        await executeQuery(supabaseClient, 'DELETE FROM expenses');
        await executeQuery(supabaseClient, 'DELETE FROM revenues');
        await executeQuery(supabaseClient, 'DELETE FROM payroll');
        await executeQuery(supabaseClient, 'DELETE FROM cash_shifts');
        
        // Log clearance
        await executeQuery(supabaseClient, 'INSERT INTO system_logs (id, action, details, user_id, timestamp) VALUES (?, ?, ?, ?, ?)', [
            `log-${Date.now()}`,
            'FINANCIAL_CLEARANCE',
            `Limpeza de dados financeiros. Motivo: ${reason}`,
            userId,
            new Date().toISOString()
        ]);
        
        await executeQuery(supabaseClient, 'COMMIT');
        return { success: true };
    } catch (e) {
        await executeQuery(supabaseClient, 'ROLLBACK');
        throw e;
    }
  } catch (error: any) {
    logger.error('Exception clearing financial data via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function correctPaymentAction(orderId: UUID, userId: UUID, reason: string, newPayments: OrderPayment[]) {
  try {
    const { supabase } = await import('@/lib/supabase');
    const { createClient } = await import('@/lib/supabase/server');
    const supabaseClient = await createClient();
    
    await executeQuery(supabaseClient, 'BEGIN TRANSACTION');
    try {
        // Delete old payments
        await executeQuery(supabaseClient, 'DELETE FROM order_payments WHERE order_id = ?', [orderId]);
        
        // Insert new payments
        for (const payment of newPayments) {
            await executeQuery(supabaseClient, 'INSERT INTO order_payments (id, order_id, method, amount, timestamp) VALUES (?, ?, ?, ?, ?)', 
                [payment.id || `pay-${Date.now()}`, orderId, payment.method, payment.amount, payment.timestamp || new Date().toISOString()]
            );
        }
        
        // Log correction
        await executeQuery(supabaseClient, 'INSERT INTO payment_corrections (id, order_id, user_id, reason, type, timestamp, data) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [`corr-${Date.now()}`, orderId, userId, reason, 'PAYMENT_UPDATE', new Date().toISOString(), JSON.stringify(newPayments)]
        );
        
        await executeQuery(supabaseClient, 'COMMIT');
        return { success: true };
    } catch (e) {
        await executeQuery(supabaseClient, 'ROLLBACK');
        throw e;
    }
  } catch (error: any) {
    logger.error('Exception correcting payment via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}
