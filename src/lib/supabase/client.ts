import { createBrowserClient } from '@supabase/ssr'
import { isTauri } from '../supabase'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: !isTauri(), // Web: Persist, Tauri: No
      },
    }
  )
}
