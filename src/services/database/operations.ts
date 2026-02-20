
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { supabase as supabaseClientPromise } from './connection';


import { logger } from '../logger';
import { generateUUID } from '@/utils/uuid';
import { Order, OrderItem, Table, MenuCategory, Dish, CashShift, Expense, Revenue, Fornecedor, User, AttendanceRecord, PayrollRecord, SystemSettings, Customer, Employee, StockItem, LayoutBackup, Reservation, Delivery } from '../../types';


export async function executeQuery(sql: string, params?: any[]): Promise<void>;
export async function executeQuery(supabase: SupabaseClient<Database>, sql: string, params?: any[]): Promise<void>;
export async function executeQuery(supabaseOrSql: SupabaseClient<Database> | string, sqlOrParams?: string | any[], params?: any[]) {
    if (typeof supabaseOrSql === 'string') {
        // Handle case where first arg is sql string (legacy compatibility: executeQuery(sql, params))
        const sql = supabaseOrSql;
        // const parameters = Array.isArray(sqlOrParams) ? sqlOrParams : [];
        const client = await supabaseClientPromise;
        const { error } = await (client as any).rpc('execute_sql', { sql_query: sql }); // Note: parameters are currently ignored by execute_sql RPC wrapper in this codebase
        if (error) throw error;
        return;
    }
    
    // Handle standard case: executeQuery(supabase, sql, params)
    const supabase = supabaseOrSql;
    const sql = sqlOrParams as string;
    // params is the third argument
    
    const { error } = await (supabase as any).rpc('execute_sql', { sql_query: sql });
    if (error) throw error;
}

const selectQuery = async <T>(supabase: SupabaseClient<Database>, sql: string, params?: any[]): Promise<T[]> => {
    const { data, error } = await (supabase as any).rpc('execute_sql', { sql_query: sql });
    if (error) throw error;
    return (data ?? []) as unknown as T[];
};

export const databaseOperations = {
  _handleDatabaseOperation: async <T>(operation: (supabase: SupabaseClient<Database>) => Promise<T>, context: string, functionName: string = 'databaseOperations'): Promise<{ success: boolean; data?: T; error?: string }> => {
    try {
      const client = await supabaseClientPromise;
      const data = await operation(client);
      return { success: true, data };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : (typeof e === 'object' && e !== null && 'message' in e ? (e as any).message : JSON.stringify(e));
      logger.error(`Failed to ${context}`, { error: errorMessage, fullError: e }, functionName);
      return { success: false, error: errorMessage };
    }
  },
  /**
   * Completely clears and recreates menu schema.
   * This is a destructive operation used during full restore/reset.
   */
  restoreFullState: async (data: any): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
        if (data.categories) await databaseOperations.saveCategories(data.categories);
        if (data.dishes) await databaseOperations.saveDishes(data.dishes);
        if (data.products) await databaseOperations.saveDishes(data.products);
        if (data.employees) await databaseOperations.saveEmployees(data.employees);
        if (data.attendance) await databaseOperations.saveAttendance(data.attendance);
        if (data.orders) await databaseOperations.saveOrders(data.orders);
        if (data.expenses) await databaseOperations.saveExpenses(data.expenses);
        if (data.revenues) await databaseOperations.saveRevenues(data.revenues);
        if (data.customers) await databaseOperations.saveCustomers(data.customers);
        if (data.suppliers) await databaseOperations.saveSuppliers(data.suppliers);
        if (data.stock) await databaseOperations.saveStockItems(data.stock);
        if (data.settings) await databaseOperations.saveSettings(data.settings);
        if (data.tables) await databaseOperations.saveTables(data.tables);
        if (data.shifts) await databaseOperations.saveShifts(data.shifts);
        if (data.users) await databaseOperations.saveUsers(data.users);
        if (data.payrollRecords || data.payroll) await databaseOperations.savePayrolls(data.payrollRecords || data.payroll);
        
        return true;
    }, 'restore full state', 'DATABASE');
  },

  recreateMenuSchema: async (): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async (supabase) => {
      // 1. Drop existing tables
      await executeQuery(supabase, 'DROP TABLE IF EXISTS dishes');
      await executeQuery(supabase, 'DROP TABLE IF EXISTS menu_categories');
      await executeQuery(supabase, 'DROP TABLE IF EXISTS suppliers');
      
      // Also drop old tables if they exist
      await executeQuery(supabase, 'DROP TABLE IF EXISTS products');
      await executeQuery(supabase, 'DROP TABLE IF EXISTS categories');
      await executeQuery(supabase, 'DROP TABLE IF EXISTS menu');
      await executeQuery(supabase, 'DROP TABLE IF EXISTS menu_items');
      
      // 2. Recreate Menu Categories Table
      await executeQuery(supabase, `
        CREATE TABLE IF NOT EXISTS menu_categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            icon TEXT,
            sort_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            parent_id TEXT,
            is_available_on_digital_menu BOOLEAN DEFAULT TRUE,
            deleted_at TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 3. Recreate Suppliers Table
      await executeQuery(supabase, `
        CREATE TABLE IF NOT EXISTS suppliers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            nif TEXT,
            contact TEXT,
            email TEXT,
            address TEXT,
            category TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 4. Recreate Dishes Table (Products)
      await executeQuery(supabase, `
        CREATE TABLE IF NOT EXISTS dishes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            cost_price REAL DEFAULT 0,
            category_id TEXT,
            image_url TEXT,
            tax_code TEXT,
            tax_percentage DECIMAL(5,2),
            preparation_time INTEGER,
            is_active BOOLEAN DEFAULT TRUE,
            available BOOLEAN DEFAULT TRUE,
            is_available_on_digital_menu BOOLEAN DEFAULT TRUE,
            track_stock BOOLEAN DEFAULT FALSE,
            stock_quantity REAL DEFAULT 0,
            min_stock_quantity REAL DEFAULT 0,
            max_stock_quantity REAL,
            unit TEXT DEFAULT 'unidade',
            supplier_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(category_id) REFERENCES menu_categories(id) ON DELETE SET NULL,
            FOREIGN KEY(supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
        )
      `);
      
      logger.info('Database menu schema recreated successfully.', undefined, 'DATABASE');
      return true;
    }, 'recreate menu schema', 'DATABASE');
    return result.success;
  },



  /**
   * Verifies if the database is empty of menu data.
   */
  isMenuDataEmpty: async (): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async (supabase) => {
        const products = await selectQuery<{count: number}>(supabase, 'SELECT COUNT(*) as count FROM dishes');
        const categories = await selectQuery<{count: number}>(supabase, 'SELECT COUNT(*) as count FROM menu_categories');
        
        const pCount = products?.[0]?.count || 0;
        const cCount = categories?.[0]?.count || 0;
        
        return pCount === 0 && cCount === 0;
    }, 'check menu data emptiness', 'DATABASE');
    return result.success && result.data !== undefined ? result.data : false;
  },

  /**
   * Recreates the tables schema (restaurant layout).
   */
  recreateTableSchema: async (): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async (supabase) => {
        // Drop tables first to ensure clean state
        await executeQuery(supabase, 'DROP TABLE IF EXISTS order_items');
        await executeQuery(supabase, 'DROP TABLE IF EXISTS orders');
        await executeQuery(supabase, 'DROP TABLE IF EXISTS restaurant_tables');

        await executeQuery(supabase, `
            CREATE TABLE IF NOT EXISTS restaurant_tables (
                id TEXT PRIMARY KEY, 
                number INTEGER NOT NULL, 
                name TEXT, 
                seats INTEGER, 
                status TEXT DEFAULT 'available', 
                x REAL DEFAULT 0, 
                y REAL DEFAULT 0, 
                width INTEGER DEFAULT 1,
                height INTEGER DEFAULT 1,
                zone TEXT DEFAULT 'INTERIOR', 
                shape TEXT, 
                rotation INTEGER,
                group_id TEXT,
                label TEXT,
                color TEXT,
                user_id TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await executeQuery(supabase, `
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                table_id TEXT,
                status TEXT DEFAULT 'ABERTO',
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                total REAL DEFAULT 0,
                tax_total REAL DEFAULT 0,
                payment_method TEXT,
                customer_id TEXT,
                shift_id TEXT,
                sub_account_name TEXT,
                invoice_number TEXT,
                hash TEXT,
                previous_hash TEXT,
                signature TEXT,
                jws_payload TEXT,
                is_synced_agt INTEGER DEFAULT 0,
                agt_submission_uuid TEXT,
                user_id TEXT,
                user_name TEXT,
                customer_nif TEXT,
                customer_name TEXT,
                notes TEXT,
                closed_at DATETIME,
                split_payments TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await executeQuery(supabase, `
            CREATE TABLE IF NOT EXISTS order_items (
                id TEXT PRIMARY KEY,
                order_id TEXT NOT NULL,
                dish_id TEXT NOT NULL,
                quantity REAL DEFAULT 1,
                unit_price REAL NOT NULL,
                tax_amount REAL DEFAULT 0,
                tax_percentage REAL DEFAULT 14.0,
                tax_code TEXT DEFAULT 'NOR',
                notes TEXT,
                status TEXT DEFAULT 'PENDENTE',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(order_id) REFERENCES orders(id)
            )
        `);
        
        // Create backups table
        await executeQuery(supabase, `
            CREATE TABLE IF NOT EXISTS layout_backups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                layout_data TEXT NOT NULL,
                user_id TEXT
            )
        `);

        return true;
    }, 'recreate table schema', 'DATABASE');
    return result.success;
  },

  getCategories: async (): Promise<{ success: boolean; data: MenuCategory[]; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
        const rows = await selectQuery<MenuCategory>(supabase, 'SELECT * FROM menu_categories ORDER BY sort_order ASC');
        return rows.map(r => ({
            id: r.id,
            name: r.name,
            icon: r.icon,
            sortOrder: r.sortOrder || (r as any).sort_order || 0,
            isActive: r.isActive || (r as any).is_active || true,
            parentId: r.parentId || (r as any).parent_id || null,
            isAvailableOnDigitalMenu: r.isAvailableOnDigitalMenu || (r as any).is_available_on_digital_menu || true
        }));
    }, 'get categories', 'DATABASE') as Promise<{ success: boolean; data: MenuCategory[]; error?: string }>;
  },

  saveProduct: async (product: Dish): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
        await executeQuery(supabase, `
            CREATE TABLE IF NOT EXISTS dishes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                cost_price REAL DEFAULT 0,
                category_id TEXT,
                image_url TEXT,
                tax_code TEXT,
                tax_percentage DECIMAL(5,2),
                preparation_time INTEGER,
                is_active BOOLEAN DEFAULT TRUE,
                available BOOLEAN DEFAULT TRUE,
                is_available_on_digital_menu BOOLEAN DEFAULT TRUE,
                track_stock BOOLEAN DEFAULT FALSE,
                stock_quantity REAL DEFAULT 0,
                min_stock_quantity REAL DEFAULT 0,
                max_stock_quantity REAL,
                unit TEXT DEFAULT 'unidade',
                supplier_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await executeQuery(supabase, 
            'INSERT OR REPLACE INTO dishes (id, name, description, price, cost_price, category_id, image_url, tax_code, tax_percentage, preparation_time, is_active, available, is_available_on_digital_menu, track_stock, stock_quantity, min_stock_quantity, max_stock_quantity, unit, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                product.id,
                product.name,
                product.description || null,
                product.price,
                product.costPrice || (product as any).cost_price || 0,
                product.categoryId || (product as any).category_id || null,
                product.image || (product as any).image_url || null,
                product.taxCode || (product as any).tax_code || null,
                product.taxPercentage || (product as any).tax_percentage || null,
                product.preparationTime || (product as any).preparation_time || null,
                product.isActive ? 1 : 0,
                product.available ? 1 : 0,
                product.isAvailableOnDigitalMenu ? 1 : 0,
                product.trackStock ? 1 : 0,
                product.stockQuantity || (product as any).stock_quantity || 0,
                product.minStockQuantity || (product as any).min_stock_quantity || 0,
                product.maxStockQuantity || (product as any).max_stock_quantity || null,
                product.unit || 'unidade',
                product.supplierId || (product as any).supplier_id || null
            ]
        );
        return true;
    }, `save product ${product.id}`, 'DATABASE');
  },

  saveDish: async (dish: Dish) => databaseOperations.saveProduct(dish),
  saveProducts: async (products: Dish[]) => databaseOperations.saveDishes(products),
  
  saveCategory: async (category: MenuCategory): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
        await executeQuery(supabase, `
            CREATE TABLE IF NOT EXISTS menu_categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                icon TEXT,
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                parent_id TEXT,
                is_available_on_digital_menu BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await executeQuery(supabase, 
            'INSERT OR REPLACE INTO menu_categories (id, name, icon, sort_order, is_active, parent_id, is_available_on_digital_menu) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                category.id,
                category.name,
                category.icon,
                category.sortOrder || (category as any).sort_order || 0,
                category.isActive ? 1 : 0,
                category.parentId || (category as any).parent_id || null,
                category.isAvailableOnDigitalMenu ? 1 : 0
            ]
        );
        return true;
    }, `save category ${category.id}`, 'DATABASE');
  },

  deleteDish: async (id: string): Promise<{ success: boolean; error?: string }> => {
      return databaseOperations._handleDatabaseOperation(async (supabase) => {
          await executeQuery(supabase, 'DELETE FROM dishes WHERE id = ?', [id]);
          return true;
      }, `delete dish ${id}`, 'DATABASE');
  },

  deleteCategory: async (id: string): Promise<{ success: boolean; error?: string }> => {
      return databaseOperations._handleDatabaseOperation(async (supabase) => {
          await executeQuery(supabase, 'DELETE FROM menu_categories WHERE id = ?', [id]);
          return true;
      }, `delete category ${id}`, 'DATABASE');
  },
  
  saveDishes: async (dishes: Dish[]): Promise<{ success: boolean; error?: string }> => {
      for (const dish of dishes) {
          const result = await databaseOperations.saveDish(dish);
          if (!result.success) return result;
      }
      return { success: true };
  },

  saveCategories: async (categories: MenuCategory[]): Promise<{ success: boolean; error?: string }> => {
      for (const category of categories) {
          const result = await databaseOperations.saveCategory(category);
          if (!result.success) return result;
      }
      return { success: true };
  },

  getDishes: async (): Promise<{ success: boolean; data: Dish[]; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
        const rows = await selectQuery<Dish>(supabase, 'SELECT * FROM dishes');
        return rows.map(r => ({
            id: r.id,
            name: r.name,
            description: r.description,
            price: r.price,
            costPrice: r.costPrice || (r as any).cost_price || 0,
            categoryId: r.categoryId || (r as any).category_id,
            image: r.image || (r as any).image_url,
            taxCode: r.taxCode || (r as any).tax_code,
            taxPercentage: r.taxPercentage || (r as any).tax_percentage,
            preparationTime: r.preparationTime || (r as any).preparation_time,
            isActive: r.isActive || (r as any).is_active || true,
            available: r.available || true,
            isAvailableOnDigitalMenu: r.isAvailableOnDigitalMenu || (r as any).is_available_on_digital_menu || true,
            trackStock: r.trackStock || (r as any).track_stock || false,
            stockQuantity: r.stockQuantity || (r as any).stock_quantity || 0,
            minStockQuantity: r.minStockQuantity || (r as any).min_stock_quantity || 0,
            maxStockQuantity: r.maxStockQuantity || (r as any).max_stock_quantity,
            unit: r.unit || 'unidade',
            supplierId: r.supplierId || (r as any).supplier_id
        }));
    }, 'get dishes', 'DATABASE') as Promise<{ success: boolean; data: Dish[]; error?: string }>;
  },

  saveExpense: async (expense: Expense): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
        await executeQuery(supabase, `
            CREATE TABLE IF NOT EXISTS expenses (
                id TEXT PRIMARY KEY,
                description TEXT,
                amount REAL,
                date DATETIME,
                category TEXT,
                payment_method TEXT,
                supplier_id TEXT,
                paid BOOLEAN DEFAULT TRUE,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await executeQuery(supabase, 
            'INSERT OR REPLACE INTO expenses (id, description, amount, date, category, payment_method, supplier_id, paid, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                expense.id,
                expense.description,
                expense.amount,
                (expense.date as any) instanceof Date ? (expense.date as Date).toISOString() : expense.date,
                expense.category,
                expense.paymentMethod || (expense as any).payment_method || null,
                expense.supplierId || (expense as any).supplier_id || null,
                expense.paid ? 1 : 0,
                expense.notes || null
            ]
        );
        return true;
    }, `save expense ${expense.id}`, 'DATABASE');
  },

  saveExpenses: async (expenses: Expense[]): Promise<{ success: boolean; error?: string }> => {
      for (const expense of expenses) {
          const result = await databaseOperations.saveExpense(expense);
          if (!result.success) return result;
      }
      return { success: true };
  },

  saveRevenue: async (revenue: Revenue): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
        await executeQuery(supabase, `
            CREATE TABLE IF NOT EXISTS revenues (
                id TEXT PRIMARY KEY,
                description TEXT,
                amount REAL,
                date DATETIME,
                category TEXT,
                payment_method TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await executeQuery(supabase, 
            'INSERT OR REPLACE INTO revenues (id, description, amount, date, category, payment_method) VALUES (?, ?, ?, ?, ?, ?)',
            [
                revenue.id,
                revenue.description,
                revenue.amount,
                revenue.date instanceof Date ? revenue.date.toISOString() : revenue.date,
                revenue.category,
                revenue.paymentMethod || (revenue as any).payment_method || null
            ]
        );
        return true;
    }, `save revenue ${revenue.id}`, 'DATABASE');
  },

  saveRevenues: async (revenues: Revenue[]): Promise<{ success: boolean; error?: string }> => {
      for (const revenue of revenues) {
          const result = await databaseOperations.saveRevenue(revenue);
          if (!result.success) return result;
      }
      return { success: true };
  },

  saveOrder: async (order: Order): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async (supabase) => {
        // Ensure table exists with correct schema before saving
        await executeQuery(supabase, `
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                table_id TEXT,
                status TEXT DEFAULT 'ABERTO',
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                total REAL DEFAULT 0,
                tax_total REAL DEFAULT 0,
                payment_method TEXT,
                customer_id TEXT,
                shift_id TEXT,
                sub_account_name TEXT,
                invoice_number TEXT,
                hash TEXT,
                previous_hash TEXT,
                signature TEXT,
                jws_payload TEXT,
                is_synced_agt INTEGER DEFAULT 0,
                agt_submission_uuid TEXT,
                user_id TEXT,
                user_name TEXT
            )
        `);

        await executeQuery(supabase, 
            'INSERT OR REPLACE INTO orders (id, table_id, status, timestamp, total, tax_total, payment_method, customer_id, shift_id, sub_account_name, invoice_number, hash, previous_hash, signature, jws_payload, is_synced_agt, agt_submission_uuid, user_id, user_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                order.id, 
                (order as any).table_id, 
                order.status, 
                order.timestamp instanceof Date ? order.timestamp.toISOString() : order.timestamp, 
                order.total, 
                (order as any).tax_total || 0,
                (order as any).payment_method || null,
                (order as any).customer_id || null,
                (order as any).shift_id || null,
                (order as any).sub_account_name || null, 
                (order as any).invoice_number || null,
                order.hash || null,
                order.previous_hash || null,
                (order as any).signature || null,
                order.jws_payload ? (typeof order.jws_payload === 'string' ? order.jws_payload : JSON.stringify(order.jws_payload)) : null,
                order.is_synced_agt ? 1 : 0,
                order.agt_submission_uuid || null,
                (order as any).user_id || null,
                (order as any).user_name || null
            ]
        );

        if (order.items && order.items.length > 0) {
            // Ensure order_items table exists with correct schema
            await executeQuery(supabase, `
                CREATE TABLE IF NOT EXISTS order_items (
                    id TEXT PRIMARY KEY,
                    order_id TEXT NOT NULL,
                    dish_id TEXT NOT NULL,
                    quantity INTEGER DEFAULT 1,
                    unit_price REAL NOT NULL,
                    tax_amount REAL DEFAULT 0,
                    tax_percentage REAL DEFAULT 14.0,
                    tax_code TEXT DEFAULT 'NOR',
                    notes TEXT,
                    status TEXT DEFAULT 'PENDENTE',
                    FOREIGN KEY(order_id) REFERENCES orders(id)
                )
            `);

            // Clear existing items for this order to avoid duplicates on replace
            await executeQuery(supabase, 'DELETE FROM order_items WHERE order_id = ?', [order.id]);
            for (const item of order.items) {
                await executeQuery(supabase, 
                    'INSERT INTO order_items (id, order_id, dish_id, quantity, unit_price, tax_amount, tax_percentage, tax_code, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                      item.id || generateUUID(),
                    order.id, 
                    (item as any).dish_id, 
                    item.quantity, 
                    (item as any).unit_price || 0, 
                    (item as any).tax_amount || 0, 
                    (item as any).tax_percentage || 14, 
                    (item as any).tax_code || 'NOR', 
                    item.notes || null, 
                    item.status || 'PENDENTE'
                    ]
                );
            }
        }
        return true;
    }, `save order ${order.id}`, 'DATABASE');
    return result.success;
  },

  saveOrders: async (orders: Order[]): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async (supabase) => {
      if (orders.length === 0) return true;

      await executeQuery(supabase, `
          CREATE TABLE IF NOT EXISTS orders (
              id TEXT PRIMARY KEY,
              table_id TEXT,
              status TEXT DEFAULT 'ABERTO',
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
              total REAL DEFAULT 0,
              tax_total REAL DEFAULT 0,
              payment_method TEXT,
              customer_id TEXT,
              shift_id TEXT,
              sub_account_name TEXT,
              invoice_number TEXT,
              hash TEXT,
              previous_hash TEXT,
              signature TEXT,
              jws_payload TEXT,
              is_synced_agt INTEGER DEFAULT 0,
              agt_submission_uuid TEXT,
              user_id TEXT,
              user_name TEXT
          )
      `);

      await executeQuery(supabase, `
          CREATE TABLE IF NOT EXISTS order_items (
              id TEXT PRIMARY KEY,
              order_id TEXT NOT NULL,
              dish_id TEXT NOT NULL,
              quantity INTEGER DEFAULT 1,
              unit_price REAL NOT NULL,
              tax_amount REAL DEFAULT 0,
              tax_percentage REAL DEFAULT 14.0,
              tax_code TEXT DEFAULT 'NOR',
              notes TEXT,
              status TEXT DEFAULT 'PENDENTE',
              FOREIGN KEY(order_id) REFERENCES orders(id)
          )
      `);

      await executeQuery(supabase, 'BEGIN TRANSACTION');
      try {
        for (const order of orders) {
          await executeQuery(supabase, 
            'INSERT OR REPLACE INTO orders (id, table_id, status, timestamp, total, tax_total, payment_method, customer_id, shift_id, sub_account_name, invoice_number, hash, previous_hash, signature, jws_payload, is_synced_agt, agt_submission_uuid, user_id, user_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                order.id, 
                order.tableId || (order as any).table_id, 
                order.status, 
                order.timestamp instanceof Date ? order.timestamp.toISOString() : order.timestamp, 
                order.total, 
                order.taxTotal || (order as any).tax_total || 0,
                order.paymentMethod || (order as any).payment_method || null,
                order.customerId || (order as any).customer_id || null,
                order.shiftId || (order as any).shift_id || null,
                order.subAccountName || (order as any).sub_account_name || null, 
                order.invoiceNumber || (order as any).invoice_number || null,
                order.hash || null,
                order.previous_hash || null,
                (order as any).signature || null,
                order.jws_payload ? (typeof order.jws_payload === 'string' ? order.jws_payload : JSON.stringify(order.jws_payload)) : null,
                order.is_synced_agt ? 1 : 0,
                order.agt_submission_uuid || null,
                order.userId || (order as any).user_id || null,
                order.userName || (order as any).user_name || null
            ]
          );

          // Clear existing items
          await executeQuery(supabase, 'DELETE FROM order_items WHERE order_id = ?', [order.id]);
          
          if (order.items && order.items.length > 0) {
            for (const item of order.items) {
                await executeQuery(supabase, 
                    'INSERT INTO order_items (id, order_id, dish_id, quantity, unit_price, tax_amount, tax_percentage, tax_code, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          item.id || generateUUID(),
          order.id, 
          item.dishId || (item as any).dish_id, 
          item.quantity, 
          item.price || (item as any).unit_price || (item as any).price || 0, 
          item.taxAmount || (item as any).tax_amount || 0, 
          item.taxPercentage || (item as any).tax_percentage || 14, 
          item.taxCode || (item as any).tax_code || 'NOR', 
          item.notes || null, 
          item.status || 'PENDENTE'
        ]
                );
            }
          }
        }
        await executeQuery(supabase, 'COMMIT');
        return true;
      } catch (e: unknown) {
        await executeQuery(supabase, 'ROLLBACK');
        throw e;
      }
    }, `save ${orders.length} orders batch`, 'DATABASE');
    return result.success;
  },

  saveShift: async (shift: CashShift): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
      await executeQuery(supabase, `
        CREATE TABLE IF NOT EXISTS cash_shifts (
          id TEXT PRIMARY KEY, 
          user_id TEXT, 
          user_name TEXT, 
          start_time TEXT, 
          end_time TEXT, 
          opening_balance REAL, 
          closing_balance REAL, 
          expected_balance REAL, 
          status TEXT
        )
      `);
      await executeQuery(supabase, 
        'INSERT OR REPLACE INTO cash_shifts (id, user_id, user_name, start_time, end_time, opening_balance, closing_balance, expected_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          shift.id, 
          shift.userId || (shift as any).user_id || null, 
          shift.userName || (shift as any).user_name || null, 
          shift.startTime instanceof Date ? shift.startTime.toISOString() : (shift.startTime || (shift as any).start_time || new Date().toISOString()), 
          shift.endTime instanceof Date ? shift.endTime.toISOString() : (shift.endTime || (shift as any).end_time || null), 
          shift.openingBalance || (shift as any).opening_balance || 0, 
          shift.closingBalance || (shift as any).closing_balance || 0, 
          shift.expectedBalance || (shift as any).expected_balance || 0, 
          shift.status || 'FECHADO'
        ]
      );
      return true;
    }, `save shift ${shift.id}`, 'DATABASE');
  },

  saveShifts: async (shifts: CashShift[]): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
      if (shifts.length === 0) return true;

      await executeQuery(supabase, `
        CREATE TABLE IF NOT EXISTS cash_shifts (
          id TEXT PRIMARY KEY, 
          user_id TEXT, 
          user_name TEXT, 
          start_time TEXT, 
          end_time TEXT, 
          opening_balance REAL, 
          closing_balance REAL, 
          expected_balance REAL, 
          status TEXT
        )
      `);
      
      await executeQuery(supabase, 'BEGIN TRANSACTION');
      try {
        for (const shift of shifts) {
          await executeQuery(supabase, 
            'INSERT OR REPLACE INTO cash_shifts (id, user_id, user_name, start_time, end_time, opening_balance, closing_balance, expected_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              shift.id, 
              shift.userId || (shift as any).user_id || null, 
              shift.userName || (shift as any).user_name || null, 
              shift.startTime instanceof Date ? shift.startTime.toISOString() : (shift.startTime || (shift as any).start_time || new Date().toISOString()), 
              shift.endTime instanceof Date ? shift.endTime.toISOString() : (shift.endTime || (shift as any).end_time || null), 
              shift.openingBalance || (shift as any).opening_balance || 0, 
              shift.closingBalance || (shift as any).closing_balance || 0, 
              shift.expectedBalance || (shift as any).expected_balance || 0, 
              shift.status || 'FECHADO'
            ]
          );
        }
        await executeQuery(supabase, 'COMMIT');
        return true;
      } catch (e: unknown) {
        await executeQuery(supabase, 'ROLLBACK');
        throw e;
      }
    }, `save ${shifts.length} shifts batch`, 'DATABASE');
  },
  
  saveDishesBatch: async (dishes: Dish[]): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async (supabase) => {
      if (dishes.length === 0) return true;

      await executeQuery(supabase, 'BEGIN TRANSACTION');
      try {
        for (const dish of dishes) {
          await executeQuery(supabase, 
            'INSERT OR REPLACE INTO dishes (id, name, description, price, cost_price, category_id, image_url, tax_code, tax_percentage, preparation_time, is_active, available, is_available_on_digital_menu, track_stock, stock_quantity, min_stock_quantity, max_stock_quantity, unit, supplier_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              dish.id,
              dish.name,
              dish.description,
              dish.price,
              (dish as any).cost_price || 0,
              (dish as any).category_id,
              (dish as any).image_url,
              (dish as any).tax_code,
              (dish as any).tax_percentage,
              (dish as any).preparation_time,
              dish.is_active,
              dish.available,
              dish.is_available_on_digital_menu,
              dish.track_stock,
              dish.stock_quantity,
              dish.min_stock_quantity,
              dish.max_stock_quantity,
              dish.unit,
              (dish as any).supplier_id,
              (dish.created_at as any) instanceof Date ? (dish.created_at as any).toISOString() : dish.created_at,
              (dish.updated_at as any) instanceof Date ? (dish.updated_at as any).toISOString() : dish.updated_at,
            ]
          );
        }
        await executeQuery(supabase, 'COMMIT');
        return true;
      } catch (e: unknown) {
        await executeQuery(supabase, 'ROLLBACK');
        throw e;
      }
    }, `save ${dishes.length} dishes batch`, 'DATABASE');
    return result.success;
  },

  getStockItems: async (): Promise<StockItem[]> => {
    const result = await databaseOperations._handleDatabaseOperation(async (supabase) => {
      const { data, error } = await supabase.from('stock_items').select('*');
      if (error) throw error;
      return data as StockItem[];
    }, 'get stock items', 'DATABASE');
    return result.success ? (result.data || []) : [];
  },

  saveTable: async (table: Table): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
      const { activeOrderIds, ...dbTable } = table;
      const { error } = await supabase.from('restaurant_tables').upsert(dbTable);
      if (error) throw error;
      return true;
    }, 'save table');
  },

  deleteTable: async (id: string): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
      const { error } = await supabase.from('restaurant_tables').delete().eq('id', id);
      if (error) throw error;
      return true;
    }, 'delete table');
  },

  saveCustomer: async (customer: Customer): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
      const { error } = await supabase.from('customers').upsert(customer);
      if (error) throw error;
      return true;
    }, 'save customer');
  },
  
  saveCustomers: async (customers: Customer[]): Promise<{ success: boolean; error?: string }> => {
      for (const customer of customers) {
          const result = await databaseOperations.saveCustomer(customer);
          if (!result.success) return result;
      }
      return { success: true };
  },

  deleteCustomer: async (id: string): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      return true;
    }, 'delete customer');
  },

  saveReservation: async (reservation: Reservation): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
      const dbReservation = {
        id: reservation.id,
        table_id: reservation.tableId,
        customer_name: reservation.customerName,
        customer_phone: reservation.customerPhone,
        date: reservation.date instanceof Date ? reservation.date.toISOString() : reservation.date,
        time: reservation.time,
        guests: reservation.guests,
        status: reservation.status,
        notes: reservation.notes,
        created_at: reservation.createdAt instanceof Date ? reservation.createdAt.toISOString() : new Date().toISOString(),
        updated_at: reservation.updatedAt instanceof Date ? reservation.updatedAt.toISOString() : new Date().toISOString()
      };
      const { error } = await supabase.from('reservations').upsert(dbReservation);
      if (error) throw error;
      return true;
    }, 'save reservation');
  },

  deleteReservation: async (id: string): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
      const { error } = await supabase.from('reservations').delete().eq('id', id);
      if (error) throw error;
      return true;
    }, 'delete reservation');
  },

  saveStockItem: async (item: StockItem): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
      const dbItem = {
        ...item,
        min_threshold: item.minThreshold ?? item.min_threshold,
        created_at: item.createdAt instanceof Date ? item.createdAt.toISOString() : (item.created_at || new Date().toISOString()),
        updated_at: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : (item.updated_at || new Date().toISOString())
      };
      const { error } = await supabase.from('stock_items').upsert(dbItem);
      if (error) throw error;
      return true;
    }, 'save stock item');
  },
  
  saveStockItems: async (items: StockItem[]): Promise<{ success: boolean; error?: string }> => {
      for (const item of items) {
          const result = await databaseOperations.saveStockItem(item);
          if (!result.success) return result;
      }
      return { success: true };
  },

  deleteStockItem: async (id: string): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
      const { error } = await supabase.from('stock_items').delete().eq('id', id);
      if (error) throw error;
      return true;
    }, 'delete stock item');
  },

  saveDelivery: async (delivery: Delivery): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
      const dbDelivery = {
        id: delivery.id,
        order_id: delivery.orderId || delivery.order_id,
        driver_name: delivery.driverName || delivery.driver_name,
        status: delivery.status,
        address: delivery.address,
        customer_name: delivery.customerName || delivery.customer_name,
        customer_phone: delivery.customerPhone || delivery.customer_phone,
        start_time: delivery.startTime instanceof Date ? delivery.startTime.toISOString() : delivery.startTime || delivery.start_time,
        end_time: delivery.endTime instanceof Date ? delivery.endTime.toISOString() : delivery.endTime || delivery.end_time
      };
      const { error } = await supabase.from('deliveries').upsert(dbDelivery);
      if (error) throw error;
      return true;
    }, 'save delivery');
  },

  deleteDelivery: async (id: string): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
      const { error } = await supabase.from('deliveries').delete().eq('id', id);
      if (error) throw error;
      return true;
    }, 'delete delivery');
  },

  saveSettings: async (settings: SystemSettings): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
      const dbSettings = {
        id: settings.id,
        restaurant_name: settings.restaurantName || settings.restaurant_name,
        nif: settings.nif,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        tax_percentage: settings.taxPercentage || settings.tax_percentage,
        currency: settings.currency,
        timezone: settings.timezone,
        language: settings.language,
        supabase_config: settings.supabaseConfig || settings.supabase_config,
        printer_config: settings.printerConfig || settings.printer_config,
        backup_config: settings.backupConfig || settings.backup_config,
        app_logo_url: settings.appLogoUrl || settings.app_logo_url,
        agt_certificate: settings.agtCertificate || settings.agt_certificate,
        open_drawer_code: settings.openDrawerCode || settings.open_drawer_code,
        admin_pin: settings.adminPin || settings.admin_pin,
        api_token: settings.apiToken || settings.api_token,
        wifi_name: settings.wifi_name,
        wifi_password: settings.wifi_password,
        qr_code_title: settings.qr_code_title,
        qr_code_subtitle: settings.qr_code_subtitle,
        qr_code_short_code: settings.qr_code_short_code,
        qr_menu_url: settings.qr_menu_url,
        qr_menu_cloud_url: settings.qr_menu_cloud_url,
        logo_url: settings.logo_url,
        name: settings.name
      };
      const { error } = await supabase.from('settings').upsert(dbSettings);
      if (error) {
        // Fallback: If currency column is missing, try saving without it
        if (error.message?.includes('currency') || error.details?.includes('currency')) {
            logger.warn('Currency column missing in settings table, retrying without it', { error: error.message }, 'DATABASE');
            const { currency, ...settingsWithoutCurrency } = dbSettings;
            const { error: retryError } = await supabase.from('settings').upsert(settingsWithoutCurrency);
            if (retryError) throw retryError;
            return true;
        }
        throw error;
      }
      return true;
    }, 'save settings');
  },

  saveSupplier: async (supplier: Fornecedor): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async (supabase) => {
      const { error } = await supabase.from('suppliers').upsert(supplier);
      if (error) throw error;
      return true;
    }, 'save supplier');
    return result.success;
  },
  
  saveSuppliers: async (suppliers: Fornecedor[]): Promise<{ success: boolean; error?: string }> => {
      for (const supplier of suppliers) {
          const result = await databaseOperations.saveSupplier(supplier);
          if (!result) return { success: false, error: 'Failed to save supplier' };
      }
      return { success: true };
  },

  saveEmployees: async (employees: Employee[]): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
      const dbEmployees = employees.map(e => ({
        ...e,
        admission_date: e.admissionDate instanceof Date ? e.admissionDate.toISOString() : (e.admissionDate || e.admission_date),
        social_security_number: e.socialSecurityNumber || e.social_security_number,
        bank_account: e.bankAccount || e.bank_account,
        is_active: e.isActive ?? e.is_active,
        created_at: e.createdAt instanceof Date ? e.createdAt.toISOString() : (e.createdAt || e.created_at || new Date().toISOString()),
        updated_at: e.updatedAt instanceof Date ? e.updatedAt.toISOString() : (e.updatedAt || e.updated_at || new Date().toISOString())
      }));
      const { error } = await supabase.from('employees').upsert(dbEmployees);
      if (error) throw error;
      return true;
    }, 'save employees');
  },

  deleteEmployee: async (id: string): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async (supabase) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      return true;
    }, 'delete employee');
    return result.success;
  },

  saveAttendance: async (records: AttendanceRecord[]): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
      const dbRecords = records.map(r => ({
        ...r,
        date: r.date || (r.clockIn instanceof Date ? r.clockIn.toISOString().split('T')[0] : (typeof r.clockIn === 'string' ? r.clockIn.split('T')[0] : new Date().toISOString().split('T')[0])),
        employee_id: r.employeeId || r.employee_id,
        clock_in: r.clockIn instanceof Date ? r.clockIn.toISOString() : (r.clockIn || r.clock_in),
        clock_out: r.clockOut instanceof Date ? r.clockOut.toISOString() : (r.clockOut || r.clock_out),
        clock_in_method: r.clockInMethod || r.clock_in_method,
        clock_out_method: r.clockOutMethod || r.clock_out_method,
        total_hours: r.totalHours || r.total_hours,
        is_late: r.isLate ?? r.is_late,
        late_minutes: r.lateMinutes || r.late_minutes,
        overtime_hours: r.overtimeHours || r.overtime_hours,
        is_absence: r.isAbsence ?? r.is_absence,
        created_at: r.createdAt instanceof Date ? r.createdAt.toISOString() : (r.createdAt || r.created_at || new Date().toISOString())
      }));
      const { error } = await supabase.from('attendance_records').upsert(dbRecords);
      if (error) throw error;
      return true;
    }, 'save attendance');
  },
  
  saveUsers: async (users: User[]): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
        // Users are typically handled by Supabase Auth, but if we have a users table:
        // We'll assume a 'profiles' or 'users' table exists for application data
        const { error } = await (supabase as any).from('profiles').upsert(users.map(u => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            pin: u.pin
        })));
        if (error) throw error;
        return true;
    }, 'save users');
  },
  
  saveTables: async (tables: Table[]): Promise<{ success: boolean; error?: string }> => {
      for (const table of tables) {
          const result = await databaseOperations.saveTable(table);
          if (!result.success) return result;
      }
      return { success: true };
  },
  
  savePayrolls: async (payrolls: PayrollRecord[]): Promise<{ success: boolean; error?: string }> => {
      // Assuming a payrolls table exists
      return databaseOperations._handleDatabaseOperation(async (supabase) => {
        const { error } = await supabase.from('payroll_records').upsert(payrolls.map(p => ({
            id: p.id,
            employee_id: p.employeeId || (p as any).employee_id,
            month: p.month,
            year: p.year,
            base_salary: p.baseSalary || (p as any).base_salary || 0,
            amount: p.amount,
            date: p.date instanceof Date ? p.date.toISOString() : p.date,
            created_at: (p as any).created_at || (p as any).createdAt || new Date().toISOString()
        })));
        if (error) throw error;
        return true;
      }, 'save payrolls');
  },
  
  clearAllData: async (): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
        const tables = [
            'order_items', 'orders', 'dishes', 'menu_categories', 'suppliers', 
            'expenses', 'revenues', 'customers', 'employees', 'attendance_records',
            'stock_items', 'cash_shifts', 'reservations', 'deliveries', 'payroll_records'
        ];
        
        for (const table of tables) {
            await executeQuery(supabase, `DELETE FROM ${table}`);
        }
        return true;
    }, 'clear all data', 'DATABASE');
  }
}
