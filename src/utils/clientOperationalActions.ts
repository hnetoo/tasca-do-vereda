/**
 * Versões client-side das Server Actions de operational para compatibilidade com Tauri
 * Server Actions não funcionam em builds estáticos do Tauri
 */

import { adminOperations } from '@/services/database/adminOperations';
import { Table, Customer, Reservation, StockItem, CashShift, Delivery, UUID, Order, OrderItem } from '@/types';
import { logger } from '@/services/logger';

export async function saveOrderActionClient(order: Order): Promise<{ success: boolean; error?: string | Error }> {
  try {
    // Para ambiente client-side, salvar diretamente via adminOperations
    const result = await adminOperations.saveOrder(order);
    if (!result.success) {
      logger.error('Failed to save order via client action', { orderId: order.id, error: result.error }, 'CLIENT_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception saving order via client action', { error: errorMessage }, 'CLIENT_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function saveOrderItemActionClient(orderItem: OrderItem): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const result = await adminOperations.saveOrderItem(orderItem);
    if (!result.success) {
      logger.error('Failed to save order item via client action', { orderItemId: orderItem.id, error: result.error }, 'CLIENT_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception saving order item via client action', { error: errorMessage }, 'CLIENT_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function updateOrderActionClient(order: Order): Promise<{ success: boolean; error?: string | Error }> {
  try {
    // Usar saveOrder para atualizar (upsert)
    const result = await adminOperations.saveOrder(order);
    if (!result.success) {
      logger.error('Failed to update order via client action', { orderId: order.id, error: result.error }, 'CLIENT_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception updating order via client action', { error: errorMessage }, 'CLIENT_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function deleteOrderActionClient(orderId: UUID): Promise<{ success: boolean; error?: string | Error }> {
  try {
    // Para deletar, vamos marcar como cancelado em vez de deletar fisicamente
    const cancelOrder = {
      id: orderId,
      status: 'CANCELADO',
      updated_at: new Date().toISOString()
    } as Order;
    
    const result = await adminOperations.saveOrder(cancelOrder);
    if (!result.success) {
      logger.error('Failed to cancel order via client action', { orderId, error: result.error }, 'CLIENT_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception canceling order via client action', { error: errorMessage }, 'CLIENT_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function saveTableActionClient(table: Table): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const result = await adminOperations.saveTable(table);
    if (!result.success) {
      logger.error('Failed to save table via client action', { tableId: table.id, error: result.error }, 'CLIENT_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception saving table via client action', { error: errorMessage }, 'CLIENT_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function deleteTableActionClient(tableId: UUID): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const result = await adminOperations.deleteTable(tableId);
    if (!result.success) {
      logger.error('Failed to delete table via client action', { tableId, error: result.error }, 'CLIENT_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception deleting table via client action', { error: errorMessage }, 'CLIENT_ACTION');
    return { success: false, error: errorMessage };
  }
}

// Adicionar outras ações necessárias para o POS
export async function saveCustomerActionClient(customer: Customer): Promise<{ success: boolean; error?: string | Error }> {
  try {
    // Implementar salvamento de cliente
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
}

export async function saveReservationActionClient(reservation: Reservation): Promise<{ success: boolean; error?: string | Error }> {
  try {
    // Implementar salvamento de reserva
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
}
