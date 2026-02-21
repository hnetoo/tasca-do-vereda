

'use server';

import { databaseOperations } from '@/services/database/operations';
import { Table, Customer, Reservation, StockItem, CashShift, Delivery, UUID, Order } from '@/types';
import { logger } from '@/services/logger';
import { createClient } from '@/lib/supabase/server';

export async function saveOrderAction(order: Order): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const supabase = await createClient();
    const success = await databaseOperations.saveOrder(order, supabase);
    if (!success) {
      logger.error('Failed to save order via server action', { orderId: order.id }, 'SERVER_ACTION');
      return { success: false, error: 'Operation returned false' };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception saving order via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function getTablesAction(): Promise<{ success: boolean; data?: Table[]; error?: string }> {
  try {
    const tables = await databaseOperations.getTables();
    return { success: true, data: tables };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception fetching tables via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function saveTableAction(table: Table): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const result = await databaseOperations.saveTable(table);
    if (!result.success) {
      logger.error('Failed to save table via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception saving table via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function deleteTableAction(id: string): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const result = await databaseOperations.deleteTable(id);
    if (!result.success) {
      logger.error('Failed to delete table via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception deleting table via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function saveCustomerAction(customer: Customer): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const result = await databaseOperations.saveCustomer(customer);
    if (!result.success) {
      logger.error('Failed to save customer via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception saving customer via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function deleteCustomerAction(id: UUID): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const result = await databaseOperations.deleteCustomer(id);
    if (!result.success) {
      logger.error('Failed to delete customer via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception deleting customer via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function saveReservationAction(reservation: Reservation): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const result = await databaseOperations.saveReservation(reservation);
    if (!result.success) {
      logger.error('Failed to save reservation via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception saving reservation via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function deleteReservationAction(id: UUID): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const result = await databaseOperations.deleteReservation(id);
    if (!result.success) {
      logger.error('Failed to delete reservation via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception deleting reservation via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function saveStockItemAction(item: StockItem): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const result = await databaseOperations.saveStockItem(item);
    if (!result.success) {
      logger.error('Failed to save stock item via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception saving stock item via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function deleteStockItemAction(id: UUID): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const result = await databaseOperations.deleteStockItem(id);
    if (!result.success) {
      logger.error('Failed to delete stock item via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception deleting stock item via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function saveShiftAction(shift: CashShift): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const result = await databaseOperations.saveShift(shift);
    if (!result.success) {
      logger.error('Failed to save shift via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception saving shift via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function saveDeliveryAction(delivery: Delivery): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const result = await databaseOperations.saveDelivery(delivery);
    if (!result.success) {
      logger.error('Failed to save delivery via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception saving delivery via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function deleteDeliveryAction(id: UUID): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const result = await databaseOperations.deleteDelivery(id);
    if (!result.success) {
      logger.error('Failed to delete delivery via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception deleting delivery via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}
