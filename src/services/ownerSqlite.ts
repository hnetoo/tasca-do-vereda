import { createClient } from '@/lib/supabase/client';
import { getStoredDatabaseConfigSync } from '@/lib/config-manager-simple';

let client: any = null;
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

export async function getSQLiteClient() {
  if (client) return client;
  const cfg = getStoredDatabaseConfigSync();
  const url = normalizeSqliteUrl(cfg.connectionString);
  
  // Detectar se está no ambiente Tauri
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
  
  if (isTauri) {
    try {
      const { default: Database } = await import('@tauri-apps/plugin-sql');
      client = Database.load(url);
      return client;
    } catch (error) {
      console.error('Erro ao carregar plugin SQLite Tauri:', error);
      // Fallback para Supabase se falhar
      const { createClient: createSupabaseClient } = await import('@/lib/supabase/client');
      return createSupabaseClient();
    }
  } else {
    // Ambiente Web: usar Supabase client
    const { createClient: createSupabaseClient } = await import('@/lib/supabase/client');
    return createSupabaseClient();
  }
}

export async function syncFinancialClientToSqlite(sqliteUrl: string = 'sqlite:tasca.db'): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getSQLiteClient();
    const supabase = createClient();
    await db.execute(`CREATE TABLE IF NOT EXISTS revenues (id TEXT PRIMARY KEY, amount REAL, description TEXT, category TEXT, created_at TEXT)`);
    await db.execute(`CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, amount REAL, description TEXT, category TEXT, created_at TEXT)`);
    await db.execute(`CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, total REAL, created_at TEXT)`);
    await db.execute(`CREATE TABLE IF NOT EXISTS financial_transactions (id TEXT PRIMARY KEY, date TEXT, amount REAL, description TEXT, category TEXT, type TEXT, status TEXT)`);
    const [rRes, eRes, oRes, tRes] = await Promise.all([
      supabase.from('revenues').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('orders').select('*'),
      (supabase as any).from('financial_transactions').select('*'),
    ]);
    for (const it of rRes.data || []) {
      await db.execute(`INSERT OR REPLACE INTO revenues (id, amount, description, category, created_at) VALUES (?, ?, ?, ?, ?)`, [String(it.id), Number(it.amount||0), String(it.description||''), String(it.category||''), String(it.created_at||'')]);
    }
    for (const it of eRes.data || []) {
      await db.execute(`INSERT OR REPLACE INTO expenses (id, amount, description, category, created_at) VALUES (?, ?, ?, ?, ?)`, [String(it.id), Number(it.amount||0), String(it.description||''), String(it.category||''), String(it.created_at||'')]);
    }
    for (const it of oRes.data || []) {
      await db.execute(`INSERT OR REPLACE INTO orders (id, total, created_at) VALUES (?, ?, ?)`, [String(it.id), Number(it.total||0), String(it.created_at||'')]);
    }
    for (const it of tRes.data || []) {
      await db.execute(`INSERT OR REPLACE INTO financial_transactions (id, date, amount, description, category, type, status) VALUES (?, ?, ?, ?, ?, ?, ?)`, [String(it.id), String(it.date||it.created_at||''), Number(it.amount||0), String(it.description||''), String(it.category||''), String(it.type||'REVENUE'), it.status ? String(it.status) : null]);
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function fetchOwnerDataFromSqlite(sqliteUrl: string = 'sqlite:tasca.db') {
  console.log('🔍 fetchOwnerDataFromSqlite - Iniciando');
  console.log('📁 sqliteUrl:', sqliteUrl);
  
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
  console.log('🔍 Ambiente Tauri detectado:', isTauri);
  
  if (isTauri) {
    console.log('🔍 Usando plugin SQLite Tauri');
    try {
      const { default: Database } = await import('@tauri-apps/plugin-sql');
      const db = await Database.load(sqliteUrl);
      console.log('🔍 Database SQLite carregado com sucesso');
      
      const txRows = await db.select<Array<{ id: string; date: string; amount: number; description: string; category: string; type: 'REVENUE' | 'EXPENSE'; status?: string }>>(`SELECT id, date, amount, description, category, type, status FROM financial_transactions ORDER BY datetime(date) DESC`);
      console.log('🔍 Transações encontradas:', txRows.length);
      
      const todayStartIso = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString();
      const rToday = await db.select<Array<{ amount: number }>>(`SELECT amount FROM revenues WHERE created_at >= ?`, [todayStartIso]);
      const eToday = await db.select<Array<{ amount: number }>>(`SELECT amount FROM expenses WHERE created_at >= ?`, [todayStartIso]);
      const ordersToday = await db.select<Array<{ id: string }>>(`SELECT id FROM orders WHERE created_at >= ?`, [todayStartIso]);
      const monthStartIso = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const rMonth = await db.select<Array<{ amount: number }>>(`SELECT amount FROM revenues WHERE created_at >= ?`, [monthStartIso]);
      
      const revenueTotal = (rToday || []).reduce((a, r) => a + Number(r.amount||0), 0);
      const expenseTotal = (eToday || []).reduce((a, r) => a + Number(r.amount||0), 0);
      const monthTotal = (rMonth || []).reduce((a, r) => a + Number(r.amount||0), 0);
      const ordersCount = (ordersToday || []).length;
      
      console.log('📊 Dados calculados:', { revenueTotal, expenseTotal, monthTotal, ordersCount });
      
      return { 
        success: true, 
        transactions: txRows || [], 
        revenueTotal, 
        expenseTotal, 
        monthTotal, 
        ordersCount
      };
    } catch (error: any) {
      console.error('❌ Erro ao buscar dados SQLite:', error);
      return { 
        success: false, 
        transactions: [], 
        revenueTotal: 0, 
        expenseTotal: 0, 
        monthTotal: 0, 
        ordersCount: 0,
        error: error.message
      };
    }
  } else {
    console.log('🌐 Ambiente Web detectado - usando Supabase fallback');
    // Fallback para Supabase se não for Tauri
    try {
      const { createClient: createSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = createSupabaseClient();
      
      const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString();
      
      const [rRes, eRes, oRes] = await Promise.all([
        supabase.from('revenues').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('orders').select('*'),
      ]);
      
      const revenueTotal = (rRes.data || []).reduce((sum, r) => sum + Number(r.amount || 0), 0);
      const expenseTotal = (eRes.data || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const ordersCount = (oRes.data || []).length;
      
      return { 
        success: true, 
        transactions: [], 
        revenueTotal, 
        expenseTotal, 
        monthTotal: 0, 
        ordersCount
      };
    } catch (error: any) {
      console.error('❌ Erro ao buscar dados Supabase:', error);
      return { 
        success: false, 
        transactions: [], 
        revenueTotal: 0, 
        expense: 0, 
        monthTotal: 0, 
        ordersCount: 0,
        error: error.message
      };
    }
  }
}
