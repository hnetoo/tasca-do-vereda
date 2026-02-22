import sql from '@/lib/postgres';
import { MenuCategory, Dish, Order, Table, Customer, Reservation, StockItem, CashShift, Delivery, SystemSettings, Fornecedor, Employee, Database } from '@/types';
import { logger } from '@/services/logger';
import { v4 as uuidv4 } from 'uuid';
import { isValidUUID } from '@/utils/uuid';

async function withRetry<T>(
  operation: () => Promise<T>, 
  retries = 3, 
  delay = 1000,
  operationName = 'Operation'
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      logger.warn(`${operationName} failed (attempt ${i + 1}/${retries})`, { error: error.message }, 'DATABASE_DIRECT');
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i))); // Exponential backoff
      }
    }
  }
  throw lastError;
}

export const directOperations = {
  getEmployees: async (): Promise<{ success: boolean; data: Employee[]; error?: string }> => {
    try {
        const employees = await withRetry(async () => {
            return await sql<Database['public']['Tables']['employees']['Row'][]>`
                SELECT * FROM employees
                ORDER BY name ASC
            `;
        }, 3, 1000, 'fetch employees');

        const mappedEmployees = employees.map((e: any) => ({
            id: e.id,
            name: e.name,
            role: e.role,
            pin: e.pin,
            email: e.email,
            phone: e.phone,
            active: (e as any).active ?? true, // Handle potential schema mismatch if active/is_active differs
            created_at: e.created_at,
            updated_at: e.updated_at
        }));

        return { success: true, data: mappedEmployees };
    } catch (error: any) {
        logger.error('Error fetching employees (direct)', { error: error.message }, 'DATABASE_DIRECT');
        return { success: false, data: [], error: error.message };
    }
  },

  saveEmployee: async (employee: Employee): Promise<{ success: boolean; error?: string }> => {
    try {
      const dbEmployee = {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        pin: employee.pin || null,
        email: employee.email || null,
        phone: employee.phone || null,
        active: employee.active ?? true,
        updated_at: new Date().toISOString()
      };

      // Check if trying to delete/deactivate last admin
      if (employee.active === false && employee.role === 'ADMIN') {
         const admins = await sql`SELECT count(*) FROM employees WHERE role = 'ADMIN' AND active = true AND id != ${employee.id}`;
         if (admins[0].count === '0') {
             return { success: false, error: 'Não é possível desativar o último administrador.' };
         }
      }

      await sql`
        INSERT INTO employees ${sql(dbEmployee)}
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          pin = EXCLUDED.pin,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          active = EXCLUDED.active,
          updated_at = EXCLUDED.updated_at
      `;
      return { success: true };
    } catch (error: any) {
      logger.error(`Error saving employee (direct) ${employee.id}`, { error: error.message }, 'DATABASE_DIRECT');
      return { success: false, error: error.message };
    }
  },

  deleteEmployee: async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
        // Check if deleting last admin
        const employee = await sql`SELECT role FROM employees WHERE id = ${id}`;
        if (employee.length > 0 && employee[0].role === 'ADMIN') {
            const admins = await sql`SELECT count(*) FROM employees WHERE role = 'ADMIN' AND id != ${id}`;
            if (admins[0].count === '0') {
                return { success: false, error: 'Não é possível eliminar o último administrador.' };
            }
        }

        await sql`DELETE FROM employees WHERE id = ${id}`;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
  },

  saveCategory: async (category: MenuCategory): Promise<{ success: boolean; error?: string }> => {
    try {
      logger.debug(`Saving category directly via Postgres: ${category.id}`, { category }, 'DATABASE_DIRECT');
      
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

      await sql`
        INSERT INTO menu_categories ${sql(dbCategory)}
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          icon = EXCLUDED.icon,
          sort_order = EXCLUDED.sort_order,
          is_active = EXCLUDED.is_active,
          parent_id = EXCLUDED.parent_id,
          is_available_on_digital_menu = EXCLUDED.is_available_on_digital_menu,
          updated_at = EXCLUDED.updated_at
      `;

      logger.info(`Category ${category.id} saved successfully (direct)`, undefined, 'DATABASE_DIRECT');
      return { success: true };
    } catch (error: any) {
      logger.error(`Error saving category (direct) ${category.id}`, { error: error.message }, 'DATABASE_DIRECT');
      return { success: false, error: error.message };
    }
  },

  saveDish: async (dish: Dish): Promise<{ success: boolean; error?: string }> => {
    try {
      logger.debug(`Saving dish directly via Postgres: ${dish.id}`, { dish }, 'DATABASE_DIRECT');
      
      const dbDish = {
        id: dish.id,
        name: dish.name,
        description: dish.description || null,
        price: dish.price,
        cost_price: dish.costPrice || 0,
        category_id: dish.categoryId && isValidUUID(dish.categoryId) ? dish.categoryId : null,
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
        supplier_id: dish.supplierId && isValidUUID(dish.supplierId) ? dish.supplierId : null,
        updated_at: new Date().toISOString()
      };

      await sql`
        INSERT INTO dishes ${sql(dbDish)}
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          cost_price = EXCLUDED.cost_price,
          category_id = EXCLUDED.category_id,
          image_url = EXCLUDED.image_url,
          tax_code = EXCLUDED.tax_code,
          tax_percentage = EXCLUDED.tax_percentage,
          preparation_time = EXCLUDED.preparation_time,
          is_active = EXCLUDED.is_active,
          available = EXCLUDED.available,
          is_available_on_digital_menu = EXCLUDED.is_available_on_digital_menu,
          track_stock = EXCLUDED.track_stock,
          stock_quantity = EXCLUDED.stock_quantity,
          min_stock_quantity = EXCLUDED.min_stock_quantity,
          max_stock_quantity = EXCLUDED.max_stock_quantity,
          unit = EXCLUDED.unit,
          supplier_id = EXCLUDED.supplier_id,
          updated_at = EXCLUDED.updated_at
      `;

      logger.info(`Dish ${dish.id} saved successfully (direct)`, undefined, 'DATABASE_DIRECT');
      return { success: true };
    } catch (error: any) {
      // Enhanced error logging
      const errorDetails = {
        message: error.message,
        code: error.code,
        detail: error.detail,
        constraint: error.constraint
      };
      logger.error(`Error saving dish (direct) ${dish.id}`, { error: errorDetails }, 'DATABASE_DIRECT');
      
      // Friendly error messages based on constraints
      if (error.code === '23503') { // Foreign key violation
          if (error.constraint === 'dishes_category_id_fkey') {
              return { success: false, error: 'Categoria selecionada não existe.' };
          }
          if (error.constraint === 'dishes_supplier_id_fkey') {
              return { success: false, error: 'Fornecedor selecionado não existe.' };
          }
      }
      
      return { success: false, error: error.message };
    }
  },
  
  deleteCategory: async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
        await sql`DELETE FROM menu_categories WHERE id = ${id}`;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
  },

  deleteDish: async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
        await sql`DELETE FROM dishes WHERE id = ${id}`;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
  },

  saveCategories: async (categories: MenuCategory[]): Promise<boolean> => {
    if (categories.length === 0) return true;
    try {
      const dbCategories = categories.map(category => ({
        id: category.id,
        name: category.name,
        icon: category.icon,
        sort_order: category.sortOrder || 0,
        is_active: category.isActive ?? true,
        parent_id: category.parentId || null,
        is_available_on_digital_menu: category.isAvailableOnDigitalMenu ?? true,
        updated_at: new Date().toISOString()
      }));

      await sql`
        INSERT INTO menu_categories ${sql(dbCategories)}
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          icon = EXCLUDED.icon,
          sort_order = EXCLUDED.sort_order,
          is_active = EXCLUDED.is_active,
          parent_id = EXCLUDED.parent_id,
          is_available_on_digital_menu = EXCLUDED.is_available_on_digital_menu,
          updated_at = EXCLUDED.updated_at
      `;
      return true;
    } catch (error: any) {
      logger.error('Error saving categories (direct)', { error: error.message }, 'DATABASE_DIRECT');
      return false;
    }
  },

  saveDishes: async (dishes: Dish[]): Promise<boolean> => {
    if (dishes.length === 0) return true;
    try {
      const dbDishes = dishes.map(dish => ({
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
      }));

      await sql`
        INSERT INTO dishes ${sql(dbDishes)}
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          cost_price = EXCLUDED.cost_price,
          category_id = EXCLUDED.category_id,
          image_url = EXCLUDED.image_url,
          tax_code = EXCLUDED.tax_code,
          tax_percentage = EXCLUDED.tax_percentage,
          preparation_time = EXCLUDED.preparation_time,
          is_active = EXCLUDED.is_active,
          available = EXCLUDED.available,
          is_available_on_digital_menu = EXCLUDED.is_available_on_digital_menu,
          track_stock = EXCLUDED.track_stock,
          stock_quantity = EXCLUDED.stock_quantity,
          min_stock_quantity = EXCLUDED.min_stock_quantity,
          max_stock_quantity = EXCLUDED.max_stock_quantity,
          unit = EXCLUDED.unit,
          supplier_id = EXCLUDED.supplier_id,
          updated_at = EXCLUDED.updated_at
      `;
      return true;
    } catch (error: any) {
      logger.error('Error saving dishes (direct)', { error: error.message }, 'DATABASE_DIRECT');
      return false;
    }
  },

  getCategories: async (): Promise<{ success: boolean; data: MenuCategory[]; error?: string }> => {
    try {
      const categories = await withRetry(async () => {
          return await sql<Database['public']['Tables']['menu_categories']['Row'][]>`
            SELECT * FROM menu_categories
            ORDER BY sort_order ASC
          `;
      }, 3, 1000, 'fetch categories');
      
      const mappedCategories = categories.map((r: any) => ({
        id: r.id,
        name: r.name,
        icon: r.icon,
        sortOrder: r.sort_order || 0,
        isActive: r.is_active ?? true,
        parentId: r.parent_id || null,
        isAvailableOnDigitalMenu: r.is_available_on_digital_menu ?? true
      }));

      return { success: true, data: mappedCategories };
    } catch (error: any) {
      logger.error('Error fetching categories (direct)', { error: error.message }, 'DATABASE_DIRECT');
      return { success: false, data: [], error: error.message };
    }
  },

  getDishes: async (): Promise<{ success: boolean; data: Dish[]; error?: string }> => {
    try {
      const dishes = await withRetry(async () => {
          return await sql<Database['public']['Tables']['dishes']['Row'][]>`
            SELECT * FROM dishes
          `;
      }, 3, 1000, 'fetch dishes');
      
      const mappedDishes = dishes.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        price: Number(r.price),
        costPrice: Number(r.cost_price || 0),
        categoryId: r.category_id,
        imageUrl: r.image_url,
        taxCode: r.tax_code,
        taxPercentage: Number(r.tax_percentage),
        preparationTime: r.preparation_time,
        isActive: r.is_active ?? true,
        available: r.available ?? true,
        isAvailableOnDigitalMenu: r.is_available_on_digital_menu ?? true,
        trackStock: r.track_stock ?? false,
        stockQuantity: Number(r.stock_quantity || 0),
        minStockQuantity: Number(r.min_stock_quantity || 0),
        maxStockQuantity: r.max_stock_quantity ? Number(r.max_stock_quantity) : undefined,
        unit: r.unit || 'unidade',
        supplierId: r.supplier_id
      }));

      return { success: true, data: mappedDishes };
    } catch (error: any) {
      logger.error('Error fetching dishes (direct)', { error: error.message }, 'DATABASE_DIRECT');
      return { success: false, data: [], error: error.message };
    }
  },

  saveOrder: async (order: Order): Promise<{ success: boolean; error?: string }> => {
    try {
      logger.debug(`Saving order directly via Postgres: ${order.id}`, { order }, 'DATABASE_DIRECT');

      const dbOrder = {
          id: order.id,
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
          user_name: (order as any).user_name || order.userName || null
      };

      await sql.begin(async (sql: any) => {
          await sql`
            INSERT INTO orders ${sql(dbOrder)}
            ON CONFLICT (id) DO UPDATE SET
              table_id = EXCLUDED.table_id,
              status = EXCLUDED.status,
              timestamp = EXCLUDED.timestamp,
              total = EXCLUDED.total,
              tax_total = EXCLUDED.tax_total,
              payment_method = EXCLUDED.payment_method,
              customer_id = EXCLUDED.customer_id,
              shift_id = EXCLUDED.shift_id,
              sub_account_name = EXCLUDED.sub_account_name,
              invoice_number = EXCLUDED.invoice_number,
              hash = EXCLUDED.hash,
              previous_hash = EXCLUDED.previous_hash,
              signature = EXCLUDED.signature,
              jws_payload = EXCLUDED.jws_payload,
              is_synced_agt = EXCLUDED.is_synced_agt,
              agt_submission_uuid = EXCLUDED.agt_submission_uuid,
              user_id = EXCLUDED.user_id,
              user_name = EXCLUDED.user_name
          `;

          await sql`DELETE FROM order_items WHERE order_id = ${order.id}`;

          if (order.items && order.items.length > 0) {
              const dbItems = order.items.map(item => ({
                  id: item.id || uuidv4(),
                  order_id: order.id,
                  dish_id: (item as any).dish_id || item.dishId,
                  quantity: item.quantity || 1,
                  unit_price: (item as any).unit_price || item.unitPrice || item.price || 0,
                  tax_amount: (item as any).tax_amount || item.taxAmount || 0,
                  tax_percentage: (item as any).tax_percentage || item.taxPercentage || 14,
                  tax_code: (item as any).tax_code || item.taxCode || 'NOR',
                  notes: item.notes || null,
                  status: item.status || 'PENDENTE'
              }));
              await sql`INSERT INTO order_items ${sql(dbItems)}`;
          }
      });
      return { success: true };
    } catch (error: any) {
      logger.error(`Error saving order (direct) ${order.id}`, { error: error.message }, 'DATABASE_DIRECT');
      return { success: false, error: error.message };
    }
  },

  saveTable: async (table: Table): Promise<{ success: boolean; error?: string }> => {
    try {
      const { activeOrderIds, ...dbTable } = table;
      await sql`
        INSERT INTO restaurant_tables ${sql(dbTable as any)}
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          number = EXCLUDED.number,
          seats = EXCLUDED.seats,
          zone = EXCLUDED.zone,
          shape = EXCLUDED.shape,
          width = EXCLUDED.width,
          height = EXCLUDED.height,
          x = EXCLUDED.x,
          y = EXCLUDED.y,
          rotation = EXCLUDED.rotation,
          color = EXCLUDED.color,
          is_active = EXCLUDED.is_active,
          group_id = EXCLUDED.group_id,
          updated_at = EXCLUDED.updated_at,
          user_id = EXCLUDED.user_id,
          label = EXCLUDED.label,
          status = EXCLUDED.status
      `;
      return { success: true };
    } catch (error: any) {
      logger.error(`Error saving table (direct) ${table.id}`, { error: error.message }, 'DATABASE_DIRECT');
      return { success: false, error: error.message };
    }
  },

  saveCustomer: async (customer: Customer): Promise<{ success: boolean; error?: string }> => {
    try {
      const dbCustomer = {
        id: customer.id,
        name: customer.name,
        nif: customer.nif || null,
        phone: customer.phone || null,
        email: customer.email || null,
        address: customer.address || null,
        created_at: customer.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await sql`
        INSERT INTO customers ${sql(dbCustomer)}
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          nif = EXCLUDED.nif,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          address = EXCLUDED.address,
          updated_at = EXCLUDED.updated_at
      `;
      return { success: true };
    } catch (error: any) {
      logger.error(`Error saving customer (direct) ${customer.id}`, { error: error.message }, 'DATABASE_DIRECT');
      return { success: false, error: error.message };
    }
  },

  saveReservation: async (reservation: Reservation): Promise<{ success: boolean; error?: string }> => {
    try {
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
        created_at: reservation.createdAt instanceof Date ? reservation.createdAt.toISOString() : (reservation.createdAt || new Date().toISOString()),
        updated_at: reservation.updatedAt instanceof Date ? reservation.updatedAt.toISOString() : (reservation.updatedAt || new Date().toISOString())
      };
      await sql`
        INSERT INTO reservations ${sql(dbReservation)}
        ON CONFLICT (id) DO UPDATE SET
          table_id = EXCLUDED.table_id,
          customer_name = EXCLUDED.customer_name,
          customer_phone = EXCLUDED.customer_phone,
          date = EXCLUDED.date,
          time = EXCLUDED.time,
          guests = EXCLUDED.guests,
          status = EXCLUDED.status,
          notes = EXCLUDED.notes,
          updated_at = EXCLUDED.updated_at
      `;
      return { success: true };
    } catch (error: any) {
      logger.error(`Error saving reservation (direct) ${reservation.id}`, { error: error.message }, 'DATABASE_DIRECT');
      return { success: false, error: error.message };
    }
  },

  saveStockItem: async (item: StockItem): Promise<{ success: boolean; error?: string }> => {
    try {
      const dbItem = {
        ...item,
        min_threshold: item.minThreshold ?? (item as any).min_threshold,
        created_at: item.createdAt instanceof Date ? item.createdAt.toISOString() : (item.createdAt || (item as any).created_at || new Date().toISOString()),
        updated_at: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : (item.updatedAt || (item as any).updated_at || new Date().toISOString())
      };
      
      delete (dbItem as any).minThreshold;
      delete (dbItem as any).createdAt;
      delete (dbItem as any).updatedAt;

      await sql`
        INSERT INTO stock_items ${sql(dbItem as any)}
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          quantity = EXCLUDED.quantity,
          unit = EXCLUDED.unit,
          min_threshold = EXCLUDED.min_threshold,
          updated_at = EXCLUDED.updated_at
      `;
      return { success: true };
    } catch (error: any) {
      logger.error(`Error saving stock item (direct) ${item.id}`, { error: error.message }, 'DATABASE_DIRECT');
      return { success: false, error: error.message };
    }
  },

  saveShift: async (shift: CashShift): Promise<{ success: boolean; error?: string }> => {
    try {
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
      await sql`
        INSERT INTO cash_shifts ${sql(dbShift)}
        ON CONFLICT (id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          user_name = EXCLUDED.user_name,
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time,
          opening_balance = EXCLUDED.opening_balance,
          closing_balance = EXCLUDED.closing_balance,
          expected_balance = EXCLUDED.expected_balance,
          status = EXCLUDED.status
      `;
      return { success: true };
    } catch (error: any) {
      logger.error(`Error saving shift (direct) ${shift.id}`, { error: error.message }, 'DATABASE_DIRECT');
      return { success: false, error: error.message };
    }
  },

  saveDelivery: async (delivery: Delivery): Promise<{ success: boolean; error?: string }> => {
    try {
      const dbDelivery = {
        id: delivery.id,
        order_id: delivery.orderId || (delivery as any).order_id,
        driver_name: delivery.driverName || (delivery as any).driver_name,
        status: delivery.status,
        address: delivery.address,
        customer_name: delivery.customerName || (delivery as any).customer_name,
        customer_phone: delivery.customerPhone || (delivery as any).customer_phone,
        start_time: delivery.startTime instanceof Date ? delivery.startTime.toISOString() : delivery.startTime || (delivery as any).start_time,
        end_time: delivery.endTime instanceof Date ? delivery.endTime.toISOString() : delivery.endTime || (delivery as any).end_time
      };
      await sql`
        INSERT INTO deliveries ${sql(dbDelivery)}
        ON CONFLICT (id) DO UPDATE SET
          order_id = EXCLUDED.order_id,
          driver_name = EXCLUDED.driver_name,
          status = EXCLUDED.status,
          address = EXCLUDED.address,
          customer_name = EXCLUDED.customer_name,
          customer_phone = EXCLUDED.customer_phone,
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time
      `;
      return { success: true };
    } catch (error: any) {
      logger.error(`Error saving delivery (direct) ${delivery.id}`, { error: error.message }, 'DATABASE_DIRECT');
      return { success: false, error: error.message };
    }
  },

  saveSettings: async (settings: SystemSettings): Promise<{ success: boolean; error?: string }> => {
    try {
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
      
      // Clean undefined
      Object.keys(dbSettings).forEach(key => (dbSettings as any)[key] === undefined && delete (dbSettings as any)[key]);

      await sql`
        INSERT INTO settings ${sql(dbSettings)}
        ON CONFLICT (id) DO UPDATE SET
          restaurant_name = EXCLUDED.restaurant_name,
          nif = EXCLUDED.nif,
          address = EXCLUDED.address,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          tax_percentage = EXCLUDED.tax_percentage,
          currency = EXCLUDED.currency,
          timezone = EXCLUDED.timezone,
          language = EXCLUDED.language,
          supabase_config = EXCLUDED.supabase_config,
          printer_config = EXCLUDED.printer_config,
          backup_config = EXCLUDED.backup_config,
          app_logo_url = EXCLUDED.app_logo_url,
          agt_certificate = EXCLUDED.agt_certificate,
          open_drawer_code = EXCLUDED.open_drawer_code,
          admin_pin = EXCLUDED.admin_pin,
          api_token = EXCLUDED.api_token,
          wifi_name = EXCLUDED.wifi_name,
          wifi_password = EXCLUDED.wifi_password,
          qr_code_title = EXCLUDED.qr_code_title,
          qr_code_subtitle = EXCLUDED.qr_code_subtitle,
          qr_code_short_code = EXCLUDED.qr_code_short_code,
          qr_menu_url = EXCLUDED.qr_menu_url,
          qr_menu_cloud_url = EXCLUDED.qr_menu_cloud_url,
          logo_url = EXCLUDED.logo_url,
          name = EXCLUDED.name
      `;
      return { success: true };
    } catch (error: any) {
      logger.error(`Error saving settings (direct) ${settings.id}`, { error: error.message }, 'DATABASE_DIRECT');
      return { success: false, error: error.message };
    }
  },

  saveSupplier: async (supplier: Fornecedor): Promise<{ success: boolean; error?: string }> => {
    try {
        await sql`
            INSERT INTO suppliers ${sql(supplier as any)}
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                contact = EXCLUDED.contact,
                email = EXCLUDED.email,
                nif = EXCLUDED.nif,
                address = EXCLUDED.address,
                notes = EXCLUDED.notes
        `;
        return { success: true };
    } catch (error: any) {
        logger.error(`Error saving supplier (direct) ${supplier.id}`, { error: error.message }, 'DATABASE_DIRECT');
        return { success: false, error: error.message };
    }
  },


};
