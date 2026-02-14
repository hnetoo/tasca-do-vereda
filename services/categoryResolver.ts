import { Dish, MenuCategory } from "../types";

const norm = (s?: string) => String(s || "").trim().toLowerCase();
const slug = (s?: string) => norm(s).replace(/\s+/g, "_");

export const resolveCategoryId = (dish: Dish, categories: MenuCategory[]): string | null => {
  const byId = categories.find(c => norm(dish.categoryId) === norm(c.id));
  if (byId) return byId.id;

  const byNameFromDish = categories.find(c => norm((dish as unknown as { categoryName?: string }).categoryName) === norm(c.name));
  if (byNameFromDish) return byNameFromDish.id;

  const byNameFromId = categories.find(c => norm(c.name) === norm(dish.categoryId));
  if (byNameFromId) return byNameFromId.id;

  const bySlug = categories.find(c => slug(c.name) === norm(dish.categoryId));
  if (bySlug) return bySlug.id;

  return null;
};

export const validateDishCategory = (
  dish: Dish,
  categories: MenuCategory[]
): { valid: boolean; resolvedId?: string; reason?: string } => {
  const resolved = resolveCategoryId(dish, categories);
  if (resolved) return { valid: true, resolvedId: resolved };
  return { valid: false, reason: "Categoria inválida para o produto." };
};

