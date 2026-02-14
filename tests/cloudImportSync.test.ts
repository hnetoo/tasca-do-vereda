import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';
import { Dish, MenuCategory } from '../types';

describe('Cloud Import and Conflict Resolution', () => {
  beforeEach(() => {
    const s = useStore.getState();
    useStore.setState({ categories: [], menu: [] });
    s.invalidateMenuCache();
  });

  it('imports new categories and dishes from cloud', () => {
    const cloudCats: MenuCategory[] = [
      { id: 'cat1', name: 'Bebidas', icon: 'Cup', sort_order: 1, is_active: true }
    ];
    const cloudDishes: Dish[] = [
      { id: 'd1', name: 'Cerveja Gela', description: '', price: 1200, categoryId: 'cat1', image: '', disponivel: true, taxCode: 'NOR', taxPercentage: 14 }
    ];
    useStore.getState().importCloudItems({ categories: cloudCats, dishes: cloudDishes });
    const s = useStore.getState();
    expect(s.categories.length).toBe(1);
    expect(s.menu.length).toBe(1);
  });

  it('detects conflicts when same id differs', () => {
    useStore.setState({ categories: [{ id: 'cat1', name: 'Bebida', sort_order: 1, is_active: true } as any], menu: [] });
    const conflicts = useStore.getState().detectCloudConflicts({
      categories: [{ id: 'cat1', name: 'Bebidas', sort_order: 1, is_active: true } as any],
      dishes: []
    });
    expect(conflicts.categories.length).toBe(1);
  });

  it('resolves conflict preferring cloud', () => {
    useStore.setState({ categories: [{ id: 'cat1', name: 'Local', sort_order: 1, is_active: true } as any], menu: [] });
    useStore.getState().resolveCloudConflict('category', 'cat1', 'cloud', { id: 'cat1', name: 'Cloud', sort_order: 1, is_active: true } as any);
    const s = useStore.getState();
    expect(s.categories[0].name).toBe('Cloud');
  });
});
