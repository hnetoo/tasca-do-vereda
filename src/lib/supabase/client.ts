import { createBrowserClient } from '@supabase/ssr';
import { isTauri, supabaseUrl, supabaseAnonKey } from './config';
import type { Database } from '@/types/supabase'; // Importar o tipo Database
import { SafeLock } from './SafeLock';

let supabaseBrowserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (!supabaseBrowserClient) {
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
      // @ts-expect-error intentionally broad to avoid runtime crash in desktop
      supabaseBrowserClient = dummy;
    } else {
      supabaseBrowserClient = createBrowserClient<Database>(url, key, {
        auth: { persistSession: !isTauri() },
      });
    }
  }
  return supabaseBrowserClient!;
}
