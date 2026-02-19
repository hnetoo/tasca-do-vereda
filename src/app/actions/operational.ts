'use server';

import { databaseOperations } from '@/services/database/operations';
import { Table, Customer, Reservation, StockItem, CashShift, Delivery, UUID } from '@/types';
import { logger } from '@/services/logger';

export async function saveTableAction(table: Table) {
  try {
    const result = await databaseOperations.saveTable(table);
    if (!result.success) {
      logger.error('Failed to save table via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception saving table via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function deleteTableAction(id: string) {
  try {
    const result = await databaseOperations.deleteTable(id);
    if (!result.success) {
      logger.error('Failed to delete table via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception deleting table via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function saveCustomerAction(customer: Customer) {
  try {
    const result = await databaseOperations.saveCustomer(customer);
    if (!result.success) {
      logger.error('Failed to save customer via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception saving customer via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function deleteCustomerAction(id: UUID) {
  try {
    const result = await databaseOperations.deleteCustomer(id);
    if (!result.success) {
      logger.error('Failed to delete customer via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception deleting customer via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function saveReservationAction(reservation: Reservation) {
  try {
    const result = await databaseOperations.saveReservation(reservation);
    if (!result.success) {
      logger.error('Failed to save reservation via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception saving reservation via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function deleteReservationAction(id: UUID) {
  try {
    const result = await databaseOperations.deleteReservation(id);
    if (!result.success) {
      logger.error('Failed to delete reservation via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception deleting reservation via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function saveStockItemAction(item: StockItem) {
  try {
    const result = await databaseOperations.saveStockItem(item);
    if (!result.success) {
      logger.error('Failed to save stock item via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception saving stock item via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function deleteStockItemAction(id: UUID) {
  try {
    const result = await databaseOperations.deleteStockItem(id);
    if (!result.success) {
      logger.error('Failed to delete stock item via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception deleting stock item via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function saveShiftAction(shift: CashShift) {
  try {
    const result = await databaseOperations.saveShift(shift);
    if (!result.success) {
      logger.error('Failed to save shift via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception saving shift via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function saveDeliveryAction(delivery: Delivery) {
  try {
    const result = await databaseOperations.saveDelivery(delivery);
    if (!result.success) {
      logger.error('Failed to save delivery via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception saving delivery via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function deleteDeliveryAction(id: UUID) {
  try {
    const result = await databaseOperations.deleteDelivery(id);
    if (!result.success) {
      logger.error('Failed to delete delivery via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception deleting delivery via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}
