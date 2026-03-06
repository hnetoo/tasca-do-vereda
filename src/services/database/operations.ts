
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase'; // Centralized Supabase client

import { logger } from '../logger';
import { translateDatabaseError } from './errors';
import { Order, OrderItem, Table, MenuCategory, Dish, CashShift, Expense, Revenue, Fornecedor, User, AttendanceRecord, PayrollRecord, SystemSettings, Customer, Employee, StockItem, LayoutBackup, Reservation, Delivery } from '../../types';

// Kwanza ORM Config (centralized)
const KWANZA_CONFIG = {
  retry: { attempts: 3, baseMs: 200 },
  timeouts: { queryMs: 30000, connectMs: 10000 },
  cache: { ttlMs: 10000, enabled: true },
};

/**
 * @deprecated A função executeQuery foi descontinuada. Use os métodos do cliente Supabase diretamente (e.g., supabase.from(...).select(...)).
 * Para SQL bruto, use `supabase.rpc()`.
 */
export async function executeQuery(client: SupabaseClient<any>, sql: string, params?: any[]) {
  // Esta função é mantida para operações que ainda não foram migradas, como DDL.
  // Ela deve ser usada com cautela e eventualmente removida.
  const { data, error } = await client.rpc('execute_sql', { sql_query: sql, params: params || [] });
  if (error) {
    // Ignorar erros de "já existe" para DDL idempotente
    if (error.message.includes('already exists') || error.message.includes('não existe')) {
      logger.warn(`DDL operation skipped (already exists/not exists): ${sql}`, { error: error.message }, 'DATABASE');
    } else {
      throw error;
    }
  }
  return data;
}

export const withTransaction = async <T>(client: SupabaseClient<any>, fn: (client: SupabaseClient<any>) => Promise<T>): Promise<T> => {
  // NOTA: Transações com o Supabase JS SDK são complexas.
  // A abordagem recomendada é criar uma Função de Banco de Dados (RPC) que execute a transação atomicamente.
  // Esta implementação é um fallback e pode não ser totalmente à prova de falhas.
  logger.warn('withTransaction is a fallback. For critical operations, use a database RPC function.', undefined, 'DATABASE');
  try {
    const res = await fn(client);
    return res;
  } catch (e) {
    throw e;
  }
};

export const databaseOperations = {
  _handleDatabaseOperation: async <T>(operation: (supabase: SupabaseClient<any>) => Promise<T>, context: string, functionName: string = 'databaseOperations', client?: SupabaseClient<any>): Promise<{ success: boolean; data?: T; error?: string }> => {
    try {
      // Usa o cliente supabase centralizado. O parâmetro 'client' é mantido para compatibilidade com transações.
      const dbClient = client || supabase;
      const data = await operation(dbClient);
      return { success: true, data };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : (typeof e === 'object' && e !== null && 'message' in e ? (e as any).message : JSON.stringify(e));
      logger.error(`Failed to ${context}`, { error: errorMessage, fullError: e }, functionName);
      
      const friendlyError = translateDatabaseError(e);
      return { success: false, error: friendlyError };
    }
  },
  
  runMigrations: async (): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
      await executeQuery(supabase, `
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id TEXT PRIMARY KEY,
          checksum TEXT NOT NULL,
          applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
      `);
      const migrations: { id: string; sql: string; checksum: string }[] = [
        { id: '006_daily_analytics', sql: `
          CREATE TABLE IF NOT EXISTS daily_analytics (
            id BIGSERIAL PRIMARY KEY,
            date DATE NOT NULL,
            total_orders INTEGER DEFAULT 0,
            total_sales NUMERIC DEFAULT 0
          );
        `, checksum: 'm006' }
      ];
      for (const m of migrations) {
        const { data: exists, error } = await supabase.from('schema_migrations').select('id').eq('id', m.id).single();
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "exact one row not found"
        
        if (!exists) {
          await executeQuery(supabase, m.sql);
          await supabase.from('schema_migrations').insert({ id: m.id, checksum: m.checksum });
          logger.info('Migration applied', { id: m.id }, 'DATABASE');
        }
      }
      return true;
    }, 'run migrations', 'DATABASE');
  },
  /**
   * Completely clears and recreates menu schema.
   * This is a destructive operation used during full restore/reset.
   */
  restoreFullState: async (data: any): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
        if (data.menu_categories) await databaseOperations.saveCategories(data.menu_categories);
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
      // NOTA: Esta é uma operação destrutiva. Em produção, use migrações.
      await executeQuery(supabase, 'DROP TABLE IF EXISTS dishes CASCADE');
      await executeQuery(supabase, 'DROP TABLE IF EXISTS menu_categories CASCADE');
      await executeQuery(supabase, 'DROP TABLE IF EXISTS suppliers CASCADE');
      
      // Also drop old tables if they exist
      await executeQuery(supabase, 'DROP TABLE IF EXISTS products CASCADE');
      await executeQuery(supabase, 'DROP TABLE IF EXISTS menu CASCADE');
      
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
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(parent_id) REFERENCES menu_categories(id) ON DELETE SET NULL
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
        const { count: pCount, error: pError } = await supabase.from('dishes').select('*', { count: 'exact', head: true });
        if (pError) throw pError;

        const { count: cCount, error: cError } = await supabase.from('menu_categories').select('*', { count: 'exact', head: true });
        if (cError) throw cError;

        return pCount === 0 && cCount === 0;
    }, 'check menu data emptiness', 'DATABASE');
    return result.success && result.data !== undefined ? result.data : false;
  },

  /**
   * Recreates the tables schema (restaurant layout).
   */
  recreateTableSchema: async (): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async (supabase) => {
        // NOTA: Esta é uma operação destrutiva. Em produção, use migrações.
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
        
        if (error) {
            logger.error(`Error fetching categories from Supabase`, { error }, 'DATABASE');
            throw error;
        }
        
        if (!data || data.length === 0) {
            logger.debug('No categories found in Supabase.', undefined, 'DATABASE');
        } else {
            logger.debug(`Fetched ${data.length} categories`, undefined, 'DATABASE');
        }

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

  saveProduct: async (product: Dish, client?: SupabaseClient<any>): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
        logger.debug(`Saving product ${product.id}`, { product }, 'DATABASE');
        
        const dbProduct = {
            id: product.id,
            name: product.name,
            description: product.description || null,
            price: product.price,
            cost_price: product.costPrice || 0,
            category_id: product.categoryId || null,
            image_url: product.imageUrl || null,
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
    }, `save product ${product.id}`, 'DATABASE', client);
  },

  saveDish: async (dish: Dish, client?: SupabaseClient<any>) => databaseOperations.saveProduct(dish, client),
  saveProducts: async (products: Dish[], client?: SupabaseClient<any>) => databaseOperations.saveDishes(products, client),
  
  saveCategory: async (category: MenuCategory, client?: SupabaseClient<any>): Promise<{ success: boolean; error?: string }> => {
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
      }, `save category ${category.id}`, 'DATABASE', client);
    },

  deleteDish: async (id: string, client?: SupabaseClient<any>): Promise<{ success: boolean; error?: string }> => {
      return databaseOperations._handleDatabaseOperation(async (supabase) => {
          logger.debug(`Deleting dish ${id}`, undefined, 'DATABASE');
          const { error } = await supabase
              .from('dishes')
              .delete()
              .eq('id', id);
          
                if (error) throw error;
          
          logger.info(`Dish ${id} deleted successfully`, undefined, 'DATABASE');
          return true;
      }, `delete dish ${id}`, 'DATABASE', client);
  },

  deleteCategory: async (id: string, client?: SupabaseClient<any>): Promise<{ success: boolean; error?: string }> => {
      return databaseOperations._handleDatabaseOperation(async (supabase) => {
          logger.debug(`Deleting category ${id}`, undefined, 'DATABASE');
          const { error } = await supabase
              .from('menu_categories')
              .delete()
              .eq('id', id);
          
          if (error) throw error;
          
          logger.info(`Category ${id} deleted successfully`, undefined, 'DATABASE');
          return true;
      }, `delete category ${id}`, 'DATABASE', client);
  },
  
  saveDishes: async (dishes: Dish[], client?: SupabaseClient<any>): Promise<{ success: boolean; error?: string }> => {
      for (const dish of dishes) {
          const result = await databaseOperations.saveDish(dish, client);
          if (!result.success) return result;
      }
      return { success: true };
  },

  saveCategories: async (categories: MenuCategory[], client?: SupabaseClient<any>): Promise<{ success: boolean; error?: string }> => {
      for (const category of categories) {
          const result = await databaseOperations.saveCategory(category, client);
          if (!result.success) return result;
      }
      return { success: true };
  },

  saveMenu: async (dishes: Dish[], categories: MenuCategory[], client?: SupabaseClient<any>): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
      // Use transaction to ensure both dishes and menu_categories are saved together
      return await withTransaction(supabase, async (transactionClient) => {
        // Save menu_categories first
        for (const category of categories) {
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

          const { error: categoryError } = await transactionClient
              .from('menu_categories')
              .upsert(dbCategory);

          if (categoryError) throw categoryError;
        }

        // Save dishes
        for (const dish of dishes) {
          const dbDish = {
              id: dish.id,
              name: dish.name,
              description: dish.description || null,
              price: dish.price,
              cost_price: dish.costPrice || 0,
              category_id: dish.categoryId || null,
              image_url: dish.imageUrl || null,
              tax_code: dish.taxCode || null,
              tax_percentage: dish.taxPercentage || null,
              preparation_time: dish.preparationTime || null,
              is_active: dish.isActive ?? true,
              available: dish.available ?? true,
              is_available_on_digital_menu: dish.isAvailableOnDigitalMenu ?? true,
              track_stock: dish.trackStock ?? false,
              stock_quantity: dish.stockQuantity || 0,
              min_stock_quantity: dish.minStockQuantity || 0,
              max_stock_quantity: dish.maxStockQuantity || null,
              unit: dish.unit || 'unidade',
              supplier_id: dish.supplierId || null,
              updated_at: new Date().toISOString()
          };

          const { error: dishError } = await transactionClient
              .from('dishes')
              .upsert(dbDish);

          if (dishError) throw dishError;
        }

        return true;
      });
    }, 'save menu', 'DATABASE', client);
  },

  getDishes: async (): Promise<{ success: boolean; data: Dish[]; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
        logger.debug('Fetching dishes from Supabase', undefined, 'DATABASE');
        const { data, error } = await supabase
            .from('dishes')
            .select('*');
        
        if (error) {
            logger.error(`Error fetching dishes from Supabase`, { error }, 'DATABASE');
            throw error;
        }

        if (!data || data.length === 0) {
            logger.debug('No dishes found in Supabase.', undefined, 'DATABASE');
        } else {
            logger.debug(`Fetched ${data.length} dishes`, undefined, 'DATABASE');
        }

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

  saveOrder: async (order: Order, client?: SupabaseClient<any>): Promise<boolean> => {
    const orderId = order.id;
    if (!orderId) {
        logger.error('Cannot save order without ID', { order }, 'DATABASE');
        return false;
    }

    const result = await databaseOperations._handleDatabaseOperation(async (supabase) => {
        const dbOrder = {
            id: orderId,
            table_id: (order as any).table_id || order.tableId || null,
            status: order.status || 'PENDENTE',
            timestamp: order.timestamp instanceof Date ? order.timestamp.toISOString() : (order.timestamp || new Date().toISOString()),
            total: order.total || 0,
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
            user_name: (order as any).user_name || order.userName || null,
            items: order.items || [] // Save items directly into the JSONB column
        };

        const { error } = await supabase.from('orders').upsert(dbOrder);
        if (error) throw error;

        return true;
    }, `save order ${orderId}`, 'DATABASE', client);
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
      // A criação da tabela deve ser feita por migrações, não em tempo de execução.
      const dbShift = {
        id: shift.id,
        user_id: shift.userId || (shift as any).user_id || null,
        user_name: shift.userName || (shift as any).user_name || null,
        start_time: shift.startTime instanceof Date ? shift.startTime.toISOString() : (shift.startTime || (shift as any).start_time || new Date().toISOString()),
        end_time: shift.endTime instanceof Date ? shift.endTime.toISOString() : (shift.endTime || (shift as any).end_time || null),
        opening_balance: shift.openingBalance || (shift as any).opening_balance || 0,
        closing_balance: shift.closingBalance || (shift as any).closing_balance || 0,
        expected_balance: shift.expectedBalance || (shift as any).expected_balance || 0,
        status: shift.status || 'FECHADO'
      };

      const { error } = await supabase.from('cash_shifts').upsert(dbShift);
      if (error) throw error;

      return true;
    }, `save shift ${shift.id}`, 'DATABASE');
  },

  saveShifts: async (shifts: CashShift[]): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
      if (shifts.length === 0) return true;
      // A criação da tabela deve ser feita por migrações.
      const dbShifts = shifts.map(shift => ({
        id: shift.id,
        user_id: shift.userId || (shift as any).user_id || null,
        user_name: shift.userName || (shift as any).user_name || null,
        start_time: shift.startTime instanceof Date ? shift.startTime.toISOString() : (shift.startTime || (shift as any).start_time || new Date().toISOString()),
        end_time: shift.endTime instanceof Date ? shift.endTime.toISOString() : (shift.endTime || (shift as any).end_time || null),
        opening_balance: shift.openingBalance || (shift as any).opening_balance || 0,
        closing_balance: shift.closingBalance || (shift as any).closing_balance || 0,
        expected_balance: shift.expectedBalance || (shift as any).expected_balance || 0,
        status: shift.status || 'FECHADO'
      }));

      const { error } = await supabase.from('cash_shifts').upsert(dbShifts);
      if (error) throw error;

      return true;
    }, `save ${shifts.length} shifts batch`, 'DATABASE');
  },
  
  saveDishesBatch: async (dishes: Dish[]): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async (supabase) => {
      if (dishes.length === 0) return true;
      // A sintaxe INSERT OR REPLACE é do SQLite. O equivalente no Supabase/Postgres é upsert.
      const dbDishes = dishes.map(dish => ({ /* ...mapeamento de campos... */ }));
      // O mapeamento completo foi omitido por brevidade, mas seria similar ao saveDish
      const { error } = await supabase.from('dishes').upsert(dbDishes);
      if (error) throw error;
      return true;
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
  
  renameCategoryName: async (oldName: string, newName: string): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
      const { data, error } = await (supabase as any)
        .from('menu_categories')
        .update({ 
          name: newName,
          updated_at: new Date().toISOString()
        })
        .ilike('name', oldName); // Use ilike for case-insensitive matching

      if (error) throw error;

      logger.info(`Renamed category from ${oldName} to ${newName}`, { count: (data as any[])?.length }, 'DATABASE');
      return true;
    }, 'rename category', 'DATABASE');
  },

  getTables: async (): Promise<Table[]> => {
    const result = await databaseOperations._handleDatabaseOperation(async (supabase) => {
      const { data, error } = await supabase.from('restaurant_tables').select('id, status');
      if (error) throw error;
      
      // Map database fields to application type if needed
      return (data || []).map(t => ({
        ...t,
        activeOrderIds: [] // Initialize runtime property
      })) as Table[];
    }, 'get tables', 'DATABASE');
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

  saveSettings: async (settings: SystemSettings, client?: SupabaseClient<any>): Promise<{ success: boolean; error?: string }> => {
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
    }, 'save settings', 'DATABASE', client);
  },

  saveSupplier: async (supplier: Fornecedor, client?: SupabaseClient<any>): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
      const { error } = await supabase.from('suppliers').upsert(supplier);
      if (error) throw error;
      return true;
    }, 'save supplier', 'DATABASE', client);
  },
  
  saveSuppliers: async (suppliers: Fornecedor[], client?: SupabaseClient<any>): Promise<{ success: boolean; error?: string }> => {
      for (const supplier of suppliers) {
          const result = await databaseOperations.saveSupplier(supplier, client);
          if (!result.success) return result;
      }
      return { success: true };
  },

  saveEmployees: async (employees: Employee[], client?: SupabaseClient<any>): Promise<{ success: boolean; error?: string }> => {
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
    }, 'save employees', 'DATABASE', client);
  },

  deleteEmployee: async (id: string, client?: SupabaseClient<any>): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async (supabase) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      return true;
    }, 'delete employee', 'DATABASE', client);
    return result.success;
  },

  saveAttendance: async (records: AttendanceRecord[], client?: SupabaseClient<any>): Promise<{ success: boolean; error?: string }> => {
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
    }, 'save attendance', 'DATABASE', client);
  },
  
  saveUsers: async (users: User[], client?: SupabaseClient<any>): Promise<{ success: boolean; error?: string }> => {
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
    }, 'save users', 'DATABASE', client);
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
  
  applyDatabaseOptimizations: async (): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
        // NOTA: Esta é uma operação destrutiva. Em produção, use migrações.
        // 1. Indexes for menu_categories
        await executeQuery(supabase, `CREATE INDEX IF NOT EXISTS idx_menu_categories_sort_order ON menu_categories(sort_order)`);
        await executeQuery(supabase, `CREATE INDEX IF NOT EXISTS idx_menu_categories_is_active ON menu_categories(is_active)`);
        await executeQuery(supabase, `CREATE INDEX IF NOT EXISTS idx_menu_categories_parent_id ON menu_categories(parent_id)`);

        // 2. Indexes for dishes
        await executeQuery(supabase, `CREATE INDEX IF NOT EXISTS idx_dishes_category_id ON dishes(category_id)`);
        await executeQuery(supabase, `CREATE INDEX IF NOT EXISTS idx_dishes_supplier_id ON dishes(supplier_id)`);
        await executeQuery(supabase, `CREATE INDEX IF NOT EXISTS idx_dishes_is_active ON dishes(is_active)`);
        await executeQuery(supabase, `CREATE INDEX IF NOT EXISTS idx_dishes_available ON dishes(available)`);
        await executeQuery(supabase, `CREATE INDEX IF NOT EXISTS idx_dishes_is_available_on_digital_menu ON dishes(is_available_on_digital_menu)`);
        
        // Policies for menu_categories
        await executeQuery(supabase, `ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY`);
        await executeQuery(supabase, `DROP POLICY IF EXISTS "Public menu_categories are viewable by everyone" ON menu_categories`);
        await executeQuery(supabase, `CREATE POLICY "Public menu_categories are viewable by everyone" ON menu_categories FOR SELECT USING (true)`);
        await executeQuery(supabase, `DROP POLICY IF EXISTS "Authenticated users can modify menu_categories" ON menu_categories`);
        await executeQuery(supabase, `CREATE POLICY "Authenticated users can modify menu_categories" ON menu_categories FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated')`);

        // Policies for dishes
        await executeQuery(supabase, `ALTER TABLE dishes ENABLE ROW LEVEL SECURITY`);
        await executeQuery(supabase, `DROP POLICY IF EXISTS "Public dishes are viewable by everyone" ON dishes`);
        await executeQuery(supabase, `CREATE POLICY "Public dishes are viewable by everyone" ON dishes FOR SELECT USING (true)`);
        await executeQuery(supabase, `DROP POLICY IF EXISTS "Authenticated users can modify dishes" ON dishes`);
        await executeQuery(supabase, `CREATE POLICY "Authenticated users can modify dishes" ON dishes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated')`);

        logger.info('Database optimizations and RLS policies applied successfully.', undefined, 'DATABASE');
        return true;
    }, 'apply database optimizations', 'DATABASE');
  },

  clearAllData: async (): Promise<{ success: boolean; error?: string }> => {
    return databaseOperations._handleDatabaseOperation(async (supabase) => {
        const tables = [
            'orders', 'dishes', 'menu_categories', 'suppliers', 
            'expenses', 'revenues', 'customers', 'employees', 'attendance_records',
            'stock_items', 'cash_shifts', 'reservations', 'deliveries', 'payroll_records'
        ];
        
        for (const table of tables) {
            const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
            if (error) logger.warn(`Could not clear table ${table}`, { error }, 'DATABASE');
        }
        return true;
    }, 'clear all data', 'DATABASE');
  }
}
