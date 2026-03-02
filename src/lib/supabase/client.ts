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
      console.log('🔍 [SUPABASE] URL:', url);
      console.log('🔑 [SUPABASE] Key:', key ? '***DEFINED***' : 'UNDEFINED');
      
      supabaseBrowserClient = createBrowserClient<Database>(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });

      console.log('✅ [SUPABASE] Browser client created successfully');
      isCreating = false;
      return supabaseBrowserClient;
      
    } catch (error: any) {
      console.error('❌ [SUPABASE] Failed to create browser client:', error.message);
      isCreating = false;
      
      // Return dummy client on error
      const dummy: any = {
        from() {
          return {
            select: async () => ({ data: [], error: { message: 'Client creation failed' } }),
            insert: async () => ({ data: null, error: { message: 'Client creation failed' } }),
            update: async () => ({ data: null, error: { message: 'Client creation failed' } }),
            delete: async () => ({ data: null, error: { message: 'Client creation failed' } }),
          };
        },
        auth: {
          getUser: async () => ({ data: { user: null }, error: { message: 'Client creation failed' } }),
          signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Client creation failed' } }),
          signUp: async () => ({ data: { user: null }, error: { message: 'Client creation failed' } }),
          signOut: async () => ({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        },
        channel: () => ({
          on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
          subscribe: () => ({ unsubscribe: () => {} })
        })
      };
      return dummy as unknown as ReturnType<typeof createBrowserClient<Database>>;
    }
  }
  
  isCreating = false;
  return supabaseBrowserClient!;
}
