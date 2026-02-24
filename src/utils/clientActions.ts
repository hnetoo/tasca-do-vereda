/**
 * Utilitário para converter Server Actions em funções client-side compatíveis com Tauri
 * Server Actions não funcionam em builds estáticos do Tauri
 */

import { adminOperations } from "@/services/database/adminOperations";
import { logger } from "@/services/logger";
import { MenuCategory, Product } from "@/types";

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
    logger.error('Error in getMenuDataClient', { error: error.message }, 'CLIENT_ACTION');
    return { success: false, error: error.message };
  }
}
