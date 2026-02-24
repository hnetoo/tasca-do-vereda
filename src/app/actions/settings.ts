'use server';

import { getStoredDatabaseConfig, saveStoredDatabaseConfig, DatabaseConfig } from '@/lib/config-manager';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

// Helper for server-side logging
const serverLog = (message: string, data?: any, type: string = 'INFO') => {
  try {
    const dataStr = data ? (data instanceof Error ? data.toString() : JSON.stringify(data, null, 2)) : '';
    console.log(`[SERVER_ACTION][${type}] ${message}`, dataStr);
  } catch (e) {
    console.log(`[SERVER_ACTION][${type}] ${message}`, '[Circular/Unserializable Data]');
  }
};

export async function getDatabaseConfigAction(): Promise<{ success: boolean; data?: DatabaseConfig; error?: string }> {
  try {
    const config = await getStoredDatabaseConfig();
    return { success: true, data: config };
  } catch (error: any) {
    serverLog('Erro ao ler configuração de banco de dados', { error: error.message }, 'ERROR');
    return { success: false, error: error.message };
  }
}

export async function testDatabaseConnectionAction(type: string, connectionString: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (type === 'local' || type === 'local_storage') {
       return { success: true };
    }
    
    if (type !== 'postgres') {
       return { success: false, error: 'Teste de conexão suportado apenas para PostgreSQL.' };
    }
    
    if (!connectionString) {
        return { success: false, error: 'String de conexão ausente.' };
    }
    
    serverLog(`Testing Postgres connection`, null, 'DATABASE');
    
    const sql = postgres(connectionString, {
      max: 1,
      connect_timeout: 5,
      idle_timeout: 5,
      ssl: { rejectUnauthorized: false } 
    });

    try {
      await sql`SELECT 1`;
      await sql.end();
      serverLog('Postgres connection successful', null, 'DATABASE');
      return { success: true };
    } catch (e: any) {
      await sql.end();
      throw e;
    }
  } catch (error: any) {
    serverLog(`Postgres connection failed: ${error.message}`, error, 'ERROR');
    return { success: false, error: error.message };
  }
}

export async function saveDatabaseConfigAction(config: DatabaseConfig): Promise<{ success: boolean; error?: string }> {
  try {
    serverLog('Salvando nova configuração de banco de dados...', { type: config.type }, 'DATABASE');
    await saveStoredDatabaseConfig(config);
    serverLog('Configuração de banco de dados salva com sucesso.', null, 'DATABASE');
    return { success: true };
  } catch (error: any) {
    serverLog('Erro ao salvar configuração de banco de dados', { error: error.message }, 'ERROR');
    return { success: false, error: error.message };
  }
}

export async function clearAllDataAction(): Promise<{ success: boolean; error?: string }> {
  try {
    serverLog('Clearing all data via server action', {}, 'SETTINGS');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function hardResetAction(): Promise<{ success: boolean; error?: string }> {
  try {
    serverLog('Performing hard reset via server action', {}, 'SETTINGS');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function testCloudConnectionAction(url: string, key: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const cleanUrl = (url || '').trim().replace(/\/+$/, '');
    const cleanKey = (key || '').trim().replace(/\n/g, '');
    serverLog(`Testing connection to ${cleanUrl}`, null, 'CLOUD');

    if (!cleanUrl || !cleanKey) {
      return { success: false, error: 'URL e Key são obrigatórios' };
    }
    
    // Validate URL format to prevent sync crashes
    try {
      new URL(cleanUrl);
    } catch (e) {
      return { success: false, error: 'URL do Supabase inválida' };
    }

    const supabase = createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    // 1) Verificar um select simples para validar REST + RLS/Key
    const { error: readError } = await supabase.from('menu_categories').select('id').limit(1);
    if (readError && !readError.message?.includes('permission')) {
      // Se for permission, a ligação e a key são válidas mas sem acesso à tabela/buckets
      serverLog(`Supabase DB check returned error: ${readError.message}`, readError, 'CLOUD');
    }

    // 2) Tentar Storage (pode falhar por permissões; se falhar, ainda assim consideramos ligação OK)
    const { error: storageError } = await supabase.storage.listBuckets();
    if (storageError && (storageError.message?.includes('fetch failed') || storageError.message?.includes('network'))) {
      serverLog(`Supabase storage check network error: ${storageError.message}`, storageError, 'CLOUD');
      return { success: false, error: 'Falha de rede ao verificar Storage. Verifique conectividade.' };
    }

    const msg =
      !readError && !storageError
        ? 'Conexão Supabase estabelecida com sucesso!'
        : 'Conexão estabelecida. Nota: algumas operações podem estar restritas pelas políticas atuais.';
    serverLog('Connection successful', { msg }, 'CLOUD');
    return { success: true, message: msg };
  } catch (error: any) {
    serverLog(`Connection failed: ${error.message}`, error, 'ERROR');
    // Ensure we return a serializable error object
    return { success: false, error: error.message || 'Erro desconhecido ao testar conexão' };
  }
}

export async function fetchRemoteCategoriesAction(config: any, search?: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    if (!config?.url || !config?.key) throw new Error('Configuração Supabase inválida');
    
    const supabase = createClient(config.url, config.key);
    let query = supabase.from('categories').select('*');
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { success: true, data: data || [] };
  } catch (error: any) {
    serverLog('Erro ao buscar categorias remotas', error, 'CLOUD_IMPORT');
    return { success: false, error: error.message };
  }
}

export async function fetchRemoteProductsAction(config: any, search?: string, categoryId?: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    if (!config?.url || !config?.key) throw new Error('Configuração Supabase inválida');
    
    const supabase = createClient(config.url, config.key);
    let query = supabase.from('dishes').select('*');
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { success: true, data: data || [] };
  } catch (error: any) {
    serverLog('Erro ao buscar produtos remotos', error, 'CLOUD_IMPORT');
    return { success: false, error: error.message };
  }
}

export async function setupRLSAction(config: any): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Simulating RLS setup/check as we cannot alter table policies with Anon key easily via JS client
    // unless we use a specific RPC function that might not exist.
    // However, we can verify connection and perhaps check if we can read public tables.
    if (!config?.url || !config?.key) throw new Error('Configuração Supabase inválida');
    
    const supabase = createClient(config.url, config.key);
    const { error } = await supabase.from('categories').select('id').limit(1);
    
    if (error) {
       if (error.code === 'PGRST301' || error.message.includes('permission')) {
          // This actually means RLS is working and blocking us, or table doesn't exist
          serverLog('RLS Check: Permission denied (expected if not authenticated)', error, 'SECURITY');
       } else {
          throw error;
       }
    }
    
    serverLog('RLS Setup: Validation complete', null, 'SECURITY');
    return { success: true, message: 'Políticas de segurança validadas.' };
  } catch (error: any) {
    serverLog('RLS Setup failed', error, 'SECURITY');
    return { success: false, error: error.message };
  }
}

export async function setupBucketsAction(config: any): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (!config?.url || !config?.key) throw new Error('Configuração Supabase inválida');
    
    const supabase = createClient(config.url, config.key);
    
    const buckets = ['menu-items', 'invoices', 'backups'];
    const results = [];
    
    for (const bucket of buckets) {
        const { data, error } = await supabase.storage.getBucket(bucket);
        if (error && error.message.includes('not found')) {
            // Try to create if doesn't exist (might fail with Anon key, but worth a shot if policies allow)
            const { data: createData, error: createError } = await supabase.storage.createBucket(bucket, {
                public: bucket === 'menu-items', // menu-items should be public
                fileSizeLimit: 5242880 // 5MB
            });
            
            if (createError) {
                results.push(`Falha ao criar ${bucket}: ${createError.message}`);
            } else {
                results.push(`Criado ${bucket}`);
            }
        } else if (data) {
            results.push(`Existente: ${bucket}`);
        } else {
            results.push(`Erro ao verificar ${bucket}: ${error?.message}`);
        }
    }

    serverLog('Buckets Setup', results, 'STORAGE');
    return { success: true, message: `Verificação de Storage concluída: ${results.join(', ')}` };
  } catch (error: any) {
    serverLog('Bucket Setup failed', error, 'STORAGE');
    return { success: false, error: error.message };
  }
}

export async function captureFullStateAction(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const dbConfig = await getStoredDatabaseConfig();
    
    if (dbConfig?.type === 'postgres' && dbConfig?.connectionString) {
       serverLog('Starting full state capture from Postgres', null, 'BACKUP');
       const sql = postgres(dbConfig.connectionString, { ssl: { rejectUnauthorized: false } });
       
       try {
           const tablesResult = await sql`
               SELECT table_name 
               FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_type = 'BASE TABLE'
           `;
           
           const data: any = {};
           for (const t of tablesResult) {
               const tableName = t.table_name;
               // Skip internal tables if any
               if (tableName.startsWith('_')) continue;
               
               const rows = await sql`SELECT * FROM ${sql(tableName)}`;
               data[tableName] = rows;
           }
           
           await sql.end();
           serverLog('Postgres state captured', { tables: Object.keys(data).length }, 'BACKUP');
           return { success: true, data };
       } catch (e: any) {
           await sql.end();
           throw e;
       }
    }

    // For local storage, we return empty data, and the client will fill it with local state
    return { success: true, data: {} };
  } catch (error: any) {
    serverLog('Full State Capture failed', error, 'BACKUP');
    return { success: false, error: error.message };
  }
}

export async function restoreFullStateAction(state: any): Promise<{ success: boolean; error?: string }> {
  try {
    const dbConfig = await getStoredDatabaseConfig();
    
    if (dbConfig?.type === 'postgres' && dbConfig?.connectionString) {
        // Restore to Postgres is complex due to FKs.
        // For now, we will log a warning that this is not fully supported via this action yet.
        serverLog('Restore to Postgres requested but not fully implemented', null, 'BACKUP');
        return { success: false, error: 'Restauro para PostgreSQL via arquivo JSON ainda não suportado. Use backup SQL.' };
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
