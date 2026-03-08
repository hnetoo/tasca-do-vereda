// DEBUG SUPABASE CLIENT - Verificar variáveis de ambiente
import { createClient } from '@supabase/supabase-js';

console.log('🔍 DEBUG SUPABASE CLIENT VARIABLES');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Window type:', typeof window);

// Testar criação do cliente
try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is missing');
    process.exit(1);
  }
  
  const keyToUse = (typeof window === 'undefined' && supabaseServiceRoleKey) ? supabaseServiceRoleKey : supabaseAnonKey;
  
  if (!keyToUse) {
    console.error('❌ No Supabase key available');
    process.exit(1);
  }
  
  console.log('✅ Creating Supabase client...');
  const client = createClient(supabaseUrl, keyToUse, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  console.log('✅ Supabase client created successfully');
  console.log('📊 Client config:', {
    url: supabaseUrl,
    hasServiceKey: !!supabaseServiceRoleKey,
    hasAnonKey: !!supabaseAnonKey,
    keyType: (typeof window === 'undefined' && supabaseServiceRoleKey) ? 'SERVICE' : 'ANON'
  });
  
} catch (error) {
  console.error('❌ Error creating Supabase client:', error.message);
  process.exit(1);
}
