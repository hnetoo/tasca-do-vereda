import { describe, it, expect } from 'vitest';
import { isValidImageUrl } from './qrMenuService';
import { Dish, MenuCategory } from '../types';

// Mock Dish and Category for testing logic (simulating the logic in PublicMenu)
const matchesCategoryLogic = (dish: Dish, cat: MenuCategory & { originalId?: string; isModified?: boolean }) => {
    if (!cat) return false;
    
    const dishCatId = String(dish.categoryId || '').trim();
    const catId = String(cat.id || '').trim();
    const catOriginalId = String(cat.originalId || '').trim();
    const catName = String(cat.name || '').trim().toLowerCase();
    const dishCatName = dish.categoryName ? String(dish.categoryName).trim().toLowerCase() : '';

    if (dishCatId && catId && dishCatId === catId) return true;
    if (dishCatId && catOriginalId && dishCatId === catOriginalId) return true;
    
    if (catName) {
        if (dishCatId.toLowerCase() === catName) return true;
        if (dishCatName === catName) return true;
        const catSlug = catName.replace(/\s+/g, '_');
        if (dishCatId.toLowerCase() === catSlug) return true;
    }

    if (!dishCatId || dishCatId === 'undefined' || dishCatId === 'null') {
        if (!catId || catId === 'undefined' || catId === 'null') return true;
    }

    return false;
};

describe('PublicMenu - Image Validation', () => {
  it('should validate base64 images', () => {
    expect(isValidImageUrl('data:image/png;base64,xxxx')).toBe(true);
    expect(isValidImageUrl('data:image/jpeg;base64,xxxx')).toBe(true);
  });

  it('should validate URLs', () => {
    expect(isValidImageUrl('https://example.com/image.png')).toBe(true);
    expect(isValidImageUrl('http://example.com/image.jpg')).toBe(true);
  });

  it('should reject invalid strings', () => {
    expect(isValidImageUrl('')).toBe(false);
    expect(isValidImageUrl('/')).toBe(false);
    expect(isValidImageUrl('null')).toBe(false);
    expect(isValidImageUrl('undefined')).toBe(false);
    expect(isValidImageUrl('Just a name')).toBe(false);
  });
});

describe('PublicMenu - Category Matching Logic', () => {
    it('should match by ID', () => {
        const dish: Dish = { id: 'd1', name: 'Dish 1', description: 'Desc 1', price: 10, categoryId: 'cat123', image: 'img1.jpg', taxCode: 'IVA0' };
        const cat = { id: 'cat123', name: 'Bebidas' };
        expect(matchesCategoryLogic(dish, cat)).toBe(true);
    });

    it('should match by Original ID', () => {
        const dish: Dish = { id: 'd2', name: 'Dish 2', description: 'Desc 2', price: 12, categoryId: 'old-id', image: 'img2.jpg', taxCode: 'IVA0' };
        const cat = { id: 'new-id', originalId: 'old-id', name: 'Bebidas' };
        expect(matchesCategoryLogic(dish, cat)).toBe(true);
    });

    it('should match by Name (fallback)', () => {
        const dish: Dish = { id: 'd3', name: 'Dish 3', description: 'Desc 3', price: 15, categoryId: 'bebidas', image: 'img3.jpg', taxCode: 'IVA0' }; // ID is the name
        const cat = { id: 'cat123', name: 'Bebidas' };
        expect(matchesCategoryLogic(dish, cat)).toBe(true);
    });

    it('should match by CategoryName property (fallback)', () => {
        const dish: Dish = { id: 'd4', name: 'Dish 4', description: 'Desc 4', price: 20, categoryId: 'wrong-id', categoryName: 'Bebidas', image: 'img4.jpg', taxCode: 'IVA0' };
        const cat = { id: 'cat123', name: 'Bebidas' };
        expect(matchesCategoryLogic(dish, cat)).toBe(true);
    });

    it('should match by Slugified Name', () => {
        const dish: Dish = { id: 'd5', name: 'Dish 5', description: 'Desc 5', price: 25, categoryId: 'pratos_principais', image: 'img5.jpg', taxCode: 'IVA0' };
        const cat = { id: 'cat123', name: 'Pratos Principais' };
        expect(matchesCategoryLogic(dish, cat)).toBe(true);
    });
});
