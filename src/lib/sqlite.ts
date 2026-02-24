import { createClient, Client } from '@libsql/client';
import { getStoredDatabaseConfigSync } from '@/lib/config-manager';

let client: Client | null = null;
let initialized = false;

function normalizeSqliteUrl(conn?: string): string {
  // Accept formats: 'sqlite:tasca.db', 'file:tasca.db', or absolute file paths
  if (!conn || conn.trim() === '') return 'file:tasca.db';
  const trimmed = conn.trim();
  if (trimmed.startsWith('file:')) return trimmed;
  if (trimmed.startsWith('sqlite:')) {
    return 'file:' + trimmed.slice('sqlite:'.length);
  }
  // If path without scheme, assume file:
  return 'file:' + trimmed;
}

export function getSQLiteClient(): Client {
  if (client) return client;
  const cfg = getStoredDatabaseConfigSync();
  const url = normalizeSqliteUrl(cfg.connectionString);
  client = createClient({ url });
  return client!;
}

export async function ensureSqliteSchema(): Promise<void> {
  if (initialized) return;
  const db = getSQLiteClient();

  // Minimal schema required by the app for local mode
  await db.execute(`
    CREATE TABLE IF NOT EXISTS menu_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      parent_id TEXT,
      is_available_on_digital_menu INTEGER DEFAULT 1,
      updated_at TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS dishes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      cost_price REAL DEFAULT 0,
      category_id TEXT,
      image_url TEXT,
      tax_code TEXT,
      tax_percentage REAL,
      preparation_time INTEGER,
      is_active INTEGER DEFAULT 1,
      available INTEGER DEFAULT 1,
      is_available_on_digital_menu INTEGER DEFAULT 1,
      track_stock INTEGER DEFAULT 0,
      stock_quantity REAL DEFAULT 0,
      min_stock_quantity REAL DEFAULT 0,
      max_stock_quantity REAL,
      unit TEXT DEFAULT 'unidade',
      supplier_id TEXT,
      updated_at TEXT,
      FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE SET NULL
    );
  `);

  initialized = true;
}

