import { createBrowserClient } from '@supabase/ssr';
import { isTauri, supabaseUrl, supabaseAnonKey } from './config';
import type { Database } from '@/types/supabase';
import { SafeLock } from './SafeLock';

let supabaseBrowserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;
let isCreating = false;
let creationPromise: Promise<ReturnType<typeof createBrowserClient<Database>>> | null = null;

export function createClient() {
  // Return existing client if already created
  if (supabaseBrowserClient) {
    console.log('🔄 [SUPABASE] Returning existing client');
    return supabaseBrowserClient;
  }
  
  // If already creating, return the existing promise
  if (isCreating && creationPromise) {
    console.log('⏳ [SUPABASE] Client creation in progress, waiting...');
    return creationPromise;
  }
  
  isCreating = true;
  
  // Create promise for client creation
  creationPromise = (async () => {
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
      };
      supabaseBrowserClient = dummy as unknown as ReturnType<typeof createBrowserClient<Database>>;
      return supabaseBrowserClient;
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
        return supabaseBrowserClient;
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
        };
        supabaseBrowserClient = dummy as unknown as ReturnType<typeof createBrowserClient<Database>>;
        return supabaseBrowserClient;
      }
    }
  })();
  
  // Wait for creation to complete
  creationPromise.then(() => {
    isCreating = false;
    creationPromise = null;
  });
  
  return supabaseBrowserClient!;
}
