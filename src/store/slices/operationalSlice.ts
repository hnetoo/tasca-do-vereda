import { StateCreator } from 'zustand';
import { Table, Customer, Reservation, StockItem, CashShift, Delivery, UUID, OrderItem, Order, TableStatus, Dish } from '../../types';
import { 
  saveTableAction, 
  deleteTableAction, 
  saveCustomerAction, 
  deleteCustomerAction,
  saveReservationAction,
  deleteReservationAction,
  saveStockItemAction,
  deleteStockItemAction,
  saveDeliveryAction,
  deleteDeliveryAction,
  getTablesAction,
  saveOrderAction,
  saveOrderItemAction,
  deleteOrderItemAction,
  updateTableStatusAction
} from '@/app/actions/operational';
import { saveTableActionClient as saveTableClient, deleteTableActionClient as deleteTableClient } from '@/utils/clientOperationalActions';
import { logger } from '../../services/logger';
import { generateUUID } from '../../utils/uuid';

export interface OperationalSlice {
  tables: Table[];
  fetchTables: () => Promise<void>;
  activeTableId: string | null;
  saveStatus: 'SAVING' | 'SAVED' | 'ERROR' | 'IDLE';
  setSaveStatus: (status: 'SAVING' | 'SAVED' | 'ERROR' | 'IDLE') => void;
  customers: Customer[];
  reservations: Reservation[];
  stock: StockItem[];
  shifts: CashShift[];
  currentShiftId: UUID | null;
  deliveries: Delivery[];
  
  setActiveTable: (id: string | null) => void;
  addTable: (table: Table) => void;
  updateTable: (tableId: string, updates: Partial<Table>) => void;
  removeTable: (id: string) => void;
  updateTableStatus: (id: string, status: TableStatus) => Promise<void>;
  
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  removeCustomer: (id: UUID) => void;
  
  addReservation: (res: Reservation) => void;
  updateReservation: (res: Reservation) => void;
  removeReservation: (id: UUID) => void;
  
  addStockItem: (item: StockItem) => void;
  updateStockItem: (item: StockItem) => void;
  removeStockItem: (id: UUID) => void;
  
  openShift: (amount: number) => void;
  closeShift: (closingAmount: number) => void;
  backupLayout: () => void;
  createNewOrder: (tableId: string, name: string) => UUID;
  addOrderItem: (order_id: UUID, item: OrderItem) => void;
  updateOrderItem: (order_id: UUID, itemId: UUID, updatedItem: Partial<OrderItem>) => void;
  removeOrderItem: (order_id: UUID, itemId: UUID) => void;
  updateStockQuantity: (id: UUID, quantity: number) => void;
  
  closeTableWithoutOrders: (tableId: string) => void;
  transferTable: (fromTableId: string, toTableId: string) => void;

  addDelivery: (delivery: Delivery) => void;
  updateDelivery: (delivery: Delivery) => void;
  removeDelivery: (id: UUID) => void;
  setDeliveries: (deliveries: Delivery[]) => void;
  setShifts: (shifts: CashShift[]) => void;
  addAuditLog: (log: any) => void;
  auditLogs: any[];
  settleCustomerDebt: (customerId: UUID, amount: number) => void;
}

export const createOperationalSlice: StateCreator<
  any,
  [['zustand/persist', unknown]],
  [],
  OperationalSlice
> = (set, get) => ({
  tables: [],
  orders: [], // Initialize orders to avoid undefined access
  cartItems: [], // ✅ ADICIONAR cartItems para o carrinho lateral
  activeTableId: null,
  saveStatus: 'IDLE',
  setSaveStatus: (status) => set({ saveStatus: status }),
  customers: [],
  reservations: [],
  stock: [],
  shifts: [],
  currentShiftId: null,
  deliveries: [],
  auditLogs: [],
  
  fetchTables: async () => {
    const res = await getTablesAction();
    if (res.success && res.data) {
      set({ tables: res.data });
      logger.info(`Tables fetched successfully: ${res.data.length}`, undefined, 'DATABASE');
    } else {
      logger.error('Failed to fetch tables', { error: res.error }, 'DATABASE');
    }
  },

  settleCustomerDebt: (customerId: UUID, amount: number) => {
    const state = get();
    const customer = state.customers.find((c: any) => c.id === customerId);
    if (customer) {
      const newBalance = (customer.balance || 0) - amount;
      const updatedCustomer = { ...customer, balance: newBalance };
      state.updateCustomer(updatedCustomer);
      
      // Log the transaction
      state.addAuditLog({
        id: crypto.randomUUID(),
        action: 'PAYMENT_RECEIVED',
        details: { customerId, amount, newBalance },
        timestamp: new Date().toISOString(),
      });
    }
  },

  setActiveTable: (id: string | null) => {
    if (id && id !== 'balcao-999') {
      get().updateTableStatus(id, 'ocupada');
    }
    set({ activeTableId: id });
  },
  
  addTable: (table: Table) => {
    set({ saveStatus: 'SAVING' });
    set((state: any) => ({ tables: [...state.tables, table] }));
    saveTableClient(table).then(res => {
      if (!res.success) {
        set({ saveStatus: 'ERROR' });
        logger.error('Failed to persist new table to SQL', { id: table.id, error: res.error }, 'DATABASE');
      } else {
        set({ saveStatus: 'SAVED' });
        setTimeout(() => set({ saveStatus: 'IDLE' }), 2000);
      }
    }).catch(e => {
      set({ saveStatus: 'ERROR' });
      logger.error('Failed to persist new table to SQL', { id: table.id, error: e.message }, 'DATABASE')
    });
  },
  
  updateTable: (tableId: string, updates: Partial<Table>) => {
    const table = get().tables.find((t: any) => t.id === tableId);
    if (!table) return;
    
    set({ saveStatus: 'SAVING' });
    set((state: any) => ({
      tables: state.tables.map((t: Table) => t.id === tableId ? { ...t, ...updates } : t)
    }));
    saveTableClient({ ...table, ...updates }).then(res => {
      if (!res.success) {
        set({ saveStatus: 'ERROR' });
        logger.error('Failed to persist updated table to SQL', { id: tableId, error: res.error }, 'DATABASE');
      } else {
        set({ saveStatus: 'SAVED' });
        setTimeout(() => set({ saveStatus: 'IDLE' }), 2000);
      }
    }).catch(e => {
      set({ saveStatus: 'ERROR' });
      logger.error('Failed to persist updated table to SQL', { id: tableId, error: e.message }, 'DATABASE')
    });
  },
  
  removeTable: (id: string) => {
    set({ saveStatus: 'SAVING' });
    set((state: any) => ({
      tables: state.tables.filter((t: Table) => t.id !== id)
    }));
    deleteTableClient(id).then(res => {
      if (!res.success) {
        set({ saveStatus: 'ERROR' });
        logger.error('Failed to delete table from SQL', { id, error: res.error }, 'DATABASE');
      } else {
        set({ saveStatus: 'SAVED' });
        setTimeout(() => set({ saveStatus: 'IDLE' }), 2000);
      }
    }).catch(e => {
      set({ saveStatus: 'ERROR' });
      logger.error('Failed to delete table from SQL', { id, error: e.message }, 'DATABASE')
    });
  },

  updateTableStatus: async (tableId: string, newStatus: TableStatus) => {
    const table = get().tables.find((t: Table) => t.id === tableId);
    if (!table) {
      logger.warn('updateTableStatus: Mesa não encontrada', { tableId }, 'OPERATIONAL');
      get().addNotification?.('error', `Mesa ${tableId} não encontrada.`);
      return;
    }

    const originalStatus = table.status;
    const tableName = table.name || `Mesa ${tableId}`;

    console.log('🔄 [OPERATIONAL SLICE] Iniciando atualização de status:', { 
      tableId, 
      tableName, 
      originalStatus, 
      newStatus 
    });

    // 1. Atualização Otimista
    set((state: any) => ({
      tables: state.tables.map((t: any) =>
        t.id === tableId ? { ...t, status: 'UPDATING' } : t
      ),
    }));

    try {
      // 2. Chamar a Ação do Servidor
      const { success, error } = await updateTableStatusAction(tableId, newStatus);

      if (success) {
        // 3. Sucesso: Atualizar para o estado final
        set((state: any) => ({
          tables: state.tables.map((t: any) =>
            t.id === tableId ? { ...t, status: newStatus } : t
          ),
        }));
        
        get().addAuditLog({
          action: 'TABLE_STATUS_CHANGE',
          details: `Mesa ${tableName} alterada de ${originalStatus} para ${newStatus}`,
          metadata: { tableId, originalStatus, newStatus },
        });

        console.log('✅ [OPERATIONAL SLICE] Status atualizado com sucesso:', { 
          tableId, 
          tableName, 
          originalStatus, 
          newStatus 
        });

        get().addNotification?.('success', `Mesa ${tableName} atualizada para ${newStatus}`);
      } else {
        // 4. Erro: Reverter e notificar
        const errorMsg = error || 'Erro desconhecido ao atualizar o estado da mesa.';
        console.error('❌ [OPERATIONAL SLICE] Erro ao atualizar status:', { tableId, tableName, error: errorMsg });
        throw new Error(errorMsg);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error('❌ [OPERATIONAL SLICE] Exceção ao atualizar status:', { 
        tableId, 
        tableName, 
        originalStatus, 
        newStatus, 
        error: errorMessage,
        stack: e instanceof Error ? e.stack : undefined
      });
      
      logger.error('Falha ao atualizar o estado da mesa', { 
        tableId, 
        tableName, 
        originalStatus, 
        newStatus, 
        error: errorMessage 
      }, 'OPERATIONAL');
      
      get().addNotification?.('error', `Não foi possível atualizar a mesa ${tableName}: ${errorMessage}`);
      
      // Reverter para o estado original
      set((state: any) => ({
        tables: state.tables.map((t: any) =>
          t.id === tableId ? { ...t, status: originalStatus } : t
        ),
      }));
    }
  },
  
  addCustomer: (customer: Customer) => {
    set((state: any) => ({ customers: [...state.customers, customer] }));
    saveCustomerAction(customer).then(res => {
      if (!res.success) logger.error('Failed to persist new customer to SQL', { id: customer.id, error: res.error }, 'DATABASE');
    }).catch(e => 
      logger.error('Failed to persist new customer to SQL', { id: customer.id, error: e.message }, 'DATABASE')
    );
  },
  
  updateCustomer: (customer: Customer) => {
    set((state: any) => ({
      customers: state.customers.map((c: Customer) => c.id === customer.id ? customer : c)
    }));
    saveCustomerAction(customer).then(res => {
      if (!res.success) logger.error('Failed to persist updated customer to SQL', { id: customer.id, error: res.error }, 'DATABASE');
    }).catch(e => 
      logger.error('Failed to persist updated customer to SQL', { id: customer.id, error: e.message }, 'DATABASE')
    );
  },
  
  removeCustomer: (id: UUID) => {
    set((state: any) => ({
      customers: state.customers.filter((c: Customer) => c.id !== id)
    }));
    deleteCustomerAction(id).then(res => {
      if (!res.success) logger.error('Failed to delete customer from SQL', { id, error: res.error }, 'DATABASE');
    }).catch(e => 
      logger.error('Failed to delete customer from SQL', { id, error: e.message }, 'DATABASE')
    );
  },
  
  addReservation: (res: Reservation) => set((state: any) => ({ reservations: [...state.reservations, res] })),
  
  updateReservation: (res: Reservation) => set((state: any) => ({
    reservations: state.reservations.map((r: Reservation) => r.id === res.id ? res : r)
  })),
  
  removeReservation: (id: UUID) => set((state: any) => ({
    reservations: state.reservations.filter((r: Reservation) => r.id !== id)
  })),
  
  addStockItem: (item: StockItem) => {
    set((state: any) => ({ stock: [...state.stock, item] }));
    saveStockItemAction(item).then(res => {
      if (!res.success) logger.error('Failed to persist new stock item to SQL', { id: item.id, error: res.error }, 'DATABASE');
    }).catch(e => 
      logger.error('Failed to persist new stock item to SQL', { id: item.id, error: e.message }, 'DATABASE')
    );
  },
  
  updateStockItem: (item: StockItem) => {
    set((state: any) => ({
      stock: state.stock.map((s: StockItem) => s.id === item.id ? item : s)
    }));
    saveStockItemAction(item).then(res => {
      if (!res.success) logger.error('Failed to persist updated stock item to SQL', { id: item.id, error: res.error }, 'DATABASE');
    }).catch(e => 
      logger.error('Failed to persist updated stock item to SQL', { id: item.id, error: e.message }, 'DATABASE')
    );
  },
  
  removeStockItem: (id: UUID) => {
    set((state: any) => ({
      stock: state.stock.filter((s: StockItem) => s.id !== id)
    }));
    deleteStockItemAction(id).then(res => {
      if (!res.success) logger.error('Failed to delete stock item from SQL', { id, error: res.error }, 'DATABASE');
    }).catch(e => 
      logger.error('Failed to delete stock item from SQL', { id, error: e.message }, 'DATABASE')
    );
  },
  
  openShift: (amount: number) => {
    const shiftId = generateUUID();
    set({ currentShiftId: shiftId });
    get().addNotification?.('success', `Turno aberto com sucesso: ${amount} Kz`);
  },
  
  closeShift: (closingAmount: number) => {
    set({ currentShiftId: null });
    get().addNotification?.('success', `Turno fechado com sucesso: ${closingAmount} Kz`);
  },

  backupLayout: () => {
    const { tables } = get();
    logger.info('Backup de layout de mesas realizado localmente', { count: tables.length }, 'UI');
    get().addNotification?.('success', 'Layout de mesas guardado!');
  },

  createNewOrder: (tableId: string, name: string) => {
    const order_id = generateUUID();
    const newOrder: Order = {
      id: order_id,
      tableId,
      customerName: name || 'Balcão', // 🎯 DEFEITO 'Balcão' quando não há nome
      items: [],
      status: 'ABERTO',
      total: 0,
      total_amount: 0,
      tax_amount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      closedAt: null, // 🎯 closedAt conforme schema atualizado
      isPaid: false,
      subAccountName: name || 'Balcão',
      shiftId: get().currentShiftId || null,
      shift_id: get().currentShiftId || null
    } as unknown as Order;
    
    // 🎯 CORRIGIDO: Usar saveOrderAction que mapeia corretamente
    try {
      const state = get();
      if (typeof (state as any).addOrder === 'function') {
        (state as any).addOrder(newOrder);
        
        // 🎯 PERSISTIR CORRETAMENTE COM saveOrderAction (que mapeia items e total)
        saveOrderAction(newOrder).then(res => {
          if (!res.success) {
             logger.error('Failed to persist new order', { id: order_id, error: res.error }, 'OPERATIONAL');
          } else {
            console.log('✅ [createNewOrder] Pedido persistido com sucesso:', (res as any).data);
          }
        }).catch(err => {
           logger.error('Exception persisting new order', { id: order_id, error: err }, 'OPERATIONAL');
        });
      } else {
        console.error('❌ [createNewOrder] addOrder function not available');
        logger.error('addOrder function not available in state', { tableId, name }, 'OPERATIONAL');
      }
    } catch (error) {
      console.error('❌ [createNewOrder] Error creating order:', error);
      logger.error('Error in createNewOrder', { error, tableId, name }, 'OPERATIONAL');
    }
    
    return order_id;
  },

  addOrderItem: (order_id: UUID, item: OrderItem) => {
    const state = get();
    const orders = (state as any).orders as Order[];
    const orderIndex = orders.findIndex(o => o.id === order_id);

    if (orderIndex !== -1) {
      const updatedOrders = [...orders];
      const orderToUpdate = { ...updatedOrders[orderIndex] };
      
      const newItem = { 
        ...item, 
        id: item.id || generateUUID(), 
        order_id, 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      };
      
      orderToUpdate.items = [...(orderToUpdate.items || []), newItem];

      // Recalculate order totals - USAR APENAS CAMPOS EXISTENTES
      orderToUpdate.total = (orderToUpdate.items || []).reduce((sum, oi) => {
        const price = oi.unit_price || oi.price || 0;
        const qty = oi.quantity || 1;
        return sum + (price * qty);
      }, 0);

      updatedOrders[orderIndex] = orderToUpdate;
      set({ orders: updatedOrders } as any);

      saveOrderItemAction(newItem).then(res => {
        if (!res.success) {
          logger.error('Failed to persist new order item', { orderItemId: newItem.id, error: res.error }, 'OPERATIONAL');
        }
      }).catch(err => {
        logger.error('Exception persisting new order item', { orderItemId: newItem.id, error: err }, 'OPERATIONAL');
      });
    } else {
      logger.warn(`Order with ID ${order_id} not found when trying to add item.`, undefined, 'OPERATIONAL');
    }
  },

  updateOrderItem: (order_id: UUID, itemId: UUID, updatedItem: Partial<OrderItem>) => {
    const state = get();
    const orders = (state as any).orders as Order[];
    const orderIndex = orders.findIndex(o => o.id === order_id);

    if (orderIndex !== -1) {
      const updatedOrders = [...orders];
      const orderToUpdate = { ...updatedOrders[orderIndex] };
      
      const items = orderToUpdate.items || [];
      const itemToUpdateIndex = items.findIndex(item => item.id === itemId);

      if (itemToUpdateIndex !== -1) {
        const itemToUpdate = { ...items[itemToUpdateIndex], ...updatedItem, updated_at: new Date().toISOString() };
        const newItems = items.map((item, idx) => idx === itemToUpdateIndex ? itemToUpdate : item);
        orderToUpdate.items = newItems;

        // Recalculate order totals - USAR APENAS CAMPOS EXISTENTES
      orderToUpdate.total = newItems.reduce((sum, oi) => {
        const price = oi.unit_price || oi.price || 0;
        const qty = oi.quantity || 1;
        return sum + (price * qty);
      }, 0);

        updatedOrders[orderIndex] = orderToUpdate;
        set({ orders: updatedOrders } as any);

        saveOrderItemAction(itemToUpdate).then(res => {
          if (!res.success) {
            logger.error('Failed to persist updated order item', { orderItemId: itemToUpdate.id, error: res.error }, 'OPERATIONAL');
          }
        }).catch(err => {
          logger.error('Exception persisting updated order item', { orderItemId: itemToUpdate.id, error: err }, 'OPERATIONAL');
        });
      } else {
        logger.warn(`Order item with ID ${itemId} not found for order ID ${order_id}.`, undefined, 'OPERATIONAL');
      }
    } else {
      logger.warn(`Order with ID ${order_id} not found when trying to update item.`, undefined, 'OPERATIONAL');
    }
  },

  // FUNÇÃO addToCart - INSERÇÃO DIRETA COM VALIDAÇÃO
  addToCart: (product: Dish, quantity: number = 1) => {
    console.log(' [addToCart] Produto:', product.name, 'Quantidade:', quantity);
    
    const state = get();
    let activeOrderId = (state as any).activeOrderId;
    const cartItems = (state as any).cartItems || [];
    const orders = (state as any).orders || [];
    
    // Criar OrderItem - EXATAMENTE como no schema Supabase
    const orderItem: OrderItem = {
      id: generateUUID(),
      order_id: activeOrderId || 'temp',
      dish_id: product.id,
      quantity: Math.abs(quantity),
      unit_price: product.price || 0,
      tax_percentage: 0,
      tax_amount: 0,
      tax_code: '',
      notes: '',
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    console.log(' [addToCart] OrderItem criado:', orderItem);
    
    // Se quantity for negativo, remover do carrinho
    if (quantity < 0) {
      console.log(' [addToCart] Removendo item do carrinho...');
      const updatedCartItems = cartItems.filter((item: OrderItem) => item.dish_id !== product.id);
      (set as any)({ cartItems: updatedCartItems });
      
      try {
        localStorage.setItem('cartItems', JSON.stringify(updatedCartItems));
        console.log(' [addToCart] Carrinho salvo no LocalStorage (remoção)');
      } catch (error) {
        console.error(' [addToCart] Erro ao salvar no LocalStorage:', error);
      }
      
      console.log(' [addToCart] Item removido do cartItems local!');
      return;
    }
    
    // Adicionar ao carrinho local
    const existingItemIndex = cartItems.findIndex((item: OrderItem) => item.dish_id === product.id);
    let updatedCartItems;
    
    if (existingItemIndex >= 0) {
      // Atualizar quantidade
      updatedCartItems = cartItems.map((item: OrderItem, index: number) => 
        index === existingItemIndex 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      // Adicionar novo item
      updatedCartItems = [...cartItems, orderItem];
    }
    
    (set as any)({ cartItems: updatedCartItems });
    
    // Salvar no LocalStorage
    try {
      localStorage.setItem('cartItems', JSON.stringify(updatedCartItems));
      localStorage.setItem('activeOrderId', activeOrderId || generateUUID());
      console.log(' [addToCart] Carrinho salvo no LocalStorage');
    } catch (error) {
      console.error(' [addToCart] Erro ao salvar no LocalStorage:', error);
    }
    
    console.log(' [addToCart] Item adicionado ao cartItems local! Total itens:', updatedCartItems.length);
    
    // CRIAR/SALVAR PEDIDO DIRETAMENTE COM TOTAL E ITENS CORRETOS
    if (!activeOrderId) {
      console.log(' [addToCart] Criando pedido no Balcão...');
      
      // Verificar se já existe um pedido aberto para o Balcão
      const balcaoOrder = orders.find((o: any) => o.table_id === 'balcao-999' && o.status === 'ABERTO');
      
      if (balcaoOrder) {
        activeOrderId = balcaoOrder.id;
        console.log(' [addToCart] Usando pedido existente do Balcão:', activeOrderId);
      } else {
        // CRIAR NOVO PEDIDO COM TOTAL E ITENS CORRETOS
        const newOrderId = generateUUID();
        
        // Calcular total real dos itens
        const realTotal = updatedCartItems.reduce((sum: number, item: OrderItem) => {
          return sum + (item.unit_price * item.quantity);
        }, 0);
        
        console.log(' [addToCart] Total real calculado:', realTotal);
        console.log(' [addToCart] Itens para salvar:', updatedCartItems);
        
        // VALIDAÇÃO CRÍTICA ANTES DE INSERIR
        if (realTotal === 0 || updatedCartItems.length === 0) {
          console.error(' [addToCart] ERRO: Total ou itens vazios! Abortando inserção.');
          return;
        }
        
        // PAYLOAD CORRETO PARA INSERÇÃO DIRETA
        const orderPayload = {
          id: newOrderId,
          status: 'ABERTO' as const,
          total: realTotal,                    // TOTAL REAL
          total_amount: realTotal,             // TOTAL REAL
          tax_amount: 0,
          customer_name: 'Balcão',
          table_id: 'balcao-999',
          order_number: newOrderId,
          payment_method: 'CASH',
          items: updatedCartItems,             // ITENS REAIS
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_name: 'System',
          customer_id: null,
          shift_id: (state as any).currentShiftId || null,
          notes: '',
          closedAt: null,                   // closedAt conforme schema
        } as unknown as Order;
        
        console.log(' [addToCart] Payload para inserir:', orderPayload);
        console.log(' [addToCart] VALIDAÇÃO: total !== 0?', orderPayload.total !== 0);
        console.log(' [addToCart] VALIDAÇÃO: items.length > 0?', orderPayload.items.length > 0);
        
        // INSERÇÃO DIRETA NO SUPABASE COM VALIDAÇÃO
        const insertOrderDirectly = async () => {
          try {
            // Importar supabase dinamicamente para evitar múltiplas instâncias
            const { supabase } = await import('@/lib/supabase');
            
            // VALIDAÇÃO FINAL ANTES DO INSERT
            if (orderPayload.total === 0 || orderPayload.items.length === 0) {
              throw new Error('Dados vazios detetados! Total ou itens vazios.');
            }
            
            console.log('🛒 [addToCart] ENVIANDO PARA SUPABASE...');
            
            // @ts-ignore - Ignorar erro de TypeScript do Supabase
            const { data, error } = await (supabase as any)
              .from('orders')
              .insert(orderPayload)
              .select();
            
            if (error) {
              console.error(' [addToCart] Erro ao inserir pedido:', error);
              return;
            }
            
            console.log(' [addToCart] SUCESSO! Pedido inserido:', data);
            console.log(' [addToCart] Total salvo:', (data as any)?.[0]?.total);
            console.log(' [addToCart] Items salvos:', (data as any)?.[0]?.items?.length);
            
            // Atualizar estado local
            const updatedOrders = [...orders, ...(data as any)];
            (set as any)({ orders: updatedOrders, activeOrderId: newOrderId, cartItems: updatedCartItems });
            
            console.log(' [addToCart] Pedido criado e salvo com sucesso!');
            
          } catch (error) {
            console.error(' [addToCart] Exceção ao inserir pedido:', error);
          }
        };
        
        // Executar inserção em background
        insertOrderDirectly();
        activeOrderId = newOrderId;
        
        console.log(' [addToCart] Pedido criado para Balcão COM ITEM:', activeOrderId);
        return;
      }
    }
    
    // Adicionar item ao pedido existente
    if (activeOrderId) {
      const order = orders.find((o: any) => o.id === activeOrderId);
      if (order) {
        const existingItem = order.items?.find((item: OrderItem) => item.dish_id === product.id);
        
        if (existingItem) {
          // Atualizar item existente
          const finalCartItems = updatedCartItems.map((item: OrderItem) => 
            item.dish_id === product.id 
              ? { ...item, quantity: existingItem.quantity + quantity }
              : item
          );
          
          (set as any)({ cartItems: finalCartItems });
          
          console.log(' [addToCart] Item atualizado no pedido existente!');
          return;
        } else {
          // Adicionar novo item ao pedido existente
          const updatedItems = [...(order.items || []), orderItem];
          
          // Calcular novo total
          const newTotal = updatedItems.reduce((sum: number, item: OrderItem) => {
            return sum + (item.unit_price * item.quantity);
          }, 0);
          
          // ATUALIZAR PEDIDO EXISTENTE COM TOTAL E ITENS CORRETOS
          const updateOrderDirectly = async () => {
            try {
              const { supabase } = await import('@/lib/supabase');
              
              const updatePayload = {
                total: newTotal,
                total_amount: newTotal,
                items: updatedItems,
                updated_at: new Date().toISOString()
              };
              
              // VALIDAÇÃO ANTES DO UPDATE
              if (updatePayload.total === 0 || updatePayload.items.length === 0) {
                throw new Error('Dados vazios detetados! Total ou itens vazios.');
              }
              
              console.log('🛒 [addToCart] Atualizando pedido existente:', updatePayload);
              
              // @ts-ignore - Ignorar erro de TypeScript do Supabase
              const { data, error } = await (supabase as any)
                .from('orders')
                .update(updatePayload)
                .eq('id', activeOrderId)
                .select();
              
              if (error) {
                console.error(' [addToCart] Erro ao atualizar pedido:', error);
                return;
              }
              
              console.log(' [addToCart] Pedido atualizado com sucesso:', data);
              
              // Atualizar estado local
              const updatedOrders = orders.map((o: any) => 
                o.id === activeOrderId ? { ...o, ...updatePayload } : o
              );
              (set as any)({ orders: updatedOrders, cartItems: updatedItems });
              
            } catch (error) {
              console.error(' [addToCart] Exceção ao atualizar pedido:', error);
            }
          };
          
          updateOrderDirectly();
          console.log(' [addToCart] Item adicionado ao pedido existente!');
        }
      }
    }
  },

  // FUNÇÃO AUSENTE - Adicionar addToOrder para o carrinho funcionar
  addToOrder: (tableId: string, product: Dish, quantity: number = 1, notes: string = '', order_id?: string, userId?: string) => {
    const state = get();
    const orders = (state as any).orders as Order[];
    
    // Find or create order
    let targetOrder: Order | undefined;
    if (order_id) {
      targetOrder = orders.find(o => o.id === order_id);
    } else {
      // Find active order for this table
      targetOrder = orders.find(o => o.tableId === tableId && o.status === 'ABERTO');
    }
    
    if (!targetOrder) {
      console.error(' [addToOrder] No order found for table:', tableId);
      return;
    }
    
    // Create order item
    const orderItem: OrderItem = {
      id: generateUUID(),
      order_id: targetOrder.id,
      dish_id: product.id,
      price: product.price || 0,
      unit_price: product.price || 0,
      quantity,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to order
    const updatedOrders = orders.map(order => {
      if (order.id === targetOrder!.id) {
        const existingItemIndex = order.items?.findIndex(item => item.dish_id === product.id);
        
        if (existingItemIndex !== undefined && existingItemIndex !== -1) {
          // Update existing item
          const updatedItems = [...(order.items || [])];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: (updatedItems[existingItemIndex].quantity || 1) + quantity,
            updated_at: new Date().toISOString()
          };
          
          return {
            ...order,
            items: updatedItems,
            total: updatedItems.reduce((sum, item) => sum + ((item.unit_price || 0) * (item.quantity || 1)), 0),
            updated_at: new Date().toISOString()
          };
        } else {
          // Add new item
          const newItems = [...(order.items || []), orderItem];
          
          return {
            ...order,
            items: newItems,
            total: newItems.reduce((sum, item) => sum + ((item.unit_price || 0) * (item.quantity || 1)), 0),
            updated_at: new Date().toISOString()
          };
        }
      }
      return order;
    });
    
    set({ orders: updatedOrders } as any);
    
    // Persist to Supabase
    saveOrderAction(targetOrder).then(res => {
      if (!res.success) {
        console.error('❌ [addToOrder] Failed to persist order:', res.error);
      }
    });
  },

  removeOrderItem: (order_id: UUID, itemId: UUID) => {
    const state = get();
    const orders = (state as any).orders as Order[];
    const orderIndex = orders.findIndex(o => o.id === order_id);

    if (orderIndex !== -1) {
      const updatedOrders = [...orders];
      const orderToUpdate = { ...updatedOrders[orderIndex] };
      
      const items = orderToUpdate.items || [];
      const itemToRemove = items.find(item => item.id === itemId);

      if (itemToRemove) {
        orderToUpdate.items = items.filter(item => item.id !== itemId);

        // Recalculate order totals - USAR APENAS CAMPOS EXISTENTES
      orderToUpdate.total = orderToUpdate.items.reduce((sum, oi) => {
        const price = oi.unit_price || oi.price || 0;
        const qty = oi.quantity || 1;
        return sum + (price * qty);
      }, 0);

        updatedOrders[orderIndex] = orderToUpdate;
        set({ orders: updatedOrders } as any);

        if (itemToRemove.id) {
          deleteOrderItemAction(itemToRemove.id).then(res => {
            if (!res.success) {
              logger.error('Failed to delete order item', { orderItemId: itemToRemove.id, error: res.error }, 'OPERATIONAL');
            }
          }).catch(err => {
            logger.error('Exception deleting order item', { orderItemId: itemToRemove.id, error: err }, 'OPERATIONAL');
          });
        }
      } else {
        logger.warn(`Order item with ID ${itemId} not found for order ID ${order_id}.`, undefined, 'OPERATIONAL');
      }
    } else {
      logger.warn(`Order with ID ${order_id} not found when trying to remove item.`, undefined, 'OPERATIONAL');
    }
  },

  closeTableWithoutOrders: (tableId: string) => {
    if (tableId !== 'balcao-999') {
      get().updateTableStatus(tableId, 'disponível');
    }
    set((state: any) => ({
      activeTableId: state.activeTableId === tableId ? null : state.activeTableId
    }));
  },

  transferTable: (fromTableId: string, toTableId: string) => {
    const state = get();
    // Update tables
    set((state: any) => ({
      tables: state.tables.map((t: Table) => {
        if (t.id === fromTableId) return { ...t, status: 'disponível' };
        if (t.id === toTableId) return { ...t, status: 'ocupada' };
        return t;
      }),
      activeTableId: toTableId
    }));

    get().addAuditLog({
      action: 'TABLE_TRANSFER',
      details: `Transferência da mesa ${fromTableId} para ${toTableId}`,
      metadata: { fromTableId, toTableId },
      userId: (state as any).currentUser?.id
    });
    
    // Move orders
    // We need to access orders from FinanceSlice part of state
    const orders = (state as any).orders || []; // Assuming orders is in StoreState
    const activeOrders = (state as any).activeOrders || [];
    
    const updatedOrders = orders.map((o: any) => o.tableId === fromTableId ? { ...o, tableId: toTableId } : o);
    const updatedActiveOrders = activeOrders.map((o: any) => o.tableId === fromTableId ? { ...o, tableId: toTableId } : o);
    
    set({ orders: updatedOrders, activeOrders: updatedActiveOrders } as any);
  },

  updateStockQuantity: (id: UUID, quantity: number) => {
    set((state: any) => ({
      stock: state.stock.map((item: StockItem) => 
        item.id === id ? { ...item, quantity, lastUpdated: new Date() } : item
      )
    }));
    
    const item = get().stock.find((s: StockItem) => s.id === id);
    if (item) {
      saveStockItemAction(item).then(res => {
        if (!res.success) logger.error('Failed to update stock quantity in SQL', { id, error: res.error }, 'DATABASE');
      }).catch(e => 
        logger.error('Failed to update stock quantity in SQL', { id, error: e.message }, 'DATABASE')
      );
    }
  },

  addDelivery: (delivery: Delivery) => {
    set((state: any) => ({ deliveries: [...state.deliveries, delivery] }));
    get().addAuditLog({
      action: 'DELIVERY_ADD',
      details: `Entrega adicionada para o pedido: ${delivery.order_id}`,
      metadata: { deliveryId: delivery.id },
    });
  },

  updateDelivery: (delivery: Delivery) => {
    set((state: any) => ({
      deliveries: state.deliveries.map((d: Delivery) => d.id === delivery.id ? delivery : d)
    }));
    get().addAuditLog({
      action: 'DELIVERY_UPDATE',
      details: `Entrega atualizada: ${delivery.id}`,
      metadata: { deliveryId: delivery.id, status: delivery.status },
    });
  },

  removeDelivery: (id: UUID) => {
    set((state: any) => ({
      deliveries: state.deliveries.filter((d: Delivery) => d.id !== id)
    }));
    get().addAuditLog({
      action: 'DELIVERY_REMOVE',
      details: `Entrega removida: ${id}`,
      metadata: { deliveryId: id },
    });
  },

  setDeliveries: (deliveries: Delivery[]) => set({ deliveries }),
  setShifts: (shifts: CashShift[]) => set({ shifts }),
  addAuditLog: (log: any) => {
    logger.info('AUDIT LOG', log, 'AUDIT');
    set((state: any) => ({ 
      auditLogs: [
        { 
          ...log, 
          id: log.id || `log-${Date.now()}`, 
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString() 
        }, 
        ...state.auditLogs
      ].slice(0, 50) 
    }));
  }
});
