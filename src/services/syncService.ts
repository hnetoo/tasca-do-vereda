import { localStorage } from './hybridStorage';
import { createClient } from '@supabase/supabase-js';

// Serviço de sincronização automática
export class SyncService {
  private isRunning = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime: Date | null = null;

  constructor() {
    // Iniciar sincronização automática a cada 5 minutos
    this.startAutoSync();
  }

  // Iniciar sincronização automática
  startAutoSync(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('🔄 Starting automatic sync service...');

    // Sincronizar a cada 5 minutos
    this.syncInterval = setInterval(async () => {
      await this.performSync();
    }, 5 * 60 * 1000); // 5 minutos

    // Sincronização inicial
    setTimeout(() => this.performSync(), 1000);
  }

  // Parar sincronização automática
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Automatic sync service stopped');
  }

  // Realizar sincronização completa
  async performSync(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    if (!this.isRunning) {
      return { success: false, synced: 0, errors: ['Sync service not running'] };
    }

    console.log('🔄 Performing automatic sync...');
    const startTime = new Date();

    try {
      const result = await this.syncToSupabase();
      this.lastSyncTime = startTime;

      if (result.success) {
        console.log(`✅ Sync completed: ${result.synced} items synced`);
      } else {
        console.error(`❌ Sync failed: ${result.errors.length} errors`);
      }

      return result;
    } catch (error: any) {
      console.error('❌ Sync error:', error);
      return { success: false, synced: 0, errors: [error.message] };
    }
  }

  // Sincronizar dados locais para Supabase
  private async syncToSupabase(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        return { success: false, synced: 0, errors: ['Supabase not configured'] };
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // 1. Sincronizar pedidos
      const ordersResult = await this.syncOrders(supabase);
      synced += ordersResult.synced;
      errors.push(...ordersResult.errors);

      // 2. Sincronizar despesas
      const expensesResult = await this.syncExpenses(supabase);
      synced += expensesResult.synced;
      errors.push(...expensesResult.errors);

      // 3. Sincronizar produtos
      const dishesResult = await this.syncDishes(supabase);
      synced += dishesResult.synced;
      errors.push(...dishesResult.errors);

      return { success: errors.length === 0, synced, errors };
    } catch (error: any) {
      return { success: false, synced, errors: [error.message] };
    }
  }

  // Sincronizar pedidos
  private async syncOrders(supabase: any): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      // Obter pedidos não sincronizados do SQLite
      const unsyncedOrders = await this.getUnsyncedOrders();
      console.log(`📦 Found ${unsyncedOrders.length} unsynced orders`);

      for (const order of unsyncedOrders) {
        try {
          // Inserir pedido no Supabase
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
              id: order.id,
              order_number: order.order_number,
              table_id: order.table_id,
              status: order.status,
              total: order.total,
              subtotal: order.subtotal,
              tax_amount: order.tax_amount,
              customer_name: order.customer_name,
              customer_phone: order.customer_phone,
              payment_method: order.payment_method,
              notes: order.notes,
              created_at: order.created_at,
              updated_at: order.updated_at
            })
            .select()
            .single();

          if (orderError) {
            errors.push(`Order ${order.id}: ${orderError.message}`);
            continue;
          }

          // Inserir itens do pedido
          if (order.items && order.items.length > 0) {
            const orderItems = order.items.map((item: any) => ({
              id: item.id,
              order_id: orderData.id,
              dish_id: item.dish_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              notes: item.notes,
              status: item.status,
              created_at: item.created_at,
              updated_at: item.updated_at
            }));

            const { error: itemsError } = await supabase
              .from('order_items')
              .upsert(orderItems, { onConflict: 'id' });

            if (itemsError) {
              errors.push(`Order items ${order.id}: ${itemsError.message}`);
              continue;
            }
          }

          // Marcar como sincronizado no SQLite
          await this.markOrderAsSynced(order.id);
          synced++;
        } catch (error: any) {
          errors.push(`Order ${order.id}: ${error.message}`);
        }
      }
    } catch (error: any) {
      errors.push(`Orders sync: ${error.message}`);
    }

    return { synced, errors };
  }

  // Sincronizar despesas
  private async syncExpenses(supabase: any): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      // Obter despesas não sincronizadas do SQLite
      const unsyncedExpenses = await this.getUnsyncedExpenses();
      console.log(`💰 Found ${unsyncedExpenses.length} unsynced expenses`);

      for (const expense of unsyncedExpenses) {
        try {
          const { error } = await supabase
            .from('expenses')
            .upsert({
              id: expense.id,
              amount: expense.amount,
              category: expense.category,
              date: expense.date,
              description: expense.description,
              notes: expense.notes,
              payment_method: expense.payment_method,
              status: expense.status,
              created_at: expense.created_at,
              updated_at: expense.updated_at
            }, { onConflict: 'id' });

          if (error) {
            errors.push(`Expense ${expense.id}: ${error.message}`);
            continue;
          }

          // Marcar como sincronizado no SQLite
          await this.markExpenseAsSynced(expense.id);
          synced++;
        } catch (error: any) {
          errors.push(`Expense ${expense.id}: ${error.message}`);
        }
      }
    } catch (error: any) {
      errors.push(`Expenses sync: ${error.message}`);
    }

    return { synced, errors };
  }

  // Sincronizar produtos
  private async syncDishes(supabase: any): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      // Obter produtos não sincronizados do SQLite
      const unsyncedDishes = await this.getUnsyncedDishes();
      console.log(`🍽️ Found ${unsyncedDishes.length} unsynced dishes`);

      for (const dish of unsyncedDishes) {
        try {
          const { error } = await supabase
            .from('dishes')
            .upsert({
              id: dish.id,
              name: dish.name,
              description: dish.description,
              price: dish.price,
              category_id: dish.category_id,
              image_url: dish.image_url,
              is_available: dish.is_available,
              tax_code: dish.tax_code,
              is_active: dish.is_active,
              created_at: dish.created_at,
              updated_at: dish.updated_at
            }, { onConflict: 'id' });

          if (error) {
            errors.push(`Dish ${dish.id}: ${error.message}`);
            continue;
          }

          // Marcar como sincronizado no SQLite
          await this.markDishAsSynced(dish.id);
          synced++;
        } catch (error: any) {
          errors.push(`Dish ${dish.id}: ${error.message}`);
        }
      }
    } catch (error: any) {
      errors.push(`Dishes sync: ${error.message}`);
    }

    return { synced, errors };
  }

  // Métodos auxiliares para obter dados não sincronizados
  private async getUnsyncedOrders(): Promise<any[]> {
    // Implementar busca de pedidos não sincronizados
    return [];
  }

  private async getUnsyncedExpenses(): Promise<any[]> {
    // Implementar busca de despesas não sincronizadas
    return [];
  }

  private async getUnsyncedDishes(): Promise<any[]> {
    // Implementar busca de produtos não sincronizados
    return [];
  }

  // Métodos auxiliares para marcar como sincronizado
  private async markOrderAsSynced(orderId: string): Promise<void> {
    // Implementar marcação de pedido como sincronizado
  }

  private async markExpenseAsSynced(expenseId: string): Promise<void> {
    // Implementar marcação de despesa como sincronizada
  }

  private async markDishAsSynced(dishId: string): Promise<void> {
    // Implementar marcação de produto como sincronizado
  }

  // Obter status da sincronização
  getStatus(): { isRunning: boolean; lastSyncTime: Date | null } {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime
    };
  }

  // Forçar sincronização manual
  async forceSync(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    console.log('🔄 Forcing manual sync...');
    return await this.performSync();
  }
}

// Instância global do serviço de sincronização
export const syncService = new SyncService();
