export const isTauri = () => typeof window !== 'undefined' && !!(window as unknown as any).__TAURI__;

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
