

'use server';

import { adminOperations } from "@/services/database/adminOperations";
import { logger } from "@/services/logger";
import { MenuCategory, Product } from "@/types";

export async function getMenuData(): Promise<{ success: boolean; categories?: MenuCategory[]; dishes?: Product[]; error?: string }> {
  try {
    // Optimization removed for stability - running on every fetch is dangerous
    // await databaseOperations.applyDatabaseOptimizations();

    // Use admin operations to bypass RLS
    const [categoriesResult, dishesResult] = await Promise.all([
      adminOperations.getCategories(),
      adminOperations.getDishes(),
    ]);

    if (!categoriesResult.success || !dishesResult.success) {
      const error = categoriesResult.error || dishesResult.error || 'Unknown error fetching menu data';
      logger.error('Error fetching menu data', { error }, 'SERVER_ACTION');
      return { success: false, error };
    }

    return { 
      success: true, 
      categories: categoriesResult.data, 
      dishes: dishesResult.data 
    };
  } catch (error: any) {
    logger.error('Exception getting menu data via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}
