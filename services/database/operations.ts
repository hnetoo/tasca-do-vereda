import { executeQuery, selectQuery } from './connection';
import { logger } from '../logger';
import { Order, OrderItem, Table, MenuCategory, Dish, CashShift, Expense, Revenue, Fornecedor, User, AttendanceRecord, PayrollRecord, SystemSettings, Customer, Employee, StockItem, LayoutBackup } from '../../types';

export const databaseOperations = {
  _handleDatabaseOperation: async <T>(operation: () => Promise<T>, context: string, functionName: string = 'databaseOperations'): Promise<{ success: boolean; data?: T; error?: string }> => {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (e: unknown) {
      const error = e as Error;
      logger.error(`Failed to ${context}`, { error: error.message }, functionName);
      return { success: false, error: error.message };
    }
  },
  /**
   * Completely clears and recreates menu schema.
   * This is a destructive operation used during full restore/reset.
   */
  recreateMenuSchema: async (): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      // 1. Drop existing tables
      await executeQuery('DROP TABLE IF EXISTS dishes');
      await executeQuery('DROP TABLE IF EXISTS menu_categories');
      await executeQuery('DROP TABLE IF EXISTS suppliers');
      
      // 2. Recreate Categories Table
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS menu_categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            icon TEXT,
            sort_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE
        )
      `);

      // 3. Recreate Suppliers Table
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS suppliers (
            id TEXT PRIMARY KEY,
            nome TEXT NOT NULL,
            nif TEXT,
            telefone TEXT,
            email TEXT,
            endereco TEXT,
            ativo BOOLEAN DEFAULT TRUE,
            categoria TEXT
        )
      `);

      // 4. Recreate Dishes Table
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS dishes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            preco_custo REAL DEFAULT 0,
            category_id TEXT,
            image TEXT,
            tax_code TEXT,
            tax_percentage DECIMAL(5,2),
            tempo_preparo INTEGER,
            is_available BOOLEAN DEFAULT TRUE,
            is_available_on_digital_menu BOOLEAN DEFAULT TRUE,
            controla_estoque BOOLEAN DEFAULT FALSE,
            quantidade_estoque REAL DEFAULT 0,
            quantidade_minima REAL DEFAULT 0,
            quantidade_maxima REAL,
            unidade_medida TEXT DEFAULT 'unidade',
            fornecedor_padrao_id TEXT,
            FOREIGN KEY(category_id) REFERENCES menu_categories(id) ON DELETE SET NULL,
            FOREIGN KEY(fornecedor_padrao_id) REFERENCES suppliers(id) ON DELETE SET NULL
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
    const result = await databaseOperations._handleDatabaseOperation(async () => {
        const dishes = await selectQuery<{count: number}>('SELECT COUNT(*) as count FROM dishes');
        const categories = await selectQuery<{count: number}>('SELECT COUNT(*) as count FROM menu_categories');
        
        const dCount = dishes?.[0]?.count || 0;
        const cCount = categories?.[0]?.count || 0;
        
        return dCount === 0 && cCount === 0;
    }, 'check menu data emptiness', 'DATABASE');
    return result.success && result.data !== undefined ? result.data : false;
  },

  /**
   * Recreates the tables schema (restaurant layout).
   */
  recreateTableSchema: async (): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
        // Drop tables first to ensure clean state
        await executeQuery('DROP TABLE IF EXISTS order_items');
        await executeQuery('DROP TABLE IF EXISTS orders');
        await executeQuery('DROP TABLE IF EXISTS restaurant_tables');

        await executeQuery(`
            CREATE TABLE IF NOT EXISTS restaurant_tables (
                id INTEGER PRIMARY KEY, 
                name TEXT, 
                seats INTEGER, 
                status TEXT, 
                x INTEGER, 
                y INTEGER, 
                width INTEGER DEFAULT 1,
                height INTEGER DEFAULT 1,
                zone TEXT, 
                shape TEXT, 
                rotation INTEGER,
                groupId TEXT,
                label TEXT,
                color TEXT,
                userId TEXT
            )
        `);

        await executeQuery(`
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                table_id INTEGER,
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

        await executeQuery(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        
        // Create backups table
        await executeQuery(`
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

  saveOrder: async (order: Order): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
        // Ensure table exists with correct schema before saving
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                table_id INTEGER,
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

        await executeQuery(
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

        if (order.items && order.items.length > 0) {
            // Ensure order_items table exists with correct schema
            await executeQuery(`
                CREATE TABLE IF NOT EXISTS order_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
            await executeQuery('DELETE FROM order_items WHERE order_id = ?', [order.id]);
            for (const item of order.items) {
                await executeQuery(
                    'INSERT INTO order_items (order_id, dish_id, quantity, unit_price, tax_amount, tax_percentage, tax_code, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                      order.id, 
                      item.dishId || (item as any).dish_id, 
                      item.quantity, 
                      item.unitPrice || (item as any).unit_price, 
                      item.taxAmount || (item as any).tax_amount || 0, 
                      item.taxPercentage || (item as any).tax_percentage || 14, 
                      item.taxCode || (item as any).tax_code || 'NOR', 
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
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      if (orders.length === 0) return true;

      await executeQuery(`
          CREATE TABLE IF NOT EXISTS orders (
              id TEXT PRIMARY KEY,
              table_id INTEGER,
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

      await executeQuery(`
          CREATE TABLE IF NOT EXISTS order_items (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
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

      await executeQuery('BEGIN TRANSACTION');
      try {
        for (const order of orders) {
          await executeQuery(
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
          await executeQuery('DELETE FROM order_items WHERE order_id = ?', [order.id]);
          
          if (order.items && order.items.length > 0) {
            for (const item of order.items) {
                await executeQuery(
                    'INSERT INTO order_items (order_id, dish_id, quantity, unit_price, tax_amount, tax_percentage, tax_code, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                      order.id, 
                      item.dishId || (item as any).dish_id, 
                      item.quantity, 
                      item.unitPrice || (item as any).unit_price, 
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
        await executeQuery('COMMIT');
        return true;
      } catch (e: unknown) {
        await executeQuery('ROLLBACK');
        throw e;
      }
    }, `save ${orders.length} orders batch`, 'DATABASE');
    return result.success;
  },

  saveShift: async (shift: CashShift): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      await executeQuery(`
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
      await executeQuery(
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
    return result.success;
  },

  saveShifts: async (shifts: CashShift[]): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      if (shifts.length === 0) return true;

      await executeQuery(`
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
      await executeQuery('BEGIN TRANSACTION');
      try {
        for (const shift of shifts) {
          await executeQuery(
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
        await executeQuery('COMMIT');
        return true;
      } catch (e: unknown) {
        await executeQuery('ROLLBACK');
        throw e;
      }
    }, `save ${shifts.length} shifts batch`, 'DATABASE');
    return result.success;
  },

  getOrders: async (status?: string): Promise<Order[]> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
        let query = 'SELECT * FROM orders';
        const params: (string | number)[] = [];
        if (status) {
            query += ' WHERE status = ?';
            params.push(status);
        }

        interface DBOrder {
            id: string;
            table_id: number;
            status: string;
            timestamp: string;
            total: number;
            tax_total: number;
            payment_method?: string;
            customer_id?: string;
            shift_id?: string;
            sub_account_name?: string;
            invoice_number?: string;
            hash?: string;
            previous_hash?: string;
            signature?: string;
            jws_payload?: string;
            is_synced_agt?: number;
            agt_submission_uuid?: string;
            user_id?: string;
            user_name?: string;
        }

        const dbOrders = await selectQuery<DBOrder>(query, params);
        if (dbOrders.length === 0) return [];

        // Optimize: Fetch all items for all retrieved orders in a single query
        const orderIds = dbOrders.map(o => o.id);
        const placeholders = orderIds.map(() => '?').join(',');
        
        interface DBOrderItem {
            id: number;
            order_id: string;
            dish_id: string;
            quantity: number;
            unit_price: number;
            tax_amount: number;
            tax_percentage?: number;
            tax_code?: string;
            notes?: string;
            status?: string;
        }

        const allItems = await selectQuery<DBOrderItem>(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`, orderIds);
        
        // Group items by orderId
        const itemsByOrder = allItems.reduce((acc: Record<string, OrderItem[]>, item: DBOrderItem) => {
            if (!acc[item.order_id]) acc[item.order_id] = [];
            acc[item.order_id].push({
                dishId: item.dish_id,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                taxAmount: item.tax_amount,
                taxPercentage: item.tax_percentage || 14,
                taxCode: item.tax_code || 'NOR',
                notes: item.notes || undefined,
                status: item.status as any || 'PENDENTE'
            } as OrderItem);
            return acc;
        }, {});

        return dbOrders.map(o => ({ 
            id: o.id,
            tableId: o.table_id,
            status: o.status as any,
            timestamp: new Date(o.timestamp),
            total: o.total,
            taxTotal: o.tax_total,
            paymentMethod: o.payment_method as any,
            customerId: o.customer_id,
            shiftId: o.shift_id,
            subAccountName: o.sub_account_name,
            invoiceNumber: o.invoice_number,
            hash: o.hash,
            previous_hash: o.previous_hash,
            signature: o.signature,
            jws_payload: o.jws_payload ? JSON.parse(o.jws_payload) : null,
            is_synced_agt: !!o.is_synced_agt,
            agt_submission_uuid: o.agt_submission_uuid,
            userId: o.user_id,
            userName: o.user_name,
            items: itemsByOrder[o.id] || []
        })) as Order[];
    }, `get orders with status ${status || 'any'}`, 'DATABASE');
    return result.success ? (result.data || []) : [];
  },

  deleteOrder: async (id: string): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
        await executeQuery('DELETE FROM orders WHERE id = ?', [id]);
        await executeQuery('DELETE FROM order_items WHERE order_id = ?', [id]);
        logger.info('Order deleted successfully', { id }, 'DATABASE');
        return true;
    }, `delete order ${id}`, 'DATABASE');
    return result.success;
  },

  saveTable: async (table: Table): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS restaurant_tables (
                id INTEGER PRIMARY KEY, 
                name TEXT, 
                seats INTEGER, 
                status TEXT, 
                x INTEGER, 
                y INTEGER, 
                width INTEGER DEFAULT 1,
                height INTEGER DEFAULT 1,
                zone TEXT, 
                shape TEXT, 
                rotation INTEGER,
                groupId TEXT,
                label TEXT,
                color TEXT,
                userId TEXT
            )
        `);
        await executeQuery(
            'INSERT OR REPLACE INTO restaurant_tables (id, name, seats, status, x, y, width, height, zone, shape, rotation, groupId, label, color, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [table.id, table.name, table.seats, table.status, table.x, table.y, table.width || 1, table.height || 1, table.zone, table.shape, table.rotation, table.groupId || null, table.label || null, table.color || null, table.userId || null]
        );
        return true;
    }, `save table ${table.id}`, 'DATABASE');
    return result.success;
  },

  saveTables: async (tables: Table[]): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      if (tables.length === 0) return true;
      
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS restaurant_tables (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          seats INTEGER DEFAULT 4,
          status TEXT DEFAULT 'LIVRE',
          current_order_id TEXT,
          x INTEGER DEFAULT 0,
          y INTEGER DEFAULT 0,
          width INTEGER DEFAULT 1,
          height INTEGER DEFAULT 1,
          zone TEXT DEFAULT 'INTERIOR',
          shape TEXT DEFAULT 'SQUARE',
          rotation INTEGER DEFAULT 0,
          groupId TEXT,
          label TEXT,
          color TEXT,
          userId TEXT
        )
      `);
      await executeQuery('BEGIN TRANSACTION');
      try {
        for (const table of tables) {
          await executeQuery(
            'INSERT OR REPLACE INTO restaurant_tables (id, name, seats, status, x, y, width, height, zone, shape, rotation, groupId, label, color, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              table.id, 
              table.name, 
              table.seats, 
              table.status, 
              table.x, 
              table.y, 
              table.width || 1, 
              table.height || 1, 
              table.zone, 
              table.shape, 
              table.rotation, 
              table.groupId || null, 
              table.label || null, 
              table.color || null, 
              table.userId || null
            ]
          );
        }
        await executeQuery('COMMIT');
        return true;
      } catch (e: unknown) {
        await executeQuery('ROLLBACK');
        throw e;
      }
    }, `save ${tables.length} tables batch`, 'DATABASE');
    return result.success;
  },

  createLayoutBackup: async (tables: Table[], userId?: string): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
        const layoutData = JSON.stringify(tables);
        await executeQuery('INSERT INTO layout_backups (layout_data, user_id) VALUES (?, ?)', [layoutData, userId || 'system']);
        
        // Clean up backups older than 7 days
        await executeQuery("DELETE FROM layout_backups WHERE timestamp < datetime('now', '-7 days')");
        
        return true;
    }, 'create layout backup', 'DATABASE');
    return result.success;
  },

  getLayoutBackups: async (): Promise<LayoutBackup[]> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
        return await selectQuery<LayoutBackup>('SELECT * FROM layout_backups ORDER BY timestamp DESC');
    }, 'get layout backups', 'DATABASE');
    return result.success ? (result.data || []) : [];
  },

  getTables: async (): Promise<Table[]> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
        return await selectQuery<Table>('SELECT * FROM restaurant_tables');
    }, 'get tables', 'DATABASE');
    return result.success ? (result.data || []) : [];
  },

  /**
   * DATA RECOVERY LOGIC (BACKUP & RESTORE)
   */

  /**
   * Get all menu categories from SQL
   */
  getCategories: async (): Promise<MenuCategory[]> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      return await selectQuery<MenuCategory>('SELECT * FROM menu_categories ORDER BY sort_order ASC, name ASC');
    }, 'get categories', 'DATABASE');
    return result.success ? (result.data || []) : [];
  },

  /**
   * Save a single category to SQL
   */
  saveCategory: async (cat: MenuCategory): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS menu_categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            icon TEXT,
            sort_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            parent_id TEXT,
            is_available_on_digital_menu BOOLEAN DEFAULT TRUE,
            deleted_at TEXT
        )
      `);

      // Try to add columns if they don't exist (fail silently if they do)
      try { await executeQuery('ALTER TABLE menu_categories ADD COLUMN parent_id TEXT'); } catch (e) { /* Coluna pode já existir */ }
      try { await executeQuery('ALTER TABLE menu_categories ADD COLUMN is_available_on_digital_menu BOOLEAN DEFAULT TRUE'); } catch (e) { /* Coluna pode já existir */ }
      try { await executeQuery('ALTER TABLE menu_categories ADD COLUMN deleted_at TEXT'); } catch (e) { /* Coluna pode já existir */ }

      await executeQuery(
        'INSERT OR REPLACE INTO menu_categories (id, name, icon, sort_order, is_active, parent_id, is_available_on_digital_menu, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
            cat.id, 
            cat.name, 
            cat.icon || null, 
            cat.sort_order !== undefined ? cat.sort_order : ((cat as any).sortOrder || 0), 
            (cat.is_active !== undefined ? cat.is_active : ((cat as any).isActive !== false)) ? 1 : 0,
            cat.parentId || (cat as any).parent_id || null,
            (cat.isAvailableOnDigitalMenu !== undefined ? cat.isAvailableOnDigitalMenu : ((cat as any).is_available_on_digital_menu !== false)) ? 1 : 0,
            cat.deletedAt || (cat as any).deleted_at || null
        ]
      );
      return true;
    }, `save category ${cat.id}`, 'DATABASE');
    return result.success;
  },

  /**
   * Save multiple categories to SQL (for restoration/sync)
   */
  saveCategories: async (categories: MenuCategory[]): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      if (categories.length === 0) return true;
      
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS menu_categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            icon TEXT,
            sort_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            parent_id TEXT,
            is_available_on_digital_menu BOOLEAN DEFAULT TRUE,
            deleted_at TEXT
        )
      `);

      // Try to add columns if they don't exist
      try { await executeQuery('ALTER TABLE menu_categories ADD COLUMN parent_id TEXT'); } catch (e) { /* Coluna pode já existir */ }
      try { await executeQuery('ALTER TABLE menu_categories ADD COLUMN is_available_on_digital_menu BOOLEAN DEFAULT TRUE'); } catch (e) { /* Coluna pode já existir */ }
      try { await executeQuery('ALTER TABLE menu_categories ADD COLUMN deleted_at TEXT'); } catch (e) { /* Coluna pode já existir */ }

      // Batch operation using a transaction if possible, or multiple inserts
      await executeQuery('BEGIN TRANSACTION');
      try {
        for (const cat of categories) {
          await executeQuery(
            'INSERT OR REPLACE INTO menu_categories (id, name, icon, sort_order, is_active, parent_id, is_available_on_digital_menu, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                cat.id, 
                cat.name, 
                cat.icon || null, 
                cat.sort_order !== undefined ? cat.sort_order : ((cat as any).sortOrder || 0), 
                (cat.is_active !== undefined ? cat.is_active : ((cat as any).isActive !== false)) ? 1 : 0,
                cat.parentId || (cat as any).parent_id || null,
                (cat.isAvailableOnDigitalMenu !== undefined ? cat.isAvailableOnDigitalMenu : ((cat as any).is_available_on_digital_menu !== false)) ? 1 : 0,
                cat.deletedAt || (cat as any).deleted_at || null
            ]
          );
        }
        await executeQuery('COMMIT');
        return true;
      } catch (e: unknown) {
        await executeQuery('ROLLBACK');
        throw e;
      }
    }, `save ${categories.length} categories batch`, 'DATABASE');
    return result.success;
  },

  /**
   * Delete category from SQL
   */
  deleteCategory: async (id: string): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      await executeQuery('DELETE FROM menu_categories WHERE id = ?', [id]);
      return true;
    }, `delete category ${id}`, 'DATABASE');
    return result.success;
  },

  /**
   * Delete dish from SQL
   */
  deleteDish: async (id: string): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      await executeQuery('DELETE FROM dishes WHERE id = ?', [id]);
      return true;
    }, `delete dish ${id}`, 'DATABASE');
    return result.success;
  },

  /**
   * Get all dishes from SQL
   */
  getDishes: async (): Promise<Dish[]> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      return await selectQuery<Dish>('SELECT * FROM dishes');
    }, 'get dishes', 'DATABASE');
    return result.success ? (result.data || []) : [];
  },

  /**
   * Save a single dish to SQL
   */
  saveDish: async (dish: Dish): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      // Ensure dishes table exists with correct schema
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS dishes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            preco_custo REAL DEFAULT 0,
            category_id TEXT,
            image TEXT,
            tax_code TEXT,
            tax_percentage DECIMAL(5,2),
            tempo_preparo INTEGER,
            is_available BOOLEAN DEFAULT TRUE,
            is_available_on_digital_menu BOOLEAN DEFAULT TRUE,
            controla_estoque BOOLEAN DEFAULT FALSE,
            quantidade_estoque REAL DEFAULT 0,
            quantidade_minima REAL DEFAULT 0,
            quantidade_maxima REAL,
            unidade_medida TEXT DEFAULT 'unidade',
            fornecedor_padrao_id TEXT,
            FOREIGN KEY(category_id) REFERENCES menu_categories(id) ON DELETE SET NULL,
            FOREIGN KEY(fornecedor_padrao_id) REFERENCES suppliers(id) ON DELETE SET NULL
        )
      `);

      await executeQuery(
        'INSERT OR REPLACE INTO dishes (id, name, description, price, preco_custo, category_id, image, tax_code, tax_percentage, tempo_preparo, is_available, is_available_on_digital_menu, controla_estoque, quantidade_estoque, quantidade_minima, quantidade_maxima, unidade_medida, fornecedor_padrao_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          dish.id,
          dish.name,
          dish.description || null,
          dish.price,
          dish.precoCusto || (dish as any).preco_custo || 0,
          dish.categoryId || (dish as any).category_id,
          dish.image || null,
          dish.taxCode || (dish as any).tax_code || 'NOR',
          dish.taxPercentage || (dish as any).tax_percentage || 14.00,
          dish.tempo_preparo || (dish as any).tempo_preparo || null,
          dish.disponivel !== undefined ? dish.disponivel : (dish as any).is_available !== false,
          dish.isAvailableOnDigitalMenu !== undefined ? dish.isAvailableOnDigitalMenu : (dish as any).is_available_on_digital_menu !== false,
          (dish.controlaEstoque || (dish as any).controla_estoque) ? 1 : 0,
          dish.quantidadeEstoque || (dish as any).quantidade_estoque || 0,
          dish.quantidadeMinima || (dish as any).quantidade_minima || 0,
          dish.quantidadeMaxima || (dish as any).quantidade_maxima || null,
          dish.unidadeMedida || (dish as any).unidade_medida || 'unidade',
          dish.fornecedorPadraoId || (dish as any).fornecedor_padrao_id || null
        ]
      );
      return true;
    }, `save dish ${dish.id}`, 'DATABASE');
    return result.success;
  },

  /**
   * Save multiple dishes to SQL
   */
  saveDishes: async (dishes: Dish[]): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      if (dishes.length === 0) return true;

      // Ensure table exists with correct schema
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS dishes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            preco_custo REAL DEFAULT 0,
            category_id TEXT,
            image TEXT,
            tax_code TEXT,
            tax_percentage DECIMAL(5,2),
            tempo_preparo INTEGER,
            is_available BOOLEAN DEFAULT TRUE,
            is_available_on_digital_menu BOOLEAN DEFAULT TRUE,
            controla_estoque BOOLEAN DEFAULT FALSE,
            quantidade_estoque REAL DEFAULT 0,
            quantidade_minima REAL DEFAULT 0,
            quantidade_maxima REAL,
            unidade_medida TEXT DEFAULT 'unidade',
            fornecedor_padrao_id TEXT,
            FOREIGN KEY(category_id) REFERENCES menu_categories(id) ON DELETE SET NULL,
            FOREIGN KEY(fornecedor_padrao_id) REFERENCES suppliers(id) ON DELETE SET NULL
        )
      `);

      await executeQuery('BEGIN TRANSACTION');
      try {
        for (const dish of dishes) {
          await executeQuery(
            'INSERT OR REPLACE INTO dishes (id, name, description, price, preco_custo, category_id, image, tax_code, tax_percentage, tempo_preparo, is_available, is_available_on_digital_menu, controla_estoque, quantidade_estoque, quantidade_minima, quantidade_maxima, unidade_medida, fornecedor_padrao_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              dish.id, 
              dish.name, 
              dish.description || null, 
              dish.price, 
              dish.precoCusto || (dish as any).preco_custo || 0,
              dish.categoryId || (dish as any).category_id || null, 
              dish.image || null, 
              dish.taxCode || (dish as any).tax_code || 'NOR', 
              dish.taxPercentage || (dish as any).tax_percentage || 23, 
              dish.tempo_preparo || (dish as any).preparationTime || null, 
              dish.disponivel !== undefined ? dish.disponivel : (dish as any).is_available !== false,
              dish.isAvailableOnDigitalMenu !== undefined ? dish.isAvailableOnDigitalMenu : (dish as any).is_available_on_digital_menu !== false,
              (dish.controlaEstoque || (dish as any).controla_estoque) ? 1 : 0,
              dish.quantidadeEstoque || (dish as any).quantidade_estoque || 0,
              dish.quantidadeMinima || (dish as any).quantidade_minima || 0,
              dish.quantidadeMaxima || (dish as any).quantidade_maxima || null,
              dish.unidadeMedida || (dish as any).unidade_medida || 'unidade',
              dish.fornecedorPadraoId || (dish as any).fornecedor_padrao_id || null
            ]
          );
        }
        await executeQuery('COMMIT');
        return true;
      } catch (e) {
        await executeQuery('ROLLBACK');
        throw e;
      }
    }, `save ${dishes.length} dishes batch`, 'DATABASE');
    return result.success;
  },

  /**
   * Get all stock items from SQL
   */
  getStockItems: async (): Promise<StockItem[]> => {
    try {
      return await selectQuery<StockItem>('SELECT * FROM stock_items ORDER BY name ASC');
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to get stock items from SQL', { error: error.message }, 'DATABASE');
      return [];
    }
  },

  /**
   * Save multiple stock items to SQL
   */
  saveStockItems: async (items: StockItem[]): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      if (items.length === 0) return true;

      await executeQuery(`
        CREATE TABLE IF NOT EXISTS stock_items (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          quantity REAL DEFAULT 0,
          unit TEXT DEFAULT 'un',
          min_threshold REAL DEFAULT 5
        )
      `);
      await executeQuery('BEGIN TRANSACTION');
      try {
        for (const item of items) {
          await executeQuery(
            'INSERT OR REPLACE INTO stock_items (id, name, quantity, unit, min_threshold) VALUES (?, ?, ?, ?, ?)',
            [
              item.id, 
              item.name, 
              item.quantity || 0, 
              item.unit || (item as any).unidade || 'un', 
              item.minThreshold || (item as any).min_threshold || 5
            ]
          );
        }
        await executeQuery('COMMIT');
        return true;
      } catch (e) {
        await executeQuery('ROLLBACK');
        throw e;
      }
    }, `save ${items.length} stock items batch`, 'DATABASE');
    return result.success;
  },

  saveStockItem: async (item: StockItem): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS stock_items (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          quantity REAL DEFAULT 0,
          unit TEXT DEFAULT 'un',
          min_threshold REAL DEFAULT 5
        )
      `);
      await executeQuery(
        'INSERT OR REPLACE INTO stock_items (id, name, quantity, unit, min_threshold) VALUES (?, ?, ?, ?, ?)',
        [
          item.id, 
          item.name, 
          item.quantity || 0, 
          item.unit || (item as any).unidade || 'un', 
          item.minThreshold || (item as any).min_threshold || 5
        ]
      );
      return true;
    }, `save stock item ${item.id}`, 'DATABASE');
    return result.success;
  },

  /**
   * Delete a stock item from SQL
   */
  deleteStockItem: async (id: string): Promise<boolean> => {
    try {
      await executeQuery('DELETE FROM stock_items WHERE id = ?', [id]);
      logger.info('Stock item deleted successfully', { id }, 'DATABASE');
      return true;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to delete stock item from SQL', { id, error: error.message }, 'DATABASE');
      return false;
    }
  },

  /**
   * FINANCIAL DATA PERSISTENCE
   */

  /**
   * Recreates the financial schema (orders, items, expenses, revenues, payroll, shifts)
   */
  recreateFinancialSchema: async (): Promise<boolean> => {
    try {
      await executeQuery('DROP TABLE IF EXISTS expenses');
      await executeQuery('DROP TABLE IF EXISTS revenues');
      await executeQuery('DROP TABLE IF EXISTS payroll_records');
      await executeQuery('DROP TABLE IF EXISTS cash_shifts');
      await executeQuery('DROP TABLE IF EXISTS order_items');
      await executeQuery('DROP TABLE IF EXISTS orders');

      await executeQuery(`
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            table_id INTEGER,
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

      await executeQuery(`
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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

      await executeQuery(`
        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY,
          description TEXT,
          amount REAL,
          date TEXT,
          category TEXT
        )
      `);

      await executeQuery(`
        CREATE TABLE IF NOT EXISTS revenues (
          id TEXT PRIMARY KEY,
          description TEXT,
          amount REAL,
          date TEXT,
          category TEXT
        )
      `);

      await executeQuery(`
        CREATE TABLE IF NOT EXISTS payroll_records (
          id TEXT PRIMARY KEY,
          employee_id TEXT,
          amount REAL,
          date TEXT,
          month INTEGER,
          year INTEGER,
          status TEXT,
          net_salary REAL,
          base_salary REAL,
          notes TEXT,
          FOREIGN KEY(employee_id) REFERENCES employees(id)
        )
      `);

      await executeQuery(`
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

      logger.info('Financial schema recreated successfully', undefined, 'DATABASE');
      return true;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to recreate financial schema', { error: error.message }, 'DATABASE');
      return false;
    }
  },

  /**
   * Get all revenues/sales from SQL
   */
  getRevenues: async (): Promise<Revenue[]> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      return await selectQuery<Revenue>('SELECT * FROM revenues ORDER BY date DESC');
    }, 'get revenues', 'DATABASE');
    return result.success ? (result.data || []) : [];
  },

  /**
   * Get all expenses from SQL
   */
  getExpenses: async (): Promise<Expense[]> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      // Assuming expenses table exists or needs creation
      await executeQuery('CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, description TEXT, amount REAL, date TEXT, category TEXT)');
      return await selectQuery<Expense>('SELECT * FROM expenses ORDER BY date DESC');
    }, 'get expenses', 'DATABASE');
    return result.success ? (result.data || []) : [];
  },

  /**
   * Save multiple expenses to SQL
   */
  saveExpenses: async (expenses: Expense[]): Promise<boolean> => {
    try {
      if (expenses.length === 0) return true;

      await executeQuery(`
        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY, 
          description TEXT, 
          amount REAL, 
          date TEXT, 
          category TEXT
        )
      `);
      await executeQuery('BEGIN TRANSACTION');
      try {
        for (const exp of expenses) {
          await executeQuery(
            'INSERT OR REPLACE INTO expenses (id, description, amount, date, category) VALUES (?, ?, ?, ?, ?)',
            [
              exp.id, 
              exp.description || (exp as any).descricao || 'Despesa', 
              exp.amount || (exp as any).valor || 0, 
              exp.date instanceof Date ? exp.date.toISOString() : (exp.date || (exp as any).data || new Date().toISOString()), 
              exp.category || (exp as any).categoria || 'Geral'
            ]
          );
        }
        await executeQuery('COMMIT');
        return true;
      } catch (e) {
        await executeQuery('ROLLBACK');
        throw e;
      }
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to save expenses to SQL', { count: expenses.length, error: error.message }, 'DATABASE');
      return false;
    }
  },

  /**
   * Get all suppliers from SQL
   */
  getSuppliers: async (): Promise<Fornecedor[]> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      return await selectQuery<Fornecedor>('SELECT * FROM suppliers ORDER BY nome ASC');
    }, 'get suppliers', 'DATABASE');
    return result.success ? (result.data || []) : [];
  },

  /**
   * Save a single supplier to SQL
   */
  saveSupplier: async (s: Fornecedor): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS suppliers (
          id TEXT PRIMARY KEY,
          nome TEXT NOT NULL,
          nif TEXT,
          telefone TEXT,
          email TEXT,
          endereco TEXT,
          ativo BOOLEAN DEFAULT TRUE,
          categoria TEXT
        )
      `);
      await executeQuery(
        'INSERT OR REPLACE INTO suppliers (id, nome, nif, telefone, email, endereco, ativo, categoria) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          s.id, 
          s.nome || (s as any).name || 'Fornecedor', 
          s.nif || null, 
          s.telefone || (s as any).phone || null, 
          s.email || null, 
          s.endereco || (s as any).address || null, 
          (s.ativo !== false && (s as any).active !== false) ? 1 : 0, 
          s.categoria || (s as any).category || null
        ]
      );
      return true;
    }, `save supplier ${s.id}`, 'DATABASE');
    return result.success;
  },

  /**
   * Save multiple suppliers to SQL
   */
  saveSuppliers: async (suppliers: Fornecedor[]): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      if (suppliers.length === 0) return true;
      
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS suppliers (
          id TEXT PRIMARY KEY,
          nome TEXT NOT NULL,
          nif TEXT,
          telefone TEXT,
          email TEXT,
          endereco TEXT,
          ativo BOOLEAN DEFAULT TRUE,
          categoria TEXT
        )
      `);

      await executeQuery('BEGIN TRANSACTION');
      try {
        for (const s of suppliers) {
          await executeQuery(
            'INSERT OR REPLACE INTO suppliers (id, nome, nif, telefone, email, endereco, ativo, categoria) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              s.id, 
              s.nome || (s as any).name || 'Fornecedor', 
              s.nif || null, 
              s.telefone || (s as any).phone || null, 
              s.email || null, 
              s.endereco || (s as any).address || null, 
              (s.ativo !== false && (s as any).active !== false) ? 1 : 0, 
              s.categoria || (s as any).category || null
            ]
          );
        }
        await executeQuery('COMMIT');
        return true;
      } catch (e) {
        await executeQuery('ROLLBACK');
        throw e;
      }
    }, `save ${suppliers.length} suppliers batch`, 'DATABASE');
    return result.success;
  },

  deleteSupplier: async (id: string): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      await executeQuery('DELETE FROM suppliers WHERE id = ?', [id]);
      return true;
    }, `delete supplier ${id}`, 'DATABASE');
    return result.success;
  },

  saveExpense: async (expense: Expense): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY, 
          description TEXT, 
          amount REAL, 
          date TEXT, 
          category TEXT
        )
      `);
      await executeQuery(
        'INSERT OR REPLACE INTO expenses (id, description, amount, date, category) VALUES (?, ?, ?, ?, ?)',
        [
          expense.id, 
          expense.description || (expense as any).descricao || 'Despesa', 
          expense.amount || (expense as any).valor || 0, 
          expense.date instanceof Date ? expense.date.toISOString() : (expense.date || (expense as any).data || new Date().toISOString()), 
          expense.category || (expense as any).categoria || 'Geral'
        ]
      );
      return true;
    }, `save expense ${expense.id}`, 'DATABASE');
    return result.success;
  },

  deleteExpense: async (id: string): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      await executeQuery('DELETE FROM expenses WHERE id = ?', [id]);
      return true;
    }, `delete expense ${id}`, 'DATABASE');
    return result.success;
  },

  saveRevenue: async (revenue: Revenue): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS revenues (
          id TEXT PRIMARY KEY, 
          description TEXT, 
          amount REAL, 
          date TEXT, 
          category TEXT
        )
      `);
      await executeQuery(
        'INSERT OR REPLACE INTO revenues (id, description, amount, date, category) VALUES (?, ?, ?, ?, ?)',
        [revenue.id, revenue.description || (revenue as any).source || null, revenue.amount, revenue.date instanceof Date ? revenue.date.toISOString() : (revenue.date || new Date().toISOString()), revenue.category || null]
      );
      return true;
    }, `save revenue ${revenue.id}`, 'DATABASE');
    return result.success;
  },

  saveRevenues: async (revenues: Revenue[]): Promise<boolean> => {
    try {
      if (revenues.length === 0) return true;

      await executeQuery(`
        CREATE TABLE IF NOT EXISTS revenues (
          id TEXT PRIMARY KEY, 
          description TEXT, 
          amount REAL, 
          date TEXT, 
          category TEXT
        )
      `);
      await executeQuery('BEGIN TRANSACTION');
      try {
        for (const rev of revenues) {
          await executeQuery(
            'INSERT OR REPLACE INTO revenues (id, description, amount, date, category) VALUES (?, ?, ?, ?, ?)',
            [
              rev.id, 
              rev.description || (rev as any).source || null, 
              rev.amount, 
              rev.date instanceof Date ? rev.date.toISOString() : (rev.date || new Date().toISOString()), 
              rev.category || null
            ]
          );
        }
        await executeQuery('COMMIT');
        return true;
      } catch (e) {
        await executeQuery('ROLLBACK');
        throw e;
      }
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to save revenues batch', { count: revenues.length, error: error.message }, 'DATABASE');
      return false;
    }
  },

  deleteRevenue: async (id: string): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      await executeQuery('DELETE FROM revenues WHERE id = ?', [id]);
      return true;
    }, `delete revenue ${id}`, 'DATABASE');
    return result.success;
  },

  savePayroll: async (record: PayrollRecord): Promise<boolean> => {
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS payroll_records (
          id TEXT PRIMARY KEY, 
          employee_id TEXT, 
          amount REAL, 
          date TEXT, 
          month INTEGER, 
          year INTEGER, 
          status TEXT,
          net_salary REAL,
          base_salary REAL,
          notes TEXT,
          FOREIGN KEY(employee_id) REFERENCES employees(id)
        )
      `);
      await executeQuery(
        'INSERT OR REPLACE INTO payroll_records (id, employee_id, amount, date, month, year, status, net_salary, base_salary, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          record.id, 
          record.employeeId || (record as any).employee_id || null, 
          record.netSalary || (record as any).amount || 0, 
          record.paymentDate instanceof Date ? record.paymentDate.toISOString() : (record.paymentDate || (record as any).date || new Date().toISOString()), 
          record.month || new Date().getMonth() + 1, 
          record.year || new Date().getFullYear(), 
          record.status || 'PENDENTE',
          record.netSalary || (record as any).amount || 0,
              record.baseSalary || 0,
          record.notes || null
        ]
      );
      return true;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to save payroll record', { id: record.id, error: error.message }, 'DATABASE');
      return false;
    }
  },

  deletePayroll: async (id: string): Promise<boolean> => {
    try {
      await executeQuery('DELETE FROM payroll_records WHERE id = ?', [id]);
      return true;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to delete payroll record', { id, error: error.message }, 'DATABASE');
      return false;
    }
  },
  
  getEmployees: async (): Promise<Employee[]> => {
    try {
      return await selectQuery<Employee>('SELECT * FROM employees ORDER BY name ASC');
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to get employees from SQL', { error: error.message }, 'DATABASE');
      return [];
    }
  },

  saveEmployees: async (employees: Employee[]): Promise<boolean> => {
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS employees (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          phone TEXT,
          salary REAL DEFAULT 0,
          status TEXT DEFAULT 'ATIVO',
          color TEXT,
          work_days_per_month INTEGER DEFAULT 22,
          daily_work_hours INTEGER DEFAULT 8,
          external_bio_id TEXT,
          bi TEXT,
          nif TEXT,
          email TEXT,
          admission_date TEXT,
          active BOOLEAN DEFAULT TRUE,
          social_security TEXT,
          bank_account TEXT,
          work_days INTEGER DEFAULT 22,
          daily_hours INTEGER DEFAULT 8
        )
      `);
      await executeQuery('BEGIN TRANSACTION');
      try {
        for (const emp of employees) {
          await executeQuery(
            'INSERT OR REPLACE INTO employees (id, name, role, salary, phone, email, admission_date, active, nif, social_security, bank_account, status, color, work_days, daily_hours, external_bio_id, bi, work_days_per_month, daily_work_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              emp.id, 
              emp.name || (emp as any).nome || 'Funcionário', 
              emp.role || (emp as any).cargo || 'STAFF', 
              emp.salary || (emp as any).salario || 0, 
              emp.phone || (emp as any).telefone || null, 
              emp.email || null, 
              emp.admissionDate || (emp as any).data_admissao || null, 
              emp.active !== false ? 1 : 0, 
              emp.nif || null, 
              emp.socialSecurityNumber || (emp as any).seguranca_social || null, 
              emp.bankAccount || (emp as any).conta_bancaria || null, 
              emp.status || (emp as any).estado || 'ATIVO', 
              emp.color || null, 
              emp.workDaysPerMonth || (emp as any).dias_trabalho || 22, 
              emp.dailyWorkHours || (emp as any).horas_diarias || 8,
              emp.externalBioId || (emp as any).bio_id || null, 
              emp.bi || null,
              emp.workDaysPerMonth || (emp as any).dias_trabalho || 22, 
              emp.dailyWorkHours || (emp as any).horas_diarias || 8
            ]
          );
        }
        await executeQuery('COMMIT');
        return true;
      } catch (e) {
        await executeQuery('ROLLBACK');
        throw e;
      }
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to save employees batch', { count: employees.length, error: error.message }, 'DATABASE');
      return false;
    }
  },

  /**
   * Get all users from SQL
   */
  getUsers: async (): Promise<User[]> => {
    try {
      // Define a type for the raw DB row
      type UserRow = Omit<User, 'permissions'> & { permissions: string };
      const users = await selectQuery<UserRow>('SELECT * FROM users ORDER BY name ASC');
      return users.map(u => ({
        ...u,
        permissions: u.permissions ? JSON.parse(u.permissions) : []
      })) as User[];
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to get users from SQL', { error: error.message }, 'DATABASE');
      return [];
    }
  },

  /**
   * Save users to SQL
   */
  saveUsers: async (users: User[]): Promise<boolean> => {
    const result = await databaseOperations._handleDatabaseOperation(async () => {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          pin TEXT NOT NULL,
          color TEXT,
          permissions TEXT,
          isActive BOOLEAN DEFAULT TRUE
        )
      `);
      await executeQuery('BEGIN TRANSACTION');
      try {
        for (const u of users) {
          await executeQuery(
            'INSERT OR REPLACE INTO users (id, name, role, pin, color, permissions, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [u.id, u.name, u.role, u.pin, u.color || null, u.permissions ? JSON.stringify(u.permissions) : '[]', u.isActive !== false ? 1 : 0]
          );
        }
        await executeQuery('COMMIT');
        return true;
      } catch (e) {
        await executeQuery('ROLLBACK');
        throw e;
      }
    }, `save ${users.length} users batch`, 'DATABASE');
    return result.success;
  },

  getCustomers: async (): Promise<Customer[]> => {
    try {
      return await selectQuery<Customer>('SELECT * FROM customers ORDER BY name ASC');
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to get customers from SQL', { error: error.message }, 'DATABASE');
      return [];
    }
  },

  saveCustomers: async (customers: Customer[]): Promise<boolean> => {
    try {
      if (customers.length === 0) return true;

      await executeQuery(`
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT,
          nif TEXT,
          points INTEGER DEFAULT 0,
          visits INTEGER DEFAULT 0,
          last_visit DATETIME,
          balance REAL DEFAULT 0
        )
      `);
      await executeQuery('BEGIN TRANSACTION');
      try {
        for (const c of customers) {
          await executeQuery(
            'INSERT OR REPLACE INTO customers (id, name, phone, nif, points, visits, last_visit, balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              c.id, 
              c.name || (c as any).nome || 'Cliente', 
              c.phone || (c as any).telefone || null, 
              c.nif || null, 
              c.points || (c as any).pontos || 0, 
              c.visits || (c as any).visitas || 0, 
              c.lastVisit || (c as any).last_visit || null, 
              c.balance || (c as any).saldo || 0
            ]
          );
        }
        await executeQuery('COMMIT');
        return true;
      } catch (e) {
        await executeQuery('ROLLBACK');
        throw e;
      }
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to save customers to SQL', { count: customers.length, error: error.message }, 'DATABASE');
      return false;
    }
  },

  saveCustomer: async (customer: Customer): Promise<boolean> => {
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT,
          nif TEXT,
          points INTEGER DEFAULT 0,
          visits INTEGER DEFAULT 0,
          last_visit DATETIME,
          balance REAL DEFAULT 0
        )
      `);
      await executeQuery(
        'INSERT OR REPLACE INTO customers (id, name, phone, nif, points, visits, last_visit, balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          customer.id, 
          customer.name || (customer as any).nome || 'Cliente', 
          customer.phone || (customer as any).telefone || null, 
          customer.nif || null, 
          customer.points || (customer as any).pontos || 0, 
          customer.visits || (customer as any).visitas || 0, 
          customer.lastVisit || (customer as any).last_visit || null, 
          customer.balance || (customer as any).saldo || 0
        ]
      );
      return true;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to save customer', { id: customer.id, error: error.message }, 'DATABASE');
      return false;
    }
  },

  deleteCustomer: async (id: string): Promise<boolean> => {
    try {
      await executeQuery('DELETE FROM customers WHERE id = ?', [id]);
      return true;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to delete customer', { id, error: error.message }, 'DATABASE');
      return false;
    }
  },

  getAttendance: async (): Promise<AttendanceRecord[]> => {
    try {
      return await selectQuery<AttendanceRecord>('SELECT * FROM attendance_records ORDER BY date DESC');
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to get attendance from SQL', { error: error.message }, 'DATABASE');
      return [];
    }
  },

  saveAttendance: async (records: AttendanceRecord[]): Promise<boolean> => {
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS attendance_records (
          id TEXT PRIMARY KEY,
          employee_id TEXT NOT NULL,
          date TEXT NOT NULL,
          clock_in DATETIME,
          clock_out DATETIME,
          total_hours REAL DEFAULT 0,
          is_late BOOLEAN DEFAULT 0,
          late_minutes INTEGER DEFAULT 0,
          overtime_hours REAL DEFAULT 0,
          is_absence BOOLEAN DEFAULT 0,
          status TEXT,
          justification TEXT,
          source TEXT DEFAULT 'MANUAL',
          FOREIGN KEY(employee_id) REFERENCES employees(id)
        )
      `);
      await executeQuery('BEGIN TRANSACTION');
      try {
        for (const r of records) {
          await executeQuery(
            'INSERT OR REPLACE INTO attendance_records (id, employee_id, date, clock_in, clock_out, total_hours, is_late, late_minutes, overtime_hours, is_absence, status, justification, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              r.id, 
              r.employeeId || (r as any).employee_id || null, 
              r.date || (r as any).data || new Date().toISOString().split('T')[0], 
              r.clockIn || (r as any).entrada || null, 
              r.clockOut || (r as any).saida || null, 
              r.totalHours || (r as any).horas_totais || 0, 
              (r.isLate || (r as any).atrasado) ? 1 : 0, 
              r.lateMinutes || (r as any).minutos_atraso || 0, 
              r.overtimeHours || (r as any).horas_extra || 0, 
              (r.isAbsence || (r as any).falta) ? 1 : 0, 
              r.status || 'PRESENTE', 
              r.justification || (r as any).justificativa || null, 
              r.source || 'MANUAL'
            ]
          );
        }
        await executeQuery('COMMIT');
        return true;
      } catch (e) {
        await executeQuery('ROLLBACK');
        throw e;
      }
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to save attendance to SQL', { count: records.length, error: error.message }, 'DATABASE');
      return false;
    }
  },

  clearAllData: async (): Promise<boolean> => {
    try {
      await executeQuery('BEGIN TRANSACTION');
      try {
        const tables = [
          'order_items', 'orders', 'dishes', 'menu_categories', 
          'restaurant_tables', 'stock_items', 'expenses', 'revenues',
          'employees', 'attendance_records', 'system_settings', 'users',
          'customers', 'payroll_records', 'cash_shifts', 'suppliers'
        ];
        for (const table of tables) {
          // Check if table exists before trying to delete
          await executeQuery(`DELETE FROM ${table}`).catch(() => {
            logger.warn(`Table ${table} does not exist or could not be cleared`, undefined, 'DATABASE');
          });
        }
        await executeQuery('COMMIT');
        return true;
      } catch (e) {
        await executeQuery('ROLLBACK');
        throw e;
      }
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to clear database', { error: error.message }, 'DATABASE');
      return false;
    }
  },

  deleteTable: async (id: number): Promise<boolean> => {
      try {
          await executeQuery('DELETE FROM restaurant_tables WHERE id = ?', [id]);
          return true;
      } catch (e: unknown) {
          const error = e as Error;
          logger.error('Failed to delete table', { id, error: error.message }, 'DATABASE');
          return false;
      }
  },

  deleteEmployee: async (id: string): Promise<boolean> => {
    try {
        await executeQuery('DELETE FROM employees WHERE id = ?', [id]);
        return true;
    } catch (e: unknown) {
        const error = e as Error;
        logger.error('Failed to delete employee', { id, error: error.message }, 'DATABASE');
        return false;
    }
  },

  /**
   * Settings Persistence
   */

  savePayrolls: async (records: PayrollRecord[]): Promise<boolean> => {
    try {
      if (records.length === 0) return true;

      await executeQuery(`
        CREATE TABLE IF NOT EXISTS payroll_records (
          id TEXT PRIMARY KEY, 
          employee_id TEXT, 
          amount REAL, 
          date TEXT, 
          month INTEGER, 
          year INTEGER, 
          status TEXT,
          net_salary REAL,
          base_salary REAL,
          notes TEXT,
          FOREIGN KEY(employee_id) REFERENCES employees(id)
        )
      `);
      await executeQuery('BEGIN TRANSACTION');
      try {
        for (const record of records) {
          await executeQuery(
            'INSERT OR REPLACE INTO payroll_records (id, employee_id, amount, date, month, year, status, net_salary, base_salary, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              record.id, 
              record.employeeId || (record as any).employee_id || null, 
              record.netSalary || (record as any).amount || 0, 
              record.paymentDate instanceof Date ? record.paymentDate.toISOString() : (record.paymentDate || (record as any).date || new Date().toISOString()), 
              record.month || new Date().getMonth() + 1, 
              record.year || new Date().getFullYear(), 
              record.status || 'PENDENTE',
              record.netSalary || (record as any).amount || 0,
              record.baseSalary || 0,
              record.notes || null
            ]
          );
        }
        await executeQuery('COMMIT');
        return true;
      } catch (e) {
        await executeQuery('ROLLBACK');
        throw e;
      }
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to save payrolls batch', { count: records.length, error: error.message }, 'DATABASE');
      return false;
    }
  },

  getShifts: async (): Promise<CashShift[]> => {
    try {
      return await selectQuery<CashShift>('SELECT * FROM cash_shifts ORDER BY start_time DESC');
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to get shifts from SQL', { error: error.message }, 'DATABASE');
      return [];
    }
  },

  getPayrollRecords: async (): Promise<PayrollRecord[]> => {
    try {
      return await selectQuery<PayrollRecord>('SELECT * FROM payroll_records ORDER BY year DESC, month DESC');
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Failed to get payroll records from SQL', { error: error.message }, 'DATABASE');
      return [];
    }
  },

  saveSettings: async (settings: SystemSettings): Promise<boolean> => {
      try {
          // Ensure table exists (idempotent)
          await executeQuery('CREATE TABLE IF NOT EXISTS system_settings (key TEXT PRIMARY KEY, value TEXT)');
          
          const settingsToSave = settings || {};
          const json = JSON.stringify(settingsToSave);
          await executeQuery('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)', ['app_settings', json]);
          
          // Debug log for settings persistence
          logger.info('Settings saved to local SQL', { 
            qrMenuUrl: (settingsToSave as any).qrMenuUrl,
            qrMenuShortCode: (settingsToSave as any).qrMenuShortCode 
          }, 'DATABASE');
          
          return true;
      } catch (e: unknown) {
          const error = e as Error;
          logger.error('Failed to save settings', { error: error.message }, 'DATABASE');
          return false;
      }
  },

  getSettings: async (): Promise<SystemSettings | null> => {
      try {
          await executeQuery('CREATE TABLE IF NOT EXISTS system_settings (key TEXT PRIMARY KEY, value TEXT)');
          const result = await selectQuery<{value: string}>('SELECT value FROM system_settings WHERE key = ?', ['app_settings']);
          if (result.length > 0) {
              return JSON.parse(result[0].value);
          }
          return null;
      } catch (e: unknown) {
          const error = e as Error;
          logger.error('Failed to get settings', { error: error.message }, 'DATABASE');
          return null;
      }
  }
};
