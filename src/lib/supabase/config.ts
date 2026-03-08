export const isTauri = () => typeof window !== 'undefined' && !!(window as unknown as any).__TAURI__;

// FORÇAR REINICIALIZAÇÃO - Garantir leitura das variáveis
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  console.log('🔍 [SUPABASE INIT] Verificando NEXT_PUBLIC_SUPABASE_URL:', url ? 'DEFINED' : 'NOT DEFINED');
  console.log('🔍 [SUPABASE INIT] Process env keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  return url;
};

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  console.log('🔍 [SUPABASE INIT] Verificando NEXT_PUBLIC_SUPABASE_ANON_KEY:', key ? 'DEFINED' : 'NOT DEFINED');
  return key;
};

export const supabaseUrl = getSupabaseUrl();
export const supabaseAnonKey = getSupabaseAnonKey();

if (!supabaseUrl || !supabaseAnonKey) {
  const msg = '[SUPABASE WARN] Variáveis NEXT_PUBLIC_SUPABASE_URL/ANON_KEY ausentes. Modo local/desktop sem cloud.';
  if (typeof window !== 'undefined') {
    console.warn(msg);
  } else {
    console.warn(msg);
  }
} else {
  if (process.env.NODE_ENV === 'development') {
    console.log('[SUPABASE CONFIG] URL:', supabaseUrl);
    console.log('[SUPABASE CONFIG] Key:', supabaseAnonKey ? '***DEFINED***' : 'UNDEFINED');
  }
}
