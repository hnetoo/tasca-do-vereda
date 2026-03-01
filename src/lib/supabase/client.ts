import { createBrowserClient } from '@supabase/ssr';
import { isTauri, supabaseUrl, supabaseAnonKey } from './config';
import type { Database } from '@/types/supabase';
import { SafeLock } from './SafeLock';

let supabaseBrowserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;
let isCreating = false;

export function createClient() {
  // Return existing client if already created
  if (supabaseBrowserClient) {
    return supabaseBrowserClient;
  }
  
  // Prevent race conditions
  if (isCreating) {
    console.log('⏳ [SUPABASE] Client creation in progress, returning dummy');
    // Return a dummy client while waiting
    const dummy: any = {
      from() {
        return {
          select: async () => ({ data: [], error: null }),
          insert: async () => ({ data: null, error: null }),
          update: async () => ({ data: null, error: null }),
          delete: async () => ({ data: null, error: null }),
        };
      },
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
      channel: () => ({
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        subscribe: () => ({ unsubscribe: () => {} })
      })
    };
    return dummy as unknown as ReturnType<typeof createBrowserClient<Database>>;
  }
  
  isCreating = true;
  
  const url = supabaseUrl;
  const key = supabaseAnonKey ? supabaseAnonKey.trim().replace(/\n/g, '') : '';

  if (!url || !key) {
    console.warn('[SUPABASE] Não configurado. A app funcionará em modo local (sem cloud).');
    const dummy: any = {
      from() {
        return {
          select: async () => ({ data: [], error: null }),
          insert: async () => ({ data: null, error: null }),
          update: async () => ({ data: null, error: null }),
          delete: async () => ({ data: null, error: null }),
        };
      },
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
      channel: () => ({
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        subscribe: () => ({ unsubscribe: () => {} })
      })
    };
    supabaseBrowserClient = dummy as unknown as ReturnType<typeof createBrowserClient<Database>>;
  } else {
    try {
      console.log('🆕 [SUPABASE] Creating new browser client');
      supabaseBrowserClient = createBrowserClient<Database>(url, key, {
        auth: { 
          persistSession: !isTauri(),
          // Disable lock manager to prevent timeout errors
          lock: undefined
        },
      });
    } catch (error) {
      console.error('[SUPABASE] Error creating client:', error);
      // Fallback to dummy client
      const dummy: any = {
        from() {
          return {
            select: async () => ({ data: [], error: null }),
            insert: async () => ({ data: null, error: null }),
            update: async () => ({ data: null, error: null }),
            delete: async () => ({ data: null, error: null }),
          };
        },
        auth: {
          getUser: async () => ({ data: { user: null }, error: null }),
        },
        channel: () => ({
          on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
          subscribe: () => ({ unsubscribe: () => {} })
        })
      };
      supabaseBrowserClient = dummy as unknown as ReturnType<typeof createBrowserClient<Database>>;
    }
  }
  
  isCreating = false;
  return supabaseBrowserClient!;
}
