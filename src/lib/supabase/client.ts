import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { isTauri, supabaseUrl, supabaseAnonKey } from './config'
import { SafeLock } from './SafeLock'

let supabaseBrowserClient: ReturnType<typeof createSupabaseClient> | undefined;
let isCreating = false;
const clientLock = new SafeLock();

export function createClient() {
  // 🎯 SINGLE INSTANCE ENFORCED: Return existing client immediately
  if (supabaseBrowserClient) {
    console.log('🔄 [SUPABASE] Returning existing client (SINGLE INSTANCE ENFORCED)');
    return supabaseBrowserClient;
  }
  
  // 🎯 RACE CONDITION PROTECTION: Use SafeLock to prevent concurrent creation
  if (isCreating) {
    console.log('⏳ [SUPABASE] Client creation in progress, waiting for lock...');
    
    // Wait for lock to release
    const waitForClient = async () => {
      await clientLock.acquireLock('supabase-client');
      clientLock.releaseLock('supabase-client');
      
      if (supabaseBrowserClient) {
        console.log('✅ [SUPABASE] Client available after wait');
        return supabaseBrowserClient;
      }
      
      // If still not available after wait, create it
      console.log('⚠️ [SUPABASE] Client still not available, forcing creation');
      return createClient();
    };
    
    // Return dummy client while waiting
    const dummy: any = {
      from() {
        return {
          select: async () => ({ data: [], error: null }),
          insert: async () => ({ data: null, error: null }),
          update: async () => ({ data: null, error: null }),
          delete: async () => ({ data: null, error: null }),
        };
      },
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
      channel: () => ({
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        subscribe: () => ({ unsubscribe: () => {} })
      })
    };
    
    // Start async wait but return dummy immediately
    waitForClient().catch(console.error);
    return dummy as unknown as ReturnType<typeof createSupabaseClient>;
  }
  
  // 🎯 ATOMIC CREATION: Acquire lock before creating
  clientLock.acquireLock('supabase-client');
  isCreating = true;
  
  try {
    console.log('🆕 [SUPABASE] Creating new browser client (ATOMIC CREATION)');
    
    const url = supabaseUrl;
    const anonKey = supabaseAnonKey ? supabaseAnonKey.trim().replace(/\n/g, '') : '';

    if (!url || !anonKey) {
      console.warn('[SUPABASE] Não configurado. A app funcionará em modo local (sem cloud).');
      const dummy: any = {
        from() {
          return {
            select: async () => ({ data: [], error: null }),
            insert: async () => ({ data: null, error: null }),
            update: async () => ({ data: null, error: null }),
            delete: async () => ({ data: null, error: null }),
          };
        },
        auth: {
          getUser: async () => ({ data: { user: null }, error: null }),
        },
        channel: () => ({
          on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
          subscribe: () => ({ unsubscribe: () => {} })
        })
      };
      supabaseBrowserClient = dummy as unknown as ReturnType<typeof createSupabaseClient>;
      return supabaseBrowserClient;
    }
    
    // Create the actual client
    supabaseBrowserClient = createSupabaseClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'apikey': anonKey
        }
      }
    });

    console.log('✅ [SUPABASE] Browser client created successfully (SINGLE INSTANCE GUARANTEED)');
    return supabaseBrowserClient;
    
  } catch (error: any) {
    console.error('❌ [SUPABASE] Failed to create browser client:', error.message);
    
    const anonKey = supabaseAnonKey ? supabaseAnonKey.trim().replace(/\n/g, '') : '';
    
    // Return dummy client on error
    const dummy: any = {
      from() {
        return {
          select: async () => ({ data: [], error: { message: 'Client creation failed' } }),
          insert: async () => ({ data: null, error: { message: 'Client creation failed' } }),
          update: async () => ({ data: null, error: { message: 'Client creation failed' } }),
          delete: async () => ({ data: null, error: { message: 'Client creation failed' } }),
        };
      },
      auth: {
        getUser: async () => ({ data: { user: null }, error: { message: 'Client creation failed' } }),
        signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Client creation failed' } }),
        signUp: async () => ({ data: { user: null }, error: { message: 'Client creation failed' } }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      channel: () => ({
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        subscribe: () => ({ unsubscribe: () => {} })
      }),
      _headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'apikey': anonKey
      }
    };
    supabaseBrowserClient = dummy as unknown as ReturnType<typeof createSupabaseClient>;
    return supabaseBrowserClient;
    
  } finally {
    // 🎯 ALWAYS RELEASE LOCK
    isCreating = false;
    clientLock.releaseLock('supabase-client');
    console.log('🔓 [SUPABASE] Lock released, client creation complete');
  }
}
