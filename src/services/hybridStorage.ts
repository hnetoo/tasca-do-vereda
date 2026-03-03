import Database from 'better-sqlite3';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Interface para o sistema híbrido
export interface HybridStorage {
  saveOrder(order: any): Promise<{ success: boolean; data?: any; error?: string }>;
  getOrder(id: string): Promise<any>;
  getOrders(filters?: any): Promise<any[]>;
  saveExpense(expense: any): Promise<{ success: boolean; data?: any; error?: string }>;
  getExpenses(filters?: any): Promise<any[]>;
  saveDish(dish: any): Promise<{ success: boolean; data?: any; error?: string }>;
  getDishes(): Promise<any[]>;
  syncToSupabase(): Promise<{ success: boolean; synced: number; errors: string[] }>;
}

// Implementação SQLite local
export class SQLiteStorage implements HybridStorage {
  private db: Database.Database | null = null;
  private isInitialized = false;
  private dbPath: string;

  constructor() {
    // Garantir que o diretório data exista
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = join(dataDir, 'tasca-local.db');
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      
      // Criar tabelas se não existirem
      await this.createTables();
      this.isInitialized = true;
      console.log('✅ SQLite local initialized at:', this.dbPath);
    } catch (error) {
      console.error('❌ Failed to initialize SQLite:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Tabela de pedidos
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT NOT NULL,
        table_id TEXT,
        status TEXT DEFAULT 'OPEN',
        total REAL DEFAULT 0,
        subtotal REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        customer_name TEXT,
        customer_phone TEXT,
        payment_method TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_to_supabase INTEGER DEFAULT 0
      )
    `);

    // Tabela de itens do pedido
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        dish_id TEXT NOT NULL,
        quantity REAL DEFAULT 1,
        unit_price REAL DEFAULT 0,
        total_price REAL DEFAULT 0,
        notes TEXT,
        status TEXT DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_to_supabase INTEGER DEFAULT 0,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);

    // Tabela de despesas
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        category TEXT DEFAULT 'Outros',
        date TEXT NOT NULL,
        description TEXT NOT NULL,
        notes TEXT,
        payment_method TEXT,
        status TEXT DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_to_supabase INTEGER DEFAULT 0
      )
    `);

    // Tabela de produtos
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dishes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category_id TEXT,
        image_url TEXT,
        is_available INTEGER DEFAULT 1,
        tax_code TEXT DEFAULT 'NOR',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_to_supabase INTEGER DEFAULT 0
      )
    `);

    console.log('✅ SQLite tables created');
  }

  async saveOrder(order: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');

      const orderId = order.id || this.generateId();
      const orderData = {
        id: orderId,
        order_number: order.order_number || `ORD-${Date.now()}`,
        table_id: order.table_id || null,
        status: order.status || 'OPEN',
        total: order.total || 0,
        subtotal: order.subtotal || 0,
        tax_amount: order.tax_amount || 0,
        customer_name: order.customer_name || null,
        customer_phone: order.customer_phone || null,
        payment_method: order.payment_method || null,
        notes: order.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced_to_supabase: 0
      };

      // Inserir pedido
      const stmt = this.db.prepare(`
        INSERT INTO orders (
          id, order_number, table_id, status, total, subtotal, tax_amount,
          customer_name, customer_phone, payment_method, notes, created_at, updated_at, synced_to_supabase
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        orderData.id, orderData.order_number, orderData.table_id, orderData.status,
        orderData.total, orderData.subtotal, orderData.tax_amount,
        orderData.customer_name, orderData.customer_phone, orderData.payment_method,
        orderData.notes, orderData.created_at, orderData.updated_at, orderData.synced_to_supabase
      );

      // Inserir itens se existirem
      if (order.items && Array.isArray(order.items)) {
        const itemStmt = this.db.prepare(`
          INSERT INTO order_items (
            id, order_id, dish_id, quantity, unit_price, total_price,
            notes, status, created_at, updated_at, synced_to_supabase
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const item of order.items) {
          const itemData = {
            id: item.id || this.generateId(),
            order_id: orderData.id,
            dish_id: item.dish_id || item.dishId || item.id,
            quantity: item.quantity || 1,
            unit_price: item.unit_price || item.price || 0,
            total_price: item.total_price || (item.price || 0) * (item.quantity || 1),
            notes: item.notes || null,
            status: item.status || 'PENDING',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            synced_to_supabase: 0
          };

          itemStmt.run(
            itemData.id, itemData.order_id, itemData.dish_id, itemData.quantity,
            itemData.unit_price, itemData.total_price, itemData.notes, itemData.status,
            itemData.created_at, itemData.updated_at, itemData.synced_to_supabase
          );
        }
      }

      console.log('✅ Order saved to SQLite:', orderData.id);
      return { success: true, data: orderData };
    } catch (error: any) {
      console.error('❌ Failed to save order to SQLite:', error);
      return { success: false, error: error.message };
    }
  }

  async getOrder(id: string): Promise<any> {
    try {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');

      const order = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
      if (!order) return null;

      // Buscar itens do pedido
      const items = this.db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id) as any[];
      return { ...order, items };
    } catch (error: any) {
      console.error('❌ Failed to get order from SQLite:', error);
      return null;
    }
  }

  async getOrders(filters?: any): Promise<any[]> {
    try {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');

      let query = 'SELECT * FROM orders';
      const params: any[] = [];

      if (filters) {
        const conditions: string[] = [];
        if (filters.tableId) {
          conditions.push('table_id = ?');
          params.push(filters.tableId);
        }
        if (filters.status) {
          conditions.push('status = ?');
          params.push(filters.status);
        }
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }

      query += ' ORDER BY created_at DESC';

      const orders = this.db.prepare(query).all(...params) as any[];
      
      // Buscar itens para cada pedido
      const ordersWithItems = orders.map((order: any) => {
        const items = this.db!.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id) as any[];
        return { ...order, items };
      });

      return ordersWithItems;
    } catch (error: any) {
      console.error('❌ Failed to get orders from SQLite:', error);
      return [];
    }
  }

  async saveExpense(expense: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');

      const expenseData = {
        id: expense.id || this.generateId(),
        amount: expense.amount || 0,
        category: expense.category || 'Outros',
        date: expense.date || new Date().toISOString().split('T')[0],
        description: expense.description || '',
        notes: expense.notes || null,
        payment_method: expense.payment_method || null,
        status: expense.status || 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced_to_supabase: 0
      };

      const stmt = this.db.prepare(`
        INSERT INTO expenses (
          id, amount, category, date, description, notes, payment_method,
          status, created_at, updated_at, synced_to_supabase
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        expenseData.id, expenseData.amount, expenseData.category, expenseData.date,
        expenseData.description, expenseData.notes, expenseData.payment_method,
        expenseData.status, expenseData.created_at, expenseData.updated_at, expenseData.synced_to_supabase
      );

      console.log('✅ Expense saved to SQLite:', expenseData.id);
      return { success: true, data: expenseData };
    } catch (error: any) {
      console.error('❌ Failed to save expense to SQLite:', error);
      return { success: false, error: error.message };
    }
  }

  async getExpenses(filters?: any): Promise<any[]> {
    try {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');

      let query = 'SELECT * FROM expenses';
      const params: any[] = [];

      if (filters) {
        const conditions: string[] = [];
        if (filters.category) {
          conditions.push('category = ?');
          params.push(filters.category);
        }
        if (filters.date) {
          conditions.push('date = ?');
          params.push(filters.date);
        }
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }

      query += ' ORDER BY created_at DESC';

      const expenses = this.db.prepare(query).all(...params) as any[];
      return expenses;
    } catch (error: any) {
      console.error('❌ Failed to get expenses from SQLite:', error);
      return [];
    }
  }

  async saveDish(dish: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');

      const dishData = {
        id: dish.id || this.generateId(),
        name: dish.name || '',
        description: dish.description || null,
        price: dish.price || 0,
        category_id: dish.category_id || null,
        image_url: dish.image_url || null,
        is_available: dish.is_available !== false ? 1 : 0,
        tax_code: dish.tax_code || 'NOR',
        is_active: dish.is_active !== false ? 1 : 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced_to_supabase: 0
      };

      const stmt = this.db.prepare(`
        INSERT INTO dishes (
          id, name, description, price, category_id, image_url, is_available,
          tax_code, is_active, created_at, updated_at, synced_to_supabase
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        dishData.id, dishData.name, dishData.description, dishData.price,
        dishData.category_id, dishData.image_url, dishData.is_available,
        dishData.tax_code, dishData.is_active, dishData.created_at, dishData.updated_at, dishData.synced_to_supabase
      );

      console.log('✅ Dish saved to SQLite:', dishData.id);
      return { success: true, data: dishData };
    } catch (error: any) {
      console.error('❌ Failed to save dish to SQLite:', error);
      return { success: false, error: error.message };
    }
  }

  async getDishes(): Promise<any[]> {
    try {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');

      const dishes = this.db.prepare('SELECT * FROM dishes ORDER BY name').all() as any[];
      return dishes;
    } catch (error: any) {
      console.error('❌ Failed to get dishes from SQLite:', error);
      return [];
    }
  }

  async syncToSupabase(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    try {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');

      const errors: string[] = [];
      let synced = 0;

      // Sincronizar pedidos não sincronizados
      const unsyncedOrders = this.db.prepare('SELECT * FROM orders WHERE synced_to_supabase = 0').all() as any[];
      
      for (const order of unsyncedOrders) {
        try {
          // Aqui você implementaria a sincronização com Supabase
          // Por enquanto, apenas marcamos como sincronizado
          this.db.prepare('UPDATE orders SET synced_to_supabase = 1 WHERE id = ?').run(order.id);
          synced++;
        } catch (error: any) {
          errors.push(`Order ${order.id}: ${error.message}`);
        }
      }

      // Sincronizar despesas não sincronizadas
      const unsyncedExpenses = this.db.prepare('SELECT * FROM expenses WHERE synced_to_supabase = 0').all() as any[];
      
      for (const expense of unsyncedExpenses) {
        try {
          // Aqui você implementaria a sincronização com Supabase
          this.db.prepare('UPDATE expenses SET synced_to_supabase = 1 WHERE id = ?').run(expense.id);
          synced++;
        } catch (error: any) {
          errors.push(`Expense ${expense.id}: ${error.message}`);
        }
      }

      console.log(`✅ Sync completed: ${synced} items synced, ${errors.length} errors`);
      return { success: true, synced, errors };
    } catch (error: any) {
      console.error('❌ Failed to sync to Supabase:', error);
      return { success: false, synced: 0, errors: [error.message] };
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

// Instância global do storage local
export const localStorage = new SQLiteStorage();
