import { useStore } from '../store/useStore';
import { logger } from './logger';

export interface CreateOrderDTO {
  tableId: string;
  items: {
    dishId: string;
    quantity: number;
    notes?: string;
  }[];
  customerName?: string;
}

export interface OrderResponse {
  success: boolean;
  orderId?: string;
  message?: string;
  error?: string;
}

export interface OrderStatus {
  id: string;
  status: string;
  kitchenStatus: 'PRONTO' | 'PREPARANDO' | 'PENDENTE';
}

class OrderService {
  /**
   * Validates if there is enough stock for the requested items.
   * @returns {Promise<boolean>}
   */
  async validateStock(items: CreateOrderDTO['items']): Promise<{ valid: boolean; missingItems: string[] }> {
    const store = useStore.getState();
    const missingItems: string[] = [];

    for (const item of items) {
      const product = store.dishes.find(d => d.id === item.dishId);
      if (!product) continue;

      if (product.track_stock) {
        const currentStock = product.stock_quantity || 0;
        if (currentStock < item.quantity) {
            missingItems.push(`${product.name} (Disponível: ${currentStock})`);
        }
      }
    }

    return {
      valid: missingItems.length === 0,
      missingItems
    };
  }

  /**
   * Creates a new order with full validation and stock management.
   * Acts as a RESTful POST /orders endpoint.
   */
  async createOrder(data: CreateOrderDTO): Promise<OrderResponse> {
    try {
      const store = useStore.getState();
      
      // 1. Validate Stock
      const validation = await this.validateStock(data.items);
      if (!validation.valid) {
        logger.warn('Order creation failed due to stock', { missing: validation.missingItems }, 'OrderService');
        return {
          success: false,
          message: `Stock insuficiente: ${validation.missingItems.join(', ')}`
        };
      }

      // 2. Create Order in Store (Database)
      // We use the store's action which handles ID generation and state update
      const orderId = store.createNewOrder(data.tableId, data.customerName || '');
      
      // 3. Add Items and Deduct Stock
      for (const item of data.items) {
        const product = store.dishes.find(d => d.id === item.dishId);
        if (product) {
            // Add to order
            store.addToOrder(data.tableId, product, item.quantity, item.notes || '', orderId || '');
            
            // Deduct stock if tracked
            if (product.track_stock) {
                const newQuantity = Math.max(0, (product.stock_quantity || 0) - item.quantity);
                store.updateDish({ ...product, stock_quantity: newQuantity });
                logger.info(`Stock deducted for ${product.name}`, { productId: product.id, qty: item.quantity, newStock: newQuantity }, 'OrderService');
            }
        }
      }

      // 4. Fire to Kitchen (Simulated "Send" action)
      store.fireOrderToKitchen(orderId);

      // 5. Sync (if online)

      // 6. Audit Log
      store.addAuditLog({
        action: 'ORDER_CREATED',
        details: `Order ${orderId} created with ${data.items.length} items`,
        metadata: { orderId, tableId: data.tableId, items: data.items },
        userId: data.customerName || 'SYSTEM'
      });

      logger.info('Order created successfully', { orderId, tableId: data.tableId }, 'OrderService');
      
      return {
        success: true,
        orderId,
        message: 'Pedido criado com sucesso'
      };

    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to create order', { error: error.message }, 'OrderService');
      return {
        success: false,
        error: error.message || 'Erro interno ao processar pedido'
      };
    }
  }

  /**
   * Cancel an order and restore stock.
   * Acts as DELETE /orders/:id
   */
  async cancelOrder(orderId: string): Promise<OrderResponse> {
      const store = useStore.getState();
      const order = store.activeOrders.find(o => o.id === orderId);
      
      if (!order) {
          return { success: false, message: 'Pedido não encontrado' };
      }

      // Restore stock and clear items using store action
      // clearDraftOrder now handles stock restoration automatically
      store.clearDraftOrder(orderId);

      // store.addAuditLog is called below...
      
      store.addAuditLog({
        action: 'ORDER_CANCELLED',
        details: `Order ${orderId} cancelled`,
        metadata: { orderId },
        userId: 'SYSTEM'
      });

      logger.info('Order cancelled and stock restored', { orderId }, 'OrderService');
      return { success: true, message: 'Pedido cancelado e stock restaurado' };
  }
  
  /**
   * Get order status
   * Acts as GET /orders/:id/status
   */
  getOrderStatus(orderId: string): OrderStatus | null {
      const store = useStore.getState();
      const order = store.activeOrders.find(o => o.id === orderId);
      if (!order) return null;
      
      // Simple logic to determine aggregate status
      const allReady = (order.items || []).every(i => i.status === 'PRONTO' || i.status === 'ENTREGUE');
      const anyPreparing = (order.items || []).some(i => i.status === 'PREPARANDO');
      
      return {
          id: order.id!,
          status: order.status || 'PENDENTE',
          kitchenStatus: allReady ? 'PRONTO' : anyPreparing ? 'PREPARANDO' : 'PENDENTE'
      };
  }
}

export const orderService = new OrderService();
