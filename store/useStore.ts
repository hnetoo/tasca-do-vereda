
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { logger } from '../services/logger';
import { validationService } from '../services/validationService';
import { disasterRecoveryService } from '../services/disasterRecoveryService';
import { supabaseService } from '../services/supabaseService';

const customStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    }
    return null;
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(name, value);
      } catch {
        // Safari privado ou ambiente com storage desativado: ignora persistência
      }
    } else {
      logger.warn(`Attempted to set item '${name}' in non-browser environment. Value: ${value}`);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(name);
      } catch {
        // Ambiente sem storage: nada a fazer
      }
    } else {
      logger.warn(`Attempted to remove item '${name}' in non-browser environment.`);
    }
  },
};
import { IntegrityIssue, MenuCategory, StoreState, Permission, IntegrationLog, Fornecedor, SystemSettings, Notification, Dish, User, StockItem, CashShift, Order, PaymentMethod, PayrollRecord, Expense, DailySalesAnalytics, MenuAnalytics, Delivery, Employee, AttendanceRecord, AuditLog, MenuAccessLog, OfflineAction, Revenue } from '../types';
import { MOCK_MENU, MOCK_STOCK, MOCK_USERS, MOCK_CATEGORIES, MOCK_TABLES, MOCK_CUSTOMERS, MOCK_RESERVATIONS } from '../constants';
import { calculateIRT, calculateINSS, calculateDeductions } from '../services/salaryCalculatorAngola';
import { backupService, FinancialBackupData } from '../services/backupService';
import { generateNewKeyPair, signInvoice } from '../services/agtService';
import { validateDishCategory, resolveCategoryId } from '../services/categoryResolver';
import { databaseOperations } from '../services/database/operations';
import { getDatabase } from '../services/database/connection';
import { createMenuSlice } from './slices/menuSlice';
import { createStaffSlice } from './slices/staffSlice';
import { createFinanceSlice } from './slices/financeSlice';
import { createAuthSlice } from './slices/authSlice';
import { createOperationalSlice } from './slices/operationalSlice';



/* Redundant interface removed, imported from ../types */

import { recoveryService } from '../services/recoveryService';
import { CryptoService } from '../services/cryptoService';

export const useStore = create<StoreState>()(
  persist(
    (set, get, api) => ({
      ...createMenuSlice(set, get, api),
      ...createStaffSlice(set, get, api),
      ...createFinanceSlice(set, get, api),
      ...createAuthSlice(set, get, api),
      ...createOperationalSlice(set, get, api),
      users: MOCK_USERS,
      payroll: [], // Initialize payroll array
      loyaltyRewards: [], // Initialize loyaltyRewards
 // Initialize menuAccessLogs
      getMenuAccessStats: () => {
        const logs = get().menuAccessLogs;
        const now = new Date();
        const todayStr = now.toDateString();

        const total = logs.length;
        const todayAccesses = logs.filter(log => new Date(log.timestamp).toDateString() === todayStr).length;
        const publicMenus = logs.filter(log => log.type === 'PUBLIC_MENU').length;
        const tableMenus = logs.filter(log => log.type === 'TABLE_MENU').length;

        // Calculate unique visitors
        const uniqueVisitors = new Set(logs.map(log => `${log.ip || 'unknown'}-${log.userAgent || 'unknown'}`)).size;

        // Calculate average access per day
        let averageAccessPerDay = 0;
        if (logs.length > 0) {
          const firstLogDate = new Date(logs[logs.length - 1].timestamp); // Oldest log
          const lastLogDate = new Date(logs[0].timestamp); // Newest log
          const timeDiff = Math.abs(lastLogDate.getTime() - firstLogDate.getTime());
          const diffDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end day
          averageAccessPerDay = total / diffDays;
        }

        // Calculate peak access time
        const hourCounts = new Array(24).fill(0);
        logs.forEach(log => {
          const hour = new Date(log.timestamp).getHours();
          hourCounts[hour]++;
        });
        const peakAccessHour = hourCounts.indexOf(Math.max(...hourCounts));
        const peakAccessTime = `${peakAccessHour}:00-${peakAccessHour + 1}:00`;

        // Calculate most accessed menu
        const menuAccessCounts: { [key: string]: number } = {};
        logs.forEach(log => {
          const menuId = log.type === 'TABLE_MENU' && log.tableId ? `Table ${log.tableId}` : log.type === 'PUBLIC_MENU' ? 'Public Menu' : 'Unknown';
          menuAccessCounts[menuId] = (menuAccessCounts[menuId] || 0) + 1;
        });
        let mostAccessedMenu = 'N/A';
        let maxAccessCount = 0;
        for (const menuId in menuAccessCounts) {
          if (menuAccessCounts[menuId] > maxAccessCount) {
            maxAccessCount = menuAccessCounts[menuId];
            mostAccessedMenu = menuId;
          }
        }

        return { 
          total,
          todayAccesses,
          publicMenus,
          tableMenus,
          uniqueVisitors, 
          averageAccessPerDay, 
          peakAccessTime, 
          mostAccessedMenu 
        };
      },
      isSidebarCollapsed: false,
      isInitialized: false,
      auditLogs: [],
      integrityIssues: [],
      isDiagnosing: false,
      integrationLogs: [],
      lastSync: null,
      syncError: null,
      saveStatus: 'SAVED',
      addIntegrationLog: (log: { type: string; message: string; details?: Record<string, unknown> }) => set((state) => {
        const newIntegrationLog: IntegrationLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date(),
          integrationName: 'AppStore', 
          eventType: log.type,
          status: 'INFO', 
          request: { message: log.message, details: log.details }, 
          response: {},
          duration: 0,
        };
        const newLogs = [newIntegrationLog, ...state.integrationLogs].slice(0, 100);
        
        logger.info(`[INTEGRATION] ${log.message}`, log.details, log.type);
        
        return { integrationLogs: newLogs };
      }),
      suppliers: [],
      setSuppliers: (suppliers: Fornecedor[]) => set({ suppliers }),
      addSupplier: (supplier: Fornecedor) => {
        set((state) => ({ suppliers: [...state.suppliers, supplier] }));
        databaseOperations.saveSupplier(supplier);
        get().triggerSync();
      },

      updateSupplier: (supplier: Fornecedor) => {
        set((state) => ({
          suppliers: state.suppliers.map((s) => (s.id === supplier.id ? supplier : s)),
        }));
        databaseOperations.saveSupplier(supplier);
        get().triggerSync();
      },
      removeSupplier: (id: string) => {
        set((state) => ({
          suppliers: state.suppliers.filter((s) => s.id !== id),
        }));
        get().triggerSync();
      },
      notifications: [],
      addNotification: (type: Notification['type'], message: string) => {
        const id = Math.random().toString(36).substring(7);
        set(state => ({ notifications: [...state.notifications, { id, type, message }] }));
        setTimeout(() => get().removeNotification(id), 3000);
      },
      removeNotification: (id) => set(state => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      settings: {
    restaurantName: "Tasca Do VEREDA",
    appLogoUrl: "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Professional%20restaurant%20logo%20for%20%22TASCA%20DO%20VEREDA%22%2C%20shield%20crest%20shape%2C%20gold%20double%20border%2C%20dark%20olive%20green%20background%2C%20arched%20white%20text%20%22TASCA%20DO%20VEREDA%22%2C%20yellow%20text%20%22RESTAURANTE%22%2C%20illustration%20of%20grilled%20steak%20with%20crossed%20fork%20and%20knife%2C%20elegant%20gold%20flourish%20at%20bottom%2C%20luxury%20style%2C%20high%20resolution&image_size=square_hd", 
    currency: "Kz",
    taxRate: 14,
        phone: "+244 900 000 000",
        address: "Luanda, Angola",
        nif: "5000000000",
        commercialReg: "Conservatória de Luanda",
        agtCertificate: "000/AGT/2025",
        invoiceSeries: "2025",
        retencaoFonte: 6.5,
        regimeIVA: "Regime Geral",
        motivoIsencao: "",
        openDrawerCode: "",
        kdsEnabled: true,
        isSidebarCollapsed: false,
        apiToken: "TASCA-SECURE-API-9922-KEY",
        webhookEnabled: true,
        qrMenuUrl: "",
        qrMenuCloudUrl: "https://tasca-do-vereda.vercel.app",
        qrMenuShortCode: "",
        qrMenuTitle: "Tasca Do VEREDA - Menu Digital",
        qrMenuLogo: "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Professional%20restaurant%20logo%20for%20%22TASCA%20DO%20VEREDA%22%2C%20shield%20crest%20shape%2C%20gold%20double%20border%2C%20dark%20olive%20green%20background%2C%20arched%20white%20text%20%22TASCA%20DO%20VEREDA%22%2C%20yellow%20text%20%22RESTAURANTE%22%2C%20illustration%20of%20grilled%20steak%20with%20crossed%20fork%20and%20knife%2C%20elegant%20gold%20flourish%20at%20bottom%2C%20luxury%20style%2C%20high%20resolution&image_size=square_hd",
        supabaseConfig: {
            enabled: true,
            url: import.meta.env.VITE_SUPABASE_URL || "https://ratzyxwpzrqbtpheygch.supabase.co",
            key: import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_brYx8iH2oCK5uVUowtUhTQ_c7X4nrAo",
            autoSync: true
        }
      },
      updateSettings: (newSettings: Partial<SystemSettings>) => {
        const currentSettings = get().settings;
        const needsCryptoReinit = newSettings.adminPin !== currentSettings.adminPin || 
                                 newSettings.apiToken !== currentSettings.apiToken ||
                                 newSettings.restaurantName !== currentSettings.restaurantName;

        set((state) => {
            const updated = { ...state.settings, ...newSettings };
            databaseOperations.saveSettings(updated).catch(e => logger.error('Failed to save settings to DB', { error: e.message }, 'DATABASE'));
            
            // Sync to Supabase if enabled
            if (updated.supabaseConfig?.enabled && updated.supabaseConfig?.autoSync) {
                if (!supabaseService.isConnected()) {
                    supabaseService.initialize(updated.supabaseConfig.url, updated.supabaseConfig.key);
                }
                supabaseService.syncSettings(updated).catch(e => logger.error('Failed to sync settings to Supabase', { error: e.message }, 'CLOUD'));
            }

            logger.info('Settings updated.', { supabaseEnabled: updated.supabaseConfig?.enabled }, 'STORE');
            if (needsCryptoReinit) {
              const cryptoSecret = updated.adminPin || updated.apiToken || updated.restaurantName || 'TASCA-DEFAULT-SECRET';
              CryptoService.initialize(cryptoSecret).then(() => {
                logger.info("Security: CryptoService re-initialized after settings update", undefined, 'SECURITY');
              });
            }

            return { settings: updated };
        });
      },
      toggleSidebar: () => set((state) => ({ 
        settings: { ...state.settings, isSidebarCollapsed: !state.settings.isSidebarCollapsed } 
      })),
      setUsers: (users: User[]) => set({ users }),
      addUser: (user: User) => set((state) => ({ users: [...state.users, user] })),
      updateUser: (user: User) => set((state) => ({
        users: state.users.map(u => u.id === user.id ? user : u)
      })),
      removeUser: (id: string) => set((state) => ({
        users: state.users.filter(u => u.id !== id)
      })),
      
      externalClockSync: (externalId: string) => {
        // Simulação de sincronização com dispositivo ZKTeco MB20-VL
        // Na implementação real, isto chamaria o backend Tauri ou um serviço WebSocket
        


        const employee = get().employees.find(e => e.externalBioId === externalId);
        if (!employee) {
          get().addNotification('error', `ID Biométrico ${externalId} não reconhecido no sistema.`);
          return;
        }

        // Simula delay de rede
        setTimeout(() => {
            const today = new Date().toISOString().split('T')[0];
            const record = get().attendance.find(a => a.employeeId === employee.id && a.date === today);

            // Lógica de sincronização inteligente
            if (!record) {
              get().clockIn(employee.id, 'EXTERNO');
              get().addNotification('success', `Entrada registada via ZKTeco: ${employee.name}`);
            } else if (!record.clockOut) {
              // Verifica se passou pelo menos 1 minuto para evitar double-scan acidental
              if (record.clockIn) {
                const lastTime = new Date(record.clockIn).getTime();
                const now = new Date().getTime();
                if (now - lastTime > 60000) {
                    get().clockOut(employee.id, 'EXTERNO');
                    get().addNotification('success', `Saída registada via ZKTeco: ${employee.name}`);
                } else {
                    logger.info('Ignorando scan repetido (debounce)', {}, 'BIOMETRICS');
                }
              }
            } else {
              get().addNotification('info', `Funcionário ${employee.name} já completou o turno de hoje.`);
            }
        }, 500);
      },

      tables: MOCK_TABLES,
      categories: MOCK_CATEGORIES,
      deletedCategoryIds: [],
      addCategory: (cat: MenuCategory) => {
        const state = get();
        
        // 1. Validation: Name required
        if (!cat.name || cat.name.trim() === '') {
            state.addNotification('error', 'Nome da categoria é obrigatório.');
            return;
        }

        // 2. Validation: ID generation/validation
        if (!cat.id || cat.id === 'undefined' || cat.id === 'null' || cat.id.trim() === '') {
             cat.id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        }

        // 3. Validation: Duplicate ID
        if (state.categories.some(c => c.id === cat.id)) {
            state.addNotification('error', `A categoria com ID "${cat.id}" já existe.`);
            return;
        }

        // 4. Prevenção de loops em hierarquia
        if (cat.parent_id && cat.parent_id === cat.id) {
           state.addNotification('error', 'Uma categoria não pode ser subcategoria de si mesma.');
           return;
        }

        // 5. Validation: Duplicate Name (Case insensitive)
        const normalizedName = cat.name.trim().toLowerCase();
        if (state.categories.some(c => c.name.trim().toLowerCase() === normalizedName)) {
            state.addNotification('warning', `A categoria "${cat.name}" já existe.`);
            return;
        }

        // 6. Real-time integrity check before adding
        const integrity = get().validateMenuIntegrity([...state.categories, cat], state.menu);
        if (!integrity.isValid) {
           logger.error('Integrity warning before adding category', { issues: integrity.issues }, 'STORE');
        }

        // 7. Assign Sort Order if missing
        if (cat.sort_order === undefined) {
             const maxOrder = state.categories.reduce((max, c) => Math.max(max, c.sort_order || 0), 0);
             cat.sort_order = maxOrder + 1;
        }

        try {
          set((state) => ({ categories: [...state.categories, cat] }));
          get().invalidateMenuCache();
          
          // 4. Persist to SQL (CRITICAL)
          databaseOperations.saveCategory(cat).then(success => {
              if (success) {
                  logger.info('Categoria guardada em SQL com sucesso', { categoryId: cat.id }, 'DATABASE');
              } else {
                  logger.error('Falha na persistência SQL da categoria', { category: cat }, 'DATABASE');
                  get().addNotification('error', 'Erro ao guardar categoria na base de dados local.');
              }
          }).catch((e: unknown) => {
              logger.error('Erro de execução na persistência SQL', { error: (e as Error).message }, 'DATABASE');
          });

          get().addAuditLog('CATEGORY_ADDED', 'MenuCategory', cat.id, { message: `Categoria adicionada: ${cat.name}` });

          // Auto-sync to cloud if configured
          get().triggerSync();
        } catch (e: unknown) {
          logger.error('Critical error adding category', { error: (e as Error).message }, 'STORE');
          get().addNotification('error', 'Erro interno ao adicionar categoria.');
        }
      },
      updateCategory: (cat: MenuCategory) => {
        const state = get();

        // 1. Validation: Name required
        if (!cat.name || cat.name.trim() === '') {
            state.addNotification('error', 'Nome da categoria é obrigatório.');
            return;
        }

        // 2. Prevenção de loops em hierarquia
        if (cat.parent_id && cat.parent_id === cat.id) {
           state.addNotification('error', 'Uma categoria não pode ser subcategoria de si mesma.');
           return;
        }

        // 3. Validation: Duplicate Name (Case insensitive, excluding self)
        const normalizedName = cat.name.trim().toLowerCase();
        const existing = state.categories.find(c => c.name.trim().toLowerCase() === normalizedName);
        if (existing && existing.id !== cat.id) {
            state.addNotification('warning', `Já existe outra categoria com o nome "${cat.name}".`);
            return;
        }

        // 4. Real-time integrity check before updating
        const nextCategories = state.categories.map(c => c.id === cat.id ? cat : c);
        const integrity = get().validateMenuIntegrity(nextCategories, state.menu);
        if (!integrity.isValid) {
           logger.error('Integrity warning before updating category', { issues: integrity.issues }, 'STORE');
        }

        try {
          // 5. Update related dishes categoryName to maintain consistency
          const updatedMenu = state.menu.map(d => 
            d.categoryId === cat.id ? { ...d, categoryName: cat.name } : d
          );

          set((state) => ({
            categories: state.categories.map(c => c.id === cat.id ? cat : c),
            menu: updatedMenu
          }));
          
          get().invalidateMenuCache();

          // 6. Persist to SQL (CRITICAL)
          databaseOperations.saveCategory(cat).then(success => {
              if (success) {
                  logger.info('Categoria atualizada em SQL com sucesso', { categoryId: cat.id }, 'DATABASE');
              } else {
                  logger.error('Falha na atualização SQL da categoria', { category: cat }, 'DATABASE');
                  get().addNotification('error', 'Erro ao atualizar categoria na base de dados local.');
              }
          }).catch((e: unknown) => {
              logger.error('Erro de execução na atualização SQL', { error: (e as Error).message }, 'DATABASE');
          });

          get().addAuditLog('CATEGORY_UPDATED', 'MenuCategory', cat.id, { message: `Categoria atualizada: ${cat.name}` });
          
          get().triggerSync();
        } catch (e: unknown) {
          logger.error('Critical error updating category', { error: (e as Error).message }, 'STORE');
          get().addNotification('error', 'Erro interno ao atualizar categoria.');
        }
      },
      removeCategory: (id: string) => {
        const state = get();
        
        // 1. Check for active products first
        const hasProducts = state.menu.some(d => d.categoryId === id);
        if (hasProducts) {
          get().addNotification('warning', 'Não é possível remover categoria com produtos ativos.');
          return;
        }

        const categoryToRemove = state.categories.find(c => c.id === id);
        if (!categoryToRemove) return;

        try {
          const newCategories = state.categories.filter(c => c.id !== id);

          // SAFETY CHECK: Ensure we didn't accidentally wipe more than intended
          if (state.categories.length - newCategories.length !== 1) {
             logger.error('CRITICAL: removeCategory attempted to remove more than one category or failed. Aborting.', { id, originalCount: state.categories.length, newCount: newCategories.length }, 'STORE');
             get().addNotification('error', 'Erro interno ao processar remoção da categoria.');
             return;
          }

          set({ 
            categories: newCategories,
            deletedCategoryIds: [...(state.deletedCategoryIds || []), id] 
          });

          // Delete from SQL
          databaseOperations.deleteCategory(id).catch((e: unknown) => {
            logger.error('Failed to delete category from SQL', { error: (e as Error).message, id }, 'DATABASE');
          });

          // Log the deletion for recovery
          const deletedAt = new Date().toISOString();
          logger.info(`Categoria removida: ${categoryToRemove.name}`, { category: categoryToRemove, deletedAt }, 'STORE');
          
          get().addAuditLog('CATEGORY_DELETED', 'MenuCategory', categoryToRemove.id, { message: `Categoria "${categoryToRemove.name}" (${id}) removida pelo utilizador.`, category: { ...categoryToRemove, deletedAt } });

          get().invalidateMenuCache();
          get().triggerSync();
        } catch (e: unknown) {
          logger.error('Critical error removing category', { error: (e as Error).message, id }, 'STORE');
          get().addNotification('error', 'Erro interno ao remover categoria.');
        }
      },

      recoverDeletedCategory: (category) => {
         set((state) => {
             const exists = state.categories.find(c => c.id === category.id);
             if (exists) return state;

             const cleanCategory = { ...category };
             delete cleanCategory.deletedAt;

             return {
                 categories: [...state.categories, cleanCategory],
                 deletedCategoryIds: state.deletedCategoryIds.filter(id => id !== category.id)
             };
         });
         get().addNotification('success', `Categoria "${category.name}" recuperada com sucesso.`);
         get().triggerSync();
       },

       scanAndRecoverCategories: async () => {
          const state = get();
          state.addNotification('info', 'A procurar categorias removidas em backups e logs...');
          
          try {
              const recoveredItems = await recoveryService.scanForDeletedCategories(state.auditLogs);
              
              if (recoveredItems.length === 0) {
                  state.addNotification('info', 'Nenhuma categoria removida encontrada para recuperação.');
                  return;
              }

              let count = 0;
              recoveredItems.forEach(item => {
                  if (recoveryService.validateIntegrity(item.category, state.categories)) {
                      state.recoverDeletedCategory(item.category);
                      count++;
                  }
              });

              if (count > 0) {
                   state.addNotification('success', `${count} categorias foram localizadas e restauradas.`);
                   // Generate Report
                   await recoveryService.generateRecoveryReport(recoveredItems);
               } else {
                  state.addNotification('info', 'Categorias encontradas já existem no sistema atual.');
              }
          } catch (e: unknown) {
              logger.error("Recovery failed", { error: (e as Error).message }, 'RECOVERY');
              state.addNotification('error', 'Falha ao executar processo de recuperação.');
          }
       },
      setCategoriesFromCloud: (categories) => {
        set({ categories });
        get().addIntegrationLog({ type: 'cloud.categories.sync', message: 'Categorias atualizadas da cloud', details: { count: categories.length } });
      },

      addDish: (dish) => {
        const state = get();
        
        // 1. Basic Validation
        if (!dish.name || dish.name.trim() === '') {
          get().addNotification('error', 'Nome do produto é obrigatório.');
          return;
        }

        if (dish.price < 0) {
          get().addNotification('error', 'Preço do produto não pode ser negativo.');
          return;
        }

        // 2. Category Validation
        const categories = get().categories;
        const { valid, resolvedId, reason } = validateDishCategory(dish, categories);
        if (!valid) {
          get().addNotification('error', reason || 'Categoria inválida');
          logger.error('Falha ao adicionar produto: Categoria inválida', { dish, reason }, 'STORE');
          return;
        }

        const finalDish: Dish = { 
            ...dish, 
            id: dish.id || `dish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            categoryId: resolvedId!,
            categoryName: categories.find(c => c.id === resolvedId)?.name || dish.categoryName 
        };

        // 3. Real-time integrity check
        const integrity = get().validateMenuIntegrity(categories, [...state.menu, finalDish]);
        if (!integrity.isValid) {
           logger.error('Integrity warning before adding dish', { issues: integrity.issues }, 'STORE');
        }

        try {
          set((state) => ({ menu: [...state.menu, finalDish] }));
          get().invalidateMenuCache();

          // 4. Persist to SQL (CRITICAL)
          databaseOperations.saveDish(finalDish).then(success => {
              if (success) {
                  logger.info('Produto guardado em SQL com sucesso', { dishId: finalDish.id }, 'DATABASE');
              } else {
                  logger.error('Falha na persistência SQL do produto', { dish: finalDish }, 'DATABASE');
                  get().addNotification('error', 'Erro ao guardar produto na base de dados local.');
              }
          }).catch((e: unknown) => {
              logger.error('Erro de execução na persistência SQL', { error: (e as Error).message }, 'DATABASE');
          });

          get().addAuditLog('DISH_ADDED', 'Dish', finalDish.id, { message: `Produto adicionado: ${finalDish.name}`, categoryId: finalDish.categoryId });
          get().triggerSync();
        } catch (e: unknown) {
          logger.error('Critical error adding dish', { error: (e as Error).message }, 'STORE');
          get().addNotification('error', 'Erro interno ao adicionar produto.');
        }
      },
      updateDish: (dish) => {
        const state = get();

        // 1. Basic Validation
        if (!dish.name || dish.name.trim() === '') {
          get().addNotification('error', 'Nome do produto é obrigatório.');
          return;
        }

        if (dish.price < 0) {
          get().addNotification('error', 'Preço do produto não pode ser negativo.');
          return;
        }

        // 2. Category Validation
        const categories = get().categories;
        const { valid, resolvedId, reason } = validateDishCategory(dish, categories);
        if (!valid) {
          get().addNotification('error', reason || 'Categoria inválida');
          logger.error('Falha ao atualizar produto: Categoria inválida', { dish, reason }, 'STORE');
          return;
        }

        const resolvedCategory = categories.find(c => c.id === resolvedId);
        const finalDish: Dish = { 
            ...dish, 
            categoryId: resolvedId!,
            categoryName: resolvedCategory ? resolvedCategory.name : dish.categoryName
        };

        // 3. Real-time integrity check
        const nextMenu = state.menu.map(d => d.id === finalDish.id ? finalDish : d);
        const integrity = get().validateMenuIntegrity(categories, nextMenu);
        if (!integrity.isValid) {
           logger.error('Integrity warning before updating dish', { issues: integrity.issues }, 'STORE');
        }

        try {
          set({
            menu: nextMenu
          });
          get().invalidateMenuCache();

          // 4. Persist to SQL (CRITICAL)
          databaseOperations.saveDish(finalDish).then(success => {
              if (success) {
                  logger.info('Produto atualizado em SQL com sucesso', { dishId: finalDish.id }, 'DATABASE');
              } else {
                  logger.error('Falha na atualização SQL do produto', { dish: finalDish }, 'DATABASE');
                  get().addNotification('error', 'Erro ao atualizar produto na base de dados local.');
              }
          }).catch((e: unknown) => {
              logger.error('Erro de execução na atualização SQL', { error: (e as Error).message }, 'DATABASE');
          });

          get().addAuditLog('DISH_UPDATED', 'Dish', finalDish.id, { message: `Produto atualizado: ${finalDish.name}` });
          get().triggerSync();
        } catch (e: unknown) {
          logger.error('Critical error updating dish', { error: (e as Error).message }, 'STORE');
          get().addNotification('error', 'Erro interno ao atualizar produto.');
        }
      },
      removeDish: (id) => {
        const state = get();
        const dishToRemove = state.menu.find(d => d.id === id);
        
        if (!dishToRemove) return;

        try {
          set((state) => ({
            menu: state.menu.filter(d => d.id !== id)
          }));
          
          get().invalidateMenuCache();

          // Delete from SQL
          databaseOperations.deleteDish(id).catch((e: unknown) => {
              logger.error('Falha ao eliminar produto no SQL', { id, error: (e as Error).message }, 'DATABASE');
          });

          get().addAuditLog('DISH_DELETED', 'Dish', id, { message: `Produto removido: ${dishToRemove.name}`, dishName: dishToRemove.name });

          get().triggerSync();
          logger.info(`Produto removido com sucesso: ${dishToRemove.name}`, { id }, 'STORE');
        } catch (e: unknown) {
          logger.error('Erro crítico ao remover produto', { id, error: (e as Error).message }, 'STORE');
          get().addNotification('error', 'Erro interno ao remover produto.');
        }
      },

      addStockItem: (item) => {
        const state = get();
        
        // 1. Validation
        if (!item.name || item.name.trim() === '') {
          get().addNotification('error', 'Nome do item de stock é obrigatório.');
          return;
        }

        // 2. Duplicate Name Validation
        const normalizedName = item.name.trim().toLowerCase();
        const existing = state.stock.find(s => s.name.trim().toLowerCase() === normalizedName);
        if (existing) {
          get().addNotification('warning', `Já existe um item de stock com o nome "${item.name}".`);
          return;
        }

        try {
          // 3. ID Generation and Sanitization
          const finalItem: StockItem = {
            ...item,
            id: item.id || `stock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            quantity: typeof item.quantity === 'number' ? Math.max(0, item.quantity) : 0,
            minThreshold: typeof item.minThreshold === 'number' ? Math.max(0, item.minThreshold) : 5
          };

          set((state) => ({ stock: [...state.stock, finalItem] }));
          
          // 4. Persist to SQL
          databaseOperations.saveStockItems([finalItem]).catch((e: unknown) => {
            logger.error('Falha ao guardar item de stock no SQL', { item: finalItem, error: (e as Error).message }, 'DATABASE');
          });

          get().addAuditLog('STOCK_ITEM_ADDED', 'StockItem', finalItem.id, { message: `Item de stock adicionado: ${finalItem.name}`, initialQty: finalItem.quantity });

          logger.info(`Item de stock adicionado: ${finalItem.name}`, { id: finalItem.id }, 'STORE');
        } catch (e: unknown) {
          logger.error('Erro crítico ao adicionar item de stock', { error: (e as Error).message }, 'STORE');
          get().addNotification('error', 'Erro interno ao adicionar item de stock.');
        }
      },

      updateStockItem: (item) => {
        const state = get();

        if (!item.id) {
          logger.warn('Tentativa de atualizar item de stock sem ID', { item }, 'STORE');
          return;
        }

        // 1. Validation
        if (!item.name || item.name.trim() === '') {
          get().addNotification('error', 'Nome do item de stock é obrigatório.');
          return;
        }

        // 2. Duplicate Name Validation (excluding self)
        const normalizedName = item.name.trim().toLowerCase();
        const existing = state.stock.find(s => s.name.trim().toLowerCase() === normalizedName && s.id !== item.id);
        if (existing) {
          get().addNotification('warning', `Já existe outro item de stock com o nome "${item.name}".`);
          return;
        }

        try {
          // 3. Sanitization
          const sanitizedItem = {
            ...item,
            quantity: Math.max(0, item.quantity),
            minThreshold: Math.max(0, item.minThreshold || 0)
          };

          set((state) => ({
            stock: state.stock.map(s => s.id === item.id ? sanitizedItem : s)
          }));

          // 4. Persist to SQL
          databaseOperations.saveStockItems([sanitizedItem]).catch((e: unknown) => {
            logger.error('Falha ao atualizar item de stock no SQL', { item: sanitizedItem, error: (e as Error).message }, 'DATABASE');
          });

          get().addAuditLog('STOCK_ITEM_UPDATED', 'StockItem', sanitizedItem.id, { message: `Item de stock atualizado: ${sanitizedItem.name}` });

          logger.info(`Item de stock atualizado: ${sanitizedItem.name}`, { id: sanitizedItem.id }, 'STORE');
        } catch (e: unknown) {
          logger.error('Erro crítico ao atualizar item de stock', { id: item.id, error: (e as Error).message }, 'STORE');
          get().addNotification('error', 'Erro interno ao atualizar item de stock.');
        }
      },

      removeStockItem: (id) => {
        const state = get();
        const itemToRemove = state.stock.find(s => s.id === id);
        
        if (!itemToRemove) {
          logger.warn('Tentativa de remover item de stock inexistente', { id }, 'STORE');
          return;
        }

        // 1. Check if any dish is linked to this stock item
        const linkedDishes = state.menu.filter(d => d.stockItemId === id);
        if (linkedDishes.length > 0) {
          const dishNames = linkedDishes.map(d => d.name).join(', ');
          get().addNotification('warning', `Não é possível remover: este item está ligado aos produtos: ${dishNames}`);
          logger.warn('Remoção de item de stock bloqueada por dependências', { id, linkedDishes: linkedDishes.length }, 'STORE');
          return;
        }

        try {
          set((state) => ({
            stock: state.stock.filter(s => s.id !== id)
          }));

          // 2. Delete from SQL
          databaseOperations.deleteStockItem(id).catch((e: unknown) => {
            logger.error('Falha ao eliminar item de stock no SQL', { id, error: (e as Error).message }, 'DATABASE');
          });

          get().addAuditLog('STOCK_ITEM_DELETED', 'StockItem', id, { message: `Item de stock removido: ${itemToRemove.name}`, itemName: itemToRemove.name });

          logger.info(`Item de stock removido com sucesso: ${itemToRemove.name}`, { id }, 'STORE');
          get().addNotification('success', `Item "${itemToRemove.name}" removido do inventário.`);
          get().triggerSync();
        } catch (e: unknown) {
          logger.error('Erro crítico ao remover item de stock', { id, error: (e as Error).message }, 'STORE');
          get().addNotification('error', 'Erro interno ao remover item de stock.');
        }
      },

      updateStockQuantity: (id, delta) => {
        const state = get();
        const item = state.stock.find(s => s.id === id);
        
        if (!item) {
          logger.warn('Tentativa de atualizar quantidade de item inexistente', { id, delta }, 'STORE');
          return;
        }

        if (delta === 0) return;

        try {
          const newQty = Math.max(0, item.quantity + delta);
          
          // Se a quantidade não mudou (ex: já era 0 e tentou tirar mais), não fazemos nada
          if (newQty === item.quantity && delta < 0) {
            logger.warn(`Tentativa de reduzir stock abaixo de zero para ${item.name}`, { id, currentQty: item.quantity, delta }, 'STORE');
            return;
          }

          const updatedItem = { ...item, quantity: newQty };

          set((state) => ({
            stock: state.stock.map(s => s.id === id ? updatedItem : s)
          }));

          // Persist to SQL
          databaseOperations.saveStockItems([updatedItem]).catch((e: unknown) => {
            logger.error('Falha ao atualizar quantidade de stock no SQL', { id, newQty, error: (e as Error).message }, 'DATABASE');
          });

          get().addAuditLog('STOCK_QUANTITY_CHANGED', 'StockItem', id, { message: `Stock ${delta > 0 ? 'aumentado' : 'diminuído'} para ${item.name} em ${Math.abs(delta)}. Novo: ${newQty}`, delta, oldQty: item.quantity, newQty });

          // Check for low stock notification
          if (newQty <= item.minThreshold) {
            get().addNotification('warning', `Stock baixo: ${item.name} restam apenas ${newQty} ${item.unit}`);
          }

          logger.info(`Quantidade de stock atualizada: ${item.name}`, { id, delta, newQty }, 'STORE');
        } catch (e: unknown) {
          logger.error('Erro crítico ao atualizar quantidade de stock', { id, delta, error: (e as Error).message }, 'STORE');
        }
      },

      stock: MOCK_STOCK,
      activeOrders: [],
      customers: MOCK_CUSTOMERS,
      reservations: MOCK_RESERVATIONS,
      expenses: [], 
      fixedExpenses: [],
      revenues: [],
      shifts: [],
      currentShiftId: null,
      activeTableId: null,
      activeOrderId: null,
      menuCache: null,

      getCachedMenu: () => {
        const state = get();
        const now = Date.now();
        const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

        if (state.menuCache && (now - state.menuCache.lastUpdated < CACHE_TTL)) {
          return { categories: state.menuCache.categories, menu: state.menuCache.menu };
        }

        // Update cache
        const cache = {
          lastUpdated: now,
          categories: state.categories,
          menu: state.menu
        };
        set({ menuCache: cache });
        return { categories: state.categories, menu: state.menu };
      },

      invalidateMenuCache: () => set({ menuCache: null }),

      importCloudItems: (payload: { categories: MenuCategory[]; dishes: Dish[]; preferCloud?: boolean }) => {
        const preferCloud = !!payload.preferCloud;
        const state = get();
        const localCatById = new Map(state.categories.map(c => [c.id, c]));
        const localDishById = new Map(state.menu.map(d => [d.id, d]));
        const nextCategories: MenuCategory[] = [...state.categories];
        const nextMenu: Dish[] = [...state.menu];
        payload.categories.forEach(rc => {
          const lc = localCatById.get(rc.id) as Record<string, any> | undefined;
          if (!lc) {
            nextCategories.push({
              ...rc,
              isAvailableOnDigitalMenu: rc.isAvailableOnDigitalMenu !== false
            });
          } else {
            const keep = preferCloud ? rc : lc;
            const merged = {
              ...(lc as Record<string, any>),
              ...(keep as Record<string, any>)
            };
            const idx = nextCategories.findIndex(c => c.id === lc.id);
            if (idx >= 0) nextCategories[idx] = merged;
          }
        });
        payload.dishes.forEach(rd => {
          const ld = localDishById.get(rd.id) as Record<string, any> | undefined;
          if (!ld) {
            nextMenu.push({
              ...rd,
              disponivel: rd.disponivel !== false
            });
          } else {
            const keep = preferCloud ? rd : ld;
            const merged = {
              ...(ld as Record<string, any>),
              ...(keep as Record<string, any>)
            };
            const idx = nextMenu.findIndex(d => d.id === ld.id);
            if (idx >= 0) nextMenu[idx] = merged;
          }
        });
        set({ categories: nextCategories, menu: nextMenu });
        get().invalidateMenuCache();
        get().addNotification('success', 'Itens importados da cloud');
        get().triggerSync();
      },

      detectCloudConflicts: (payload: { categories: MenuCategory[]; dishes: Dish[] }) => {
        const state = get();
        const conflicts: { categories: MenuCategory[]; dishes: Dish[] } = { categories: [], dishes: [] };
        const localCatById = new Map(state.categories.map(c => [c.id, c]));
        const localDishById = new Map(state.menu.map(d => [d.id, d]));
        payload.categories.forEach(rc => {
          const lc = localCatById.get(rc.id) as Record<string, any> | undefined;
          if (lc) {
            const a = JSON.stringify({ name: lc.name, icon: lc.icon, parentId: lc.parentId, sort_order: lc.sort_order });
            const b = JSON.stringify({ name: rc.name, icon: rc.icon, parentId: rc.parentId, sort_order: rc.sort_order });
            if (a !== b) conflicts.categories.push(rc);
          }
        });
        payload.dishes.forEach(rd => {
          const ld = localDishById.get(rd.id) as Record<string, any> | undefined;
          if (ld) {
            const a = JSON.stringify({ name: ld.name, price: ld.price, categoryId: ld.categoryId, taxCode: ld.taxCode });
            const b = JSON.stringify({ name: rd.name, price: rd.price, categoryId: rd.categoryId, taxCode: rd.taxCode });
            if (a !== b) conflicts.dishes.push(rd);
          }
        });
        return conflicts;
      },

      resolveCloudConflict: (itemType: 'category' | 'dish', id: string, decision: 'cloud' | 'local', cloudItem: MenuCategory | Dish) => {
        const state = get();
        if (itemType === 'category') {
          const lc = state.categories.find(c => c.id === id);
          if (!lc) return;
          const merged = decision === 'cloud' ? { ...lc, ...(cloudItem as MenuCategory) } : lc;
          set({ categories: state.categories.map(c => c.id === id ? merged : c) });
        } else {
          const ld = state.menu.find(d => d.id === id);
          if (!ld) return;
          const merged = decision === 'cloud' ? { ...ld, ...(cloudItem as Dish) } : ld;
          set({ menu: state.menu.map(d => d.id === id ? merged : d) });
        }
        get().invalidateMenuCache();
        get().triggerSync();
      },

      // QR Code Menu State
      qrCodeConfig: null,
      menuAccessLogs: [],

      openShift: (amount) => {
        const state = get();
        const { currentUser, activeOrders } = state;
        
        if (!currentUser) {
          state.addNotification('error', 'Utilizador não autenticado.');
          return;
        }

        if (state.currentShiftId) {
          state.addNotification('warning', 'Já existe um turno aberto.');
          return;
        }

        if (amount < 0) {
          state.addNotification('error', 'O saldo inicial não pode ser negativo.');
          return;
        }

        try {
          const id = `shift-${Date.now()}`;
          const newShift: CashShift = {
            id, 
            userId: currentUser.id, 
            userName: currentUser.name,
            startTime: new Date(), 
            openingBalance: amount, 
            status: 'OPEN',
            salesBreakdown: { NUMERARIO: 0, TPA: 0, TRANSFERENCIA: 0, CONTA_CORRENTE: 0, QR_CODE: 0 }
          };

          // Transferir automaticamente todas as contas em aberto para este novo turno
          const updatedOrders = activeOrders.map(order => {
            if (order.status === 'ABERTO') {
              return { ...order, shiftId: id };
            }
            return order;
          });

          set({ 
            shifts: [...get().shifts, newShift], 
            currentShiftId: id,
            activeOrders: updatedOrders
          });

          // Persist to SQL
          databaseOperations.saveShifts([newShift]).catch(e => {
            logger.error('Falha ao guardar turno no SQL', { shift: newShift, error: e.message }, 'DATABASE');
          });

          // If there were orders transferred, persist them too
          const openOrders = updatedOrders.filter(o => o.status === 'ABERTO');
          if (openOrders.length > 0) {
            databaseOperations.saveOrders(openOrders).catch(e => {
              logger.error('Falha ao atualizar ordens transferidas no SQL', { error: e.message }, 'DATABASE');
            });
          }

          get().addAuditLog('SHIFT_OPENED', 'CashShift', id, { message: `Caixa aberto por ${currentUser.name} com saldo inicial de ${amount} Kz`, openingBalance: amount });

          get().addNotification('success', 'Caixa aberto com sucesso');
          logger.info(`Caixa aberto com sucesso por ${currentUser.name}`, { shiftId: id, amount }, 'FINANCE');
          get().triggerSync();
        } catch (e: unknown) {
          logger.error('Erro crítico ao abrir caixa', { error: (e as Error).message }, 'STORE');
          get().addNotification('error', 'Erro interno ao abrir caixa.');
        }
      },

      closeShift: (closingAmount) => {
        const { currentShiftId, shifts, activeOrders, currentUser } = get();
        if (!currentShiftId) {
          logger.warn('Tentativa de fechar caixa sem turno ativo', { currentUser: currentUser?.name }, 'STORE');
          return;
        }
        
        const shiftIndex = shifts.findIndex(s => s.id === currentShiftId);
        if (shiftIndex === -1) {
          logger.error('Turno ativo não encontrado na lista de turnos', { currentShiftId }, 'STORE');
          return;
        }

        try {
          const currentShift = { ...shifts[shiftIndex] };
          
          // Calcular breakdown de vendas e totais
          const shiftOrders = activeOrders.filter(o => (o.status === 'FECHADO' || o.status === 'PAGO') && o.shiftId === currentShiftId);
          
          const breakdown = { NUMERARIO: 0, TPA: 0, TRANSFERENCIA: 0, CONTA_CORRENTE: 0, QR_CODE: 0 };
          let totalSales = 0;

          shiftOrders.forEach(order => {
            if (order.payments && order.payments.length > 0) {
              // Support for multi-payment split
              order.payments.forEach(payment => {
                const method = payment.method as keyof typeof breakdown;
                if (breakdown[method] !== undefined) {
                  breakdown[method] += payment.amount;
                }
              });
              totalSales += order.total;
            } else if (order.paymentMethod) {
              // Legacy single payment support
              const method = order.paymentMethod as keyof typeof breakdown;
              if (breakdown[method] !== undefined) {
                breakdown[method] += order.total;
              }
              totalSales += order.total;
            }
          });

          const expected = currentShift.openingBalance + totalSales;
          const difference = closingAmount - expected;

          currentShift.status = 'CLOSED';
          currentShift.endTime = new Date();
          currentShift.closingBalance = closingAmount;
          currentShift.expectedBalance = expected;
          currentShift.salesBreakdown = breakdown;

          const newShifts = [...shifts];
          newShifts[shiftIndex] = currentShift;

          // Limpar shiftId das ordens em aberto para que o próximo turno as assuma
          const updatedOrders = activeOrders.map(order => {
            if (order.status === 'ABERTO' && order.shiftId === currentShiftId) {
              return { ...order, shiftId: undefined };
            }
            return order;
          });

          set({ 
            shifts: newShifts, 
            currentShiftId: null,
            activeOrders: updatedOrders
          });

          logger.info(`Caixa fechado por ${currentUser?.name}`, { 
            shiftId: currentShiftId, 
            expected, 
            actual: closingAmount, 
            difference 
          }, 'FINANCE');

          get().addAuditLog('SHIFT_CLOSED', 'CashShift', currentShiftId, { message: `Caixa fechado por ${currentUser?.name}. Esperado: ${expected} Kz, Informado: ${closingAmount} Kz. Diferença: ${difference} Kz`, expected, actual: closingAmount, difference }); 


          get().addNotification('info', `Caixa fechado. Diferença: ${difference} Kz`);
        } catch (e: unknown) {
          logger.error('Erro ao fechar caixa', { error: (e as Error).message, shiftId: currentShiftId }, 'STORE');
          get().addNotification('error', 'Erro crítico ao fechar caixa.');
        }
      },

      setActiveTable: (id) => {
        set({ activeTableId: id });
        if (id !== null) {
          const existingOrders = get().activeOrders.filter(o => o.tableId === id && o.status === 'ABERTO');
          if (existingOrders.length > 0) {
            set({ activeOrderId: existingOrders[0].id });
          } else {
            const newId = get().createNewOrder(id, 'Principal');
            set({ activeOrderId: newId });
          }
        } else {
          set({ activeOrderId: null });
        }
      },
      setActiveOrder: (id) => set({ activeOrderId: id }),
      
      createNewOrder: (tableId, name) => {
        const state = get();
        const { currentUser, currentShiftId } = state;
        
        try {
          const id = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 4)}`;
          const newOrder: Order = {
            id, 
            subAccountName: name || 'Principal', 
            tableId, 
            items: [],
            status: 'ABERTO', 
            timestamp: new Date(), 
            total: 0, 
            taxTotal: 0,
            shiftId: currentShiftId || '',
            userId: currentUser?.id,
            userName: currentUser?.name || 'System',
            employeeId: currentUser?.id || 'SYSTEM',
            type: 'LOCAL',
            orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
            subtotal: 0,
            isPaid: false,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          set(state => ({
            activeOrders: [...state.activeOrders, newOrder],
            activeOrderId: id,
            tables: state.tables.map(t => t.id === tableId ? { ...t, status: 'OCUPADO' } : t)
          }));
          
          // Persist to SQL
          databaseOperations.saveOrder(newOrder).catch(e => {
            logger.error('Falha ao guardar nova ordem no SQL', { orderId: id, error: e.message }, 'DATABASE');
          });

          // Update table status in SQL
          const targetTable = state.tables.find(t => t.id === tableId);
          if (targetTable) {
            databaseOperations.saveTable({ ...targetTable, status: 'OCUPADO' }).catch(e => {
              logger.error('Falha ao atualizar estado da mesa no SQL', { tableId, error: e.message }, 'DATABASE');
            });
          }
          
          logger.info(`Nova ordem criada: ${id}`, { tableId, subAccountName: name }, 'STORE');
          return id;
        } catch (e: unknown) {
          logger.error('Erro crítico ao criar nova ordem', { error: (e as Error).message, tableId }, 'STORE');
          state.addNotification('error', 'Erro interno ao criar pedido.');
          return '';
        }
      },

      clearDraftOrder: (orderId) => {
        const state = get();
        const order = state.activeOrders.find(o => o.id === orderId);
        if (order) {
             order.items.forEach(item => {
                 const dish = state.menu.find(d => d.id === item.dishId);
                 if (dish && dish.stockItemId) {
                     get().updateStockQuantity(dish.stockItemId, item.quantity);
                 }
             });
        }
        
        set(state => {
        const orderIndex = state.activeOrders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) return state;
        const newOrders = [...state.activeOrders];
        newOrders[orderIndex] = { ...newOrders[orderIndex], items: [], total: 0, taxTotal: 0 };
        return { activeOrders: newOrders };
      })
      },

      updateTableStatus: (tableId, status) => {
        const state = get();
        const table = state.tables.find(t => t.id === tableId);
        if (table) {
             const updatedTable = { ...table, status };
             set({ tables: state.tables.map(t => t.id === tableId ? updatedTable : t) });
             databaseOperations.saveTable(updatedTable).catch(e => logger.error('Failed to save table status', { error: e.message }, 'DATABASE'));
        }
      },

      addTable: (table) => {
        const state = get();
        const { currentUser } = state;
        
        try {
          const tableWithUser = { ...table, userId: currentUser?.id };
          set({ saveStatus: 'SAVING' });
          
          set((state) => ({ tables: [...state.tables, tableWithUser] }));
          
          databaseOperations.saveTable(tableWithUser)
            .then(() => {
              set({ saveStatus: 'SAVED' });
              get().backupLayout(); // Auto-backup on structural changes
              logger.info(`Mesa adicionada: ${table.name}`, { tableId: table.id }, 'STORE');
            })
            .catch(e => {
              logger.error('Falha ao guardar mesa no SQL', { tableId: table.id, error: e.message }, 'DATABASE');
              set({ saveStatus: 'ERROR' });
            });

          get().addAuditLog('TABLE_ADDED', 'Table', table.id.toString(), { message: `Mesa adicionada: ${table.name}` });
        } catch (e: unknown) {
          logger.error('Erro crítico ao adicionar mesa', { error: (e as Error).message }, 'STORE');
          set({ saveStatus: 'ERROR' });
        }
      },

      updateTable: (table) => {
        try {
          set({ saveStatus: 'SAVING' });
          set((state) => ({
            tables: state.tables.map(t => t.id === table.id ? table : t)
          }));

          databaseOperations.saveTable(table)
            .then(() => {
              set({ saveStatus: 'SAVED' });
              logger.info(`Mesa atualizada: ${table.name}`, { tableId: table.id }, 'STORE');
            })
            .catch((e: unknown) => {
              logger.error('Falha ao atualizar mesa no SQL', { tableId: table.id, error: (e as Error).message }, 'DATABASE');
              set({ saveStatus: 'ERROR' });
            });
        } catch (e: unknown) {
          logger.error('Erro crítico ao atualizar mesa', { tableId: table.id, error: (e as Error).message }, 'STORE');
          set({ saveStatus: 'ERROR' });
        }
      },

      removeTable: (id) => {
        const state = get();
        const tableToRemove = state.tables.find(t => t.id === id);
        if (!tableToRemove) return;

        try {
          // Check if table has active orders
          const hasActiveOrders = state.activeOrders.some(o => o.tableId === id && o.status === 'ABERTO');
          if (hasActiveOrders) {
            state.addNotification('warning', 'Não é possível remover mesa com pedidos ativos.');
            return;
          }

          set({ saveStatus: 'SAVING' });
          set((state) => ({
            tables: state.tables.filter(t => t.id !== id)
          }));

          databaseOperations.deleteTable(id)
            .then(() => {
              set({ saveStatus: 'SAVED' });
              get().backupLayout();
              logger.info(`Mesa removida: ${tableToRemove.name}`, { tableId: id }, 'STORE');
            })
            .catch((e: unknown) => {
              logger.error('Falha ao eliminar mesa no SQL', { tableId: id, error: (e as Error).message }, 'DATABASE');
              set({ saveStatus: 'ERROR' });
            });

          get().addAuditLog('TABLE_REMOVED', 'Table', id.toString(), { message: `Mesa removida: ${tableToRemove.name}` });
        } catch (e: unknown) {
          logger.error('Erro crítico ao remover mesa', { tableId: id, error: (e as Error).message }, 'STORE');
          set({ saveStatus: 'ERROR' });
        }
      },

      backupLayout: async () => {
        const { tables, currentUser } = get();
        try {
          await databaseOperations.createLayoutBackup(tables, currentUser?.id);
        } catch (e: unknown) {
          logger.error('Failed to create layout backup', { error: (e as Error).message }, 'DATABASE');
        }
      },

      transferTable: (fromTableId, toTableId) => {
        set(state => {
          const fromTable = state.tables.find(t => t.id === fromTableId);
          const toTable = state.tables.find(t => t.id === toTableId);
          
          if (!fromTable || !toTable) {
            get().addNotification('error', 'Mesa de origem ou destino não encontrada.');
            return state;
          }

          if (toTable.status === 'OCUPADO') {
            get().addNotification('error', 'A mesa de destino já está ocupada.');
            return state;
          }

          const openOrdersToTransfer = state.activeOrders.filter(o => o.tableId === fromTableId && o.status === 'ABERTO');
          
          if (openOrdersToTransfer.length === 0) {
            get().addNotification('warning', 'Não existem pedidos abertos na mesa de origem.');
            return state;
          }

          // Transfer all open orders from source to destination
          const newOrders = state.activeOrders.map(order => {
            if (order.tableId === fromTableId && order.status === 'ABERTO') {
              return { ...order, tableId: toTableId };
            }
            return order;
          });

          // Update table statuses
          const newTables = state.tables.map(table => {
            if (table.id === fromTableId) {
              const updated = { ...table, status: 'LIVRE' as const };
              databaseOperations.saveTable(updated).catch(e => logger.error('Failed to update source table status on transfer', { error: e.message }, 'DATABASE'));
              return updated;
            }
            if (table.id === toTableId) {
              const updated = { ...table, status: 'OCUPADO' as const };
              databaseOperations.saveTable(updated).catch(e => logger.error('Failed to update destination table status on transfer', { error: e.message }, 'DATABASE'));
              return updated;
            }
            return table;
          });

          // Audit Log
          const currentUser = get().currentUser;
          const transferDetails = openOrdersToTransfer.map(o => `${o.subAccountName} (${o.items.length} itens)`).join(', ');
          
          get().addAuditLog('TABLE_TRANSFER', 'Table', fromTableId, { message: `Transferência da Mesa ${fromTable.name} para ${toTable.name}. Pedidos: ${transferDetails}`, toTableId, transferDetails }); 


          return {
            activeOrders: newOrders,
            tables: newTables,
            activeTableId: state.activeTableId === fromTableId ? toTableId : state.activeTableId
          };
        });
        get().addNotification('success', 'Mesa transferida com sucesso.');
      },

      addToOrder: (_tableId, dish, quantity = 1, notes = '', specificOrderId) => {
        const state = get();
        
        // 1. Stock Validation (only if adding)
        if (quantity > 0 && dish.stockItemId) {
             const stockItem = state.stock.find(s => s.id === dish.stockItemId);
             if (stockItem) {
                 if (stockItem.quantity < quantity) {
                     state.addNotification('error', `Stock insuficiente para ${dish.name}. Restam: ${stockItem.quantity}`);
                     return;
                 }
             }
        }

        try {
          const targetOrderId = specificOrderId || state.activeOrderId;
          if (!targetOrderId) {
            state.addNotification('warning', 'Nenhum pedido ativo selecionado.');
            return;
          }

          set((state) => {
            const existingOrderIndex = state.activeOrders.findIndex(o => o.id === targetOrderId);
            if (existingOrderIndex === -1) return state;

            const newOrders = [...state.activeOrders];
            const taxMultiplier = (state.settings?.taxRate || 0) / 100;
            
            const order = { ...newOrders[existingOrderIndex] };
            const newItems = [...order.items];
            const itemIndex = newItems.findIndex(i => i.dishId === dish.id && i.status === 'PENDING' && (i.notes || '') === (notes || ''));
            const taxItem = (dish.price * quantity) * taxMultiplier;
            
            if (itemIndex > -1) {
              const newQuantity = newItems[itemIndex].quantity + quantity;
              if (newQuantity <= 0) {
                 // If quantity becomes 0 or less, remove the item
                 const itemToRemove = newItems[itemIndex];
                 const itemTotalWithTax = (itemToRemove.unitPrice * itemToRemove.quantity) + itemToRemove.taxAmount;
                 
                 order.total -= itemTotalWithTax;
                 order.taxTotal -= itemToRemove.taxAmount;
                 
                 newItems.splice(itemIndex, 1);
              } else {
                 newItems[itemIndex] = { 
                   ...newItems[itemIndex], 
                   quantity: newQuantity,
                   taxAmount: newItems[itemIndex].taxAmount + taxItem
                 };
                 order.total += dish.price * quantity + taxItem;
                 order.taxTotal += taxItem;
              }
            } else if (quantity > 0) {
              newItems.push({ 
                id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                dishId: dish.id, 
                name: dish.name,
                price: dish.price,
                quantity, 
                total: dish.price * quantity,
                status: 'PENDING', 
                notes,
                unitPrice: dish.price, 
                taxAmount: taxItem,
                taxCode: dish.taxCode || 'ISE'
              });
              order.total += dish.price * quantity + taxItem;
              order.taxTotal += taxItem;
            }
            order.items = newItems;
            // Ensure totals don't go negative due to rounding errors
            order.total = Math.max(0, order.total);
            order.taxTotal = Math.max(0, order.taxTotal);
            
            newOrders[existingOrderIndex] = order;
            
            // Persist updated order to SQL
            databaseOperations.saveOrder(order).catch((e: unknown) => {
              logger.error('Falha ao atualizar ordem no SQL após adição', { orderId: order.id, error: (e as Error).message }, 'DATABASE');
            });
            
            return { activeOrders: newOrders };
          });

          // 2. Stock Update (Deduct/Restore)
          if (dish.stockItemId) {
              get().updateStockQuantity(dish.stockItemId, -quantity);
          }

          logger.info(`Produto ${quantity > 0 ? 'adicionado ao' : 'removido do'} pedido`, { dish: dish.name, quantity, targetOrderId }, 'STORE');
        } catch (e: unknown) {
          logger.error('Erro crítico ao adicionar ao pedido', { error: (e as Error).message, dish: dish.name }, 'STORE');
          state.addNotification('error', 'Erro interno ao atualizar itens do pedido.');
        }
      },

      removeFromOrder: (orderId, itemIndex) => {
        try {
          set((state) => {
            const orderIndex = state.activeOrders.findIndex(o => o.id === orderId);
            if (orderIndex === -1) return state;

            const newOrders = [...state.activeOrders];
            const order = { ...newOrders[orderIndex] };
            const itemToRemove = order.items[itemIndex];
            
            if (!itemToRemove) return state;

            // Restaurar stock se o item estiver associado a um stockItemId
            const dish = state.menu.find(d => d.id === itemToRemove.dishId);
            if (dish?.stockItemId) {
              get().updateStockQuantity(dish.stockItemId, itemToRemove.quantity);
            }

            // Calculate amounts to subtract
            const itemTotal = (itemToRemove.unitPrice * itemToRemove.quantity) + itemToRemove.taxAmount;
            
            order.total = Math.max(0, order.total - itemTotal);
            order.taxTotal = Math.max(0, order.taxTotal - itemToRemove.taxAmount);

            order.items = order.items.filter((_, i) => i !== itemIndex);

            newOrders[orderIndex] = order;
            
            // Persist updated order to SQL
            databaseOperations.saveOrder(order).catch((e: unknown) => {
              logger.error('Falha ao atualizar ordem no SQL após remoção de item', { orderId, error: (e as Error).message }, 'DATABASE');
            });
            
            return { activeOrders: newOrders };
          });
          logger.info(`Item removido da ordem: ${orderId}`, { itemIndex }, 'STORE');
        } catch (e: unknown) {
          logger.error('Erro crítico ao remover item da ordem', { orderId, error: (e as Error).message }, 'STORE');
          get().addNotification('error', 'Erro interno ao remover item do pedido.');
        }
      },

      removeOrder: (id) => {
        try {
          const order = get().activeOrders.find(o => o.id === id);
          if (order) {
            // Restaurar stock para todos os itens da ordem
            order.items.forEach(item => {
              const dish = get().menu.find(d => d.id === item.dishId);
              if (dish?.stockItemId) {
                get().updateStockQuantity(dish.stockItemId, item.quantity);
              }
            });
          }

          // Persist deletion to SQL
          databaseOperations.deleteOrder(id)
            .then(() => {
              set((state) => ({
                activeOrders: state.activeOrders.filter(o => o.id !== id)
              }));
              logger.info(`Ordem removida: ${id}`, {}, 'STORE');
            })
            .catch((e: unknown) => {
              logger.error('Falha ao eliminar ordem no SQL', { orderId: id, error: (e as Error).message }, 'DATABASE');
              get().addNotification('error', 'Erro interno ao remover pedido.');
            });
        } catch (e: unknown) {
          logger.error('Erro crítico ao remover ordem', { orderId: id, error: (e as Error).message }, 'STORE');
          get().addNotification('error', 'Erro interno ao remover pedido.');
        }
      },

      closeOrder: (id: string) => set((state) => ({
        activeOrders: state.activeOrders.map(o => o.id === id ? { ...o, status: 'FECHADO' } : o)
      })),

      assignCustomerToOrder: (orderId: string, customerId: string) => set((state) => ({
        activeOrders: state.activeOrders.map(o => o.id === orderId ? { ...o, customerId } : o)
      })),

      fireOrderToKitchen: (orderId) => { 
        get().addNotification('info', 'Pedido enviado para a cozinha.'); 
        get().addAuditLog('ORDER_FIRED', 'Order', orderId, { message: `Order ${orderId} fired to kitchen`, userId: get().currentUser?.name || 'SYSTEM' });
      },

      checkoutTable: async (orderId, payments, customerId, customerNif) => {
        const state = get();
        const orderIndex = state.activeOrders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) {
            state.addNotification('error', 'Pedido não encontrado.');
            return;
        }

        const currentOrder = { ...state.activeOrders[orderIndex] };
        
        try {
            // 1. Validation
            if (currentOrder.status !== 'ABERTO') {
                state.addNotification('warning', 'Este pedido já foi processado ou está fechado.');
                return;
            }

            // Validação de pagamentos
            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
            if (Math.abs(totalPaid - currentOrder.total) > 0.01) {
                state.addNotification('error', 'O valor total pago deve ser igual ao total do pedido.');
                return;
            }

            // 2. Calcular número da fatura
            const closedOrdersCount = state.activeOrders.filter(o => o.status === 'FECHADO').length;
            const nextNum = closedOrdersCount + 1; 
            const invoiceNo = `FT ${state.settings?.invoiceSeries || 'A'}/${nextNum}`;
            
            // 3. Digital Signature (AGT Compliance)
            let hash = "ERROR-HASH";
            try {
                let privateKey = localStorage.getItem('agt_private_key');
                
                if (!privateKey) {
                    logger.info("Chave privada não encontrada. Gerando nova chave para demonstração...", {}, 'SECURITY');
                    const keyPair = await generateNewKeyPair();
                    privateKey = keyPair.privateKey;
                    localStorage.setItem('agt_private_key', privateKey);
                }

                // Buscar a última fatura para o encadeamento de hash
                const lastOrder = [...state.activeOrders]
                    .filter(o => o.status === 'FECHADO' && o.hash)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                
                const previousHash = lastOrder ? (lastOrder.hash || "") : "";
                
                currentOrder.timestamp = new Date();
                currentOrder.invoiceNumber = invoiceNo;
                
                if (privateKey) {
                    hash = await signInvoice(currentOrder, previousHash, privateKey, state.menu, state.settings);
                } else {
                    throw new Error("Chave privada não disponível");
                }
            } catch (e: unknown) {
                const signError = e as Error;
                logger.error("Falha na assinatura digital AGT", { error: signError.message, orderId }, 'SECURITY');
                state.addNotification('error', 'Falha crítica na assinatura digital. Venda bloqueada por conformidade.');
                return;
            }

            // 4. Finalize Order State
            set((state) => {
              const newOrders = [...state.activeOrders];
              const finalOrder: Order = {
                  ...currentOrder,
                  status: 'FECHADO' as const,
                  payments: payments,
                  paymentMethod: payments.length === 1 ? payments[0].method : undefined,
                  customerId,
                  customerNif,
                  invoiceNumber: invoiceNo,
                  hash: hash,
                  shiftId: state.currentShiftId || undefined
              };

              newOrders[orderIndex] = finalOrder;
              
              // Persist to SQL
              databaseOperations.saveOrder(finalOrder).catch((e: unknown) => {
                  logger.error('Falha ao guardar fatura finalizada no SQL', { orderId, invoiceNo, error: (e as Error).message }, 'DATABASE');
              });

              const tableId = finalOrder.tableId;
              const remainingOrders = newOrders.filter(o => o.tableId === tableId && o.status === 'ABERTO');
              
              return { 
                  activeOrders: newOrders, 
                  tables: state.tables.map(t => t.id === tableId ? { ...t, status: remainingOrders.length > 0 ? 'OCUPADO' : 'LIVRE' } : t),
                  activeOrderId: remainingOrders.length > 0 ? remainingOrders[0].id : null,
                  activeTableId: remainingOrders.length > 0 ? tableId : null
              };
            });

            // 5. Audit & Notification
            get().addAuditLog(
                'ORDER_CHECKOUT',
                'Order',
                orderId,
                {
                    message: `Venda finalizada: ${invoiceNo}. Total: ${currentOrder.total} Kz. Pagamentos: ${payments.map(p => `${p.method}: ${p.amount}`).join(', ')}`,
                    invoiceNo,
                    total: currentOrder.total,
                    payments
                }
            );

            state.addNotification('success', `Venda Concluída! Fatura ${invoiceNo}`);
            logger.info(`Venda finalizada com sucesso: ${invoiceNo}`, { orderId, total: currentOrder.total }, 'FINANCE');
            
            get().triggerSync();
        } catch (e: unknown) {
            logger.error('Erro crítico no checkout do pedido', { orderId, error: (e as Error).message }, 'STORE');
            state.addNotification('error', 'Erro interno ao processar finalização da venda.');
        }
      },

      closeTableWithoutOrders: (tableId) => {
        const state = get();
        // Identificar ordens que serão removidas
        const ordersToRemove = state.activeOrders.filter(o => o.tableId === tableId && o.status === 'ABERTO');
        
        // Restaurar stock para cada ordem removida
        ordersToRemove.forEach(order => {
          order.items.forEach(item => {
            const dish = state.menu.find(d => d.id === item.dishId);
            if (dish?.stockItemId) {
              get().updateStockQuantity(dish.stockItemId, item.quantity);
            }
          });
        });

        set((state) => {
          const newOrders = state.activeOrders.filter(o => !(o.tableId === tableId && o.status === 'ABERTO'));
          
          return {
            activeOrders: newOrders,
            tables: state.tables.map(t => t.id === tableId ? { ...t, status: 'LIVRE' } : t),
            activeTableId: null,
            activeOrderId: null
          };
        });
        get().addNotification('success', 'Mesa libertada.');
      },

      addReservation: (res) => set((state) => ({ reservations: [...state.reservations, res] })),
      updateReservation: (res) => set((state) => ({ reservations: state.reservations.map(r => r.id === res.id ? res : r) })),
      removeReservation: (id) => set((state) => ({ reservations: state.reservations.filter(r => r.id !== id) })),
      updateOrderItemNotes: (orderId, dishId, notes) => set((state) => {
        const orderIndex = state.activeOrders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) return state;
        const newOrders = [...state.activeOrders];
        const itemIndex = newOrders[orderIndex].items.findIndex(i => i.dishId === dishId && i.status === 'PENDING');
        if (itemIndex > -1) {
          newOrders[orderIndex].items[itemIndex].notes = notes;
          return { activeOrders: newOrders };
        }
        return state;
      }),
      updateOrderItemStatus: (orderId, itemIndex, status) => set((state) => {
        const oIdx = state.activeOrders.findIndex(o => o.id === orderId);
        if (oIdx === -1) return state;
        const newOrders = [...state.activeOrders];
        newOrders[oIdx].items[itemIndex].status = status;
        return { activeOrders: newOrders };
      }),
      markOrderAsServed: (orderId) => set((state) => {
        const oIdx = state.activeOrders.findIndex(o => o.id === orderId);
        if (oIdx === -1) return state;
        const newOrders = [...state.activeOrders];
        newOrders[oIdx].items = newOrders[oIdx].items.map(i => ({ ...i, status: 'ENTREGUE' }));
        return { activeOrders: newOrders };
      }),
      addCustomer: (customer) => {
        try {
          if (!customer.name) throw new Error('Nome do cliente é obrigatório');
          
          set((state) => ({ 
            customers: [...state.customers, customer],
            saveStatus: 'SAVING'
          }));

          databaseOperations.saveCustomer(customer)
            .then(() => set({ saveStatus: 'SAVED' }))
            .catch((e: unknown) => {
              logger.error('Falha ao guardar cliente no SQL', { customerId: customer.id, error: (e as Error).message }, 'DATABASE');
              set({ saveStatus: 'ERROR' });
            });

          get().addAuditLog(
            'CUSTOMER_ADDED',
            'Customer',
            customer.id,
            { message: `Cliente adicionado: ${customer.name}` }
          );
          
          get().addNotification('success', 'Cliente registado com sucesso.');
        } catch (e: unknown) {
          logger.error('Erro ao adicionar cliente', { error: (e as Error).message }, 'STORE');
          get().addNotification('error', (e as Error).message || 'Erro ao registar cliente.');
        }
      },

      updateCustomer: (customer) => {
        try {
          set((state) => ({ 
            customers: state.customers.map(c => c.id === customer.id ? customer : c),
            saveStatus: 'SAVING'
          }));

          databaseOperations.saveCustomer(customer)
            .then(() => set({ saveStatus: 'SAVED' }))
            .catch((e: unknown) => {
              logger.error('Falha ao atualizar cliente no SQL', { customerId: customer.id, error: (e as Error).message }, 'DATABASE');
              set({ saveStatus: 'ERROR' });
            });

          logger.info(`Cliente atualizado: ${customer.name}`, { customerId: customer.id }, 'STORE');
        } catch (e: unknown) {
          logger.error('Erro ao atualizar cliente', { customerId: customer.id, error: (e as Error).message }, 'STORE');
          get().addNotification('error', 'Erro ao atualizar dados do cliente.');
        }
      },

      removeCustomer: (id) => {
        try {
          const customer = get().customers.find(c => c.id === id);
          if (!customer) return;

          set((state) => ({ 
            customers: state.customers.filter(c => c.id !== id),
            saveStatus: 'SAVING'
          }));

          databaseOperations.deleteCustomer(id)
            .then(() => set({ saveStatus: 'SAVED' }))
            .catch((e: unknown) => {
              logger.error('Falha ao eliminar cliente no SQL', { customerId: id, error: (e as Error).message }, 'DATABASE');
              set({ saveStatus: 'ERROR' });
            });

          get().addAuditLog(
            'CUSTOMER_REMOVED',
            'Customer',
            id,
            { message: `Cliente removido: ${customer.name}` }
          );
          
          get().addNotification('success', 'Cliente removido.');
        } catch (e: unknown) {
          logger.error('Erro ao remover cliente', { customerId: id, error: (e as Error).message }, 'STORE');
          get().addNotification('error', 'Erro ao remover cliente.');
        }
      },

      settleCustomerDebt: (customerId, amount) => {
        try {
          const customer = get().customers.find(c => c.id === customerId);
          if (!customer) throw new Error('Cliente não encontrado');

          const newBalance = Math.max(0, (customer.balance || 0) - amount);
          
          set((state) => ({ 
            customers: state.customers.map(c => c.id === customerId ? { ...c, balance: newBalance } : c),
            saveStatus: 'SAVING'
          }));

          databaseOperations.saveCustomer({ ...customer, balance: newBalance })
            .then(() => set({ saveStatus: 'SAVED' }))
            .catch((e: unknown) => {
              logger.error('Falha ao atualizar saldo do cliente no SQL', { customerId, error: (e as Error).message }, 'DATABASE');
              set({ saveStatus: 'ERROR' });
            });

          get().addAuditLog(
            'CUSTOMER_DEBT_SETTLED',
            'Customer',
            customerId,
            { message: `Dívida liquidada: ${amount} Kz para ${customer.name}`, amount, newBalance }
          );
          
          get().addNotification('success', `Pagamento de ${amount} Kz registado.`);
        } catch (e: unknown) {
          logger.error('Erro ao liquidar dívida de cliente', { customerId, error: (e as Error).message }, 'STORE');
          get().addNotification('error', (e as Error).message || 'Erro ao processar pagamento.');
        }
      },
      
      addExpense: (expense) => {
        try {
          set((state) => ({ 
            expenses: [expense, ...state.expenses],
            saveStatus: 'SAVING'
          }));

          databaseOperations.saveExpense(expense)
            .then(() => set({ saveStatus: 'SAVED' }))
            .catch((e: unknown) => {
              logger.error('Falha ao guardar despesa no SQL', { expenseId: expense.id, error: (e as Error).message }, 'DATABASE');
              set({ saveStatus: 'ERROR' });
            });

          logger.info(`Despesa adicionada: ${expense.description}`, { amount: expense.amount }, 'FINANCE');
        } catch (e: unknown) {
          logger.error('Erro ao adicionar despesa', { error: (e as Error).message }, 'STORE');
        }
      },

      updateExpense: (expense) => {
        try {
          set((state) => ({ 
            expenses: state.expenses.map(e => e.id === expense.id ? expense : e),
            saveStatus: 'SAVING'
          }));

          databaseOperations.saveExpense(expense)
            .then(() => set({ saveStatus: 'SAVED' }))
            .catch((e: unknown) => {
              logger.error('Falha ao atualizar despesa no SQL', { expenseId: expense.id, error: (e as Error).message }, 'DATABASE');
              set({ saveStatus: 'ERROR' });
            });
        } catch (e: unknown) {
          logger.error('Erro ao atualizar despesa', { expenseId: expense.id, error: (e as Error).message }, 'STORE');
        }
      },

      removeExpense: (id) => {
        try {
          set((state) => ({ 
            expenses: state.expenses.filter(e => e.id !== id),
            saveStatus: 'SAVING'
          }));

          databaseOperations.deleteExpense(id)
            .then(() => set({ saveStatus: 'SAVED' }))
            .catch((e: unknown) => {
              logger.error('Falha ao eliminar despesa no SQL', { expenseId: id, error: (e as Error).message }, 'DATABASE');
              set({ saveStatus: 'ERROR' });
            });
        } catch (e: unknown) {
          logger.error('Erro ao remover despesa', { expenseId: id, error: (e as Error).message }, 'STORE');
        }
      },
      
      addFixedExpense: (expense) => {
        try {
          set((state) => ({ fixedExpenses: [...state.fixedExpenses, expense] }));
          logger.info(`Despesa fixa adicionada: ${expense.name}`, { amount: expense.amount }, 'FINANCE');
        } catch (e: unknown) {
          logger.error('Erro ao adicionar despesa fixa', { error: (e as Error).message }, 'STORE');
        }
      },

      updateFixedExpense: (expense) => {
        try {
          set((state) => ({ 
            fixedExpenses: state.fixedExpenses.map(e => e.id === expense.id ? expense : e) 
          }));
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao atualizar despesa fixa', { expenseId: expense.id, error: error.message }, 'STORE');
        }
      },

      removeFixedExpense: (id) => {
        try {
          set((state) => ({ fixedExpenses: state.fixedExpenses.filter(e => e.id !== id) }));
        } catch (e: unknown) {
          logger.error('Erro ao remover despesa fixa', { expenseId: id, error: (e as Error).message }, 'STORE');
        }
      },
      
      addRevenue: (revenue) => {
        try {
          set((state) => ({ 
            revenues: [revenue, ...state.revenues],
            saveStatus: 'SAVING'
          }));

          databaseOperations.saveRevenue(revenue)
            .then(() => set({ saveStatus: 'SAVED' }))
            .catch((e: unknown) => {
              logger.error('Falha ao guardar receita no SQL', { revenueId: revenue.id, error: (e as Error).message }, 'DATABASE');
              set({ saveStatus: 'ERROR' });
            });

          logger.info(`Receita extra adicionada: ${revenue.description}`, { amount: revenue.amount }, 'FINANCE');
        } catch (e: unknown) {
          logger.error('Erro ao adicionar receita', { error: (e as Error).message }, 'STORE');
        }
      },

      removeRevenue: (id) => {
        try {
          set((state) => ({ 
            revenues: state.revenues.filter(r => r.id !== id),
            saveStatus: 'SAVING'
          }));

          databaseOperations.deleteRevenue(id)
            .then(() => set({ saveStatus: 'SAVED' }))
            .catch((e: unknown) => {
              logger.error('Falha ao eliminar receita no SQL', { revenueId: id, error: (e as Error).message }, 'DATABASE');
              set({ saveStatus: 'ERROR' });
            });
        } catch (e: unknown) {
          logger.error('Erro ao remover receita', { revenueId: id, error: (e as Error).message }, 'STORE');
        }
      },

      addPayrollRecord: (record) => {
        try {
          set((state) => ({ 
            payroll: [...state.payroll, record],
            saveStatus: 'SAVING'
          }));

          databaseOperations.savePayroll(record)
            .then(() => set({ saveStatus: 'SAVED' }))
            .catch((e: unknown) => {
              logger.error('Falha ao guardar folha de pagamento no SQL', { payrollId: record.id, error: (e as Error).message }, 'DATABASE');
              set({ saveStatus: 'ERROR' });
            });
        } catch (e: unknown) {
          logger.error('Erro ao adicionar registo de folha', { error: (e as Error).message }, 'STORE');
        }
      },

      updatePayrollRecord: (record) => {
        try {
          set((state) => ({ 
            payroll: state.payroll.map(p => p.id === record.id ? record : p),
            saveStatus: 'SAVING'
          }));

          databaseOperations.savePayroll(record)
            .then(() => set({ saveStatus: 'SAVED' }))
            .catch((e: unknown) => {
              const error = e as Error;
              logger.error('Falha ao atualizar folha de pagamento no SQL', { payrollId: record.id, error: error.message }, 'DATABASE');
              set({ saveStatus: 'ERROR' });
            });
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao atualizar registo de folha', { payrollId: record.id, error: error.message }, 'STORE');
        }
      },

      removePayrollRecord: (id) => {
        try {
          set((state) => ({ 
            payroll: state.payroll.filter(p => p.id !== id),
            saveStatus: 'SAVING'
          }));

          databaseOperations.deletePayroll(id)
            .then(() => set({ saveStatus: 'SAVED' }))
            .catch((e: unknown) => {
              const error = e as Error;
              logger.error('Falha ao eliminar folha de pagamento no SQL', { payrollId: id, error: error.message }, 'DATABASE');
              set({ saveStatus: 'ERROR' });
            });
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao remover registo de folha', { payrollId: id, error: error.message }, 'STORE');
        }
      },
      
      justifyAbsence: (employeeId: string, date: string, reason: string) => {
        try {
          if (!reason) throw new Error('Justificação é obrigatória');
          
          set(state => {
            const newAttendance = [...state.attendance];
            const index = newAttendance.findIndex(a => a.employeeId === employeeId && a.date === date);
            
            if (index >= 0) {
              newAttendance[index] = {
                ...newAttendance[index],
                isAbsence: false,
                status: 'JUSTIFIED',
                justification: reason
              };
            } else {
              newAttendance.push({
                id: `att-just-${Date.now()}`,
                employeeId,
                date,
                totalHours: 0,
                isLate: false,
                lateMinutes: 0,
                overtimeHours: 0,
                isAbsence: false,
                status: 'JUSTIFIED',
                justification: reason,
                source: 'MANUAL'
              });
            }
            return { attendance: newAttendance };
          });

          get().addAuditLog(
            'ATTENDANCE_JUSTIFIED',
            'Attendance',
            employeeId,
            { message: `Falta justificada para funcionário ID: ${employeeId} na data ${date}`, date, reason }
          );

          get().addNotification('success', 'Falta justificada com sucesso.');
          logger.info(`Falta justificada: Func ${employeeId}, Data ${date}`, { reason }, 'HR');
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao justificar falta', { employeeId, date, error: error.message }, 'STORE');
          get().addNotification('error', error.message || 'Erro ao justificar falta.');
        }
      },

      processPayroll: async (employeeId: string, month: number, year: number, paymentMethod: PaymentMethod) => {
        try {
          const state = get();
          if (!get().hasPermission('VIEW_FINANCIAL')) {
            get().addNotification('error', 'Sem permissão para processar folha de pagamento.');
            return;
          }

          const employee = state.employees.find(e => e.id === employeeId);
          if (!employee) {
            throw new Error('Funcionário não encontrado.');
          }

          // Evitar processamento duplicado para o mesmo mês/ano
          const alreadyProcessed = state.payroll.find(p => p.employeeId === employeeId && p.month === month && p.year === year);
          if (alreadyProcessed) {
            throw new Error(`Folha de pagamento já processada para ${month + 1}/${year}`);
          }

          const monthEnd = new Date(year, month + 1, 0);
          const totalDaysInMonth = monthEnd.getDate();
          let workDaysCount = 0;
          let absenceDaysCount = 0;
          let justifiedDaysCount = 0;
          let totalOvertime = 0;
          let totalLateMinutes = 0;

          for (let day = 1; day <= totalDaysInMonth; day++) {
              const currentDate = new Date(year, month, day);
              const dateStr = currentDate.toISOString().split('T')[0];
              const dayOfWeek = currentDate.getDay();

              const shift = state.workShifts.find(s => s.employeeId === employeeId && s.dayOfWeek === dayOfWeek);
              
              if (shift) {
                  const record = state.attendance.find(a => a.employeeId === employeeId && a.date === dateStr);
                  
                  if (record) {
                      if (record.status === 'JUSTIFIED') {
                          justifiedDaysCount++;
                      } else if (record.clockIn && record.clockOut) {
                          workDaysCount++;
                          totalOvertime += (record.overtimeHours || 0);
                          totalLateMinutes += (record.lateMinutes || 0);
                      } else {
                          absenceDaysCount++;
                      }
                  } else if (currentDate < new Date()) {
                      absenceDaysCount++;
                  }
              }
          }

          const baseSalary = employee.salary || 0;
          const inss = calculateINSS(baseSalary);
          const deductions = calculateDeductions(baseSalary, employee.role);
          
          const dailyRate = baseSalary / 22; 
          const hourlyRate = dailyRate / 8;

          const overtimeBonus = totalOvertime * hourlyRate * 1.5; 
          const latenessDeduction = (totalLateMinutes / 60) * hourlyRate; 
          const absenceDeduction = absenceDaysCount * dailyRate; 

          const grossSalary = baseSalary + overtimeBonus;
          const irtAdjusted = calculateIRT(grossSalary); 

          const netSalary = grossSalary - latenessDeduction - absenceDeduction - inss - irtAdjusted - deductions;

          // CRIPTOGRAFIA: Proteger dados sensíveis antes de criar o registro
          const notesRaw = `Justificadas: ${justifiedDaysCount}. IRT: ${irtAdjusted.toFixed(2)}. INSS: ${inss.toFixed(2)}`;
          const encryptedNotes = await CryptoService.encrypt(notesRaw);

          const payrollRecord: PayrollRecord = {
            id: `payroll-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            employeeId,
            month,
            year,
            baseSalary,
            workDays: workDaysCount,
            totalWorkDays: 22,
            overtimeHours: Number(totalOvertime.toFixed(2)),
            overtimeBonus: Number(overtimeBonus.toFixed(2)),
            lateMinutes: totalLateMinutes,
            latenessDeduction: Number(latenessDeduction.toFixed(2)),
            absenceDays: absenceDaysCount,
            absenceDeduction: Number(absenceDeduction.toFixed(2)),
            netSalary: Number(Math.max(0, netSalary).toFixed(2)),
            paymentDate: new Date(),
            paymentMethod,
            processedBy: state.currentUser?.name || 'System',
            notes: encryptedNotes, // Guardar versão criptografada
            status: 'PROCESSED',
            grossSalary: Number(grossSalary.toFixed(2)),
            irtAdjusted: Number(irtAdjusted.toFixed(2)),
            inss: Number(inss.toFixed(2))
          };

          get().addPayrollRecord(payrollRecord);
          
          const expenseRecord: Expense = {
            id: `exp-${Date.now()}`,
            date: new Date(),
            category: 'SALARIOS',
            description: `Salário - ${employee.name} - ${month + 1}/${year}`,
            amount: Number(netSalary.toFixed(2)),
            paymentMethod, 
            notes: `Ref: ${month + 1}/${year}`
          };
          
          get().addExpense(expenseRecord);

          get().addAuditLog(
            'PAYROLL_PROCESSED',
            'Payroll',
            employeeId,
            { message: `Folha processada: ${employee.name} (${month + 1}/${year}). Líquido: ${netSalary.toFixed(2)} Kz`, month, year, netSalary }
          );

          get().addNotification('success', `Folha de ${employee.name} processada: ${Number(netSalary.toFixed(2))} Kz`);
          logger.info(`Folha de pagamento processada: ${employee.name}`, { month, year, netSalary }, 'HR');
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao processar folha de pagamento', { employeeId, month, year, error: error.message }, 'STORE');
          get().addNotification('error', error.message || 'Erro ao processar salário.');
        }
      },

      generatePayrollReport: (month, year) => {
        try {
          return get().payroll.filter(p => p.month === month && p.year === year);
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao gerar relatório de folha', { month, year, error: error.message }, 'STORE');
          return [];
        }
      },

      markPayrollAsPaid: (payrollId: string, paymentDate: string | Date) => {
        try {
          const payroll = get().payroll.find(p => p.id === payrollId);
          if (!payroll) {
            logger.warn('Tentativa de marcar pagamento inexistente como pago', { payrollId }, 'STORE');
            return;
          }
          
          get().updatePayrollRecord({
            ...payroll,
            status: 'PAID',
            paymentDate: new Date(paymentDate)
          });
          
          const employee = get().employees.find(e => e.id === payroll.employeeId);
          get().addNotification('success', `Pagamento de ${employee?.name || 'funcionário'} registado com sucesso.`);
          logger.info(`Pagamento de folha registado: ${payrollId}`, { employeeId: payroll.employeeId }, 'HR');
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao marcar folha como paga', { payrollId, error: error.message }, 'STORE');
        }
      },

      getPendingPayrolls: () => {
        try {
          return get().payroll.filter(p => p.status === 'PENDING' || p.status === 'PROCESSED');
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao obter folhas pendentes', { error: error.message }, 'STORE');
          return [];
        }
      },

      getEmployeePayrollHistory: (employeeId: string) => {
        try {
          return get().payroll.filter(p => p.employeeId === employeeId).sort((a, b) => {
            const dateA = new Date(a.year, a.month).getTime();
            const dateB = new Date(b.year, b.month).getTime();
            return dateB - dateA;
          });
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao obter histórico de folha do funcionário', { employeeId, error: error.message }, 'STORE');
          return [];
        }
      },

      getDecryptedPayrollNotes: async (payrollId: string) => {
        try {
          const payroll = get().payroll.find(p => p.id === payrollId);
          if (!payroll || !payroll.notes) return '';
          
          // Se a nota não parecer Base64 (criptografada), retorna como está
          if (!payroll.notes.includes('==') && payroll.notes.length < 50) return payroll.notes;
          
          return await CryptoService.decrypt(payroll.notes);
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao descriptografar notas da folha', { payrollId, error: error.message }, 'SECURITY');
          return 'Erro na descriptografia';
        }
      },

      getSecurityAlerts: () => {
        return logger.getSecurityAlerts();
      },

      hasPermission: (permission: any) => {
        const state = get();
        if (!state.currentUser) return false;
        
        // Admin e Gerente têm todas as permissões
        const role = (state.currentUser.role || '').toUpperCase();
        if (role === 'ADMIN' || role === 'GERENTE') return true;
        
        // Verificar permissões explícitas no usuário
        const userPermissions = state.currentUser.permissions || [];
        
        // Se for um objeto Permission, extrair a chave
        const permKey = typeof permission === 'object' && permission !== null && 'key' in permission 
          ? permission.key 
          : permission;
          
        if (typeof permKey === 'string' && userPermissions.includes(permKey as any)) return true;
        
        return false;
      },



      redeemLoyaltyPoints: (customerId, points) => {
        try {
          if (points <= 0) return false;
          
          const state = get();
          const customer = state.customers.find(c => c.id === customerId);
          if (!customer || (customer.loyaltyPoints || 0) < points) {
            logger.warn('Redenção de pontos negada: saldo insuficiente', { customerId, points }, 'STORE');
            return false;
          }

          set(state => ({
            customers: state.customers.map(c =>
              c.id === customerId ? { ...c, loyaltyPoints: (c.loyaltyPoints || 0) - points } : c
            ),
            loyaltyRewards: state.loyaltyRewards.map(lr =>
              lr.customerId === customerId
                ? { ...lr, points: lr.points - points, redemptions: (lr.redemptions || 0) + 1 }
                : lr
            )
          }));

          logger.info(`Pontos de fidelidade resgatados: ${points}`, { customerId }, 'STORE');
          
          get().addAuditLog(
            'LOYALTY_REDEEMED',
            'Customer',
            customerId,
            { message: `Resgate de ${points} pontos pelo cliente ${customer.name}`, points }
          );

          return true;
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao resgatar pontos de fidelidade', { customerId, error: error.message }, 'STORE');
          return false;
        }
      },

      getLoyaltyTier: (customerId) => {
        try {
          const customer = get().customers.find(c => c.id === customerId);
          if (!customer) return 'BRONZE';
          const points = customer.loyaltyPoints || 0;
          if (points >= 5000) return 'PLATINUM';
          if (points >= 2500) return 'GOLD';
          if (points >= 1000) return 'SILVER';
          return 'BRONZE';
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao obter nível de fidelidade', { customerId, error: error.message }, 'STORE');
          return 'BRONZE';
        }
      },

      getCustomerDiscount: (customerId) => {
        try {
          const tier = get().getLoyaltyTier(customerId);
          const discounts: Record<string, number> = {
            PLATINUM: 0.15,
            GOLD: 0.10,
            SILVER: 0.05,
            BRONZE: 0
          };
          return discounts[tier] || 0;
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao calcular desconto de cliente', { customerId, error: error.message }, 'STORE');
          return 0;
        }
      },

      // ========== ANALYTICS & PERFORMANCE ==========
      getDailySalesAnalytics: (days = 30) => {
        try {
          const analytics: DailySalesAnalytics[] = [];
          const now = new Date();
          const state = get();

          const safeToISO = (dateStr: string | number | Date) => {
            try {
              const d = new Date(dateStr);
              return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
            } catch {
              return null;
            }
          };

          for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = safeToISO(date);
            if (!dateStr) continue;

            const dayOrders = state.activeOrders.filter(
              o => (o.status === 'FECHADO' || o.status === 'PAGO') && 
              safeToISO(o.timestamp || o.createdAt) === dateStr
            );

            const totalSales = dayOrders.reduce((acc, o) => acc + (o.total || 0), 0);
            
            const dayExpenses = state.expenses.filter(
              e => safeToISO(e.date) === dateStr
            ).reduce((acc, e) => acc + (e.amount || 0), 0);

            const dayOtherRevenues = (state.revenues || []).filter(
              r => safeToISO(r.date) === dateStr
            ).reduce((acc, r) => acc + (r.amount || 0), 0);

            const totalProfit = (totalSales + dayOtherRevenues) - dayExpenses;
            const avgOrder = dayOrders.length > 0 ? totalSales / dayOrders.length : 0;

            const topDishData = dayOrders
              .flatMap(o => o.items || [])
              .reduce((acc, item) => {
                const dishId = item.dishId || 'unknown';
                acc[dishId] = (acc[dishId] || 0) + (item.quantity || 0);
                return acc;
              }, {} as Record<string, number>);

            const topDishId = (Object.entries(topDishData) as Array<[string, number]>)
              .sort((a, b) => b[1] - a[1])[0]?.[0];
            const topDishName = state.menu.find(d => d.id === topDishId)?.name || 'N/A';

            const dayHourCounts = new Array(24).fill(0);
            dayOrders.forEach(o => {
              const d = new Date(o.timestamp || o.createdAt);
              if (!isNaN(d.getTime())) {
                const hour = d.getHours();
                dayHourCounts[hour]++;
              }
            });
            const peakHour = dayHourCounts.indexOf(Math.max(...dayHourCounts));

            analytics.push({
              date: dateStr,
              totalSales,
              totalProfit,
              totalOrders: dayOrders.length,
              avgOrderValue: avgOrder,
              topDish: topDishName,
              peakHour: dayOrders.length > 0 ? peakHour : 0
            });
          }

          return analytics;
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao obter analítica de vendas diárias', { days, error: error.message }, 'STORE');
          return [];
        }
      },

      getMenuAnalytics: (days = 30) => {
        try {
          const state = get();
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - days);

          const analytics: MenuAnalytics[] = state.menu.map(dish => {
            const relevantItems = state.activeOrders
              .filter(o => {
                if (o.status !== 'FECHADO' && o.status !== 'PAGO') return false;
                const d = new Date(o.timestamp || o.createdAt);
                return !isNaN(d.getTime()) && d > cutoffDate;
              })
              .flatMap(o => o.items || [])
              .filter(item => item.dishId === dish.id);

            const sold = relevantItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
            const revenue = relevantItems.reduce((acc, item) => acc + ((item.unitPrice || 0) * (item.quantity || 0)), 0);
            const profitMargin = dish.price > 0 ? ((revenue - (sold * dish.price * 0.3)) / revenue) * 100 : 0;

            return {
              dishId: dish.id,
              dishName: dish.name,
              views: 0, // Default value
              orders: sold, // Map sold to orders
              sold,
              revenue,
              conversionRate: 0, // Default value
              profitMargin: Math.max(0, profitMargin),
              trend: sold > 10 ? 'up' : sold > 3 ? 'stable' : 'down',
              category: state.categories.find(c => c.id === dish.categoryId)?.name || 'Outros'
            };
          });

          return analytics.filter(a => a.sold > 0).sort((a, b) => b.revenue - a.revenue);
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao obter analítica do menu', { days, error: error.message }, 'STORE');
          return [];
        }
      },

      getStockAnalytics: () => {
        try {
          const state = get();
          const now = new Date();
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);

          const recentOrders = state.activeOrders.filter(
            o => o.status === 'FECHADO' && new Date(o.timestamp || o.createdAt) >= thirtyDaysAgo
          );

          return state.stock.map(item => {
            const relatedDishes = state.menu.filter(d => d.stockItemId === item.id);
            const totalSold = recentOrders
              .flatMap(o => o.items)
              .filter(orderItem => relatedDishes.some(d => d.id === orderItem.dishId))
              .reduce((acc, orderItem) => acc + orderItem.quantity, 0);

            const consumptionRate = totalSold / 30;
            const daysToRunOut = consumptionRate > 0 ? Math.ceil(item.quantity / consumptionRate) : 999;
            const turnoverRate = item.quantity > 0 ? (totalSold / item.quantity) : 0;

            return {
              itemId: item.id,
              itemName: item.name,
              quantity: item.quantity,
              minThreshold: item.minThreshold,
              daysToRunOut: daysToRunOut,
              turnoverRate: parseFloat(turnoverRate.toFixed(2)),
              wastagePercentage: 0,
              consumptionRate: parseFloat(consumptionRate.toFixed(2))
            };
          });
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao obter analítica de stock', { error: error.message }, 'STORE');
          return [];
        }
      },

      getEmployeePerformance: (employeeId) => {
        try {
          const state = get();
          const employees = employeeId
            ? state.employees.filter(e => e.id === employeeId)
            : state.employees;

          return employees.map(emp => {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            const monthAttendance = state.attendance.filter(
              a => a.employeeId === emp.id &&
              new Date(a.date).getMonth() === currentMonth &&
              new Date(a.date).getFullYear() === currentYear
            );

            const empOrders = state.activeOrders.filter(
              o => (o.status === 'FECHADO' || o.status === 'PAGO') && 
              (o.employeeId === emp.id || o.userId === emp.id) &&
              new Date(o.timestamp || o.createdAt).getMonth() === currentMonth &&
              new Date(o.timestamp || o.createdAt).getFullYear() === currentYear
            );

            const salesGenerated = empOrders.reduce((acc, o) => acc + o.total, 0);
            const rating = Math.min(5, 3 + (monthAttendance.length / 22) + (empOrders.length / 50));

            return {
              employeeId: emp.id,
              name: emp.name,
              period: `${currentMonth + 1}/${currentYear}`,
              salesGenerated,
              ordersServed: empOrders.length,
              rating: parseFloat(rating.toFixed(1)),
              efficiency: Math.min(100, (monthAttendance.length / 22) * 100)
            };
          });
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao obter performance de funcionário', { employeeId, error: error.message }, 'STORE');
          return [];
        }
      },

      getPeakHours: () => {
        try {
          const hourCounts = new Array(24).fill(0);

          get().activeOrders
            .filter(o => o.status === 'FECHADO')
            .forEach(o => {
              const d = new Date(o.timestamp || o.createdAt);
              if (!isNaN(d.getTime())) {
                const hour = d.getHours();
                hourCounts[hour]++;
              }
            });

          return hourCounts
            .map((count, hour) => ({ hour, count }))
            .filter(h => h.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map(h => h.hour);
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao obter horários de pico', { error: error.message }, 'STORE');
          return [];
        }
      },

      getTopSellingDishes: (limit = 5) => {
        try {
          const analytics = get().getMenuAnalytics();
          const state = get();
          return analytics
            .sort((a, b) => b.sold - a.sold)
            .slice(0, limit)
            .map(a => state.menu.find(d => d.id === a.dishId)!)
            .filter(Boolean);
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao obter pratos mais vendidos', { limit, error: error.message }, 'STORE');
          return [];
        }
      },

      getAverageOrderValue: () => {
        try {
          const closedOrders = get().activeOrders.filter(o => o.status === 'FECHADO');
          if (closedOrders.length === 0) return 0;
          return closedOrders.reduce((acc, o) => acc + o.total, 0) / closedOrders.length;
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao calcular valor médio de pedido', { error: error.message }, 'STORE');
          return 0;
        }
      },

      getCustomerRetention: () => {
        try {
          const customers = get().customers;
          const returningCustomers = customers.filter(c => (c.visits || 0) > 1).length;
          return customers.length > 0 ? (returningCustomers / customers.length) * 100 : 0;
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao calcular retenção de clientes', { error: error.message }, 'STORE');
          return 0;
        }
      },

      // QR Code Menu Methods
      updateQRCodeConfig: (config) => {
        try {
          set(state => ({ 
            qrCodeConfig: { 
              ...state.qrCodeConfig, 
              ...config, 
              lastUpdated: new Date() 
            } 
          }));
          logger.info('Configuração de QR Code atualizada', {}, 'STORE');
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao atualizar configuração de QR Code', { error: error.message }, 'STORE');
        }
      },

      logMenuAccess: (log: any) => {
        try {
          set(state => ({
            menuAccessLogs: [
              ...state.menuAccessLogs, 
              { 
                id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                timestamp: new Date(),
                ...log 
              }
            ]
          }));
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao registar acesso ao menu', { error: error.message }, 'STORE');
        }
      },



      clearMenuAccessLogs: () => {
        try {
          set({ menuAccessLogs: [] });
          logger.info('Logs de acesso ao menu limpos', {}, 'STORE');
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao limpar logs de acesso ao menu', { error: error.message }, 'STORE');
        }
      },

      // Audit Logs Implementation
      addAuditLog: (actionOrLog, entityType, entityId, details) => {
        try {
          let action: string;
          let eType: string | undefined = entityType;
          let eId: string | undefined = entityId;
          let dets: any = details;
          let metadata: any = undefined;

          if (typeof actionOrLog === 'object' && actionOrLog !== null) {
            action = actionOrLog.action;
            eType = actionOrLog.entityType || entityType;
            eId = actionOrLog.entityId || entityId;
            dets = actionOrLog.details || details;
            metadata = actionOrLog.metadata;
          } else {
            action = actionOrLog as string;
          }

          const newLog: AuditLog = {
            id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            timestamp: new Date(),
            action,
            entityType: eType || 'SYSTEM',
            entityId: eId,
            details: dets,
            metadata
          };

          set(state => ({
            auditLogs: [
                newLog,
                ...(state.auditLogs || [])
            ].slice(0, 1000)
          }));

          // AGT Compliance: Ensure logs are also captured by the logger service for cloud sync
          logger.audit(action, {
            details: dets,
            entityType: eType,
            entityId: eId,
            metadata
          });
        } catch (e: unknown) {
          const error = e as Error;
          console.error('Falha crítica ao adicionar log de auditoria:', error.message);
        }
      },

      // Offline Sync Implementation
      onlineStatus: typeof navigator !== 'undefined' ? navigator.onLine : true,
      setOnlineStatus: (status) => {
        try {
          set({ onlineStatus: status });
          if (status) {
             get().processOfflineQueue();
          }
          logger.info(`Status online alterado: ${status}`, {}, 'STORE');
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao definir status online', { status, error: error.message }, 'STORE');
        }
      },
      offlineQueue: [],
      addOfflineAction: (action) => {
        try {
          set(state => ({
            offlineQueue: [
              ...state.offlineQueue,
              { 
                ...action, 
                id: action.id || Math.random().toString(36).substring(7), 
                timestamp: action.timestamp || Date.now(),
                retries: (action.retries || 0)
              }
            ]
          }));
          logger.info(`Ação adicionada à fila offline: ${action.type}`, {}, 'STORE');
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao adicionar à fila offline', { type: action.type, error: error.message }, 'STORE');
        }
      },
      processOfflineQueue: async () => {
        try {
          const state = get();
          const { offlineQueue } = state;
          if (offlineQueue.length === 0) return;

          logger.info(`Processando ${offlineQueue.length} ações offline...`, {}, 'STORE');
          const successfulActions: string[] = [];

          for (const action of offlineQueue) {
            try {
              logger.info(`Tentando reprocessar ação offline: ${action.type}`, { action }, 'OFFLINE_QUEUE');
              switch (action.type) {
                case 'ADD_DELIVERY':
                case 'UPDATE_DELIVERY':
                  // Temporarily disabled until delivery service is fully integrated with Supabase
                  logger.warn(`${action.type} na fila offline, mas o serviço de entrega Supabase está desativado.`, undefined, 'OFFLINE_QUEUE');
                  break;
                case 'SYNC_MENU':
                  await supabaseService.syncMenu(action.payload.categories, action.payload.menu, action.payload.settings);
                  break;
                case 'SYNC_USERS':
                  await supabaseService.syncUsers(action.payload.users);
                  break;
                case 'SYNC_AUDIT_LOGS':
                  await supabaseService.syncAuditLogs(action.payload.auditLogs);
                  break;
                case 'SYNC_DASHBOARD_DATA':
                  await supabaseService.syncDashboardData(action.payload.summary, action.payload.activeOrders);
                  break;
                case 'SYNC_STOCK':
                  await supabaseService.syncStock(action.payload.stock);
                  break;
                case 'SYNC_SUPPLIERS':
                  await supabaseService.syncSuppliers(action.payload.suppliers);
                  break;
                case 'SYNC_FINANCIALS':
                  await supabaseService.syncFinancials(action.payload.revenues, action.payload.expenses);
                  break;
                default:
                  logger.warn(`Tipo de ação offline desconhecido ou não implementado: ${action.type}`, undefined, 'OFFLINE_QUEUE');
              }
              successfulActions.push(action.id);
              logger.info(`Ação offline ${action.type} reprocessada com sucesso.`, undefined, 'OFFLINE_QUEUE');
            } catch (e: unknown) {
              const error = e as Error;
              logger.error(`Falha ao reprocessar ação offline ${action.type}: ${error.message}`, { action, error: error.message }, 'OFFLINE_QUEUE');
            }
          }

          if (successfulActions.length > 0) {
            set((state) => ({
              offlineQueue: state.offlineQueue.filter((action) => !successfulActions.includes(action.id)),
            }));
            logger.info(`${successfulActions.length} ações removidas da fila offline.`, undefined, 'OFFLINE_QUEUE');
          }
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro crítico ao processar fila offline', { error: error.message }, 'STORE');
        }
      },

      deliveries: [],
      addDelivery: async (delivery) => {
        try {
          set(state => ({ deliveries: [...state.deliveries, delivery] }));
          get().addIntegrationLog({ type: 'delivery.created', message: 'Entrega criada', details: { delivery } });
          // Local-only: No sync or offline queue needed for now
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao adicionar entrega', { error: error.message }, 'STORE');
        }
      },
      updateDelivery: async (delivery) => {
        try {
          set(state => ({ deliveries: state.deliveries.map(d => d.id === delivery.id ? delivery : d) }));
          get().addIntegrationLog({ type: 'delivery.updated', message: 'Entrega atualizada', details: { delivery } });
          // Local-only: No sync or offline queue needed for now
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao atualizar entrega', { deliveryId: delivery.id, error: error.message }, 'STORE');
        }
      },
      assignDelivery: (orderId, driverName, driverPhone) => {
        try {
          const id = `del-${Date.now()}`;
          const order = get().activeOrders.find(o => o.id === orderId);
          const delivery: Delivery = { 
            id, 
            orderId, 
            driverName, 
            driverPhone, 
            status: 'SAIU', 
            startTime: new Date(),
            deliveryAddress: order?.deliveryAddress || 'Endereço não especificado',
            customerName: order?.customerName || 'Cliente não especificado',
            customerPhone: order?.customerPhone || 'Telemóvel não especificado',
            deliveryFee: order?.deliveryFee || 0
          };
          get().addDelivery(delivery);
          get().addIntegrationLog({ type: 'delivery.assigned', message: 'Entrega atribuída', details: { delivery } });
          get().addNotification('info', `Encomenda atribuída a ${driverName}`);
          return id;
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao atribuir entrega', { orderId, error: error.message }, 'STORE');
          return '';
        }
      },

      predictStockNeeds: (itemId) => {
        try {
          const item = get().stock.find(s => s.id === itemId);
          if (!item) return 0;

          const lastMonth = new Date();
          lastMonth.setMonth(lastMonth.getMonth() - 1);

          const averageUsage = item.quantity / 30;
          const daysUntilEmpty = item.quantity / Math.max(0.1, averageUsage);

          return daysUntilEmpty <= 7 ? Math.ceil(item.minThreshold * 1.5) : 0;
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro ao prever necessidades de stock', { itemId, error: error.message }, 'STORE');
          return 0;
        }
      },

      validateMenuIntegrity: (categories: MenuCategory[], menu: Dish[]) => {
        const issues: IntegrityIssue[] = [];
        const catIds = new Set(categories.map(c => c.id));
        const dishIds = new Set();
        
        const createIssue = (msg: string, entityType: IntegrityIssue['entityType'], entityId?: string, severity: IntegrityIssue['severity'] = 'MEDIUM'): IntegrityIssue => ({
          id: `issue-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: 'INTEGRITY_CHECK',
          severity,
          message: msg,
          entityType,
          entityId,
          timestamp: Date.now(),
          isResolved: false
        });

        // 1. Validar Categorias
        categories.forEach(c => {
          if (!c.id) issues.push(createIssue(`Categoria "${c.name}" sem ID.`, 'CATEGORY', undefined, 'HIGH'));
          if (!c.name) issues.push(createIssue(`Categoria com ID ${c.id} sem nome.`, 'CATEGORY', c.id, 'HIGH'));
          
          // Prevenção de loops em hierarquia
          if (c.parent_id === c.id) {
            issues.push(createIssue(`Loop de referência detectado na categoria ${c.name}.`, 'CATEGORY', c.id, 'CRITICAL'));
          }
        });

        // 2. Validar Produtos
        menu.forEach(d => {
          if (!d.id) issues.push(createIssue(`Produto "${d.name}" sem ID.`, 'DISH', undefined, 'HIGH'));
          if (dishIds.has(d.id)) issues.push(createIssue(`ID de produto duplicado: ${d.id} (${d.name}).`, 'DISH', d.id, 'CRITICAL'));
          dishIds.add(d.id);

          if (!d.categoryId) {
            issues.push(createIssue(`Produto "${d.name}" sem categoria associada.`, 'DISH', d.id, 'MEDIUM'));
          } else if (!catIds.has(d.categoryId)) {
            issues.push(createIssue(`Produto "${d.name}" refere categoria inexistente (ID: ${d.categoryId}).`, 'DISH', d.id, 'HIGH'));
          }

          if (d.price < 0) issues.push(createIssue(`Produto "${d.name}" com preço negativo.`, 'DISH', d.id, 'HIGH'));
        });

        return {
          isValid: issues.length === 0,
          issues
        };
      },

      runIntegrityDiagnostics: async () => {
        set({ isDiagnosing: true });
        try {
          await new Promise(resolve => setTimeout(resolve, 1500));
          const state = get();
          const issues: IntegrityIssue[] = [];
          
          // 1. Verificar pratos sem categoria válida
          const invalidDishes = state.menu.filter(d => !state.categories.find(c => c.id === d.categoryId));
          if (invalidDishes.length > 0) {
            issues.push({
              id: `issue-cat-${Date.now()}`,
              type: 'INVALID_CATEGORY',
              severity: 'HIGH',
              message: `${invalidDishes.length} produtos sem categoria válida ou em categorias removidas.`,
              entityType: 'DISH',
              timestamp: Date.now(),
              isResolved: false,
              data: { ids: invalidDishes.map(d => d.id) }
            });
          }

          // 2. Verificar categorias duplicadas ou sem ID
          const seenCatIds = new Set();
          const seenCatNames = new Set();
          const catIssues = state.categories.filter(c => {
            const isDupId = seenCatIds.has(c.id);
            const isDupName = seenCatNames.has(c.name.toLowerCase());
            const isInvalidId = !c.id || c.id === 'undefined' || c.id === 'null';
            seenCatIds.add(c.id);
            seenCatNames.add(c.name.toLowerCase());
            return isDupId || isDupName || isInvalidId;
          });

          if (catIssues.length > 0) {
            issues.push({
              id: `issue-cat-dup-${Date.now()}`,
              type: 'INVALID_CATEGORY',
              severity: 'MEDIUM',
              message: `${catIssues.length} categorias com problemas de ID ou nome duplicado.`,
              entityType: 'CATEGORY',
              timestamp: Date.now(),
              isResolved: false,
              data: { ids: catIssues.map(c => c.id) }
            });
          }

          // 3. Verificar pratos sem imagem
          const noImageDishes = state.menu.filter(d => !d.image);
          if (noImageDishes.length > 0) {
            issues.push({
              id: `issue-img-${Date.now()}`,
              type: 'NO_IMAGE',
              severity: 'LOW',
              message: `${noImageDishes.length} produtos sem imagem definida.`,
              entityType: 'DISH',
              timestamp: Date.now(),
              isResolved: false
            });
          }

          // 4. Verificar inconsistências de stock
          const ghostStock = state.menu.filter(d => d.stockItemId && !state.stock.find(s => s.id === d.stockItemId));
          if (ghostStock.length > 0) {
            issues.push({
              id: `issue-stock-${Date.now()}`,
              type: 'GHOST_STOCK',
              severity: 'MEDIUM',
              message: `${ghostStock.length} produtos com referências de stock inválidas.`,
              entityType: 'STOCK',
              timestamp: Date.now(),
              isResolved: false,
              data: { ids: ghostStock.map(d => d.id) }
            });
          }

          set({ integrityIssues: issues });
          if (issues.length === 0) {
            get().addNotification('success', 'Nenhuma inconsistência detectada no inventário!');
          } else {
            get().addNotification('warning', `${issues.length} problemas de integridade encontrados.`);
          }
        } catch (e: unknown) {
          console.error("Integrity diagnostic failed:", e);
          get().addNotification('error', 'Falha ao executar diagnóstico.');
        } finally {
          set({ isDiagnosing: false });
        }
      },

      performSafeCleanup: async () => {
        try {
          const state = get();
          let cleanedMenu = [...state.menu];
          let cleanedCategories = [...state.categories];
          let fixedCount = 0;

          // 1. Auto-fix ghost stock references
          cleanedMenu = cleanedMenu.map(d => {
            if (d.stockItemId && !state.stock.find(s => s.id === d.stockItemId)) {
              fixedCount++;
              return { ...d, stockItemId: undefined };
            }
            return d;
          });

          // 2. Auto-fix Category IDs and Duplicates
          const seenIds = new Set();
          const seenNames = new Set();
          let catFixed = false;
          
          cleanedCategories = cleanedCategories.filter(c => {
            const name = c.name.trim().toLowerCase();
            if (seenNames.has(name)) {
              fixedCount++;
              catFixed = true;
              return false; // Remove duplicate name
            }
            if (!c.id || c.id === 'undefined' || c.id === 'null' || seenIds.has(c.id)) {
              c.id = `cat_fixed_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
              fixedCount++;
              catFixed = true;
            }
            seenIds.add(c.id);
            seenNames.add(name);
            return true;
          });

          // 3. Resolve broken category mappings
          cleanedMenu = cleanedMenu.map(d => {
            const resolvedId = resolveCategoryId(d, cleanedCategories);
            if (resolvedId && d.categoryId !== resolvedId) {
              fixedCount++;
              return { 
                ...d, 
                categoryId: resolvedId,
                categoryName: cleanedCategories.find(c => c.id === resolvedId)?.name || d.categoryName
              };
            }
            return d;
          });

          // 4. Re-assign dishes to first available category if their category was removed
          if (catFixed && cleanedCategories.length > 0) {
            const firstCatId = cleanedCategories[0].id;
            const firstCatName = cleanedCategories[0].name;
            cleanedMenu = cleanedMenu.map(d => {
              if (!cleanedCategories.find(c => c.id === d.categoryId)) {
                fixedCount++;
                return { ...d, categoryId: firstCatId, categoryName: firstCatName };
              }
              return d;
            });
          }

          if (fixedCount > 0) {
            set({ menu: cleanedMenu, categories: cleanedCategories });
            get().addNotification('success', `${fixedCount} problemas de integridade foram corrigidos automaticamente.`);
            get().addAuditLog(
              'INTEGRITY_CLEANUP',
              'System',
              undefined,
              { message: `Limpeza segura executada: ${fixedCount} itens corrigidos.` }
            );
            
            // Persist changes
            await Promise.all([
              databaseOperations.saveCategories(cleanedCategories).catch(e => logger.error('Error saving categories during cleanup', e, 'STORE')),
              databaseOperations.saveDishes(cleanedMenu).catch(e => logger.error('Error saving dishes during cleanup', e, 'STORE'))
            ]);
            
            get().invalidateMenuCache();
            // Refresh diagnostics after cleanup
            await get().runIntegrityDiagnostics();
            return true;
          } else {
            get().addNotification('info', 'Nada a limpar no momento.');
            return false;
          }
        } catch (error) {
          logger.error('CRITICAL: performSafeCleanup failed', error, 'STORE');
          get().addNotification('error', 'Falha ao executar limpeza segura.');
          throw error;
        }
      },

      // Subscription methods for Realtime Sync
      startRealtimeSync: () => {
        // Legacy Sync removed
      },

      hardResetMenu: async () => {
        get().addNotification('warning', 'A executar limpeza completa dos dados...');
        try {
            // 1. Wipe Database
            await databaseOperations.recreateMenuSchema();
            
            // 2. Clear Local State
            set({ categories: [], menu: [] });

            // 3. Clear Backups (prevent auto-restore)
            localStorage.removeItem('tasca_categories_backup_v3_user_only');
            localStorage.removeItem('tasca_categories_auto_backup_v3_user_only');
            localStorage.removeItem('tasca_dishes_backup_v3_user_only');
            localStorage.removeItem('tasca_dishes_backup_v3_user_only_auto');
            
            // 4. Clear Offline Queue
            set({ offlineQueue: [] });
            
            get().addNotification('success', 'Ementa reiniciada com sucesso. Comece do zero!');
        } catch (e) {
            console.error('Hard reset failed', e);
            get().addNotification('error', 'Falha ao limpar dados.');
        }
      },

      // Função centralizada para carregar dados APENAS do SQL Local (Security Mode)
      loadFromSQLExclusively: async () => {
        try {
          logger.info('Carregando dados exclusivamente do SQL Local (Security Mode)...', undefined, 'DATABASE');
          
          const sqlCategories = await databaseOperations.getCategories();
          const sqlDishes = await databaseOperations.getDishes();
          const sqlStock = await databaseOperations.getStockItems();
          const sqlExpenses = await databaseOperations.getExpenses();
          const sqlRevenues = await databaseOperations.getRevenues();
          const sqlSuppliers = await databaseOperations.getSuppliers();
          
          // Validação de Integridade Pós-Carga
          const cleanCategories = sqlCategories.filter(c => c.id && c.name);
          const cleanDishes = sqlDishes.filter(d => d.id && d.name && d.categoryId);
          
          set({ 
            categories: cleanCategories, 
            menu: cleanDishes,
            stock: sqlStock || [],
            expenses: sqlExpenses || [],
            revenues: sqlRevenues || [],
            suppliers: sqlSuppliers || [],
            lastSync: new Date()
          });

          get().addAuditLog(
            'DATA_LOAD_LOCAL',
            'System',
            undefined,
            { message: `Carregados ${cleanDishes.length} pratos e ${cleanCategories.length} categorias do SQL.` }
          );

          return true;
        } catch (e: unknown) {
          const error = e as Error;
          get().addAuditLog(
            'SECURITY_ALERT',
            'System',
            undefined,
            { message: `Falha crítica ao carregar do SQL Local: ${error.message}` }
          );
          return false;
        }
      },

      initializeStore: async () => {
        const state = get();
        if (state.isInitialized) return;
        
        try {
          // 0. Inicializar CryptoService com um segredo das configurações ou Admin PIN
          const settings = state.settings;
          const cryptoSecret = settings.adminPin || settings.apiToken || settings.restaurantName || 'TASCA-DEFAULT-SECRET';
          await CryptoService.initialize(cryptoSecret);
          logger.info("Security: CryptoService initialized", { 
            method: settings.adminPin ? 'ADMIN_PIN' : (settings.apiToken ? 'API_TOKEN' : 'DEFAULT')
          }, 'SECURITY');

          // --- DETECT ENVIRONMENT ---
          const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

          if (!isTauri) {
             // --- WEB MODE (Netlify/Browser) ---
             logger.info('Environment: Web Mode detected. Using Supabase as primary data source.', {}, 'STORE');
             
             const sbUrl = settings.supabaseConfig?.url || "https://ratzyxwpzrqbtpheygch.supabase.co";
             const sbKey = settings.supabaseConfig?.key || "sb_publishable_brYx8iH2oCK5uVUowtUhTQ_c7X4nrAo"; // Fallback for public demo

             if (sbUrl && sbKey) {
                 supabaseService.initialize(sbUrl, sbKey);
                 
                 // 1. Fetch Menu (Categories & Dishes)
                 logger.info('STORE: Iniciando carga de dados do Supabase...', undefined, 'STORE');
                 const menuData = await supabaseService.fetchMenu();
                 if (menuData.success && menuData.data) {
                     const data = menuData.data as { categories?: any[], dishes?: any[], settings?: any };
                     const hasData = (data.categories?.length && data.categories.length > 0) || (data.dishes?.length && data.dishes.length > 0);
                     
                    if (hasData) {
                        const existingCats = get().categories || [];
                        const existingMenu = get().menu || [];
                        const remoteCats = data.categories || [];
                        const remoteMenu = data.dishes || [];
                        const catIds = new Set(existingCats.map((c: any) => c.id));
                        const dishIds = new Set(existingMenu.map((d: any) => d.id));
                        const mergedCats = [...existingCats, ...remoteCats.filter((c: any) => !catIds.has(c.id))];
                        const mergedMenu = [...existingMenu, ...remoteMenu.filter((d: any) => !dishIds.has(d.id))];
                        set({
                            categories: mergedCats,
                            menu: mergedMenu
                        });
                         
                         if (data.settings) {
                            set({ settings: { ...get().settings, ...data.settings } });
                         }
                         logger.info(`Web Mode: Loaded ${data.dishes?.length || 0} dishes from cloud.`, {}, 'STORE');
                         logger.info(`STORE: Supabase carregou ${data.dishes?.length || 0} pratos e ${data.categories?.length || 0} categorias.`, undefined, 'STORE');
                     } else {
                         logger.warn('Web Mode: Cloud returned empty menu. Keeping local data if any.', {}, 'STORE');
                         // Fallback to MOCKs if local is also empty
                         if (get().menu.length === 0) {
                             set({ menu: MOCK_MENU, categories: MOCK_CATEGORIES });
                             logger.warn('STORE: Supabase retornou dados vazios, usando dados MOCK.', undefined, 'STORE');
                         }
                     }
                 } else {
                     logger.warn('Web Mode: Failed to load menu from cloud', { error: (menuData as { error?: string }).error || 'Unknown error' }, 'STORE');
                 }

                 // 2. Fetch Users (for Mobile App Login)
                 const usersData = await supabaseService.fetchUsers();
                 if (usersData.success && usersData.data) {
                     const users = (usersData.data as any[]).map((u: any) => ({
                         id: u.id,
                         name: u.name,
                         role: u.role,
                         pin: u.pin,
                         permissions: u.permissions || []
                     })) as User[];
                     
                     if (users.length > 0) {
                         set({ users });
                         logger.info(`Web Mode: Loaded ${users.length} users from cloud.`, {}, 'STORE');
                     } else {
                         logger.warn('Web Mode: Cloud returned no users. Using local/mock users.', {}, 'STORE');
                         if (get().users.length === 0) {
                             set({ users: MOCK_USERS });
                         }
                     }
                 } else {
                     logger.warn('Web Mode: Failed to load users from cloud', { error: (usersData as { error?: string }).error }, 'STORE');
                     if (get().users.length === 0) {
                        set({ users: MOCK_USERS });
                     }
                 }

                 // 3. Fetch Dashboard/Orders (Optional for public view)
                 const dashData = await supabaseService.fetchDashboard();
                 if (dashData.success && dashData.data) {
                     // Hydrate minimal state if needed
                 }
             } else {
                 logger.warn('Web Mode: Supabase credentials missing.', {}, 'STORE');
             }

             set({ isInitialized: true });
            logger.info(`STORE: Inicialização concluída. Menu: ${get().menu.length} pratos, Categorias: ${get().categories.length}.`, undefined, 'STORE');
             return;
          }

          // --- DESKTOP MODE (Tauri + SQLite) ---
          
          // 1. Inicializar Conexão SQL e Esquemas Core
          logger.info('STORE: Iniciando carga de dados do SQL Local...', undefined, 'STORE');
          await getDatabase();
          // await databaseOperations.recreateTableSchema(); // COMENTADO: Destrutivo demais no arranque

          // 2. Carregar Tabelas e Pedidos do SQL
          const dbTables = await databaseOperations.getTables();
          const dbOrders = await databaseOperations.getOrders();
          const dbCustomers = await databaseOperations.getCustomers();
          const dbEmployees = await databaseOperations.getEmployees();
          const dbUsers = await databaseOperations.getUsers();
          const dbSuppliers = await databaseOperations.getSuppliers();
          const dbStock = await databaseOperations.getStockItems();
          
          if (dbTables && dbTables.length > 0) set({ tables: dbTables });
          if (dbOrders && dbOrders.length > 0) set({ activeOrders: dbOrders });
          if (dbCustomers && dbCustomers.length > 0) set({ customers: dbCustomers });
          if (dbEmployees && dbEmployees.length > 0) set({ employees: dbEmployees });
          if (dbUsers && dbUsers.length > 0) set({ users: dbUsers });
          if (dbSuppliers && dbSuppliers.length > 0) set({ suppliers: dbSuppliers });
          if (dbStock && dbStock.length > 0) set({ stock: dbStock });

          // 3. Carregar Configurações do SQL
          const dbSettings = await databaseOperations.getSettings();
          if (dbSettings) {
            set({ settings: { ...get().settings, ...dbSettings } });
          }

          // 4. CARGA OBRIGATÓRIA E EXCLUSIVA DO SQL (Segurança Máxima)
          await get().loadFromSQLExclusively();

          // 6. Iniciar Supabase (Nova Cloud) - REMOVIDO
          // (Supabase removal)

          // Iniciar sincronização em tempo real (Supabase)
          get().startRealtimeSync();

          // 7. Reparação de Integridade Dish→Category após carga
          try {
            const currentCategories = get().categories || [];
            const currentDishes = get().menu || [];
            const validCatIds = new Set(currentCategories.map(c => String(c.id)));
            let fixedCount = 0;

            const findByName = (name?: string) => {
              if (!name) return undefined;
              const nm = String(name).trim().toLowerCase();
              return currentCategories.find(c => String(c.name).trim().toLowerCase() === nm);
            };

            const ensureDefaultCategory = () => {
              const existing = currentCategories.find(c => String(c.id) === 'uncategorized');
              if (existing) return existing;
              const def: MenuCategory = { 
                id: 'uncategorized', 
                name: 'Sem Categoria', 
                icon: 'Grid3X3',
                sort_order: 999,
                is_active: true,
                isAvailableOnDigitalMenu: true
              };
              set({ categories: [...get().categories, def] });
              return def;
            };

            const repairedDishes = currentDishes.map(d => {
              logger.debug('Processing dish for integrity repair', { dishId: d.id, currentCategoryId: d.categoryId, currentCategoryName: d.categoryName });
              const cid = String(d.categoryId || '').trim();
              if (cid && validCatIds.has(cid)) return d;
              logger.debug('Invalid categoryId found, attempting to repair by name', { dishId: d.id, categoryId: cid, categoryName: d.categoryName });
              const byName = findByName(d.categoryName);
              if (byName) { 
                logger.debug('Category found by name, repairing dish', { dishId: d.id, oldCategoryId: cid, newCategoryId: byName.id });
                fixedCount++; return { ...d, categoryId: byName.id }; 
              }
              const slugMatch = findByName(cid.replace(/_/g, ' '));
              if (slugMatch) { 
                logger.debug('Category found by slug match, repairing dish', { dishId: d.id, oldCategoryId: cid, newCategoryId: slugMatch.id });
                fixedCount++; return { ...d, categoryId: slugMatch.id }; 
              }
              const def = ensureDefaultCategory();
              logger.debug('No category found by name or slug, assigning default category', { dishId: d.id, defaultCategoryId: def.id });
              fixedCount++;
              return { ...d, categoryId: def.id };
            });

            if (fixedCount > 0) {
              set({ menu: repairedDishes });
              logger.warn('Dish→Category mapping repaired during initialization', { fixedCount, repairedDishes }, 'STORE');
              backupService.autoBackup(get().categories, repairedDishes);
            }
          } catch (integError) {
            logger.error('Initialization integrity fix failed', { error: (integError as Error).message }, 'STORE');
          }

          // 5. Configurar Sincronização Agendada
            get().setupScheduledSync();

            set({ isInitialized: true });
          
          get().addAuditLog(
            'APP_INITIALIZED',
            'System',
            undefined,
            { message: 'Sistema iniciado com segurança SQL-First.' }
          );

        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Erro na inicialização segura:', { error: error.message }, 'SECURITY');
          set({ isInitialized: true });
        }
      },

      triggerSync: async () => {
        set({ saveStatus: 'SAVING' });
        logger.info('Iniciando sincronização com a nuvem...', null, 'CLOUD');
        try {
            // 1. Validation (DLP Requirement)
            const state = get();
            const validation = await validationService.validateFullState({
                categories: state.categories,
                menu: state.menu,
                settings: state.settings
            });

            if (!validation.isValid) {
                logger.error('Sincronização abortada por falha de validação', { errors: validation.errors }, 'DLP');
                set({ saveStatus: 'ERROR' });
                return;
            }

            // 2. Process any pending offline actions
            get().processOfflineQueue();

            // 3. Initialize Supabase real-time sync
            // Define the realtime change handler
            const handleRealtimeChange = (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: any; old: any; tableName: string }) => {
              logger.info(`Realtime change detected in ${payload.tableName}`, payload, 'REALTIME');
              set((state) => {
                switch (payload.tableName) {
                  case 'menu_items': {
                    const newDish: Dish = {
                      id: payload.new.id,
                      name: payload.new.name,
                      description: payload.new.description,
                      price: payload.new.price,
                      categoryId: payload.new.category_id,
                      image: payload.new.image_url,
                      isAvailable: payload.new.available !== false,
                      isFeatured: payload.new.is_featured || false,
                      createdAt: new Date(payload.new.created_at || Date.now()),
                      updatedAt: new Date(payload.new.updated_at || Date.now()),
                      taxCode: String(payload.new.tax_rate || 'NOR'),
                    };
                    if (payload.eventType === 'INSERT') {
                      return { menu: [...state.menu, newDish] } as Partial<StoreState>;
                    } else if (payload.eventType === 'UPDATE') {
                      return { menu: state.menu.map(d => d.id === newDish.id ? { ...d, ...newDish } : d) } as Partial<StoreState>;
                    } else if (payload.eventType === 'DELETE') {
                      return { menu: state.menu.filter(d => d.id !== payload.old.id) } as Partial<StoreState>;
                    }
                  }
                    break;
                  case 'categories': {
                      const newCategory: MenuCategory = {
                        id: payload.new.id,
                        name: payload.new.name,
                        icon: payload.new.icon,
                        sort_order: payload.new.sort_order || 0,
                        is_active: payload.new.is_active !== false,
                        parent_id: payload.new.parent_id,
                        isAvailableOnDigitalMenu: payload.new.is_available_on_digital_menu !== false,
                        deletedAt: payload.new.deleted_at,
                      };
                    if (payload.eventType === 'INSERT') {
                      return { categories: [...state.categories, newCategory] } as Partial<StoreState>;
                    } else if (payload.eventType === 'UPDATE') {
                      return { categories: state.categories.map(c => c.id === newCategory.id ? newCategory : c) } as Partial<StoreState>;
                    } else if (payload.eventType === 'DELETE') {
                      return { categories: state.categories.filter(c => c.id !== payload.old.id) } as Partial<StoreState>;
                    }
                  }
                    break;
                  // Add other tables here as needed
                  case 'employees': {
                    const newEmployee: Employee = {
                      id: payload.new.id,
                      name: payload.new.name,
                      role: payload.new.role || 'GARCOM',
                      pin: payload.new.pin || '0000',
                      isActive: payload.new.is_active !== false,
                      permissions: payload.new.permissions || [],
                      phone: payload.new.phone,
                      email: payload.new.email,
                      address: payload.new.address,
                      salary: payload.new.salary,
                      nif: payload.new.nif,
                      createdAt: new Date(payload.new.created_at || Date.now()),
                      updatedAt: new Date(payload.new.updated_at || Date.now()),
                    };
                    if (payload.eventType === 'INSERT') {
                      return { employees: [...state.employees, newEmployee] } as Partial<StoreState>;
                    } else if (payload.eventType === 'UPDATE') {
                      return { employees: state.employees.map(e => e.id === newEmployee.id ? { ...e, ...newEmployee } : e) } as Partial<StoreState>;
                    } else if (payload.eventType === 'DELETE') {
                      return { employees: state.employees.filter(e => e.id !== payload.old.id) } as Partial<StoreState>;
                    }
                  }
                    break;
                  case 'attendance_records': {
                    const newRecord: AttendanceRecord = {
                      id: payload.new.id,
                      employeeId: payload.new.employee_id,
                      date: payload.new.date,
                      clockIn: new Date(payload.new.clock_in),
                      clockOut: payload.new.clock_out ? new Date(payload.new.clock_out) : undefined,
                      status: payload.new.status || 'PRESENT',
                      clockInMethod: payload.new.clock_in_method || 'PIN',
                      clockOutMethod: payload.new.clock_out_method,
                    };
                    if (payload.eventType === 'INSERT') {
                      return { attendance: [...state.attendance, newRecord] } as Partial<StoreState>;
                    } else if (payload.eventType === 'UPDATE') {
                      return { attendance: state.attendance.map(a => a.id === newRecord.id ? { ...a, ...newRecord } : a) } as Partial<StoreState>;
                    } else if (payload.eventType === 'DELETE') {
                      return { attendance: state.attendance.filter(a => a.id !== payload.old.id) } as Partial<StoreState>;
                    }
                  }
                    break;
                  case 'revenues': {
                    const newRevenue: Revenue = {
                      id: payload.new.id,
                      amount: payload.new.amount,
                      description: payload.new.description,
                      date: new Date(payload.new.date),
                      category: payload.new.category || 'VENDAS',
                      paymentMethod: payload.new.payment_method || 'NUMERARIO',
                      orderId: payload.new.order_id,
                      shiftId: payload.new.shift_id,
                      createdAt: new Date(payload.new.created_at || Date.now()),
                    };
                    if (payload.eventType === 'INSERT') {
                      return { revenues: [...state.revenues, newRevenue] } as Partial<StoreState>;
                    } else if (payload.eventType === 'UPDATE') {
                      return { revenues: state.revenues.map(r => r.id === newRevenue.id ? newRevenue : r) } as Partial<StoreState>;
                    } else if (payload.eventType === 'DELETE') {
                      return { revenues: state.revenues.filter(r => r.id !== payload.old.id) } as Partial<StoreState>;
                    }
                  }
                    break;
                  case 'expenses': {
                    const newExpense: Expense = {
                      id: payload.new.id,
                      amount: payload.new.amount,
                      description: payload.new.description,
                      date: new Date(payload.new.date),
                      category: payload.new.category || 'OUTROS',
                      paymentMethod: payload.new.payment_method || 'NUMERARIO',
                      supplierId: payload.new.supplier_id,
                      status: payload.new.status || 'PAGO',
                      createdAt: new Date(payload.new.created_at || Date.now()),
                    };
                    if (payload.eventType === 'INSERT') {
                      return { expenses: [...state.expenses, newExpense] } as Partial<StoreState>;
                    } else if (payload.eventType === 'UPDATE') {
                      return { expenses: state.expenses.map(e => e.id === newExpense.id ? newExpense : e) } as Partial<StoreState>;
                    } else if (payload.eventType === 'DELETE') {
                      return { expenses: state.expenses.filter(e => e.id !== payload.old.id) } as Partial<StoreState>;
                    }
                  }
                    break;
                  case 'dashboard_summary': {
                    // Update the summary if needed, or trigger a refresh
                    logger.info('Dashboard summary updated in cloud, triggering refresh...', payload.new, 'REALTIME');
                    // We don't store summary directly in the main store state usually, 
                    // but we can trigger a re-fetch or update a specific state if needed.
                  }
                    break;
                }
                return state; // No change if table not handled
              });
            };

            // 2. Cloud Sync (Supabase) if enabled
            const { settings, categories, menu, activeOrders, revenues, employees, tables, users, auditLogs, stock, suppliers, expenses } = get();
            
            if (settings.supabaseConfig?.enabled && settings.supabaseConfig?.url && settings.supabaseConfig?.key) {
                 const path = typeof window !== 'undefined' ? window.location.pathname : '';
                 const hash = typeof window !== 'undefined' ? window.location.hash : '';
                 const isPublicMenuView = /^\/menu(\/|$)/.test(path) || /^#\/menu(\/|$)/.test(hash);
                 
                 if (!supabaseService.isConnected()) {
                     logger.info('Inicializando cliente Supabase', { url: settings.supabaseConfig.url }, 'CLOUD');
                     supabaseService.initialize(settings.supabaseConfig.url, settings.supabaseConfig.key, isPublicMenuView ? undefined : handleRealtimeChange);
                 }

                 if (isPublicMenuView) {
                     logger.info('Modo Menu Público: ignorando sincronizações de escrita (RLS-safe)', null, 'CLOUD');
                 } else {
                     // Sync Menu (Categories, Products, Settings)
                     if (settings.supabaseConfig.autoSync) {
                         logger.info('Sincronizando menu e configurações...', null, 'CLOUD');
                         try {
                             await supabaseService.syncMenu(categories, menu, settings);
                         } catch (e: unknown) {
                             logger.error('Falha ao sincronizar menu com Supabase, adicionando à fila offline.', { error: (e as Error).message }, 'CLOUD');
                             get().addOfflineAction({ id: crypto.randomUUID(), type: 'SYNC_MENU', payload: { categories, menu, settings }, timestamp: Date.now() });
                         }
                         
                         // Sync Stock and Suppliers
                         logger.info('Sincronizando stock e fornecedores...', { stockCount: stock.length, supplierCount: suppliers.length }, 'CLOUD');
                         try {
                             await supabaseService.syncStock(stock);
                         } catch (e: unknown) {
                             logger.error('Falha ao sincronizar stock com Supabase, adicionando à fila offline.', { error: (e as Error).message }, 'CLOUD');
                             get().addOfflineAction({ id: crypto.randomUUID(), type: 'SYNC_STOCK', payload: { stock }, timestamp: Date.now() });
                         }
                         try {
                             await supabaseService.syncSuppliers(suppliers);
                         } catch (e: unknown) {
                             logger.error('Falha ao sincronizar fornecedores com Supabase, adicionando à fila offline.', { error: (e as Error).message }, 'CLOUD');
                             get().addOfflineAction({ id: crypto.randomUUID(), type: 'SYNC_SUPPLIERS', payload: { suppliers }, timestamp: Date.now() });
                         }
                         
                         // Sync Financials (Expenses and Revenues)
                         logger.info('Sincronizando dados financeiros...', { expenseCount: expenses.length, revenueCount: revenues.length }, 'CLOUD');
                         try {
                             await supabaseService.syncFinancials(revenues, expenses);
                         } catch (e: unknown) {
                             logger.error('Falha ao sincronizar dados financeiros com Supabase, adicionando à fila offline.', { error: (e as Error).message }, 'CLOUD');
                             get().addOfflineAction({ id: crypto.randomUUID(), type: 'SYNC_FINANCIALS', payload: { revenues, expenses }, timestamp: Date.now() });
                         }
                     }

                     // Sync Users (System Users with PINs)
                     logger.info('Sincronizando utilizadores...', { userCount: users.length }, 'CLOUD');
                     try {
                         await supabaseService.syncUsers(users);
                     } catch (e: unknown) {
                         logger.error('Falha ao sincronizar utilizadores com Supabase, adicionando à fila offline.', { error: (e as Error).message }, 'CLOUD');
                         get().addOfflineAction({ id: crypto.randomUUID(), type: 'SYNC_USERS', payload: { users }, timestamp: Date.now() });
                     }

                     // Sync Audit Logs (Incremental)
                     logger.info('Sincronizando logs de auditoria...', null, 'CLOUD');
                     try {
                         await supabaseService.syncAuditLogs(auditLogs.slice(-50));
                     } catch (e: unknown) {
                         logger.error('Falha ao sincronizar logs de auditoria com Supabase, adicionando à fila offline.', { error: (e as Error).message }, 'CLOUD');
                         get().addOfflineAction({ id: crypto.randomUUID(), type: 'SYNC_AUDIT_LOGS', payload: { auditLogs: auditLogs.slice(-50) }, timestamp: Date.now() });
                     }

                     // Sync Dashboard (Revenue, Orders, etc.)
                     const summary = {
                        totalRevenue: revenues.reduce((acc, r) => acc + r.amount, 0),
                        totalOrders: activeOrders.length, 
                        avgOrderValue: 0, 
                        peakHour: 0,
                        topDish: '',
                        employeesWorking: employees.filter(e => e.isActive).length,
                        tablesOccupied: tables.filter(t => t.status === 'OCUPADO').length,
                        lastUpdated: new Date()
                     };
                     logger.info('Sincronizando resumo do painel...', null, 'CLOUD');
                     try {
                         await supabaseService.syncDashboardData(summary, activeOrders);
                     } catch (e: unknown) {
                         logger.error('Falha ao sincronizar dados do painel com Supabase, adicionando à fila offline.', { error: (e as Error).message }, 'CLOUD');
                         get().addOfflineAction({ id: crypto.randomUUID(), type: 'SYNC_DASHBOARD_DATA', payload: { summary, activeOrders }, timestamp: Date.now() });
                     }
                 }
            } else {
                 logger.warn('Sincronização ignorada: Supabase não configurado ou desativado', null, 'CLOUD');
            }
            
            set({ saveStatus: 'SAVED', lastSync: new Date() });
            // Attempt to process any pending offline actions after a successful sync
            get().processOfflineQueue();
        } catch (e: unknown) {
            const error = e as Error;
            logger.error('Falha na sincronização', { error: error.message }, 'CLOUD');
            set({ saveStatus: 'ERROR' });
            logger.audit('SYNC_FAILED', { error: error.message });
        }
      },

      setupScheduledSync: () => {
        // Sincronização agendada a cada 5 minutos
        const interval = setInterval(() => {
          const { settings } = get();
          if (settings.supabaseConfig?.enabled && settings.supabaseConfig?.autoSync) {
            get().triggerSync();
          }
        }, 5 * 60 * 1000);

        // Limpar intervalo se necessário (embora o store seja singleton)
        return () => clearInterval(interval);
      },

      // Mecanismo de sincronização manual segura com confirmação e backup
      requestManualSync: async () => {
        const confirmSync = window.confirm(
          "Deseja iniciar o backup manual? \n\n" +
          "Este processo irá:\n" +
          "1. Criar um backup de segurança completo\n" +
          "2. Validar a integridade dos dados atuais\n" +
          "3. Sincronizar com a nuvem (se configurado)"
        );

        if (!confirmSync) return;

        get().addNotification('info', 'A iniciar backup manual seguro...');
        
        try {
          // 1. Backup Automático Pre-Sync (Requisito de Segurança)
          await disasterRecoveryService.createFullBackup('MANUAL');
          logger.info('Backup de segurança criado.', undefined, 'SECURITY');

          // 2. Validação de Integridade (Requisito de Dados)
          const state = get();
          const validation = await validationService.validateFullState({
            categories: state.categories,
            menu: state.menu,
            settings: state.settings
          });

          if (!validation.isValid) {
            get().addNotification('warning', 'Problemas de integridade detectados. Verifique os logs.');
            logger.warn('Integrity issues found during manual sync', { errors: validation.errors }, 'SECURITY');
          }

          // 3. Executar Sincronização
          await get().triggerSync();

          // 4. Auditoria (Requisito de Segurança)
          get().addAuditLog(
            'MANUAL_BACKUP_PERFORMED',
            'System',
            undefined,
            { 
              message: 'Backup manual e sincronização executados com sucesso.',
              timestamp: new Date().toISOString(),
              dishCount: get().menu.length,
              categoryCount: get().categories.length,
              validationStatus: validation.isValid ? 'VALID' : 'INVALID'
            }
          );

          get().addNotification('success', 'Backup e Sincronização concluídos!');
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Falha no backup manual seguro', { error: error.message }, 'SECURITY');
          get().addNotification('error', `Falha no backup: ${error.message}`);
          
          get().addAuditLog(
            'SECURITY_ALERT',
            'System',
            undefined,
            { message: `Falha no backup manual: ${error.message}` }
          );
        }
      },

      // Enhanced manual restore
      restoreMenuData: async () => {
        get().addNotification('info', 'A iniciar recuperação segura e completa...');
        
        try {
            // 1. Secure Wipe (SQL + State) - Elimina dados existentes
            await databaseOperations.recreateMenuSchema();
            
            // 2. Load from Local Backup (Priority)
            const integrity = backupService.checkIntegrity([], []); 
            
            const restoredCategories = integrity.suggestedCategories || [];
            const restoredDishes = integrity.suggestedDishes || [];


            // 3. Fallback to Cloud if local is empty
            // (Supabase removal - Cloud fallback disabled)


            // 4. Validate and Repair Data (Business Rules)
            // Regra: Produtos sem categoria vão para 'Sem Categoria' (evita 'Bebidas')
            const validCatIds = new Set(restoredCategories.map(c => c.id));
            let fixedCount = 0;

            const finalDishes = restoredDishes.map(d => {
                // If category exists, keep it
                if (d.categoryId && validCatIds.has(d.categoryId)) return d;
                
                // If invalid/missing, assign to 'uncategorized'
                // NEVER guess 'Bebidas' or other categories
                fixedCount++;
                return { ...d, categoryId: 'uncategorized' };
            });

            if (fixedCount > 0) {
                // Ensure 'uncategorized' category exists if we used it
                if (!validCatIds.has('uncategorized')) {
                    restoredCategories.push({ 
                        id: 'uncategorized', 
                        name: 'Sem Categoria', 
                        icon: 'Grid3X3',
                        sort_order: 999,
                        is_active: true,
                        isAvailableOnDigitalMenu: true
                    });
                }
                logger.warn('Restore integrity fix: assigned items to uncategorized', { count: fixedCount }, 'STORE');
            }

            // 5. Apply Restored State
            set({ categories: restoredCategories, menu: finalDishes });
            
            // 5.1 Persist Restored Data to SQL (Critical Fix)
            try {
                await Promise.all([
                    databaseOperations.saveCategories(restoredCategories),
                    databaseOperations.saveDishes(finalDishes)
                ]);
                logger.info('Restored data successfully persisted to SQL', { 
                    categories: restoredCategories.length, 
                    dishes: finalDishes.length 
                }, 'STORE');
            } catch (sqlError) {
                console.error('Failed to persist restored data to SQL:', sqlError);
                get().addNotification('warning', 'Dados restaurados no estado, mas falha ao gravar no banco local.');
            }
            
            // 6. Update Backups & Cloud (if needed)
            backupService.autoBackup(restoredCategories, finalDishes);
            
            get().addNotification('success', `Restauro completo: ${restoredCategories.length} categorias, ${finalDishes.length} produtos.`);
            
        } catch (error) {
            console.error("Secure restore failed:", error);
            get().addNotification('error', 'Falha crítica no restauro de dados.');
        }
      },

      createFullFinancialBackup: async () => {
        if (!get().hasPermission('EXPORT_DATA')) {
          get().addNotification('error', 'Sem permissão para realizar backup completo.');
          return false;
        }

        const state = get();
        const financialData: FinancialBackupData = {
          orders: state.activeOrders,
          expenses: state.expenses,
          revenues: state.revenues,
          payroll: state.payroll,
          shifts: state.shifts,
          settings: state.settings
        };

        const success = backupService.saveFullBackup(
          state.categories,
          state.menu,
          financialData,
          state.currentUser?.id || 'system'
        );

        if (success) {
          get().addAuditLog(
            'BACKUP_CREATED',
            'System',
            undefined,
            { 
              message: 'Backup financeiro e de menu completo realizado com sucesso.',
              dishCount: state.menu.length, 
              orderCount: state.activeOrders.length 
            }
          );
          get().addNotification('success', 'Backup completo realizado com sucesso!');
        } else {
          get().addNotification('error', 'Falha ao realizar backup completo.');
        }

        return success;
      },

      restoreFullFinancialBackup: async () => {
        if (!get().hasPermission('EXPORT_DATA')) {
          get().addNotification('error', 'Sem permissão para restaurar backup completo.');
          return false;
        }

        const confirmRestore = window.confirm(
          "ATENÇÃO: Restaurar um backup completo irá:\n" +
          "1. Apagar TODOS os dados financeiros atuais (pedidos, despesas, etc.)\n" +
          "2. Apagar o menu e categorias atuais\n" +
          "3. Substituí-los pelos dados do backup\n\n" +
          "Deseja continuar?"
        );

        if (!confirmRestore) return false;

        get().addNotification('info', 'A restaurar backup financeiro completo...');
        
        try {
          const backupPackage = backupService.loadFullBackup();
          if (!backupPackage) {
            get().addNotification('error', 'Nenhum backup completo encontrado.');
            return false;
          }

          // 1. Limpar esquemas SQL antes de restaurar
          await Promise.all([
            databaseOperations.recreateMenuSchema(),
            databaseOperations.recreateFinancialSchema()
          ]);

          const { financial, menu, metadata } = backupPackage;

          // 2. Persistir Menu e Categorias no SQL
          await Promise.all([
            databaseOperations.saveCategories(menu.categories),
            databaseOperations.saveDishes(menu.dishes)
          ]);

          // 3. Persistir Dados Financeiros no SQL
          await Promise.all([
            databaseOperations.saveOrders(financial.orders),
            databaseOperations.saveExpenses(financial.expenses),
            databaseOperations.saveRevenues(financial.revenues),
            databaseOperations.savePayrolls(financial.payroll),
            databaseOperations.saveShifts(financial.shifts),
            databaseOperations.saveSettings(financial.settings)
          ]);

          // 4. Atualizar Estado Local
          set({
            categories: menu.categories,
            menu: menu.dishes,
            activeOrders: financial.orders,
            expenses: financial.expenses,
            revenues: financial.revenues,
            payroll: financial.payroll,
            shifts: financial.shifts,
            settings: financial.settings
          });

          // 5. Validar Reconciliação Final após carga no estado
          // Cast temporário para validação
          const finalTotals = backupService.calculateFinancialTotals({
            ...financial,
            orders: financial.orders,
            expenses: financial.expenses,
            revenues: financial.revenues,
            payroll: financial.payroll,
            shifts: financial.shifts,
            settings: financial.settings
          });

          get().addAuditLog(
            'BACKUP_RESTORED',
            'System',
            undefined,
            { 
              message: `Backup completo restaurado. Data do backup: ${metadata.timestamp}`,
              backupTimestamp: metadata.timestamp,
              totals: metadata.totals,
              reconciledTotals: finalTotals,
              integrityStatus: metadata.checksum ? 'VERIFIED' : 'UNVERIFIED',
              dishCount: menu.dishes.length,
              orderCount: financial.orders.length
            }
          );

          get().addNotification('success', 'Backup completo restaurado com sucesso!');
          return true;
        } catch (e: unknown) {
          const error = e as Error;
          logger.error('Falha crítica no restauro de backup completo', { error: error.message }, 'BACKUP');
          get().addNotification('error', `Falha no restauro: ${error.message}`);
          return false;
        }
      },

      addLoyaltyPoints: (customerId, points) => {
         set(state => ({
           customers: state.customers.map(c =>
             c.id === customerId ? { ...c, loyaltyPoints: (c.loyaltyPoints || 0) + points } : c
           )
         }));
         get().addAuditLog(
           'LOYALTY_POINTS_ADDED',
           'Customer',
           customerId,
           { message: `Adicionados ${points} pontos ao cliente`, points }
         );
      },
    }),
    { 
      name: 'tasca-vereda-storage-v2', 
      storage: createJSONStorage(() => customStorage),
      version: 2,
      merge: (persistedState: unknown, currentState: StoreState) => {
        if (typeof persistedState !== 'object' || persistedState === null) {
          logger.warn('Estado persistido inválido, usando estado atual.', persistedState, 'STORE');
          return currentState;
        }

        const state = persistedState as StoreState;
        const mergedState = { ...currentState, ...state };

        // Deep merge para evitar que arrays sejam substituídos por vazios
        if (Array.isArray(state.categories) && state.categories.length === 0) {
          mergedState.categories = MOCK_CATEGORIES;
          logger.info('Categorias vazias no estado persistido, reinjetando MOCK_CATEGORIES.', undefined, 'STORE');
        }
        if (Array.isArray(state.menu) && state.menu.length === 0) {
          mergedState.menu = MOCK_MENU;
          logger.info('Menu vazio no estado persistido, reinjetando MOCK_MENU.', undefined, 'STORE');
        }
        if (Array.isArray(state.users) && state.users.length === 0) {
          mergedState.users = MOCK_USERS;
          logger.info('Utilizadores vazios no estado persistido, reinjetando MOCK_USERS.', undefined, 'STORE');
        }

        logger.info('Estado do Zustand mesclado com sucesso.', { persisted: state, current: currentState, merged: mergedState }, 'STORE');
        return mergedState;
      },
      onRehydrateStorage: () => (state) => {
        try {
          if (!state) return;
          
          const categories = state.categories || [];
          const dishes = state.menu || [];
          const validCatIds = new Set(categories.map(c => String(c.id)));
          let fixed = 0;

          // Se não houver categorias mas houver produtos, isso é um estado de erro grave de integridade
          if (categories.length === 0 && dishes.length > 0) {
             logger.error('Rehydrate CRITICAL: Products exist but categories are empty!', {}, 'STORE');
             // Não tentamos corrigir aqui, o initializeStore() cuidará da restauração SQL/Cloud
             return;
          }

          const findByName = (name?: string) => {
            if (!name) return undefined;
            const nm = String(name).trim().toLowerCase();
            return categories.find(c => String(c.name).trim().toLowerCase() === nm);
          };

          const repaired = dishes.map(d => {
            const cid = String(d.categoryId || '').trim();
            if (cid && validCatIds.has(cid)) return d;
            
            // Tenta recuperar por nome de categoria salvo no produto
            const byName = findByName(d.categoryName);
            if (byName) { fixed++; return { ...d, categoryId: byName.id }; }
            
            // Tenta se o ID for na verdade um slug/nome
            const slugMatch = findByName(cid.replace(/_/g, ' '));
            if (slugMatch) { fixed++; return { ...d, categoryId: slugMatch.id }; }
            
            return d;
          });

          if (fixed > 0) {
            logger.info('Rehydrate detected dish category inconsistencies', { fixed }, 'STORE');
            // Aplicamos a correção ao estado reidratado
            state.menu = repaired;
          }

          // Validação de Fornecedores (Fase 3/4)
          const suppliers = state.suppliers || [];
          if (suppliers.length === 0 && dishes.some(d => d.supplierId)) {
             logger.warn('Rehydrate: Dishes have suppliers but supplier list is empty', {}, 'STORE');
          }

        } catch (e) {
          console.error('Rehydrate integrity check failed', e);
        }
      },
      partialize: (state): Partial<StoreState> => ({
        tables: state.tables,
        users: state.users,
        employees: state.employees,
        menu: state.menu,
        stock: state.stock,
        customers: state.customers,
        reservations: state.reservations,
        settings: state.settings,
        expenses: state.expenses,
        fixedExpenses: state.fixedExpenses,
        revenues: state.revenues,
        activeOrders: state.activeOrders,
        shifts: state.shifts,
        attendance: state.attendance,
        payroll: state.payroll,
        workShifts: state.workShifts,
        categories: state.categories,
        deletedCategoryIds: state.deletedCategoryIds,
        auditLogs: state.auditLogs,
        activeTableId: state.activeTableId,
        activeOrderId: state.activeOrderId
      })
    }
  )
);
