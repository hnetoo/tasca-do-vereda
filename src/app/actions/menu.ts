"use server";

import { databaseOperations } from "@/services/database/operations";
import { logger } from "@/services/logger";
import { MenuCategory, Product } from "@/types";

export async function getMenuData(): Promise<{ success: boolean; categories?: MenuCategory[]; products?: Product[]; error?: string }> {
  try {
    const [categories, products] = await Promise.all([
      databaseOperations.getCategories(),
      databaseOperations.getDishes(),
    ]);
    return { success: true, data: { categories, products } };
  } catch (error: any) {
    logger.error('Exception getting menu data via server action', { error: error.message }, 'SERVER_ACTION');
    return { success: false, error: error.message };
  }
}
