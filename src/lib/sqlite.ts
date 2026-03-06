import { Client } from '@libsql/client';

// DEPRECATED: O cliente SQLite foi descontinuado em favor do Supabase como única fonte de verdade.
// Manter este arquivo evita quebras em importações existentes, mas seu uso deve ser removido.

/**
 * @deprecated Esta função foi descontinuada. Use o cliente Supabase.
 */
function normalizeSqliteUrl(conn?: string): string {  
  // Accept formats: 'sqlite:tasca.db', 'file:tasca.db', or absolute file paths
  if (!conn || conn.trim() === '') return 'file:tasca.db';
  const trimmed = conn.trim();
  if (trimmed.startsWith('file:')) return trimmed;
  if (trimmed.startsWith('sqlite:')) {
    return 'file:' + trimmed.slice('sqlite:'.length);
  }
  // If path without scheme, assume file:
  return 'file:' + trimmed;
}

/**
 * @deprecated O cliente SQLite não é mais usado. A aplicação usa Supabase.
 * @throws {Error} Sempre lança um erro para prevenir o uso.
 */
export function getSQLiteClient(): Client {
  throw new Error(
    'DEPRECATED: O cliente SQLite não deve mais ser utilizado. A aplicação agora usa o Supabase como única fonte de verdade. Refatore o código para usar o cliente Supabase de "@/lib/supabase".'
  );
}

/**
 * @deprecated O esquema da base de dados agora é gerenciado pelo Supabase.
 */
export async function ensureSqliteSchema(): Promise<void> {
  console.warn('DEPRECATED: a função ensureSqliteSchema não deve ser usada. O esquema é gerenciado no Supabase.');
  return Promise.resolve();
}
