'use server';

import { databaseOperations } from '@/services/database/operations';
import { adminOperations } from '@/services/database/adminOperations';
import { SystemSettings, Fornecedor, Employee, AttendanceRecord, Dish, MenuCategory, UUID } from '@/types';
import { logger } from '@/services/logger';
import { createClient } from '@/lib/supabase/client';
import { sqliteOperations } from '@/services/database/sqliteOperations';
import { getStoredDatabaseConfig, saveStoredDatabaseConfig, DatabaseConfig, getCategories, getFinancialTransactions, saveSettings, saveSupplier } from '@/lib/config-manager';

export async function saveSettingsAction(settings: SystemSettings): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const cfg = await getStoredDatabaseConfig();
    if (cfg.type === 'sqlite') {
      const res = await saveSettings(settings);
      if (res.success) {
        return { success: true };
      }
      return { success: false, error: res.error || 'SQLite operation failed' };
    }
    
    // Fallback para Supabase se não for SQLite
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
    const cfg = await getStoredDatabaseConfig();
    if (cfg.type === 'sqlite') {
      const res = await saveSupplier(supplier);
      if (res.success) {
        return { success: true };
      }
      return { success: false, error: res.error || 'SQLite operation failed' };
    }
    
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
    console.log('🔧 saveCategoryAction: Iniciando...', { categoryId: category.id, name: category.name });
    
    const cfg = await getStoredDatabaseConfig();
    console.log('🔧 saveCategoryAction: Config DB:', cfg);
    
    if (cfg.type === 'sqlite') {
      console.log('🔧 saveCategoryAction: Usando SQLite...');
      const res = await sqliteOperations.saveCategory(category);
      console.log('🔧 saveCategoryAction: Resultado SQLite:', res);
      
      if (res.success) {
        console.log('✅ saveCategoryAction: Sucesso SQLite');
        // Best-effort cloud sync to Supabase if configured
        try { await adminOperations.saveCategory(category); } catch (_) {}
        return { success: true };
      }
      console.error('❌ saveCategoryAction: Falha SQLite:', res.error);
      return { success: false, error: { message: res.error || 'SQLite operation failed' } };
    }
    
    console.log('🔧 saveCategoryAction: Usando Supabase (não SQLite)...');
    const result = await adminOperations.saveCategory(category);
    if (result.success) {
      return { success: true };
    }

    logger.warn('Admin saveCategory failed', { error: result.error, categoryId: category.id }, 'SERVER_ACTION');
    return { success: false, error: result.error ? { message: result.error } : undefined };
  } catch (error: unknown) {
    const errorToLog = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
    console.error('❌ saveCategoryAction: Exceção:', errorToLog);
    logger.error('Exception saving category via server action', { error: errorToLog, categoryId: category.id }, 'SERVER_ACTION');
    return { success: false, error: errorToLog };
  }
}

export async function deleteCategoryAction(id: UUID): Promise<{ success: boolean; error?: { message: string; stack?: string } }> {
  try {
    const cfg = await getStoredDatabaseConfig();
    if (cfg.type === 'sqlite') {
      const res = await sqliteOperations.deleteCategory(id);
      if (res.success) {
        // Best-effort cloud sync delete
        try { await adminOperations.deleteCategory(id as string); } catch (_) {}
        return { success: true };
      }
      return { success: false, error: { message: res.error || 'SQLite operation failed' } };
    }
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
    console.log('🔧 saveDishAction: Iniciando...', { dishId: dish.id, name: dish.name });
    
    const cfg = await getStoredDatabaseConfig();
    console.log('🔧 saveDishAction: Config DB:', cfg);
    
    if (cfg.type === 'sqlite') {
      console.log('🔧 saveDishAction: Usando SQLite...');
      const res = await sqliteOperations.saveDish(dish);
      console.log('🔧 saveDishAction: Resultado SQLite:', res);
      
      if (res.success) {
        console.log('✅ saveDishAction: Sucesso SQLite');
        // Best-effort cloud sync to Supabase if configured
        try { await adminOperations.saveDish(dish); } catch (_) {}
        return { success: true };
      }
      console.error('❌ saveDishAction: Falha SQLite:', res.error);
      return { success: false, error: { message: res.error || 'SQLite operation failed' } };
    }
    
    console.log('🔧 saveDishAction: Usando Supabase (não SQLite)...');
    // 1. Try admin operations (Supabase Service Role)
    const result = await adminOperations.saveDish(dish);
    if (result.success) {
      return { success: true };
    }

    logger.warn('Admin saveDish failed', { error: result.error, dishId: dish.id }, 'SERVER_ACTION');
    return { success: false, error: result.error ? { message: result.error } : undefined };
  } catch (error: unknown) {
    const errorToLog = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
    console.error('❌ saveDishAction: Exceção:', errorToLog);
    logger.error('Exception saving dish via server action', { error: errorToLog }, 'SERVER_ACTION');
    return { success: false, error: errorToLog };
  }
}

export async function deleteDishAction(id: UUID): Promise<{ success: boolean; error?: { message: string; stack?: string } }> {
  try {
    const cfg = await getStoredDatabaseConfig();
    if (cfg.type === 'sqlite') {
      const res = await sqliteOperations.deleteDish(id as string);
      if (res.success) {
        // Best-effort cloud sync delete
        try { await adminOperations.deleteDish(id as string); } catch (_) {}
        return { success: true };
      }
      return { success: false, error: { message: res.error || 'SQLite operation failed' } };
    }
    const result = await adminOperations.deleteDish(id);
    if (result.success) {
      return { success: true };
    }

    logger.warn('Admin deleteDish failed', { error: result.error }, 'SERVER_ACTION');
    return { success: false, error: result.error ? { message: result.error } : undefined };
  } catch (error: unknown) {
    const errorToLog = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
    logger.error('Exception deleting dish via server action', { error: errorToLog }, 'SERVER_ACTION');
    return { success: false, error: errorToLog };
  }
}

export async function getCategoriesAction(): Promise<{ success: boolean; data?: MenuCategory[]; error?: { message: string; stack?: string } }> {
  try {
    const cfg = await getStoredDatabaseConfig();
    if (cfg.type === 'sqlite') {
      const res = await sqliteOperations.getCategories();
      if (res.success) return { success: true, data: res.data };
      return { success: false, data: [], error: { message: res.error || 'SQLite operation failed' } };
    }
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
    const cfg = await getStoredDatabaseConfig();
    if (cfg.type === 'sqlite') {
      const res = await sqliteOperations.getDishes();
      if (res.success) return { success: true, data: res.data };
      return { success: false, data: [], error: { message: res.error || 'SQLite operation failed' } };
    }
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
    // 1. Try admin operations (Supabase Service Role)
    const result = await adminOperations.saveCategories(categories);
    if (result) {
      return { success: true };
    }

    logger.warn('Admin saveCategories failed', undefined, 'SERVER_ACTION');
    return { success: false, error: { message: 'Admin operation failed' } };
  } catch (error: unknown) {
    const errorToLog = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
    logger.error('Exception saving categories via server action', { error: errorToLog }, 'SERVER_ACTION');
    return { success: false, error: errorToLog };
  }
}

export async function saveDishesAction(dishes: Dish[]): Promise<{ success: boolean; error?: { message: string; stack?: string } }> {
  try {
    // 1. Try admin operations (Supabase Service Role)
    const success = await adminOperations.saveDishes(dishes);
    if (success) {
      return { success: true };
    }

    logger.warn('Admin saveDishes failed', undefined, 'SERVER_ACTION');
    return { success: false, error: { message: 'Admin operation failed' } };
  } catch (error: unknown) {
    const errorToLog = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
    logger.error('Exception saving dishes via server action', { error: errorToLog }, 'SERVER_ACTION');
    return { success: false, error: errorToLog };
  }
}

