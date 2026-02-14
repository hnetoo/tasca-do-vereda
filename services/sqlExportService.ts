
import { MenuCategory, Dish, SystemSettings } from '../types';
import { logger } from './logger';

export const generateSQLSchema = (
  categories: MenuCategory[], 
  dishes: Dish[], 
  settings: SystemSettings
): string => {
  try {
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  
  let sql = `-- Database Schema Export for ${settings.restaurantName}\n`;
  sql += `-- Generated at: ${timestamp}\n\n`;

  // 1. Create Tables
  sql += `-- Table: settings\n`;
  sql += `CREATE TABLE IF NOT EXISTS settings (\n`;
  sql += `  id INT PRIMARY KEY AUTO_INCREMENT,\n`;
  sql += `  restaurant_name VARCHAR(255),\n`;
  sql += `  nif VARCHAR(50),\n`;
  sql += `  address TEXT,\n`;
  sql += `  phone VARCHAR(50),\n`;
  sql += `  email VARCHAR(100),\n`;
  sql += `  currency VARCHAR(10),\n`;
  sql += `  tax_rate DECIMAL(5,2),\n`;
  sql += `  kds_enabled BOOLEAN DEFAULT FALSE,\n`;
  sql += `  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n`;
  sql += `);\n\n`;

  sql += `-- Table: menu_categories\n`;
  sql += `CREATE TABLE IF NOT EXISTS menu_categories (\n`;
  sql += `  id VARCHAR(36) PRIMARY KEY,\n`;
  sql += `  name VARCHAR(100) NOT NULL,\n`;
  sql += `  icon TEXT,\n`;
  sql += `  sort_order INT DEFAULT 0,\n`;
  sql += `  is_active BOOLEAN DEFAULT TRUE\n`;
  sql += `);\n\n`;

  sql += `-- Table: dishes\n`;
  sql += `CREATE TABLE IF NOT EXISTS dishes (\n`;
  sql += `  id VARCHAR(36) PRIMARY KEY,\n`;
  sql += `  category_id VARCHAR(36),\n`;
  sql += `  name VARCHAR(255) NOT NULL,\n`;
  sql += `  price DECIMAL(10,2) NOT NULL,\n`;
  sql += `  description TEXT,\n`;
  sql += `  image_url TEXT,\n`;
  sql += `  is_available BOOLEAN DEFAULT TRUE,\n`;
  sql += `  is_available_on_digital_menu BOOLEAN DEFAULT TRUE,\n`;
  sql += `  tax_percentage DECIMAL(5,2),\n`;
  sql += `  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE SET NULL\n`;
  sql += `);\n\n`;

  // 2. Insert Data
  
  // Settings
  sql += `-- Data: settings\n`;
  sql += `INSERT INTO settings (restaurant_name, nif, address, phone, email, currency, tax_rate, kds_enabled) VALUES (\n`;
  sql += `  '${escapeSQL(settings.restaurantName)}',\n`;
  sql += `  '${escapeSQL(settings.nif || '')}',\n`;
  sql += `  '${escapeSQL(settings.address || '')}',\n`;
  sql += `  '${escapeSQL(settings.phone || '')}',\n`;
  sql += `  '${escapeSQL(settings.email || '')}',\n`;
  sql += `  '${escapeSQL(settings.currency || 'Kz')}',\n`;
  sql += `  ${settings.taxRate || 14},\n`;
  sql += `  ${settings.kdsEnabled ? 1 : 0}\n`;
  sql += `);\n\n`;

  // Categories
  if (categories.length > 0) {
    sql += `-- Data: categories\n`;
    sql += `INSERT INTO categories (id, name, sort_order, is_active) VALUES\n`;
    const catValues = categories.map((cat, index) => {
      return `  ('${cat.id}', '${escapeSQL(cat.name)}', ${index}, 1)`;
    });
    sql += catValues.join(',\n') + ';\n\n';
  }

  // Dishes
  if (dishes.length > 0) {
    sql += `-- Data: dishes\n`;
    sql += `INSERT INTO dishes (id, category_id, name, price, description, image_url, is_available, is_available_on_digital_menu, tax_percentage) VALUES\n`;
    const dishValues = dishes.map(dish => {
      return `  ('${dish.id}', '${dish.categoryId}', '${escapeSQL(dish.name)}', ${dish.price}, '${escapeSQL(dish.description || '')}', '${escapeSQL(dish.image || '')}', 1, ${dish.isAvailableOnDigitalMenu !== false ? 1 : 0}, ${settings.taxRate || 0})`;
    });
    sql += dishValues.join(',\n') + ';\n\n';
  }

  logger.info('SQL Schema generated successfully', { 
    categoryCount: categories.length, 
    dishCount: dishes.length 
  }, 'SQL_EXPORT');

  return sql;
} catch (e: unknown) {
  const error = e as Error;
  logger.error('Error generating SQL Schema', { error: error.message }, 'SQL_EXPORT');
  throw error;
}
};

const escapeSQL = (str: string): string => {
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
};
