'use server';

import { databaseOperations } from '@/services/database/operations';
import { SystemSettings, Fornecedor, Employee, AttendanceRecord, Dish, MenuCategory, UUID } from '@/types';
import { logger } from '@/services/logger';

export async function saveSettingsAction(settings: SystemSettings) {
  try {
    const result = await databaseOperations.saveSettings(settings);
    if (!result.success) {
      logger.error('Failed to save settings via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception saving settings via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function saveSupplierAction(supplier: Fornecedor) {
  try {
    const result = await databaseOperations.saveSupplier(supplier);
    if (!result.success) {
      logger.error('Failed to save supplier via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception saving supplier via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function saveEmployeesAction(employees: Employee[]) {
  try {
    const result = await databaseOperations.saveEmployees(employees);
    if (!result.success) {
      logger.error('Failed to save employees via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception saving employees via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function deleteEmployeeAction(id: string) {
  try {
    const result = await databaseOperations.deleteEmployee(id);
    if (!result.success) {
      logger.error('Failed to delete employee via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception deleting employee via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function saveAttendanceAction(attendanceRecords: AttendanceRecord[]) {
  try {
    const result = await databaseOperations.saveAttendance(attendanceRecords);
    if (!result.success) {
      logger.error('Failed to save attendance via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception saving attendance via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function saveCategoryAction(category: MenuCategory) {
  try {
    const result = await databaseOperations.saveCategory(category);
    if (!result.success) {
      logger.error('Failed to save category via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception saving category via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function deleteCategoryAction(id: UUID) {
  try {
    const result = await databaseOperations.deleteCategory(id);
    if (!result.success) {
      logger.error('Failed to delete category via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception deleting category via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function saveDishAction(dish: Dish) {
  try {
    const result = await databaseOperations.saveDish(dish);
    if (!result.success) {
      logger.error('Failed to save dish via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception saving dish via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function deleteDishAction(id: UUID) {
  try {
    const result = await databaseOperations.deleteDish(id);
    if (!result.success) {
      logger.error('Failed to delete dish via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception deleting dish via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function getCategoriesAction(): Promise<{ success: boolean; data?: MenuCategory[]; error?: string }> {
  try {
    const categories = await databaseOperations.getCategories();
    return { success: true, data: categories };
  } catch (error: any) {
    logger.error('Exception getting categories via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function getDishesAction(): Promise<{ success: boolean; data?: Dish[]; error?: string }> {
  try {
    const dishes = await databaseOperations.getDishes();
    return { success: true, data: dishes };
  } catch (error: any) {
    logger.error('Exception getting dishes via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function recreateMenuSchemaAction(): Promise<{ success: boolean; error?: string }> {
  try {
    await databaseOperations.recreateMenuSchema();
    return { success: true };
  } catch (error: any) {
    logger.error('Exception recreating menu schema via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function saveCategoriesAction(categories: MenuCategory[]) {
  try {
    const result = await databaseOperations.saveCategories(categories);
    if (!result.success) {
      logger.error('Failed to save categories via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception saving categories via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

export async function saveDishesAction(dishes: Dish[]) {
  try {
    const result = await databaseOperations.saveDishes(dishes);
    if (!result.success) {
      logger.error('Failed to save dishes via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Exception saving dishes via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}

