import { ensureSqliteSchema, getSQLiteClient } from '@/lib/sqlite';
import { logger } from '@/services/logger';
import { MenuCategory, Dish } from '@/types';

export const sqliteOperations = {
  async getCategories(): Promise<{ success: boolean; data: MenuCategory[]; error?: string }> {
    try {
      await ensureSqliteSchema();
      const db = getSQLiteClient();
      const res = await db.execute(`SELECT * FROM menu_categories ORDER BY sort_order ASC`);
      const rows = res.rows as any[];
      const mapped: MenuCategory[] = rows.map((r) => {
        const parentId = (r.parent_id as string) || undefined;
        const icon = (r.icon as string) || undefined;
        return {
          id: String(r.id),
          name: r.name as string,
          icon,
          sortOrder: Number(r.sort_order ?? 0),
          isActive: Number(r.is_active ?? 1) === 1,
          parentId,
          isAvailableOnDigitalMenu: Number(r.is_available_on_digital_menu ?? 1) === 1,
        };
      });
      return { success: true, data: mapped };
    } catch (e: unknown) {
      const err = e as Error;
      logger.error('SQLite getCategories failed', { error: err.message }, 'DATABASE_SQLITE');
      return { success: false, data: [], error: err.message };
    }
  },

  async saveCategory(category: MenuCategory): Promise<{ success: boolean; error?: string }> {
    try {
      await ensureSqliteSchema();
      const db = getSQLiteClient();
      const now = new Date().toISOString();
      await db.execute({
        sql: `
          INSERT INTO menu_categories (id, name, icon, sort_order, is_active, parent_id, is_available_on_digital_menu, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name=excluded.name,
            icon=excluded.icon,
            sort_order=excluded.sort_order,
            is_active=excluded.is_active,
            parent_id=excluded.parent_id,
            is_available_on_digital_menu=excluded.is_available_on_digital_menu,
            updated_at=excluded.updated_at
        `,
        args: [
          category.id,
          category.name,
          category.icon || null,
          category.sortOrder || 0,
          category.isActive !== false ? 1 : 0,
          category.parentId || null,
          category.isAvailableOnDigitalMenu !== false ? 1 : 0,
          now,
        ],
      });
      return { success: true };
    } catch (e: unknown) {
      const err = e as Error;
      logger.error('SQLite saveCategory failed', { error: err.message }, 'DATABASE_SQLITE');
      return { success: false, error: err.message };
    }
  },

  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await ensureSqliteSchema();
      const db = getSQLiteClient();
      await db.execute({ sql: `DELETE FROM menu_categories WHERE id = ?`, args: [id] });
      return { success: true };
    } catch (e: unknown) {
      const err = e as Error;
      logger.error('SQLite deleteCategory failed', { error: err.message }, 'DATABASE_SQLITE');
      return { success: false, error: err.message };
    }
  },

  async getDishes(): Promise<{ success: boolean; data: Dish[]; error?: string }> {
    try {
      await ensureSqliteSchema();
      const db = getSQLiteClient();
      const res = await db.execute(`SELECT * FROM dishes`);
      const rows = res.rows as any[];
      const mapped: Dish[] = rows.map((r) => {
        const imageUrl = (r.image_url as string) || undefined;
        const categoryId = (r.category_id as string) || undefined;
        const supplierId = (r.supplier_id as string) || undefined;
        const description = (r.description as string) || undefined;
        return {
          id: String(r.id),
          name: r.name as string,
          description,
          price: Number(r.price),
          costPrice: Number(r.cost_price ?? 0),
          categoryId,
          imageUrl,
          taxCode: (r.tax_code as string) || undefined,
          taxPercentage: r.tax_percentage != null ? Number(r.tax_percentage) : undefined,
          preparationTime: r.preparation_time != null ? Number(r.preparation_time) : undefined,
          isActive: Number(r.is_active ?? 1) === 1,
          available: Number(r.available ?? 1) === 1,
          isAvailableOnDigitalMenu: Number(r.is_available_on_digital_menu ?? 1) === 1,
          trackStock: Number(r.track_stock ?? 0) === 1,
          stockQuantity: Number(r.stock_quantity ?? 0),
          minStockQuantity: Number(r.min_stock_quantity ?? 0),
          maxStockQuantity: r.max_stock_quantity != null ? Number(r.max_stock_quantity) : undefined,
          unit: (r.unit as string) || 'unidade',
          supplierId,
        };
      });
      return { success: true, data: mapped };
    } catch (e: unknown) {
      const err = e as Error;
      logger.error('SQLite getDishes failed', { error: err.message }, 'DATABASE_SQLITE');
      return { success: false, data: [], error: err.message };
    }
  },

  async saveDish(dish: Dish): Promise<{ success: boolean; error?: string }> {
    try {
      await ensureSqliteSchema();
      const db = getSQLiteClient();
      const now = new Date().toISOString();
      await db.execute({
        sql: `
          INSERT INTO dishes (
            id, name, description, price, cost_price, category_id, image_url,
            tax_code, tax_percentage, preparation_time, is_active, available,
            is_available_on_digital_menu, track_stock, stock_quantity, min_stock_quantity,
            max_stock_quantity, unit, supplier_id, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name=excluded.name,
            description=excluded.description,
            price=excluded.price,
            cost_price=excluded.cost_price,
            category_id=excluded.category_id,
            image_url=excluded.image_url,
            tax_code=excluded.tax_code,
            tax_percentage=excluded.tax_percentage,
            preparation_time=excluded.preparation_time,
            is_active=excluded.is_active,
            available=excluded.available,
            is_available_on_digital_menu=excluded.is_available_on_digital_menu,
            track_stock=excluded.track_stock,
            stock_quantity=excluded.stock_quantity,
            min_stock_quantity=excluded.min_stock_quantity,
            max_stock_quantity=excluded.max_stock_quantity,
            unit=excluded.unit,
            supplier_id=excluded.supplier_id,
            updated_at=excluded.updated_at
        `,
        args: [
          dish.id,
          dish.name,
          dish.description || null,
          dish.price,
          dish.costPrice || 0,
          dish.categoryId || null,
          dish.imageUrl || null,
          dish.taxCode || null,
          dish.taxPercentage ?? null,
          dish.preparationTime ?? null,
          dish.isActive !== false ? 1 : 0,
          dish.available !== false ? 1 : 0,
          dish.isAvailableOnDigitalMenu !== false ? 1 : 0,
          dish.trackStock ? 1 : 0,
          dish.stockQuantity || 0,
          dish.minStockQuantity || 0,
          dish.maxStockQuantity ?? null,
          dish.unit || 'unidade',
          dish.supplierId || null,
          now,
        ],
      });
      return { success: true };
    } catch (e: unknown) {
      const err = e as Error;
      logger.error('SQLite saveDish failed', { error: err.message }, 'DATABASE_SQLITE');
      return { success: false, error: err.message };
    }
  },

  async deleteDish(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await ensureSqliteSchema();
      const db = getSQLiteClient();
      await db.execute({ sql: `DELETE FROM dishes WHERE id = ?`, args: [id] });
      return { success: true };
    } catch (e: unknown) {
      const err = e as Error;
      logger.error('SQLite deleteDish failed', { error: err.message }, 'DATABASE_SQLITE');
      return { success: false, error: err.message };
    }
  },
};
