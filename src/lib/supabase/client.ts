import { createBrowserClient } from '@supabase/ssr';
import { isTauri } from './config';
import type { Database } from '@/types/supabase'; // Importar o tipo Database
import { SafeLock } from './SafeLock';

let supabaseBrowserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (!supabaseBrowserClient) {
    supabaseBrowserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      // Ensure API key has no newlines as per user requirement for WebSocket connection fix
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim().replace(/\n/g, ''),
      {
        auth: {
          persistSession: !isTauri(), // Web: Persist, Tauri: No
        },
      }
    );
  }
  return supabaseBrowserClient!;
}
