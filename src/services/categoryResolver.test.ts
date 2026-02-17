import { describe, it, expect } from 'vitest';
import { resolveCategoryId, validateDishCategory } from './categoryResolver';
import { MenuCategory, Dish } from '../types';

describe('Category Resolver', () => {
  const cats = [
    { id: 'cat_entradas', name: 'Entradas' },
    { id: 'cat_fast_food', name: 'Fast Food' },
  ] as MenuCategory[];

  it('resolves by exact id', () => {
    const d = { category_id: 'cat_entradas' } as Dish;
    expect(resolveCategoryId(d, cats)).toBe('cat_entradas');
  });

  it('resolves by name in dish.categoryName', () => {
    const d = { category_id: 'wrong', categoryName: 'Fast Food' } as Dish;
    expect(resolveCategoryId(d, cats)).toBe('cat_fast_food');
  });

  it('resolves by slug', () => {
    const d = { category_id: 'fast_food' } as Dish;
    expect(resolveCategoryId(d, cats)).toBe('cat_fast_food');
  });

  it('validate returns false if not found', () => {
    const d = { category_id: 'unknown' } as Dish;
    const res = validateDishCategory(d, cats);
    expect(res.valid).toBe(false);
    expect(res.reason).toBeDefined();
  });
});

