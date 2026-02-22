export const isTauri = () => typeof window !== 'undefined' && !!(window as unknown as any).__TAURI__;

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = '[SUPABASE ERROR] Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Please check your .env.local file or Vercel environment variables (ensure no quotes or extra spaces).';
  console.error(errorMessage);
  throw new Error(errorMessage);
} else {
  // Only log in development or if needed, to reduce noise
  if (process.env.NODE_ENV === 'development') {
    console.log('[SUPABASE CONFIG] URL:', supabaseUrl);
    console.log('[SUPABASE CONFIG] Key:', supabaseAnonKey ? '***DEFINED***' : 'UNDEFINED');
  }
}
