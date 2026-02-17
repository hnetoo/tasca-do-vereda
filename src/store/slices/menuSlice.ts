import { StateCreator } from 'zustand';
import { Dish, MenuCategory, StoreState } from '@/types';
import { databaseOperations } from '@/services/database/operations';
import { logger } from '@/services/logger';
import { integrationAPIService } from '@/services/integrationAPIService';

export interface MenuSlice {
  menu: Dish[];
  categories: MenuCategory[];
  deletedCategoryIds: string[];
  setMenu: (menu: Dish[]) => void;
  setMenuFromCloud: (menu: Dish[]) => void;
  setCategoriesFromCloud: (categories: MenuCategory[]) => void;
  addCategory: (cat: MenuCategory) => void;
  updateCategory: (cat: MenuCategory) => void;
  removeCategory: (id: string) => void;
  addDish: (dish: Dish) => void;
  updateDish: (dish: Dish) => void;
  removeDish: (id: string) => void;
  restoreMenuData: () => Promise<void>;
  hardResetMenu: () => Promise<void>;
  loadFromSQLExclusively: () => Promise<boolean>;
  getDishById: (id: string) => Dish | undefined;
  getDishesByCategory: (categoryId: string) => Dish[];
  getCategoryById: (id: string) => MenuCategory | undefined;
  rebuildMenu: (categories: MenuCategory[], dishes: Dish[]) => void;
  setCategories: (categories: MenuCategory[]) => void;
  invalidateMenuCache: () => void;
  restoreCategory: (id: string) => void;
  recoverDeletedCategory: (category: MenuCategory) => void;
  syncMenuWithCloud: () => Promise<void>;
}

import { MOCK_MENU, MOCK_CATEGORIES } from '@/constants';

export const createMenuSlice: StateCreator<
  StoreState,
  [['zustand/persist', unknown]],
  [],
  MenuSlice
> = (set, get) => ({
  menu: MOCK_MENU,
  categories: MOCK_CATEGORIES,
  deletedCategoryIds: [],
  setMenu: (menu) => set({ menu }),
  setMenuFromCloud: (menu) => set({ menu }),
  setCategoriesFromCloud: (categories) => set({ categories }),
  setCategories: (categories) => set({ categories }),
  
  getDishById: (id) => get().menu.find(d => d.id === id),
  getDishesByCategory: (category_id: string) => get().menu.filter(d => d.category_id === category_id),
  getCategoryById: (id) => get().categories.find(c => c.id === id),
  rebuildMenu: (categories, dishes) => set({ categories, menu: dishes }),
  
  invalidateMenuCache: () => {
    set({ menuCache: null });
    logger.info('Menu cache invalidated', undefined, 'SYSTEM');
  },
  
  addCategory: async (cat) => {
    set((state) => ({ categories: [...state.categories, cat] }));
    await databaseOperations.saveCategory(cat);
    
    const { settings, addOfflineAction } = get();
    if (settings.supabaseConfig?.enabled) {
        if (integrationAPIService.isConnected()) {
            const result = await integrationAPIService.createCategory(cat);
            if (!result.success) {
                addOfflineAction({ type: 'CREATE_CATEGORY', payload: cat, id: cat.id, timestamp: Date.now() });
            }
        } else {
            addOfflineAction({ type: 'CREATE_CATEGORY', payload: cat, id: cat.id, timestamp: Date.now() });
        }
    }
  },
  
  updateCategory: async (cat) => {
    set((state) => ({
      categories: state.categories.map((c) => (c.id === cat.id ? cat : c)),
    }));
    await databaseOperations.saveCategory(cat);
    
    const { settings, addOfflineAction } = get();
    if (settings.supabaseConfig?.enabled) {
        if (integrationAPIService.isConnected()) {
            const result = await integrationAPIService.updateCategory(cat);
            if (!result.success) {
                addOfflineAction({ type: 'UPDATE_CATEGORY', payload: cat, id: cat.id, timestamp: Date.now() });
            }
        } else {
            addOfflineAction({ type: 'UPDATE_CATEGORY', payload: cat, id: cat.id, timestamp: Date.now() });
        }
    }
  },
  
  removeCategory: async (id) => {
    const deletedAt = new Date().toISOString();
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, deletedAt } : c
      ),
      deletedCategoryIds: [...state.deletedCategoryIds, id],
    }));
    
    const category = get().categories.find(c => c.id === id);
    if (category) {
        // Save soft delete to local DB
        await databaseOperations.saveCategory(category);

        const { settings, addOfflineAction } = get();
        if (settings.supabaseConfig?.enabled) {
            if (integrationAPIService.isConnected()) {
                const result = await integrationAPIService.deleteCategory(id);
                if (!result.success) {
                    addOfflineAction({ type: 'DELETE_CATEGORY', payload: { id }, id: id, timestamp: Date.now() });
                }
            } else {
                addOfflineAction({ type: 'DELETE_CATEGORY', payload: { id }, id: id, timestamp: Date.now() });
            }
        }
    }
  },

  restoreCategory: (id) => {
    set((state) => ({
      deletedCategoryIds: state.deletedCategoryIds.filter((cid) => cid !== id)
    }));
    logger.info(`Category ${id} restored from deletion list`, undefined, 'SYSTEM');
  },

  recoverDeletedCategory: (category) => {
    set((state) => ({
      categories: [...state.categories, category],
      deletedCategoryIds: state.deletedCategoryIds.filter((id) => id !== category.id)
    }));
    databaseOperations.saveCategory(category);
    logger.info(`Category ${category.name} fully recovered`, undefined, 'SYSTEM');
  },

  addDish: async (dish) => {
    set((state) => ({ menu: [...state.menu, dish] }));
    await databaseOperations.saveDish(dish);
    
    const { settings, addOfflineAction } = get();
    if (settings.supabaseConfig?.enabled) {
        if (integrationAPIService.isConnected()) {
            const result = await integrationAPIService.createDish(dish);
            if (!result.success) {
                addOfflineAction({ type: 'CREATE_DISH', payload: dish, id: dish.id, timestamp: Date.now() });
            }
        } else {
            addOfflineAction({ type: 'CREATE_DISH', payload: dish, id: dish.id, timestamp: Date.now() });
        }
    }
  },

  updateDish: async (dish) => {
    set((state) => ({
      menu: state.menu.map((d) => (d.id === dish.id ? dish : d)),
    }));
    await databaseOperations.saveDish(dish);
    
    const { settings, addOfflineAction } = get();
    if (settings.supabaseConfig?.enabled) {
        if (integrationAPIService.isConnected()) {
            const result = await integrationAPIService.updateDish(dish);
            if (!result.success) {
                addOfflineAction({ type: 'UPDATE_DISH', payload: dish, id: dish.id, timestamp: Date.now() });
            }
        } else {
            addOfflineAction({ type: 'UPDATE_DISH', payload: dish, id: dish.id, timestamp: Date.now() });
        }
    }
  },

  removeDish: async (id) => {
    const deletedAt = new Date().toISOString();
    set((state) => ({
      menu: state.menu.map((d) =>
        d.id === id ? { ...d, deletedAt } : d
      ),
    }));
    
    const dish = get().menu.find(d => d.id === id);
    if (dish) {
        await databaseOperations.saveDish(dish);

        const { settings, addOfflineAction } = get();
        if (settings.supabaseConfig?.enabled) {
            if (integrationAPIService.isConnected()) {
                const result = await integrationAPIService.deleteDish(id);
                if (!result.success) {
                    addOfflineAction({ type: 'DELETE_DISH', payload: { id }, id: id, timestamp: Date.now() });
                }
            } else {
                addOfflineAction({ type: 'DELETE_DISH', payload: { id }, id: id, timestamp: Date.now() });
            }
        }
    }
  },

  restoreMenuData: async () => {
    logger.info("Starting menu restoration from SQL", undefined, 'DATABASE');
    const categories = await databaseOperations.getCategories();
    const dishes = await databaseOperations.getDishes();
    
    if (categories.length > 0 || dishes.length > 0) {
      set({ 
        categories: categories.map((c) => ({...c, is_active: !!c.is_active})), 
        menu: dishes.map((d) => ({...d, category_id: d.category_id, price: Number(d.price)})) 
      });
      logger.info(`Restored ${categories.length} categories and ${dishes.length} dishes`, undefined, 'DATABASE');
    }
  },

  hardResetMenu: async () => {
    if (!window.confirm("ATENÇÃO: Isso apagará todo o menu local e recriará as tabelas. Deseja continuar?")) return;
    
    await databaseOperations.recreateMenuSchema();
    set({ menu: [], categories: [] });
  },

  syncMenuWithCloud: async () => {
    const { categories, menu, settings } = get();
    if (settings.supabaseConfig?.enabled && integrationAPIService.isConnected()) {
        logger.info('Starting menu cloud sync...', {}, 'SYNC');
        
        // Sync Categories
        const catResult = await integrationAPIService.syncCategories(categories);
        if (catResult.success && catResult.data) {
            set({ categories: catResult.data });
            // Save to local DB
            for (const cat of catResult.data) {
                await databaseOperations.saveCategory(cat);
            }
        }

        // Sync Dishes
        const dishResult = await integrationAPIService.syncDishes(menu);
        if (dishResult.success && dishResult.data) {
            set({ menu: dishResult.data });
            // Save to local DB
            for (const dish of dishResult.data) {
                await databaseOperations.saveDish(dish);
            }
        }
        
        logger.info('Menu synced with cloud completed', {}, 'SYNC');
    }
  },

  loadFromSQLExclusively: async () => {
    try {
        const [cats, dishes] = await Promise.all([
            databaseOperations.getCategories(),
            databaseOperations.getDishes()
        ]);

        if (cats.length > 0 || dishes.length > 0) {
            set({
                categories: cats.map(c => ({
                    id: c.id,
                    name: c.name,
                    icon: c.icon,
                    sort_order: c.sort_order,
                    is_active: !!c.is_active
                })),
                menu: dishes.map(d => ({
                    id: d.id,
                    name: d.name,
                    description: d.description,
                    price: Number(d.price),
                    precoCusto: Number(d.precoCusto),
                    category_id: d.category_id,
                    image: d.image,
                    taxCode: d.taxCode,
                    taxPercentage: Number(d.taxPercentage),
                    tempo_preparo: d.tempo_preparo,
                    disponivel: !!d.disponivel,
                    availableOnDigitalMenu: !!d.availableOnDigitalMenu,
                    controlaEstoque: !!d.controlaEstoque,
                    quantidadeEstoque: Number(d.quantidadeEstoque),
                    quantidadeMinima: Number(d.quantidadeMinima),
                    quantidadeMaxima: d.quantidadeMaxima ? Number(d.quantidadeMaxima) : undefined,
                    unidadeMedida: d.unidadeMedida,
                    fornecedorPadraoId: d.fornecedorPadraoId
                }))
            });
            logger.info('Menu loaded exclusively from SQL', { categories: cats.length, dishes: dishes.length }, 'DATABASE');
            return true;
        }
        return false;
    } catch (e: unknown) {
        const error = e as Error;
        logger.error('Failed to load menu exclusively from SQL', { error: error.message }, 'DATABASE');
        return false;
    }
  }
});
