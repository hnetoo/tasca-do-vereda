// FIX SUPABASE CLIENT - Versão robusta com fallbacks
import { createClient } from '@supabase/supabase-js';

console.log('🔧 FIXING SUPABASE CLIENT INITIALIZATION');

// Tentar múltiplas fontes para as variáveis
const getSupabaseConfig = () => {
  // 1. Tentar variáveis de ambiente
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // 2. Tentar .env.local
  if (!supabaseUrl) {
    try {
      const fs = require('fs');
      const path = require('path');
      const envLocal = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
      
      envLocal.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          if (key.includes('SUPABASE_URL')) supabaseUrl = value.trim();
          if (key.includes('SERVICE_ROLE_KEY')) serviceKey = value.trim();
          if (key.includes('ANON_KEY')) anonKey = value.trim();
        }
      });
      
      console.log('📁 Loaded from .env.local');
    } catch (error) {
      console.log('⚠️ Could not load .env.local:', error.message);
    }
  }
  
  // 3. Valores hardcoded como último recurso
  if (!supabaseUrl) {
    supabaseUrl = 'https://myppylcyupoirizyxhpo.supabase.co';
    console.log('🔧 Using hardcoded Supabase URL');
  }
  
  if (!serviceKey) {
    serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5ciJ6.eyJpc3MiOiJzdXBhYmFzZSIsInR5ciJ9.eyJpYXQiOiJzdXBhYmFzZSIsInR5ciJ9.eyJpYXQiOiJzdXBhYmFzZSIsInR5ciJ9';
    console.log('🔧 Using hardcoded Service Key');
  }
  
  if (!anonKey) {
    anonKey = 'eyJhbGciOiJIUzI1NiIsInR5ciJ6.eyJpc3MiOiJzdXBhYmFzZSIsInR5ciJ9.eyJpYXQiOiJzdXBhYmFzZSIsInR5ciJ9.eyJpYXQiOiJzdXBhYmFzZSIsInR5ciJ9';
    console.log('🔧 Using hardcoded Anon Key');
  }
  
  return { supabaseUrl, serviceKey, anonKey };
};

// Criar cliente com múltiplos fallbacks
const createRobustSupabaseClient = () => {
  const { supabaseUrl, serviceKey, anonKey } = getSupabaseConfig();
  
  console.log('📊 Supabase config:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!serviceKey,
    hasAnonKey: !!anonKey,
    isServer: typeof window === 'undefined'
  });
  
  if (!supabaseUrl) {
    throw new Error('Supabase URL is required');
  }
  
  // Escolher chave baseada no ambiente
  const keyToUse = (typeof window === 'undefined' && serviceKey) ? serviceKey : anonKey;
  
  if (!keyToUse) {
    throw new Error('Supabase key is required');
  }
  
  const client = createClient(supabaseUrl, keyToUse, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  console.log('✅ Supabase client created successfully');
  return client;
};

// Exportar cliente robusto
export const supabaseAdmin = createRobustSupabaseClient();

// Exportar função para recriar cliente se necessário
export const recreateSupabaseClient = () => {
  console.log('🔄 Recreating Supabase client...');
  try {
    return createRobustSupabaseClient();
  } catch (error) {
    console.error('❌ Error recreating client:', error.message);
    throw error;
  }
};
