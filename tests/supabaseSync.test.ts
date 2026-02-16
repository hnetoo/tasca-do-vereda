import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseService } from '../services/supabaseService';

vi.mock('@supabase/supabase-js', () => {
  let attempts = 0;
  const makeResponse = (data: any, error: any = null) => Promise.resolve({ data, error });
  const client = {
    auth: {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    },
    from: (table: string) => {
      if (table === 'categories') {
        const builder: any = {
          select: () => builder,
          order: () => {
            attempts++;
            if (attempts < 3) return makeResponse(null, new Error('Network error'));
            return makeResponse([{ id: 'cat1', name: 'Bebidas', sort_order: 1 }], null);
          },
          ilike: () => builder,
          range: () => makeResponse([{ id: 'cat1', name: 'Bebidas', sort_order: 1 }], null)
        };
        return builder;
      }
      if (table === 'menu_items' || table === 'products') {
        const builder: any = {
          select: () => builder,
          eq: () => builder,
          ilike: () => builder,
          order: () => builder,
          range: () => makeResponse([
            { id: 'd1', name: 'Cerveja', price: 1000, category_id: 'cat1', available: true, image_url: '', tax_rate: 14, tax_code: 'NOR' }
          ], null),
          then: (resolve: any) => resolve({ 
              data: [{ id: 'd1', name: 'Cerveja', price: 1000, category_id: 'cat1', available: true, image_url: '', tax_rate: 14, tax_code: 'NOR' }], 
              error: null 
          })
        };
        return builder;
      }
      if (table === 'daily_analytics') {
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              single: () => makeResponse({ 
                date: val, 
                total_revenue: 1000, 
                total_expenses: 500, 
                total_product_cost: 300, 
                total_orders: 10, 
                net_profit: 200, 
                updated_at: '2023-01-01T00:00:00Z' 
              }, null)
            })
          })
        };
      }
      if (table === 'restaurant_settings') {
        return {
          select: () => ({
            single: () => makeResponse({ id: '1', name: 'Tasca', currency: 'AOA' }, null),
            maybeSingle: () => makeResponse({ id: '1', name: 'Tasca', currency: 'AOA' }, null)
          })
        };
      }
      return { select: () => ({ order: () => makeResponse([], null) }) };
    }
  };
  return { createClient: () => client };
});

describe('Supabase sync with retry/backoff', () => {
  beforeEach(() => {
    (supabaseService as any).client = null;
    (supabaseService as any).config = null;
  });

  it('fetchMenu succeeds after retries and updates syncStatus', async () => {
    supabaseService.initialize('http://dummy', 'sb_dummy_key');
    const result = await supabaseService.fetchMenu();
    expect(result.success).toBe(true);
    const status = supabaseService.getSyncStatus();
    expect(status.status).toBe('success');
    expect(status.retries).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.data!.categories)).toBe(true);
    expect(Array.isArray(result.data!.dishes)).toBe(true);
  });

  it('fetchCategoriesPaged returns mapped data', async () => {
    supabaseService.initialize('http://dummy', 'sb_dummy_key');
    const res = await supabaseService.fetchCategoriesPaged({ page: 1, pageSize: 10 });
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data!)).toBe(true);
  });

  it('fetchDishesPaged returns mapped data', async () => {
    supabaseService.initialize('http://dummy', 'sb_dummy_key');
    const res = await supabaseService.fetchDishesPaged({ page: 1, pageSize: 10 });
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data!)).toBe(true);
    expect(res.data![0].taxCode).toBe('NOR');
  });

  it('getDailyAnalytics returns mapped data', async () => {
    supabaseService.initialize('http://dummy', 'sb_dummy_key');
    const res = await supabaseService.getDailyAnalytics('2023-01-01');
    
    expect(res.success).toBe(true);
    expect(res.data).toEqual({
      date: '2023-01-01',
      totalRevenue: 1000,
      totalExpenses: 500,
      totalProductCost: 300,
      totalOrders: 10,
      netProfit: 200,
      lastUpdated: '2023-01-01T00:00:00Z'
    });
  });
});
