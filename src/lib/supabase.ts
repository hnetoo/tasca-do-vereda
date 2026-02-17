
import { createClient } from '@supabase/supabase-js';

// Guarda Tauri: Utilitário para verificar se estamos no ambiente Tauri
export const isTauri = () => typeof window !== 'undefined' && !!(window as unknown).__TAURI__;

// Função auxiliar para recuperar variáveis de ambiente de várias fontes
const getEnv = (key: string): string | undefined => {
  // Tenta process.env (Next.js / Node / Vercel legacy)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

// Recupera as credenciais
export const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
export const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

console.log('Supabase URL:', supabaseUrl);
// console.log('Supabase Anon Key:', supabaseAnonKey); // Security: Don't log keys

// Validação Estrita (Fase 1 Requirement)
if (!supabaseUrl) {
  throw new Error('Missing Env Vars: NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing Env Vars: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Inicialização do cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: !isTauri(), // Web: Persist, Tauri: No
    autoRefreshToken: !isTauri(),
    detectSessionInUrl: !isTauri(),
  },
  global: {
    headers: {
      'x-client-info': isTauri() ? 'tauri-msi' : 'web-vercel'
    }
  }
});
