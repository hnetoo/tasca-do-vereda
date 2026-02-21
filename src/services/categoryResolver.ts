import { Dish, MenuCategory, Product } from "../types";
import { logger } from "./logger";

const norm = (s?: string | null) => String(s || "").trim().toLowerCase();
const slug = (s?: string | null) => norm(s).replace(/\s+/g, "_");

const levenshtein = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
};

/**
 * Resolves a category ID for a dish by checking various properties.
 */
export const resolveCategoryId = (dish: Dish | Product, categories: MenuCategory[]): string | null => {
  const catId = (dish as any).category_id || (dish as any).categoryId;
  
  // 1. Direct ID match
  const byId = categories.find(c => norm(catId) === norm(c.id));
  if (byId) return byId.id;

  // 2. By Category Name in Dish
  const byNameFromDish = categories.find(c => norm((dish as any).categoryName) === norm(c.name));
  if (byNameFromDish) return byNameFromDish.id;

  // 3. By ID acting as Name
  const byNameFromId = categories.find(c => norm(c.name) === norm(catId));
  if (byNameFromId) return byNameFromId.id;

  // 4. By Slug
  const bySlug = categories.find(c => slug(c.name) === norm(catId));
  if (bySlug) return bySlug.id;

  // 5. Fuzzy Match (Levenshtein)
  const target = norm(catId) || norm((dish as any).categoryName);
  if (target && target.length > 3) {
      let bestMatch: MenuCategory | null = null;
      let minDistance = 4; // Threshold (< 4 means max 3 edits)

      for (const cat of categories) {
          const dist = levenshtein(target, norm(cat.name));
          if (dist < minDistance) {
              minDistance = dist;
              bestMatch = cat;
          }
      }
      if (bestMatch) return bestMatch.id;
  }

  return null;
};

/**
 * Validates if a dish has a valid category.
 */
export const validateDishCategory = (
  dish: Dish | Product,
  categories: MenuCategory[]
): { valid: boolean; resolvedId?: string; reason?: string } => {
  const resolved = resolveCategoryId(dish, categories);
  if (resolved) return { valid: true, resolvedId: resolved };
  return { valid: false, reason: "Categoria inválida para o prato." };
};

export interface MenuConsistencyReport {
  totalProducts: number;
  invalidProducts: number;
  fixedProducts: number;
  orphanedProducts: Product[];
  missingCategories: string[];
}

/**
 * Analyzes and attempts to fix menu consistency issues.
 * Returns a report and the fixed menu.
 */
export const analyzeAndFixMenu = (
  menu: Product[],
  categories: MenuCategory[]
): { report: MenuConsistencyReport; fixedMenu: Product[] } => {
  const report: MenuConsistencyReport = {
    totalProducts: menu.length,
    invalidProducts: 0,
    fixedProducts: 0,
    orphanedProducts: [],
    missingCategories: []
  };

  const validCategoryIds = new Set(categories.map(c => c.id));
  const fixedMenu = menu.map(product => {
    const currentCatId = (product as any).categoryId || (product as any).category_id;
    
    // Check if valid
    if (currentCatId && validCategoryIds.has(currentCatId)) {
      return { ...product, categoryId: currentCatId };
    }

    // Attempt resolution
    report.invalidProducts++;
    const resolvedId = resolveCategoryId(product, categories);
    
    if (resolvedId) {
      report.fixedProducts++;
      return { ...product, categoryId: resolvedId, category_id: undefined };
    }

    // Default to 'uncategorized' if it exists, otherwise mark as orphaned
    if (validCategoryIds.has('uncategorized')) {
        report.fixedProducts++;
        return { ...product, categoryId: 'uncategorized', category_id: undefined };
    }

    report.orphanedProducts.push(product);
    if (currentCatId) report.missingCategories.push(currentCatId);
    
    return product;
  });

  // Log findings
  if (report.invalidProducts > 0) {
    logger.warn(`Menu Consistency: Found ${report.invalidProducts} invalid products. Fixed: ${report.fixedProducts}.`, report, 'DATA_INTEGRITY');
  }

  return { report, fixedMenu };
};
