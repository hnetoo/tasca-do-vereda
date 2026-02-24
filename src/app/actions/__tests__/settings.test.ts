import { testCloudConnectionAction, testDatabaseConnectionAction } from '../settings';

jest.mock('@supabase/supabase-js', () => {
  const createClient = jest.fn(() => ({
    from: () => ({
      select: () => ({
        limit: () => Promise.resolve({ data: [], error: null })
      })
    }),
    storage: {
      listBuckets: () => Promise.resolve({ data: [], error: null })
    }
  }));
  return { createClient };
});

describe('testDatabaseConnectionAction', () => {
  it('returns success for local storage', async () => {
    const res = await testDatabaseConnectionAction('local_storage', '');
    expect(res.success).toBe(true);
  });

  it('fails for unsupported type', async () => {
    const res = await testDatabaseConnectionAction('mysql' as any, '');
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('fails when connection string missing for postgres', async () => {
    const res = await testDatabaseConnectionAction('postgres', '');
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });
});

describe('testCloudConnectionAction', () => {
  it('fails when url or key missing', async () => {
    const res = await testCloudConnectionAction('', '');
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('fails for invalid URL', async () => {
    const res = await testCloudConnectionAction('invalid-url', 'key');
    expect(res.success).toBe(false);
    expect(res.error).toBe('URL do Supabase inválida');
  });

  it('returns success for valid URL and key', async () => {
    const res = await testCloudConnectionAction('https://project.supabase.co', 'anon-key');
    expect(res.success).toBe(true);
  });

  it('returns error on storage network failure without throwing', async () => {
    const { createClient } = require('@supabase/supabase-js');
    (createClient as jest.Mock).mockReturnValueOnce({
      from: () => ({
        select: () => ({
          limit: () => Promise.resolve({ data: [], error: null })
        })
      }),
      storage: {
        listBuckets: () => Promise.resolve({ data: null, error: { message: 'fetch failed' } })
      }
    });
    const res = await testCloudConnectionAction('https://project.supabase.co', 'anon-key');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Falha de rede');
  });
});
