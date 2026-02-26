// ========================================
// SERVIÇO SQLITE PARA DESENVOLVIMENTO LOCAL
// Backup e sincronização com Supabase
// ========================================

import Database from 'better-sqlite3';
import { join } from 'path';
import { homedir } from 'os';

export interface LocalOrder {
  id: string;
  order_number: string;
  table_id?: string;
  waiter_id?: string;
  customer_name?: string;
  customer_phone?: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  notes?: string;
  order_type: string;
  delivery_address?: string;
  estimated_time?: number;
  actual_time?: number;
  started_at?: string;
  completed_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LocalProduct {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  price: number;
  cost_price: number;
  image_url?: string;
  sku?: string;
  barcode?: string;
  is_active: boolean;
  is_available: boolean;
  preparation_time: number;
  created_at: string;
  updated_at: string;
}

export interface LocalTable {
  id: string;
  number: string;
  name?: string;
  capacity: number;
  status: string;
  shape: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  rotation: number;
  zone?: string;
  color?: string;
  qr_code_url?: string;
  reservation_enabled: boolean;
  min_capacity: number;
  max_capacity: number;
  created_at: string;
  updated_at: string;
}

export class SQLiteService {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    // Caminho para o banco de dados SQLite no diretório home do usuário
    this.dbPath = join(homedir(), '.tasca-do-vereda', 'local.db');
  }

  async initialize(): Promise<void> {
    try {
      // Abrir ou criar o banco de dados
      this.db = new Database(this.dbPath);

      // Habilitar foreign keys
      this.db.pragma('foreign_keys = ON');
      
      // Criar tabelas se não existirem
      await this.createTables();
      
      console.log('✅ SQLite database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Tabela de pedidos
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT UNIQUE NOT NULL,
        table_id TEXT,
        waiter_id TEXT,
        customer_name TEXT,
        customer_phone TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        payment_status TEXT NOT NULL DEFAULT 'pending',
        payment_method TEXT,
        subtotal REAL NOT NULL DEFAULT 0,
        tax_amount REAL NOT NULL DEFAULT 0,
        service_charge REAL NOT NULL DEFAULT 0,
        discount_amount REAL NOT NULL DEFAULT 0,
        total_amount REAL NOT NULL DEFAULT 0,
        paid_amount REAL NOT NULL DEFAULT 0,
        change_amount REAL NOT NULL DEFAULT 0,
        notes TEXT,
        order_type TEXT NOT NULL DEFAULT 'dine_in',
        delivery_address TEXT,
        estimated_time INTEGER,
        actual_time INTEGER,
        started_at TEXT,
        completed_at TEXT,
        paid_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Tabela de produtos
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category_id TEXT,
        price REAL NOT NULL DEFAULT 0,
        cost_price REAL NOT NULL DEFAULT 0,
        image_url TEXT,
        sku TEXT,
        barcode TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_available INTEGER NOT NULL DEFAULT 1,
        preparation_time INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Tabela de mesas
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tables (
        id TEXT PRIMARY KEY,
        number TEXT UNIQUE NOT NULL,
        name TEXT,
        capacity INTEGER NOT NULL DEFAULT 4,
        status TEXT NOT NULL DEFAULT 'available',
        shape TEXT NOT NULL DEFAULT 'rectangle',
        x_position INTEGER NOT NULL DEFAULT 0,
        y_position INTEGER NOT NULL DEFAULT 0,
        width INTEGER NOT NULL DEFAULT 100,
        height INTEGER NOT NULL DEFAULT 100,
        rotation INTEGER NOT NULL DEFAULT 0,
        zone TEXT,
        color TEXT,
        qr_code_url TEXT,
        reservation_enabled INTEGER NOT NULL DEFAULT 0,
        min_capacity INTEGER NOT NULL DEFAULT 1,
        max_capacity INTEGER NOT NULL DEFAULT 10,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Tabela de sincronização
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_status (
        table_name TEXT PRIMARY KEY,
        last_sync_at TEXT NOT NULL,
        last_sync_id TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        error_message TEXT
      )
    `);

    // Criar índices para performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
      CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
      CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);
    `);
  }

  // ========================================
  // MÉTODOS DE PEDIDOS
  // ========================================

  async createOrder(order: Omit<LocalOrder, 'created_at' | 'updated_at'>): Promise<LocalOrder> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const orderData = {
      ...order,
      created_at: now,
      updated_at: now
    };

    const stmt = this.db.prepare(`
      INSERT INTO orders (
        id, order_number, table_id, waiter_id, customer_name, customer_phone,
        status, payment_status, payment_method, subtotal, tax_amount, service_charge,
        discount_amount, total_amount, paid_amount, change_amount, notes, order_type,
        delivery_address, estimated_time, actual_time, started_at, completed_at,
        paid_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      orderData.id, orderData.order_number, orderData.table_id, orderData.waiter_id,
      orderData.customer_name, orderData.customer_phone, orderData.status,
      orderData.payment_status, orderData.payment_method, orderData.subtotal,
      orderData.tax_amount, orderData.service_charge, orderData.discount_amount,
      orderData.total_amount, orderData.paid_amount, orderData.change_amount,
      orderData.notes, orderData.order_type, orderData.delivery_address,
      orderData.estimated_time, orderData.actual_time, orderData.started_at,
      orderData.completed_at, orderData.paid_at, orderData.created_at, orderData.updated_at
    );

    return orderData;
  }

  async getOrders(): Promise<LocalOrder[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM orders ORDER BY created_at DESC');
    const rows = stmt.all() as LocalOrder[];
    return rows;
  }

  async updateOrder(id: string, updates: Partial<LocalOrder>): Promise<LocalOrder> {
    if (!this.db) throw new Error('Database not initialized');

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const fields = Object.keys(updateData).filter(key => key !== 'id') as (keyof typeof updateData)[];
    const values = fields.map(field => updateData[field]);
    values.push(id);

    const stmt = this.db.prepare(
      `UPDATE orders SET ${fields.map(field => `${field} = ?`).join(', ')} WHERE id = ?`
    );
    stmt.run(...values);

    const updatedOrder = await this.getOrder(id);
    if (!updatedOrder) throw new Error('Order not found after update');
    return updatedOrder;
  }

  async getOrder(id: string): Promise<LocalOrder | null> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM orders WHERE id = ?');
    const row = stmt.get(id) as LocalOrder;
    return row || null;
  }

  // ========================================
  // MÉTODOS DE PRODUTOS
  // ========================================

  async createProduct(product: Omit<LocalProduct, 'created_at' | 'updated_at'>): Promise<LocalProduct> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const productData = {
      ...product,
      created_at: now,
      updated_at: now
    };

    const stmt = this.db.prepare(`
      INSERT INTO products (
        id, name, description, category_id, price, cost_price, image_url, sku,
        barcode, is_active, is_available, preparation_time, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      productData.id, productData.name, productData.description, productData.category_id,
      productData.price, productData.cost_price, productData.image_url, productData.sku,
      productData.barcode, productData.is_active ? 1 : 0, productData.is_available ? 1 : 0,
      productData.preparation_time, productData.created_at, productData.updated_at
    );

    return productData;
  }

  async getProducts(): Promise<LocalProduct[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY name');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      ...row,
      is_active: Boolean(row.is_active),
      is_available: Boolean(row.is_available)
    })) as LocalProduct[];
  }

  // ========================================
  // MÉTODOS DE MESAS
  // ========================================

  async createTable(table: Omit<LocalTable, 'created_at' | 'updated_at'>): Promise<LocalTable> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const tableData = {
      ...table,
      created_at: now,
      updated_at: now
    };

    const stmt = this.db.prepare(`
      INSERT INTO tables (
        id, number, name, capacity, status, shape, x_position, y_position,
        width, height, rotation, zone, color, qr_code_url, reservation_enabled,
        min_capacity, max_capacity, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      tableData.id, tableData.number, tableData.name, tableData.capacity,
      tableData.status, tableData.shape, tableData.x_position, tableData.y_position,
      tableData.width, tableData.height, tableData.rotation, tableData.zone,
      tableData.color, tableData.qr_code_url, tableData.reservation_enabled ? 1 : 0,
      tableData.min_capacity, tableData.max_capacity, tableData.created_at, tableData.updated_at
    );

    return tableData;
  }

  async getTables(): Promise<LocalTable[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM tables ORDER BY number');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      ...row,
      reservation_enabled: Boolean(row.reservation_enabled)
    })) as LocalTable[];
  }

  async updateTableStatus(id: string, status: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(
      'UPDATE tables SET status = ?, updated_at = ? WHERE id = ?'
    );
    stmt.run(status, new Date().toISOString(), id);
  }

  // ========================================
  // MÉTODOS DE SINCRONIZAÇÃO
  // ========================================

  async setSyncStatus(tableName: string, status: 'pending' | 'success' | 'error', lastSyncId?: string, errorMessage?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO sync_status (table_name, last_sync_at, last_sync_id, sync_status, error_message)
       VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(tableName, new Date().toISOString(), lastSyncId || null, status, errorMessage || null);
  }

  async getSyncStatus(tableName: string): Promise<{
    last_sync_at: string;
    last_sync_id: string | null;
    sync_status: string;
    error_message: string | null;
  } | null> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM sync_status WHERE table_name = ?');
    const row = stmt.get(tableName) as any;
    return row || null;
  }

  // ========================================
  // MÉTODOS UTILITÁRIOS
  // ========================================

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    this.db.exec('DELETE FROM orders');
    this.db.exec('DELETE FROM products');
    this.db.exec('DELETE FROM tables');
    this.db.exec('DELETE FROM sync_status');

    console.log('✅ All local data cleared');
  }

  async getDatabaseStats(): Promise<{
    orders: number;
    products: number;
    tables: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const ordersStmt = this.db.prepare('SELECT COUNT(*) as count FROM orders');
    const productsStmt = this.db.prepare('SELECT COUNT(*) as count FROM products');
    const tablesStmt = this.db.prepare('SELECT COUNT(*) as count FROM tables');

    const orders = ordersStmt.get() as { count: number };
    const products = productsStmt.get() as { count: number };
    const tables = tablesStmt.get() as { count: number };

    return {
      orders: orders.count,
      products: products.count,
      tables: tables.count
    };
  }
}

// Exportar instância única do serviço
export const sqliteService = new SQLiteService();
