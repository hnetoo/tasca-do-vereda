import { Product, MenuCategory } from "../types";

const norm = (s?: string) => String(s || "").trim().toLowerCase();
const slug = (s?: string) => norm(s).replace(/\s+/g, "_");

export const resolveCategoryId = (product: Product, categories: MenuCategory[]): string | null => {
  const byId = categories.find(c => norm(product.category_id) === norm(c.id));
  if (byId) return byId.id;

  const byNameFromProduct = categories.find(c => norm((product as unknown as { categoryName?: string }).categoryName) === norm(c.name));
  if (byNameFromProduct) return byNameFromProduct.id;

  const byNameFromId = categories.find(c => norm(c.name) === norm(product.category_id));
  if (byNameFromId) return byNameFromId.id;

  const bySlug = categories.find(c => slug(c.name) === norm(product.category_id));
  if (bySlug) return bySlug.id;

  return null;
};

export const validateProductCategory = (
  product: Product,
  categories: MenuCategory[]
): { valid: boolean; resolvedId?: string; reason?: string } => {
  const resolved = resolveCategoryId(product, categories);
  if (resolved) return { valid: true, resolvedId: resolved };
  return { valid: false, reason: "Categoria inválida para o produto." };
};

