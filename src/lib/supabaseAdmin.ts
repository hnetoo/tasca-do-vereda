import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

// Only check for service role key on server-side
if (typeof window === 'undefined' && !supabaseServiceRoleKey) {
    console.warn('Missing SUPABASE_SERVICE_ROLE_KEY. Admin operations will fallback to Anon Key (RLS policies must allow this).');
}

// Create a Supabase client
// If Service Role Key is available (server-side), use it (Bypasses RLS)
// If not, fallback to Anon Key (Subject to RLS)
const keyToUse = (typeof window === 'undefined' && supabaseServiceRoleKey) ? supabaseServiceRoleKey : supabaseAnonKey;

// NOTA DO DESENVOLVEDOR: Este é um cliente de administração para fins especiais, para uso no lado do servidor
// em operações que precisam contornar o RLS (Row Level Security).
// Para todas as interações normais com a base de dados no lado do cliente,
// por favor, use o cliente Supabase centralizado exportado de '@/lib/supabase'.
export const supabaseAdmin = supabaseUrl && keyToUse 
    ? createClient(supabaseUrl, keyToUse, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
      })
    : null;
