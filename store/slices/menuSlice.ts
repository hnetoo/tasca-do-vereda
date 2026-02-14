import { StateCreator } from 'zustand';
import { Dish, MenuCategory, StoreState } from '../../types';
import { databaseOperations } from '../../services/database/operations';
import { logger } from '../../services/logger';

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
}

import { MOCK_MENU, MOCK_CATEGORIES } from '../../constants';

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
  getDishesByCategory: (categoryId) => get().menu.filter(d => d.categoryId === categoryId),
  getCategoryById: (id) => get().categories.find(c => c.id === id),
  rebuildMenu: (categories, dishes) => set({ categories, menu: dishes }),
  
  invalidateMenuCache: () => {
    set({ menuCache: null });
    logger.info('Menu cache invalidated', undefined, 'SYSTEM');
  },
  
  addCategory: (cat) => {
    set((state) => ({ categories: [...state.categories, cat] }));
    databaseOperations.saveCategory(cat);
    get().triggerSync?.();
  },
  
  updateCategory: (cat) => {
    set((state) => ({
      categories: state.categories.map((c) => (c.id === cat.id ? cat : c)),
    }));
    databaseOperations.saveCategory(cat);
    get().triggerSync?.();
  },
  
  removeCategory: (id) => {
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
      deletedCategoryIds: [...state.deletedCategoryIds, id]
    }));
    databaseOperations.deleteCategory(id);
    get().triggerSync?.();
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

  addDish: (dish) => {
    set((state) => ({ menu: [...state.menu, dish] }));
    databaseOperations.saveDish(dish);
    get().triggerSync?.();
  },

  updateDish: (dish) => {
    set((state) => ({
      menu: state.menu.map((d) => (d.id === dish.id ? dish : d)),
    }));
    databaseOperations.saveDish(dish);
    get().triggerSync?.();
  },

  removeDish: (id) => {
    set((state) => ({
      menu: state.menu.filter((d) => d.id !== id),
    }));
    databaseOperations.deleteDish(id);
    get().triggerSync?.();
  },

  restoreMenuData: async () => {
    logger.info("Starting menu restoration from SQL", undefined, 'DATABASE');
    const categories = await databaseOperations.getCategories();
    const dishes = await databaseOperations.getDishes();
    
    if (categories.length > 0 || dishes.length > 0) {
      set({ 
        categories: categories.map((c) => ({...c, is_active: !!c.is_active})), 
        menu: dishes.map((d) => ({...d, categoryId: d.categoryId, price: Number(d.price)})) 
      });
      logger.info(`Restored ${categories.length} categories and ${dishes.length} dishes`, undefined, 'DATABASE');
    }
  },

  hardResetMenu: async () => {
    if (!window.confirm("ATENÇÃO: Isso apagará todo o menu local e recriará as tabelas. Deseja continuar?")) return;
    
    await databaseOperations.recreateMenuSchema();
    set({ menu: [], categories: [] });
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
                    categoryId: d.categoryId,
                    image: d.image,
                    taxCode: d.taxCode,
                    taxPercentage: Number(d.taxPercentage),
                    tempo_preparo: d.tempo_preparo,
                    disponivel: !!d.disponivel,
                    isAvailableOnDigitalMenu: !!d.isAvailableOnDigitalMenu,
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
