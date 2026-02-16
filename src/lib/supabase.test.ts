
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Supabase Client Initialization', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('should throw error if Supabase URL is missing', async () => {
    // Ensure env vars are missing
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'some-key');
    
    // We expect the module to throw an error at top level import
    await expect(import('./supabase')).rejects.toThrow(/Missing Env Vars: NEXT_PUBLIC_SUPABASE_URL/);
  });

  it('should throw error if Supabase Key is missing', async () => {
    // Ensure URL is present but Key is missing
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');

    // We expect the module to throw an error at top level import
    await expect(import('./supabase')).rejects.toThrow(/Missing Env Vars: NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it('should identify Tauri environment correctly', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'some-key');
    
    // Mock window with __TAURI__
    vi.stubGlobal('window', { __TAURI__: {} });
    
    const { isTauri } = await import('./supabase');
    expect(isTauri()).toBe(true);
  });

  it('should identify Web environment correctly', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'some-key');
    
    // Mock window without __TAURI__
    vi.stubGlobal('window', {});
    
    const { isTauri } = await import('./supabase');
    expect(isTauri()).toBe(false);
  });
});
