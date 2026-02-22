import { createBrowserClient } from '@supabase/ssr';
import { isTauri } from '../supabase';
import type { Database } from '@/types/supabase'; // Importar o tipo Database

let supabaseBrowserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (!supabaseBrowserClient) {
    supabaseBrowserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: !isTauri(), // Web: Persist, Tauri: No
        },
      }
    );
  }
  return supabaseBrowserClient;
}
