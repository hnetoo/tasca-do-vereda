import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MenuCategory, Dish, Employee, Table, Customer, Reservation, StockItem, CashShift, Delivery, Order, Fornecedor, SystemSettings, OrderItem, UUID, TableStatus } from '@/types';
import { logger } from '@/services/logger';
import { isValidUUID } from '@/utils/uuid';
import { v4 as uuidv4 } from 'uuid';
import { MOCK_USERS } from '@/constants/index';

export const adminOperations = {
  updateTableStatus: async (tableId: string, status: TableStatus): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseAdmin) return { success: false, error: 'A chave de serviço do Supabase não está configurada.' };
    
    console.log('🔄 [ADMIN OPERATIONS] Atualizando status da mesa:', { tableId, status });
    
    try {
      // Verificar se a mesa existe antes de atualizar
      const { data: existingTable, error: fetchError } = await supabaseAdmin
        .from('restaurant_tables')
        .select('id, number, status')
        .eq('id', tableId)
        .single();

      if (fetchError) {
        console.error('❌ [ADMIN OPERATIONS] Erro ao buscar mesa:', fetchError);
        return { success: false, error: `Mesa não encontrada: ${fetchError.message}` };
      }

      if (!existingTable) {
        console.error('❌ [ADMIN OPERATIONS] Mesa não encontrada:', tableId);
        return { success: false, error: `Mesa com ID ${tableId} não encontrada` };
      }

      console.log('📋 [ADMIN OPERATIONS] Mesa encontrada:', existingTable);

      // Atualizar o status
      const { error } = await supabaseAdmin
        .from('restaurant_tables')
        .update({ 
          status: status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', tableId);

      if (error) {
        console.error('❌ [ADMIN OPERATIONS] Erro ao atualizar status:', error);
        logger.error('Erro ao atualizar o estado da mesa (admin)', { 
          tableId, 
          status, 
          error: error.message,
          details: error 
        }, 'DATABASE_ADMIN');
        return { success: false, error: `Erro ao atualizar: ${error.message}` };
      }

      console.log('✅ [ADMIN OPERATIONS] Status atualizado com sucesso:', { tableId, newStatus: status });
      return { success: true };
    } catch (error: any) {
      console.error('❌ [ADMIN OPERATIONS] Exceção ao atualizar status:', error);
      logger.error('Exceção ao atualizar o estado da mesa (admin)', { 
        tableId, 
        status, 
        error: error.message,
        stack: error.stack 
      }, 'DATABASE_ADMIN');
      return { success: false, error: `Exceção: ${error.message}` };
    }
  },
  getEmployees: async (): Promise<{ success: boolean; data: Employee[]; error?: string }> => {
    if (!supabaseAdmin) return { success: false, data: [], error: 'Supabase Service Role Key not configured.' };
    
    try {
        const { data, error } = await supabaseAdmin
            .from('employees')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        let employees = data as Employee[];

        // Auto-seed default users if missing (e.g. fresh install or only owner exists)
        // This ensures all standard users (Waiter, Chef, Cashier) appear on login
        if (employees.length <= 1) { 
            const missingUsers = MOCK_USERS.filter(mock => 
                !employees.some(e => e.role === mock.role || e.name === mock.name)
            );

            if (missingUsers.length > 0) {
                logger.info('Seeding default employees...', { count: missingUsers.length }, 'DATABASE_ADMIN');
                const toInsert = missingUsers.map(u => ({
                    id: uuidv4(), // Generate valid UUID
                    name: u.name,
                    role: u.role,
                    pin: u.pin,
                    active: true,
                    updated_at: new Date().toISOString()
                }));

                const { data: newEmployees, error: insertError } = await supabaseAdmin
                    .from('employees')
                    .insert(toInsert)
                    .select();
                
                if (!insertError && newEmployees) {
                    // Combine existing and new employees
                    // Use type assertion carefully as database types might differ slightly
                    employees = [...employees, ...newEmployees as unknown as Employee[]];
                    logger.info('Default employees seeded successfully', undefined, 'DATABASE_ADMIN');
                } else {
                    logger.error('Failed to seed employees', { error: insertError?.message }, 'DATABASE_ADMIN');
                }
            }
        }
        
        return { success: true, data: employees };
    } catch (error: any) {
        logger.error('Error fetching employees (admin)', { error: error.message }, 'DATABASE_ADMIN');
        return { success: false, data: [], error: error.message };
    }
  },

  saveEmployee: async (employee: Employee): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };

    try {
        const dbEmployee = {
            id: employee.id,
            name: employee.name,
            role: employee.role,
            pin: employee.pin || null,
            email: employee.email || null,
            phone: employee.phone || null,
            active: employee.active ?? true,
            updated_at: new Date().toISOString(),
            permissions: employee.permissions || null
        };

        const { error } = await supabaseAdmin
            .from('employees')
            .upsert(dbEmployee);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        logger.error('Error saving employee (admin)', { error: error.message }, 'DATABASE_ADMIN');
        return { success: false, error: error.message };
    }
  },

  deleteEmployee: async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };

    try {
        const { error } = await supabaseAdmin
            .from('employees')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        logger.error('Error deleting employee (admin)', { error: error.message }, 'DATABASE_ADMIN');
        return { success: false, error: error.message };
    }
  },

  saveDish: async (dish: Dish): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };

    try {
        logger.debug('Attempting to save dish (admin)', { dish }, 'DATABASE_ADMIN');
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

        const { error } = await supabaseAdmin
            .from('dishes')
            .upsert(dbDish);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        logger.error('Error saving dish (admin)', { dish, error: error.message }, 'DATABASE_ADMIN');
        return { success: false, error: error.message };
    }
  },

  saveCategory: async (category: MenuCategory): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };

    try {
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

        const { error } = await supabaseAdmin
            .from('menu_categories')
            .upsert(dbCategory);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        logger.error('Error saving category (admin)', { error: error.message }, 'DATABASE_ADMIN');
        return { success: false, error: error.message };
    }
  },

  deleteDish: async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };

    try {
        const { error } = await supabaseAdmin
            .from('dishes')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        logger.error('Error deleting dish (admin)', { error: error.message }, 'DATABASE_ADMIN');
        return { success: false, error: error.message };
    }
  },

  deleteCategory: async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };

    try {
        const { error } = await supabaseAdmin
            .from('menu_categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        logger.error('Error deleting category (admin)', { error: error.message }, 'DATABASE_ADMIN');
        return { success: false, error: error.message };
    }
  },

  getCategories: async (): Promise<{ success: boolean; data: MenuCategory[]; error?: string }> => {
    if (!supabaseAdmin) return { success: false, data: [], error: 'Supabase Service Role Key not configured.' };
    try {
      const { data, error } = await supabaseAdmin
        .from('menu_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      const mappedCategories = (data || []).map(r => ({
        id: r.id,
        name: (typeof r.name === 'string' && r.name.trim().toLowerCase() === 'grelhoes') ? 'Grelhados' : r.name,
        icon: r.icon,
        sortOrder: r.sort_order || 0,
        isActive: r.is_active ?? true,
        parentId: r.parent_id || null,
        isAvailableOnDigitalMenu: r.is_available_on_digital_menu ?? true
      }));

      return { success: true, data: mappedCategories };
    } catch (error: any) {
      logger.error('Error fetching categories (admin)', { error: error.message }, 'DATABASE_ADMIN');
      return { success: false, data: [], error: error.message };
    }
  },

  getDishes: async (): Promise<{ success: boolean; data: Dish[]; error?: string }> => {
    if (!supabaseAdmin) return { success: false, data: [], error: 'Supabase Service Role Key not configured.' };
    try {
      const { data, error } = await supabaseAdmin
        .from('dishes')
        .select('*');
      
      if (error) throw error;
      
      const mappedDishes = (data || []).map(r => ({
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
      logger.error('Error fetching dishes (admin)', { error: error.message }, 'DATABASE_ADMIN');
      return { success: false, data: [], error: error.message };
    }
  },
  
  saveTable: async (table: Table): Promise<{ success: boolean; error?: string }> => {
      if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };
      try {
          const { error } = await supabaseAdmin.from('restaurant_tables').upsert({
              id: table.id,
              label: table.label || `Mesa ${table.number}`,
              number: table.number || 1,
              seats: table.seats || 4,
              x: table.x || 0,
              y: table.y || 0,
              width: table.width,
              height: table.height,
              shape: table.shape,
              rotation: table.rotation,
              color: table.color,
              status: table.status || 'AVAILABLE',
              zone: table.zone,
              is_active: table.is_active ?? true,
              group_id: table.group_id,
              user_id: table.user_id,
              created_at: table.created_at,
              updated_at: new Date().toISOString()
          });
          if (error) throw error;
          return { success: true };
      } catch (error: any) {
          logger.error('Error saving table (admin)', { error: error.message }, 'DATABASE_ADMIN');
          return { success: false, error: error.message };
      }
  },

  deleteTable: async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };
      try {
          const { error } = await supabaseAdmin.from('restaurant_tables').delete().eq('id', id);
          if (error) throw error;
          return { success: true };
      } catch (error: any) {
          logger.error('Error deleting table (admin)', { error: error.message }, 'DATABASE_ADMIN');
          return { success: false, error: error.message };
      }
  },
  
  saveCustomer: async (customer: Customer): Promise<{ success: boolean; error?: string }> => {
      if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };
      try {
          const { error } = await supabaseAdmin.from('customers').upsert({
              id: customer.id,
              name: customer.name,
              nif: customer.nif || null,
              email: customer.email || null,
              phone: customer.phone || null,
              address: customer.address || null,
              updated_at: new Date().toISOString()
          });
          if (error) throw error;
          return { success: true };
      } catch (error: any) {
          logger.error('Error saving customer (admin)', { error: error.message }, 'DATABASE_ADMIN');
          return { success: false, error: error.message };
      }
  },

  deleteCustomer: async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };
    try {
        const { error } = await supabaseAdmin.from('customers').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        logger.error('Error deleting customer (admin)', { error: error.message }, 'DATABASE_ADMIN');
        return { success: false, error: error.message };
    }
  },

  saveReservation: async (reservation: Reservation): Promise<{ success: boolean; error?: string }> => {
      if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };
      try {
          const { error } = await supabaseAdmin.from('reservations').upsert({
              id: reservation.id,
              table_id: reservation.tableId,
              customer_name: reservation.customerName,
              customer_phone: reservation.customerPhone,
              date: reservation.date instanceof Date ? reservation.date.toISOString() : reservation.date,
              time: reservation.time,
              guests: reservation.guests,
              status: reservation.status,
              notes: reservation.notes,
              updated_at: new Date().toISOString()
          });
          if (error) throw error;
          return { success: true };
      } catch (error: any) {
          logger.error('Error saving reservation (admin)', { error: error.message }, 'DATABASE_ADMIN');
          return { success: false, error: error.message };
      }
  },

  deleteReservation: async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };
    try {
        const { error } = await supabaseAdmin.from('reservations').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        logger.error('Error deleting reservation (admin)', { error: error.message }, 'DATABASE_ADMIN');
        return { success: false, error: error.message };
    }
  },

  saveShift: async (shift: CashShift): Promise<{ success: boolean; error?: string }> => {
      if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };
      try {
          const { error } = await supabaseAdmin.from('cash_shifts').upsert({
              id: shift.id,
              user_id: shift.userId || (shift as any).user_id || null,
              user_name: shift.userName || (shift as any).user_name || null,
              start_time: shift.startTime instanceof Date ? shift.startTime.toISOString() : (shift.startTime || (shift as any).start_time || new Date().toISOString()),
              end_time: shift.endTime instanceof Date ? shift.endTime.toISOString() : (shift.endTime || (shift as any).end_time || null),
              opening_balance: shift.openingBalance || (shift as any).opening_balance || 0,
              closing_balance: shift.closingBalance || (shift as any).closing_balance || 0,
              expected_balance: shift.expectedBalance || (shift as any).expected_balance || 0,
              status: shift.status || 'FECHADO',
              notes: shift.notes
          });
          if (error) throw error;
          return { success: true };
      } catch (error: any) {
          logger.error('Error saving shift (admin)', { error: error.message }, 'DATABASE_ADMIN');
          return { success: false, error: error.message };
      }
  },

  saveDelivery: async (delivery: Delivery): Promise<{ success: boolean; error?: string }> => {
      if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };
      try {
          const { error } = await supabaseAdmin.from('deliveries').upsert({
              id: delivery.id,
              order_id: delivery.orderId || (delivery as any).order_id,
              driver_name: delivery.driverName || (delivery as any).driver_name,
              status: delivery.status,
              address: delivery.address,
              customer_name: delivery.customerName || (delivery as any).customer_name,
              customer_phone: delivery.customerPhone || (delivery as any).customer_phone,
              start_time: delivery.startTime instanceof Date ? delivery.startTime.toISOString() : delivery.startTime || (delivery as any).start_time,
              end_time: delivery.endTime instanceof Date ? delivery.endTime.toISOString() : delivery.endTime || (delivery as any).end_time,
              updated_at: new Date().toISOString()
          });
          if (error) throw error;
          return { success: true };
      } catch (error: any) {
          logger.error('Error saving delivery (admin)', { error: error.message }, 'DATABASE_ADMIN');
          return { success: false, error: error.message };
      }
  },

  deleteDelivery: async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };
    try {
        const { error } = await supabaseAdmin.from('deliveries').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        logger.error('Error deleting delivery (admin)', { error: error.message }, 'DATABASE_ADMIN');
        return { success: false, error: error.message };
    }
  },
  
  saveOrderItem: async (orderItem: OrderItem): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };
    try {
      const dbOrderItem = {
        id: orderItem.id,
        order_id: orderItem.orderId || orderItem.order_id,
        product_id: orderItem.productId || orderItem.product_id || orderItem.dishId,
        quantity: orderItem.quantity,
        price: orderItem.price || orderItem.unitPrice || orderItem.unit_price,
        subtotal: orderItem.subtotal,
        tax: orderItem.tax || orderItem.taxAmount || orderItem.tax_amount,
        total: orderItem.total,
        notes: orderItem.notes,
        status: orderItem.status,
        created_at: orderItem.createdAt,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabaseAdmin
        .from('order_items')
        .upsert(dbOrderItem);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      logger.error('Error saving order item (admin)', { error: error.message }, 'DATABASE_ADMIN');
      return { success: false, error: error.message };
    }
  },

  deleteOrderItem: async (id: UUID): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };
    try {
      const { error } = await supabaseAdmin
        .from('order_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      logger.error('Error deleting order item (admin)', { error: error.message }, 'DATABASE_ADMIN');
      return { success: false, error: error.message };
    }
  },

  saveDishes: async (dishes: Dish[]): Promise<boolean> => {
    if (!supabaseAdmin) return false;
    for (const dish of dishes) {
        const res = await adminOperations.saveDish(dish);
        if (!res.success) return false;
    }
    return true;
  },

  saveCategories: async (categories: MenuCategory[]): Promise<boolean> => {
    if (!supabaseAdmin) return false;
    for (const cat of categories) {
        const res = await adminOperations.saveCategory(cat);
        if (!res.success) return false;
    }
    return true;
  },

  saveOrder: async (order: Order): Promise<{ success: boolean; error?: string }> => {
    console.log('🚀 saveOrder called with order:', order);
    
    if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };
    try {
      // 1. Save Order com estrutura correta da tabela
      const dbOrder = {
          id: order.id,
          order_number: order.order_number || `ORD-${Date.now()}`,
          table_id: order.table_id || order.tableId || null,
          status: order.status || 'pending',
          subtotal: order.subtotal || 0,
          total: order.total || 0,
          customer_name: order.customerName || order.customer_name || '',
          customer_nif: order.customer_nif || null,
          payment_method: order.payment_method || null,
          sub_account_name: order.sub_account_name || null,
          shift_id: order.shift_id || order.shiftId || null,
          closed_at: order.closed_at || null,
          created_at: order.createdAt || order.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
      };

      console.log('📦 dbOrder structure:', dbOrder);

      const { data, error: orderError } = await supabaseAdmin.from('orders').upsert(dbOrder).select();
      if (orderError) {
        console.log('❌ Order insert error:', orderError);
        throw orderError;
      }

      console.log('✅ Order saved successfully:', data);

      // 2. SALVAR OS ITENS DO PEDIDO (OrderItems) - ESTE ERA O PROBLEMA!
      if (order.items && order.items.length > 0) {
        console.log('🛒 Saving order items:', order.items.length);
        
        const orderItems = order.items.map((item, index) => ({
          id: item.id || uuidv4(),
          order_id: order.id,
          dish_id: item.dish_id || item.dishId,
          quantity: item.quantity,
          unit_price: item.unit_price || item.price,
          total_price: (item.unit_price || item.price || 0) * (item.quantity || 1),
          notes: item.notes || '',
          status: item.status || 'pending',
          created_at: item.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sort_order: index
        }));

        console.log('📦 OrderItems to save:', orderItems);

        const { data: itemsData, error: itemsError } = await supabaseAdmin
          .from('order_items')
          .upsert(orderItems)
          .select();

        if (itemsError) {
          console.log('❌ OrderItems insert error:', itemsError);
          throw itemsError;
        }

        console.log('✅ OrderItems saved successfully:', itemsData);
      }

      return { success: true };
    } catch (error: any) {
      console.log('❌ Error saving order:', error.message);
      logger.error('Error saving order (admin)', { error: error.message }, 'DATABASE_ADMIN');
      return { success: false, error: error.message };
    }
  },

  getTables: async (): Promise<Table[]> => {
    if (!supabaseAdmin) return [];
    try {
        const { data, error } = await supabaseAdmin
            .from('restaurant_tables')
            .select('*')
            .order('number', { ascending: true });
        
        if (error) throw error;
        
        return (data || []).map((t: any) => ({
            id: t.id,
            number: t.number,
            name: t.name || `Mesa ${t.number}`, // Provide default name if missing
            seats: t.seats,
            x: t.x,
            y: t.y,
            width: t.width,
            height: t.height,
            shape: t.shape,
            rotation: t.rotation,
            color: t.color,
            status: t.status || 'LIVRE',
            zone: t.zone,
            is_active: t.is_active ?? true,
            group_id: t.group_id,
            label: t.label,
            user_id: t.user_id,
            updated_at: t.updated_at,
            created_at: t.created_at || t.updated_at || new Date().toISOString(), // Provide fallback
            activeOrderIds: []
        }));
    } catch (error: any) {
        logger.error('Error fetching tables (admin)', { error: error.message }, 'DATABASE_ADMIN');
        return [];
    }
  },

  saveStockItem: async (item: StockItem): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };
    try {
        const dbItem = {
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            min_threshold: item.minThreshold ?? (item as any).min_threshold,
            updated_at: new Date().toISOString()
        };
        const { error } = await supabaseAdmin.from('stock_items').upsert(dbItem);
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        logger.error('Error saving stock item (admin)', { error: error.message }, 'DATABASE_ADMIN');
        return { success: false, error: error.message };
    }
  },

  deleteStockItem: async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };
    try {
        const { error } = await supabaseAdmin.from('stock_items').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        logger.error('Error deleting stock item (admin)', { error: error.message }, 'DATABASE_ADMIN');
        return { success: false, error: error.message };
    }
  },

  saveSupplier: async (supplier: Fornecedor): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };
    try {
        const { error } = await supabaseAdmin.from('suppliers').upsert({
            id: supplier.id,
            name: supplier.name,
            contact: supplier.contact,
            email: supplier.email,
            nif: supplier.nif,
            address: supplier.address,
            notes: supplier.notes
        });
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        logger.error('Error saving supplier (admin)', { error: error.message }, 'DATABASE_ADMIN');
        return { success: false, error: error.message };
    }
  },

  saveSettings: async (settings: SystemSettings): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseAdmin) return { success: false, error: 'Supabase Service Role Key not configured.' };
    try {
        const dbSettings = {
            id: settings.id,
            restaurant_name: settings.restaurantName,
            nif: settings.nif,
            address: settings.address,
            phone: settings.phone,
            email: settings.email,
            tax_percentage: settings.taxPercentage,
            currency: settings.currency,
            timezone: settings.timezone,
            language: settings.language,
            supabase_config: settings.supabaseConfig,
            printer_config: settings.printerConfig,
            backup_config: settings.backupConfig,
            app_logo_url: settings.appLogoUrl,
            agt_certificate: settings.agtCertificate,
            open_drawer_code: settings.openDrawerCode,
            admin_pin: settings.adminPin,
            api_token: settings.apiToken,
            wifi_name: settings.wifi_name,
            wifi_password: settings.wifi_password,
            qr_code_title: settings.qr_code_title,
            qr_code_subtitle: settings.qr_code_subtitle,
            qr_code_short_code: settings.qr_code_short_code,
            qr_menu_url: settings.qr_menu_url,
            qr_menu_cloud_url: settings.qr_menu_cloud_url,
            logo_url: settings.logo_url,
            name: settings.name,
            updated_at: new Date().toISOString()
        };

        // Remove undefined keys
        Object.keys(dbSettings).forEach(key => (dbSettings as any)[key] === undefined && delete (dbSettings as any)[key]);

        const { error } = await supabaseAdmin.from('settings').upsert(dbSettings);
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        logger.error('Error saving settings (admin)', { error: error.message }, 'DATABASE_ADMIN');
        return { success: false, error: error.message };
    }
  }
};
