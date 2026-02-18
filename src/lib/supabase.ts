import { createClient } from '@supabase/supabase-js';

// Guarda Tauri: Utilitário para verificar se estamos no ambiente Tauri
export const isTauri = () => typeof window !== 'undefined' && !!(window as unknown as any).__TAURI__;

// Recupera as credenciais com o operador ! para garantir que existem (TypeScript)
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[SUPABASE ERROR] Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('[SUPABASE ERROR] Please check your .env.local file or Vercel environment variables (ensure no quotes or extra spaces).');
} else {
  console.log('[SUPABASE CONFIG] URL:', supabaseUrl);
  console.log('[SUPABASE CONFIG] Key:', supabaseAnonKey ? '***DEFINED***' : 'UNDEFINED');
}

// Inicialização do cliente
// Mantemos as configurações de persistência para garantir funcionamento correto em Web vs Tauri
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: !isTauri(), // Web: Persist, Tauri: No (usa plugin nativo ou storage manual se necessário)
    autoRefreshToken: !isTauri(),
    detectSessionInUrl: !isTauri(),
  },
});
