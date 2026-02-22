'use server';

import { databaseOperations } from '@/services/database/operations';
import { directOperations } from '@/services/database/directOperations';
import { adminOperations } from '@/services/database/adminOperations';
import { SystemSettings, Fornecedor, Employee, AttendanceRecord, Dish, MenuCategory, UUID } from '@/types';
import { logger } from '@/services/logger';
import { createClient } from '@/lib/supabase/server';

export async function saveSettingsAction(settings: SystemSettings): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const supabase = await createClient();
    const result = await databaseOperations.saveSettings(settings, supabase);
    if (!result.success) {
      logger.error('Failed to save settings via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception saving settings via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function saveSupplierAction(supplier: Fornecedor): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const supabase = await createClient();
    const success = await databaseOperations.saveSupplier(supplier, supabase);
    if (!success) {
      logger.error('Failed to save supplier via server action', { error: 'Operation returned false' }, 'SERVER_ACTION');
      return { success: false, error: 'Operation returned false' };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception saving supplier via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function saveEmployeesAction(employees: Employee[]): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const supabase = await createClient();
    const result = await databaseOperations.saveEmployees(employees, supabase);
    if (!result.success) {
      logger.error('Failed to save employees via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception saving employees via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function deleteEmployeeAction(id: string): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const supabase = await createClient();
    const success = await databaseOperations.deleteEmployee(id, supabase);
    if (!success) {
      logger.error('Failed to delete employee via server action', { error: 'Operation returned false' }, 'SERVER_ACTION');
      return { success: false, error: 'Operation returned false' };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception deleting employee via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function saveAttendanceAction(attendanceRecords: AttendanceRecord[]): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const supabase = await createClient();
    const result = await databaseOperations.saveAttendance(attendanceRecords, supabase);
    if (!result.success) {
      logger.error('Failed to save attendance via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception saving attendance via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function saveCategoryAction(category: MenuCategory): Promise<{ success: boolean; error?: { message: string; stack?: string } }> {
  try {
    // Uses admin operations to bypass RLS/Auth issues
    const result = await adminOperations.saveCategory(category);
    if (!result.success) {
      const errorToLog = { message: result.error || 'Operation returned false' };
      logger.error('Failed to save category via server action', { error: errorToLog }, 'SERVER_ACTION');
      return { success: false, error: errorToLog };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorToLog = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
    logger.error('Exception saving category via server action', { error: errorToLog }, 'SERVER_ACTION');
    return { success: false, error: errorToLog };
  }
}

export async function deleteCategoryAction(id: UUID): Promise<{ success: boolean; error?: { message: string; stack?: string } }> {
  try {
    // Uses admin operations to bypass RLS/Auth issues
    const result = await adminOperations.deleteCategory(id);
    if (!result.success) {
      const errorToLog = { message: result.error || 'Operation returned false' };
      logger.error('Failed to delete category via server action', { error: errorToLog }, 'SERVER_ACTION');
      return { success: false, error: errorToLog };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorToLog = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
    logger.error('Exception deleting category via server action', { error: errorToLog }, 'SERVER_ACTION');
    return { success: false, error: errorToLog };
  }
}

export async function saveDishAction(dish: Dish): Promise<{ success: boolean; error?: { message: string; stack?: string } }> {
  try {
    // Uses admin operations to bypass RLS/Auth issues
    const result = await adminOperations.saveDish(dish);
    if (!result.success) {
      const errorToLog = { message: result.error || 'Operation returned false' };
      logger.error('Failed to save dish via server action', { error: errorToLog }, 'SERVER_ACTION');
      return { success: false, error: errorToLog };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorToLog = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
    logger.error('Exception saving dish via server action', { error: errorToLog }, 'SERVER_ACTION');
    return { success: false, error: errorToLog };
  }
}

export async function deleteDishAction(id: UUID): Promise<{ success: boolean; error?: { message: string; stack?: string } }> {
  try {
    // Uses admin operations to bypass RLS/Auth issues
    const result = await adminOperations.deleteDish(id);
    if (!result.success) {
      const errorToLog = { message: result.error || 'Operation returned false' };
      logger.error('Failed to delete dish via server action', { error: errorToLog }, 'SERVER_ACTION');
      return { success: false, error: errorToLog };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorToLog = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
    logger.error('Exception deleting dish via server action', { error: errorToLog }, 'SERVER_ACTION');
    return { success: false, error: errorToLog };
  }
}

export async function getCategoriesAction(): Promise<{ success: boolean; data?: MenuCategory[]; error?: { message: string; stack?: string } }> {
  try {
    const result = await adminOperations.getCategories();
    if (result.success) {
        return { success: true, data: result.data };
    } else {
        return { success: false, error: { message: result.error || 'Unknown error' }, data: [] };
    }
  } catch (error: unknown) {
    const errorToLog = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
    logger.error('Exception fetching categories via server action', { error: errorToLog }, 'SERVER_ACTION');
    return { success: false, error: errorToLog, data: [] };
  }
}

export async function getDishesAction(): Promise<{ success: boolean; data?: Dish[]; error?: { message: string; stack?: string } }> {
  try {
    const result = await adminOperations.getDishes();
    if (result.success) {
        return { success: true, data: result.data };
    } else {
        return { success: false, error: { message: result.error || 'Unknown error' }, data: [] };
    }
  } catch (error: unknown) {
    const errorToLog = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
    logger.error('Exception fetching dishes via server action', { error: errorToLog }, 'SERVER_ACTION');
    return { success: false, error: errorToLog, data: [] };
  }
}

export async function recreateMenuSchemaAction(): Promise<{ success: boolean; error?: { message: string; stack?: string } }> {
  try {
    await databaseOperations.recreateMenuSchema();
    return { success: true };
  } catch (error: unknown) {
    const errorToLog = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
    logger.error('Exception recreating menu schema via server action', { error: errorToLog }, 'SERVER_ACTION');
    return { success: false, error: errorToLog };
  }
}

export async function saveCategoriesAction(categories: MenuCategory[]): Promise<{ success: boolean; error?: { message: string; stack?: string } }> {
  try {
    // Uses admin operations to bypass RLS/Auth issues
    const success = await adminOperations.saveCategories(categories);
    if (!success) {
      const errorToLog = { message: 'Operation returned false' };
      logger.error('Failed to save categories via server action', { error: errorToLog }, 'SERVER_ACTION');
      return { success: false, error: errorToLog };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorToLog = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
    logger.error('Exception saving categories via server action', { error: errorToLog }, 'SERVER_ACTION');
    return { success: false, error: errorToLog };
  }
}

export async function saveDishesAction(dishes: Dish[]): Promise<{ success: boolean; error?: { message: string; stack?: string } }> {
  try {
    // Uses admin operations to bypass RLS/Auth issues
    const success = await adminOperations.saveDishes(dishes);
    if (!success) {
      const errorToLog = { message: 'Operation returned false' };
      logger.error('Failed to save dishes via server action', { error: errorToLog }, 'SERVER_ACTION');
      return { success: false, error: errorToLog };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorToLog = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
    logger.error('Exception saving dishes via server action', { error: errorToLog }, 'SERVER_ACTION');
    return { success: false, error: errorToLog };
  }
}

