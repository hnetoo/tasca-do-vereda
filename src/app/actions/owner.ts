'use server';

import { createClient as createLibsqlClient } from '@libsql/client';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

type Tx = { id: string; date: string; amount: number; description: string; category: string; type: 'REVENUE'|'EXPENSE'; status?: string };

export async function getOwnerFinancialData(period: 'HOJE'|'SEMANA'|'MES'|'CUSTOM' = 'HOJE', start?: string, end?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const sqlitePath = process.env.DB_SQLITE_PATH || process.env.SQLITE_DB || process.env.DATABASE_FILE || '/tmp/tasca.db';
  const cookieStore = await cookies();

  const range = (() => {
    const now = new Date();
    if (period === 'HOJE') {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const e = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      return { start: s, end: e };
    }
    if (period === 'SEMANA') {
      const d = new Date(now); const day = d.getDay() || 7;
      const startDate = new Date(d); startDate.setDate(d.getDate() - day + 1);
      const endDate = new Date(startDate); endDate.setDate(startDate.getDate() + 7);
      return { start: startDate.toISOString(), end: endDate.toISOString() };
    }
    if (period === 'MES') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      return { start: s, end: e };
    }
    return { start, end };
  })();

  // Prefer Supabase if configured
  if (supabaseUrl && supabaseKey) {
    const supabase = await createSupabaseClient();
    const txQuery = supabase.from('financial_transactions').select('*').order('date', { ascending: false });
    let txRes;
    if (range.start && range.end) txRes = await txQuery.gte('date', range.start).lte('date', range.end);
    else if (range.start) txRes = await txQuery.gte('date', range.start);
    else if (range.end) txRes = await txQuery.lte('date', range.end);
    else txRes = await txQuery;
    let transactions: Tx[] = [];
    if (!txRes.error && txRes.data) {
      transactions = (txRes.data as any[]).map(r => ({
        id: r.id, date: r.date, amount: Number(r.amount||0), description: r.description||'',
        category: r.category||'', type: r.type, status: r.status
      }));
    } else {
      const [revenues, expenses] = await Promise.all([
        supabase.from('revenues').select('*').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
      ]);
      const txs: Tx[] = [];
      (revenues.data || []).forEach((r: any) => txs.push({
        id: r.id, date: r.created_at, amount: Number(r.amount||0), description: r.description||'', category: r.category||'REVENUE', type: 'REVENUE'
      }));
      (expenses.data || []).forEach((e: any) => txs.push({
        id: e.id, date: e.created_at, amount: Number(e.amount||0), description: e.description||'', category: e.category||'EXPENSE', type: 'EXPENSE'
      }));
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      transactions = txs;
    }
    const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString();
    const [rToday, eToday, ordersToday, rMonth] = await Promise.all([
      supabase.from('revenues').select('amount').gte('created_at', todayStart),
      supabase.from('expenses').select('amount').gte('created_at', todayStart),
      supabase.from('orders').select('id,total').gte('created_at', todayStart),
      supabase.from('revenues').select('amount').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    ]);
    const revenueTotal = (rToday.data||[]).reduce((a: number, r: any) => a + Number(r.amount||0), 0);
    const expenseTotal = (eToday.data||[]).reduce((a: number, e: any) => a + Number(e.amount||0), 0);
    const monthTotal = (rMonth.data||[]).reduce((a: number, r: any) => a + Number(r.amount||0), 0);
    return { source: 'supabase', transactions, revenueTotal, expenseTotal, monthTotal, ordersCount: (ordersToday.data||[]).length };
  }

  // Fallback to SQLite (MSI/Tauri/Node local)
  try {
    const client = createLibsqlClient({ url: `file:${sqlitePath}` });
    // Ensure tables exist minimally
    await client.execute(`CREATE TABLE IF NOT EXISTS revenues (id TEXT PRIMARY KEY, amount REAL, description TEXT, category TEXT, created_at TEXT)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, amount REAL, description TEXT, category TEXT, created_at TEXT)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, total REAL, created_at TEXT)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS financial_transactions (id TEXT PRIMARY KEY, date TEXT, amount REAL, description TEXT, category TEXT, type TEXT, status TEXT)`);

    const toRows = (r: any) => r.rows.map((row: any) => row);
    const tx = await client.execute(`SELECT id, date, amount, description, category, type, status FROM financial_transactions ORDER BY datetime(date) DESC`);
    const transactions: Tx[] = toRows(tx).map((r: any) => ({
      id: String(r.id), date: String(r.date), amount: Number(r.amount || 0), description: String(r.description || ''),
      category: String(r.category || ''), type: (String(r.type).toUpperCase() === 'EXPENSE' ? 'EXPENSE' : 'REVENUE'), status: r.status ? String(r.status) : undefined
    }));

    const todayStartIso = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString();
    const rToday = await client.execute(`SELECT amount FROM revenues WHERE created_at >= ?`, [todayStartIso]);
    const eToday = await client.execute(`SELECT amount FROM expenses WHERE created_at >= ?`, [todayStartIso]);
    const ordersToday = await client.execute(`SELECT id,total FROM orders WHERE created_at >= ?`, [todayStartIso]);
    const monthStartIso = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const rMonth = await client.execute(`SELECT amount FROM revenues WHERE created_at >= ?`, [monthStartIso]);

    const revenueTotal = toRows(rToday).reduce((a: number, r: any) => a + Number(r.amount||0), 0);
    const expenseTotal = toRows(eToday).reduce((a: number, r: any) => a + Number(r.amount||0), 0);
    const monthTotal = toRows(rMonth).reduce((a: number, r: any) => a + Number(r.amount||0), 0);
    const ordersCount = toRows(ordersToday).length;
    await client.close();
    return { source: 'sqlite', transactions, revenueTotal, expenseTotal, monthTotal, ordersCount };
  } catch (e: any) {
    return { source: 'none', error: e?.message || String(e), transactions: [], revenueTotal: 0, expenseTotal: 0, monthTotal: 0, ordersCount: 0 };
  }
}

export async function syncFinancialToSqlite(): Promise<{ success: boolean; error?: string; counts?: Record<string, number> }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return { success: false, error: 'Supabase não configurado' };
    const sqlitePath = process.env.DB_SQLITE_PATH || process.env.SQLITE_DB || process.env.DATABASE_FILE || '/tmp/tasca.db';
    const cookieStore = await cookies();
    const supabase = await createSupabaseClient();
    const client = createLibsqlClient({ url: `file:${sqlitePath}` });
    await client.execute(`CREATE TABLE IF NOT EXISTS revenues (id TEXT PRIMARY KEY, amount REAL, description TEXT, category TEXT, created_at TEXT)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, amount REAL, description TEXT, category TEXT, created_at TEXT)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, total REAL, created_at TEXT)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS financial_transactions (id TEXT PRIMARY KEY, date TEXT, amount REAL, description TEXT, category TEXT, type TEXT, status TEXT)`);
    const [rRes, eRes, oRes, tRes] = await Promise.all([
      supabase.from('revenues').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('orders').select('*'),
      supabase.from('financial_transactions').select('*'),
    ]);
    const r = rRes.data || [];
    const e = eRes.data || [];
    const o = oRes.data || [];
    const t = tRes.data || [];
    for (const it of r) {
      await client.execute(`INSERT OR REPLACE INTO revenues (id, amount, description, category, created_at) VALUES (?, ?, ?, ?, ?)`, [String(it.id), Number(it.amount||0), String(it.description||''), String(it.category||''), String(it.created_at||'')]);
    }
    for (const it of e) {
      await client.execute(`INSERT OR REPLACE INTO expenses (id, amount, description, category, created_at) VALUES (?, ?, ?, ?, ?)`, [String(it.id), Number(it.amount||0), String(it.description||''), String(it.category||''), String(it.created_at||'')]);
    }
    for (const it of o) {
      await client.execute(`INSERT OR REPLACE INTO orders (id, total, created_at) VALUES (?, ?, ?)`, [String(it.id), Number(it.total||0), String(it.created_at||'')]);
    }
    for (const it of t) {
      await client.execute(`INSERT OR REPLACE INTO financial_transactions (id, date, amount, description, category, type, status) VALUES (?, ?, ?, ?, ?, ?, ?)`, [String(it.id), String(it.date||it.created_at||''), Number(it.amount||0), String(it.description||''), String(it.category||''), String(it.type||'REVENUE'), it.status ? String(it.status) : null]);
    }
    await client.close();
    return { success: true, counts: { revenues: r.length, expenses: e.length, orders: o.length, transactions: t.length } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
