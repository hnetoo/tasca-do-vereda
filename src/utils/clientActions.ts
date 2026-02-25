/**
 * Utilitário para converter Server Actions em funções client-side compatíveis com Tauri
 * Server Actions não funcionam em builds estáticos do Tauri
 */

import { adminOperations } from "@/services/database/adminOperations";
import { databaseOperations } from '@/services/database/operations';
import { logger } from "@/services/logger";
import { MenuCategory, Product, SystemSettings, Fornecedor, Employee } from "@/types";
import { supabaseService } from '@/services/supabaseService';

// Função client-side para substituir getMenuData Server Action
export async function getMenuDataClient(): Promise<{ success: boolean; categories?: MenuCategory[]; dishes?: Product[]; error?: string }> {
  try {
    // Use admin operations para bypass RLS
    const [categoriesResult, dishesResult] = await Promise.all([
      adminOperations.getCategories(),
      adminOperations.getDishes(),
    ]);

    if (!categoriesResult.success || !dishesResult.success) {
      const error = categoriesResult.error || dishesResult.error || 'Unknown error fetching menu data';
      logger.error('Error fetching menu data', { error }, 'CLIENT_ACTION');
      return { success: false, error };
    }

    return { 
      success: true, 
      categories: categoriesResult.data, 
      dishes: dishesResult.data 
    };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception fetching menu data via client action', { error: errorMessage }, 'CLIENT_ACTION');
    return { success: false, error: errorMessage };
  }
}

// Client-side Settings Actions
export async function saveSettingsAction(settings: SystemSettings): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const supabase = supabaseService.getClient();
    const result = await databaseOperations.saveSettings(settings, supabase);
    if (!result.success) {
      logger.error('Failed to save settings via client action', { error: result.error }, 'CLIENT_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception saving settings via client action', { error: errorMessage }, 'CLIENT_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function saveSupplierAction(supplier: Fornecedor): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const supabase = supabaseService.getClient();
    const success = await databaseOperations.saveSupplier(supplier, supabase);
    if (!success) {
      logger.error('Failed to save supplier via client action', { error: 'Operation returned false' }, 'CLIENT_ACTION');
      return { success: false, error: 'Operation returned false' };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception saving supplier via client action', { error: errorMessage }, 'CLIENT_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function saveEmployeesAction(employees: Employee[]): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const supabase = supabaseService.getClient();
    const result = await databaseOperations.saveEmployees(employees, supabase);
    if (!result.success) {
      logger.error('Failed to save employees via client action', { error: result.error }, 'CLIENT_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception saving employees via client action', { error: errorMessage }, 'CLIENT_ACTION');
    return { success: false, error: errorMessage };
  }
}

// Client-side Menu Actions
export async function saveMenuAction(dishes: Product[], categories: MenuCategory[]): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const supabase = supabaseService.getClient();
    const result = await databaseOperations.saveMenu(dishes, categories, supabase);
    if (!result.success) {
      logger.error('Failed to save menu via client action', { error: result.error }, 'CLIENT_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception saving menu via client action', { error: errorMessage }, 'CLIENT_ACTION');
    return { success: false, error: errorMessage };
  }
}

// Client-side Auth Actions
export async function loginAction(email: string, password: string): Promise<{ success: boolean; error?: string; user?: any }> {
  try {
    const supabase = supabaseService.getClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('Login failed via client action', { error: error.message }, 'CLIENT_ACTION');
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception during login via client action', { error: errorMessage }, 'CLIENT_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function logoutAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = supabaseService.getClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Logout failed via client action', { error: error.message }, 'CLIENT_ACTION');
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception during logout via client action', { error: errorMessage }, 'CLIENT_ACTION');
    return { success: false, error: errorMessage };
  }
}

// Client-side User Actions
export async function saveUsersAction(users: any[]): Promise<{ success: boolean; error?: string | Error }> {
  try {
    const supabase = supabaseService.getClient();
    const result = await databaseOperations.saveUsers(users, supabase);
    if (!result.success) {
      logger.error('Failed to save users via client action', { error: result.error }, 'CLIENT_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception saving users via client action', { error: errorMessage }, 'CLIENT_ACTION');
    return { success: false, error: errorMessage };
  }
}
