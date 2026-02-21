
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
      await executeQuery(supabase, 'DROP TABLE IF EXISTS dishes CASCADE');
      await executeQuery(supabase, 'DROP TABLE IF EXISTS menu_categories CASCADE');
      await executeQuery(supabase, 'DROP TABLE IF EXISTS suppliers CASCADE');
      
      // Also drop old tables if they exist
      await executeQuery(supabase, 'DROP TABLE IF EXISTS products CASCADE');
      await executeQuery(supabase, 'DROP TABLE IF EXISTS categories CASCADE');
      await executeQuery(supabase, 'DROP TABLE IF EXISTS menu CASCADE');
      await executeQuery(supabase, 'DROP TABLE IF EXISTS menu_items CASCADE');
      
      // 2. Recreate Menu Categories Table (Postgres syntax)
      await executeQuery(supabase, `
        CREATE TABLE IF NOT EXISTS menu_categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            icon TEXT,
            sort_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            parent_id TEXT,
            is_available_on_digital_menu BOOLEAN DEFAULT TRUE,
            deleted_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
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
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 4. Recreate Dishes Table (Products)
      await executeQuery(supabase, `
        CREATE TABLE IF NOT EXISTS dishes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price NUMERIC NOT NULL,
            cost_price NUMERIC DEFAULT 0,
            category_id TEXT,
            image_url TEXT,
            tax_code TEXT,
            tax_percentage NUMERIC(5,2),
            preparation_time INTEGER,
            is_active BOOLEAN DEFAULT TRUE,
            available BOOLEAN DEFAULT TRUE,
            is_available_on_digital_menu BOOLEAN DEFAULT TRUE,
            track_stock BOOLEAN DEFAULT FALSE,
            stock_quantity NUMERIC DEFAULT 0,
            min_stock_quantity NUMERIC DEFAULT 0,
            max_stock_quantity NUMERIC,
            unit TEXT DEFAULT 'unidade',
            supplier_id TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(category_id) REFERENCES menu_categories(id) ON DELETE SET NULL,
            FOREIGN KEY(supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
        )
      `);
      
      logger.info('Database menu schema recreated successfully (Postgres).', undefined, 'DATABASE');
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
        logger.debug('Fetching categories from Supabase', undefined, 'DATABASE');
        const { data, error } = await supabase
            .from('menu_categories')
            .select('*')
            .order('sort_order', { ascending: true });
        
        if (error) throw error;
        
        logger.debug(`Fetched ${data?.length || 0} categories`, undefined, 'DATABASE');
        
        return (data || []).map(r => ({
            id: r.id,
            name: r.name,
            icon: r.icon,
            sortOrder: r.sort_order || 0,
            isActive: r.is_active ?? true,
            parentId: r.parent_id || null,
            isAvailableOnDigitalMenu: r.is_available_on_digital_menu ?? true
        }));
    }, 'get categories', 'DATABASE') as Promise<{ success: boolean; data: MenuCategory[]; error?: string }>;
  },

  saveProduct: async (product: Dish): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
        logger.debug(`Saving product ${product.id}`, { product }, 'DATABASE');
        
        const dbProduct = {
            id: product.id,
            name: product.name,
            description: product.description || null,
            price: product.price,
            cost_price: product.costPrice || 0,
            category_id: product.categoryId || null,
            image_url: product.image || null,
            tax_code: product.taxCode || null,
            tax_percentage: product.taxPercentage || null,
            preparation_time: product.preparationTime || null,
            is_active: product.isActive ?? true,
            available: product.available ?? true,
            is_available_on_digital_menu: product.isAvailableOnDigitalMenu ?? true,
            track_stock: product.trackStock ?? false,
            stock_quantity: product.stockQuantity || 0,
            min_stock_quantity: product.minStockQuantity || 0,
            max_stock_quantity: product.maxStockQuantity || null,
            unit: product.unit || 'unidade',
            supplier_id: product.supplierId || null,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('dishes')
            .upsert(dbProduct);

        if (error) {
            logger.error(`Error saving product ${product.id}`, { error }, 'DATABASE');
            throw error;
        }
        
        logger.info(`Product ${product.id} saved successfully`, undefined, 'DATABASE');
        return true;
    }, `save product ${product.id}`, 'DATABASE');
  },

  saveDish: async (dish: Dish) => databaseOperations.saveProduct(dish),
  saveProducts: async (products: Dish[]) => databaseOperations.saveDishes(products),
  
  saveCategory: async (category: MenuCategory): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
        logger.debug(`Saving category ${category.id}`, { category }, 'DATABASE');
        
        const dbCategory = {
            id: category.id,
            name: category.name,
            icon: category.icon,
            sort_order: category.sortOrder || 0,
            is_active: category.isActive ?? true,
            parent_id: category.parentId || null,
            is_available_on_digital_menu: category.isAvailableOnDigitalMenu ?? true,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('menu_categories')
            .upsert(dbCategory);

        if (error) {
            logger.error(`Error saving category ${category.id}`, { error }, 'DATABASE');
            throw error;
        }

        logger.info(`Category ${category.id} saved successfully`, undefined, 'DATABASE');
        return true;
    }, `save category ${category.id}`, 'DATABASE');
  },

  deleteDish: async (id: string): Promise<{ success: boolean; error?: string }> => {
      return databaseOperations._handleDatabaseOperation(async (supabase) => {
          logger.debug(`Deleting dish ${id}`, undefined, 'DATABASE');
          const { error } = await supabase
              .from('dishes')
              .delete()
              .eq('id', id);
          
          if (error) throw error;
          
          logger.info(`Dish ${id} deleted successfully`, undefined, 'DATABASE');
          return true;
      }, `delete dish ${id}`, 'DATABASE');
  },

  deleteCategory: async (id: string): Promise<{ success: boolean; error?: string }> => {
      return databaseOperations._handleDatabaseOperation(async (supabase) => {
          logger.debug(`Deleting category ${id}`, undefined, 'DATABASE');
          const { error } = await supabase
              .from('menu_categories')
              .delete()
              .eq('id', id);
          
          if (error) throw error;
          
          logger.info(`Category ${id} deleted successfully`, undefined, 'DATABASE');
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
        logger.debug('Fetching dishes from Supabase', undefined, 'DATABASE');
        const { data, error } = await supabase
            .from('dishes')
            .select('*');
        
        if (error) throw error;

        logger.debug(`Fetched ${data?.length || 0} dishes`, undefined, 'DATABASE');

        return (data || []).map(r => ({
            id: r.id,
            name: r.name,
            description: r.description,
            price: r.price,
            costPrice: r.cost_price || 0,
            categoryId: r.category_id,
            imageUrl: r.image_url,
            taxCode: r.tax_code,
            taxPercentage: r.tax_percentage,
            preparationTime: r.preparation_time,
            isActive: r.is_active ?? true,
            available: r.available ?? true,
            isAvailableOnDigitalMenu: r.is_available_on_digital_menu ?? true,
            trackStock: r.track_stock ?? false,
            stockQuantity: r.stock_quantity || 0,
            minStockQuantity: r.min_stock_quantity || 0,
            maxStockQuantity: r.max_stock_quantity,
            unit: r.unit || 'unidade',
            supplierId: r.supplier_id
        }));
    }, 'get dishes', 'DATABASE') as Promise<{ success: boolean; data: Dish[]; error?: string }>;
  },

  saveExpense: async (expense: Expense): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
        logger.debug(`Saving expense ${expense.id}`, undefined, 'DATABASE');
        
        const dbExpense = {
            id: expense.id,
            description: expense.description,
            amount: expense.amount,
            date: (expense.date as any) instanceof Date ? (expense.date as Date).toISOString() : expense.date,
            category: expense.category,
            payment_method: expense.paymentMethod || (expense as any).payment_method || null,
            supplier_id: expense.supplierId || (expense as any).supplier_id || null,
            paid: expense.paid ?? true,
            notes: expense.notes || null,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('expenses')
            .upsert(dbExpense);

        if (error) throw error;
        
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
        logger.debug(`Saving revenue ${revenue.id}`, undefined, 'DATABASE');
        
        const dbRevenue = {
            id: revenue.id,
            description: revenue.description,
            amount: revenue.amount,
            date: revenue.date instanceof Date ? revenue.date.toISOString() : revenue.date,
            category: revenue.category,
            payment_method: revenue.paymentMethod || (revenue as any).payment_method || null,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('revenues')
            .upsert(dbRevenue);

        if (error) throw error;

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
        const dbOrder = {
            id: order.id,
            table_id: (order as any).table_id || order.tableId,
            status: order.status,
            timestamp: order.timestamp instanceof Date ? order.timestamp.toISOString() : order.timestamp,
            total: order.total,
            tax_total: (order as any).tax_total || order.taxTotal || 0,
            payment_method: (order as any).payment_method || order.paymentMethod || null,
            customer_id: (order as any).customer_id || order.customerId || null,
            shift_id: (order as any).shift_id || order.shiftId || null,
            sub_account_name: (order as any).sub_account_name || order.subAccountName || null,
            invoice_number: (order as any).invoice_number || order.invoiceNumber || null,
            hash: order.hash || null,
            previous_hash: order.previous_hash || null,
            signature: (order as any).signature || null,
            jws_payload: order.jws_payload ? (typeof order.jws_payload === 'string' ? order.jws_payload : JSON.stringify(order.jws_payload)) : null,
            is_synced_agt: order.is_synced_agt ? 1 : 0,
            agt_submission_uuid: order.agt_submission_uuid || null,
            user_id: (order as any).user_id || order.userId || null,
            user_name: (order as any).user_name || order.userName || null
        };

        const { error } = await supabase.from('orders').upsert(dbOrder);
        if (error) throw error;

        if (order.items && order.items.length > 0) {
            // Delete existing items to ensure clean state (replace behavior)
            const { error: delError } = await supabase.from('order_items').delete().eq('order_id', order.id);
            if (delError) logger.warn('Failed to clear old order items', { error: delError }, 'DATABASE');

            const dbItems = order.items.map(item => ({
                id: item.id || generateUUID(),
                order_id: order.id,
                dish_id: (item as any).dish_id || item.dishId,
                quantity: item.quantity,
                unit_price: (item as any).unit_price || item.unitPrice || item.price || 0,
                tax_amount: (item as any).tax_amount || item.taxAmount || 0,
                tax_percentage: (item as any).tax_percentage || item.taxPercentage || 14,
                tax_code: (item as any).tax_code || item.taxCode || 'NOR',
                notes: item.notes || null,
                status: item.status || 'PENDENTE'
            }));

            const { error: itemsError } = await supabase.from('order_items').upsert(dbItems);
            if (itemsError) throw itemsError;
        }
        return true;
    }, `save order ${order.id}`, 'DATABASE');
    return result.success;
  },

  saveOrders: async (orders: Order[]): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async (supabase) => {
      if (orders.length === 0) return true;

      for (const order of orders) {
          await databaseOperations.saveOrder(order);
      }
      return true;
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
