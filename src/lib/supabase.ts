
import { createClient } from '@supabase/supabase-js';

// Guarda Tauri: Utilitário para verificar se estamos no ambiente Tauri
export const isTauri = () => typeof window !== 'undefined' && !!(window as any).__TAURI__;

// Função auxiliar para recuperar variáveis de ambiente de várias fontes
const getEnv = (key: string): string | undefined => {
  // 1. Tenta import.meta.env (Vite standard)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const val = import.meta.env[key] || import.meta.env[`NEXT_PUBLIC_${key.replace('VITE_', '')}`];
    if (val) return val;
  }
  
  // 2. Tenta process.env (Next.js / Node / Vercel legacy)
  if (typeof process !== 'undefined' && process.env) {
    const val = process.env[key] || process.env[`NEXT_PUBLIC_${key.replace('VITE_', '')}`];
    if (val) return val;
  }

  return undefined;
};

// Recupera as credenciais
export const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
export const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Validação Estrita (Fase 1 Requirement)
if (!supabaseUrl) {
  throw new Error('Missing Env Vars: NEXT_PUBLIC_SUPABASE_URL (or VITE_SUPABASE_URL)');
}

if (!supabaseAnonKey) {
  throw new Error('Missing Env Vars: NEXT_PUBLIC_SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY)');
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
