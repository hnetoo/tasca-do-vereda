import { databaseOperations } from './operations';
import * as connectionModule from './connection';
import { Database } from '@/types/database';
import { MenuCategory, Dish } from '@/types';

// Mock do logger para evitar poluir a saída do teste
jest.mock('@/services/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('./connection', () => {
  return {
    supabase: Promise.resolve({
      from: jest.fn(),
    }),
  };
});

let mockFrom: jest.Mock;
let mockSelect: jest.Mock;
let mockOrder: jest.Mock;
let mockUpsert: jest.Mock;
let mockEq: jest.Mock;
let mockDelete: jest.Mock;

describe('Database Operations', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    const supabase = await connectionModule.supabase;
    mockFrom = supabase.from as jest.Mock;

    // Reset the mocks for each test
    mockOrder = jest.fn();
    mockSelect = jest.fn();
    mockUpsert = jest.fn();
    mockEq = jest.fn();
    mockDelete = jest.fn();

    // Configure the chaining for mockFrom
    mockFrom.mockImplementation(() => ({
      select: mockSelect.mockImplementation(() => ({
        order: mockOrder,
      })),
      upsert: mockUpsert,
      eq: mockEq,
      delete: mockDelete.mockImplementation(() => ({
        eq: mockEq,
      })),
    }));
  });

  it('should fetch menu categories ordered by sort_order ascending', async () => {
    const mockDbCategories = [{ 
      id: '1', 
      name: 'Category 1', 
      sort_order: 1, 
      is_active: true, 
      parent_id: null, 
      is_available_on_digital_menu: true 
    }];
    
    // The mock chain returns { data, error }
    mockOrder.mockResolvedValueOnce({ data: mockDbCategories, error: null });

    const result = await databaseOperations.getCategories();

    expect(mockFrom).toHaveBeenCalledWith('menu_categories');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockOrder).toHaveBeenCalledWith('sort_order', { ascending: true });
    
    // Verify the transformation
    expect(result.success).toBe(true);
    expect(result.data).toEqual([{
      id: '1',
      name: 'Category 1',
      sortOrder: 1,
      isActive: true,
      parentId: null,
      isAvailableOnDigitalMenu: true,
      icon: undefined
    }]);
  });

  it('should save a menu category successfully', async () => {
    const mockCategory: MenuCategory = {
      id: '1',
      name: 'New Category',
      sortOrder: 2,
      isActive: true,
      parentId: null,
      isAvailableOnDigitalMenu: true
    };

    mockUpsert.mockResolvedValueOnce({ error: null });

    const result = await databaseOperations.saveCategory(mockCategory);

    expect(mockFrom).toHaveBeenCalledWith('menu_categories');
    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
      id: '1',
      name: 'New Category',
      sort_order: 2,
      is_active: true,
      parent_id: null,
      is_available_on_digital_menu: true
    }));
    expect(result.success).toBe(true);
  });

  it('should delete a menu category successfully', async () => {
    mockEq.mockResolvedValueOnce({ error: null });

    const result = await databaseOperations.deleteCategory('1');

    expect(mockFrom).toHaveBeenCalledWith('menu_categories');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', '1');
    expect(result.success).toBe(true);
  });

  it('should fetch dishes successfully', async () => {
    const mockDbDishes = [{
      id: '1',
      name: 'Dish 1',
      price: 10,
      is_active: true,
      available: true
    }];

    mockSelect.mockResolvedValueOnce({ data: mockDbDishes, error: null });

    const result = await databaseOperations.getDishes();

    expect(mockFrom).toHaveBeenCalledWith('dishes');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(result.success).toBe(true);
    expect(result.data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: '1',
        name: 'Dish 1',
        price: 10,
        isActive: true,
        available: true
      })
    ]));
  });

  it('should save a dish successfully', async () => {
    const mockDish: Dish = {
      id: '1',
      name: 'New Dish',
      price: 15,
      isActive: true,
      available: true,
      categoryId: 'cat1',
      description: 'Test Dish',
      costPrice: 5,
      stockQuantity: 10,
      minStockQuantity: 2,
      trackStock: true
    };

    mockUpsert.mockResolvedValueOnce({ error: null });

    const result = await databaseOperations.saveDish(mockDish);

    expect(mockFrom).toHaveBeenCalledWith('dishes');
    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
      id: '1',
      name: 'New Dish',
      price: 15,
      is_active: true,
      available: true,
      category_id: 'cat1',
      description: 'Test Dish',
      cost_price: 5,
      stock_quantity: 10,
      min_stock_quantity: 2,
      track_stock: true
    }));
    expect(result.success).toBe(true);
  });

  it('should delete a dish successfully', async () => {
    mockEq.mockResolvedValueOnce({ error: null });

    const result = await databaseOperations.deleteDish('1');

    expect(mockFrom).toHaveBeenCalledWith('dishes');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', '1');
    expect(result.success).toBe(true);
  });

  it('should handle errors gracefully when saving a category', async () => {
    const mockCategory: MenuCategory = {
      id: '1',
      name: 'Error Category',
      sortOrder: 1,
      isActive: true,
      parentId: null,
      isAvailableOnDigitalMenu: true
    };

    const mockError = { message: 'duplicate key value violates unique constraint', code: '23505' };
    // Supabase client throws error if { error } is returned and we check for it?
    // Wait, in saveCategory implementation:
    // const { error } = await supabase...
    // if (error) throw error;
    
    // So mockUpsert should return { error: mockError }
    mockUpsert.mockResolvedValueOnce({ error: mockError });

    const result = await databaseOperations.saveCategory(mockCategory);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Este registo já existe no sistema.');
  });
});