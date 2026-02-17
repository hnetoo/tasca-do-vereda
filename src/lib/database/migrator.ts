'use client';

import Database from '@tauri-apps/plugin-sql';
import { logger } from '@/services/logger';

interface SQLiteTableInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: unknown;
  pk: number;
}

export const databaseMigrator = {
  /**
   * Detects if the provided URL is a valid Postgres connection string
   */
  isValidPostgresUrl(url: string): boolean {
    return url.startsWith('postgres://') || url.startsWith('postgresql://');
  },

  /**
   * Maps SQLite types to Postgres types
   */
  mapTypeToPostgres(sqliteType: string): string {
    const type = sqliteType.toUpperCase();
    if (type.includes('INT')) return 'INTEGER';
    if (type.includes('TEXT') || type.includes('CHAR') || type.includes('CLOB')) return 'TEXT';
    if (type.includes('REAL') || type.includes('FLOAT') || type.includes('DOUBLE')) return 'DOUBLE PRECISION';
    if (type.includes('BLOB')) return 'BYTEA';
    if (type.includes('BOOL')) return 'BOOLEAN';
    if (type.includes('DATE') || type.includes('TIME')) return 'TIMESTAMP';
    return 'TEXT'; // Fallback
  },

  /**
   * Migrates data from local SQLite to the provided Postgres instance
   * and switches the application to use the new database.
   */
  async migrateToPostgres(postgresUrl: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isValidPostgresUrl(postgresUrl)) {
      return { success: false, error: 'URL de conexão inválida. Deve começar com postgres://' };
    }

    try {
      logger.info('Iniciando migração para Postgres...', undefined, 'MIGRATION');

      // 1. Connect to Source (SQLite)
      const sourceDb = await Database.load('sqlite:tasca.db');
      
      // 2. Connect to Destination (Postgres)
      // Note: This requires the Postgres URL to be reachable
      const destDb = await Database.load(postgresUrl);

      // 3. Get all tables from SQLite
      const tables = await sourceDb.select<{ name: string }[]>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      for (const table of tables) {
        const tableName = table.name;
        logger.info(`Migrando tabela: ${tableName}`, undefined, 'MIGRATION');

        // 4. Get Table Schema
        const columns = await sourceDb.select<SQLiteTableInfo[]>(`PRAGMA table_info(${tableName})`);

        // 5. Create Table in Postgres
        let createQuery = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
        const columnDefs = columns.map((col) => {
          const type = this.mapTypeToPostgres(col.type);
          let constraints = '';
          if (col.pk) constraints += ' PRIMARY KEY';
          // Note: SQLite might have multiple PKs but here we simplify. 
          // Ideally we check for composite keys but for now simple PK is assumed or handled by constraints
          // Also Postgres is strict about NOT NULL. If data has nulls, this might fail.
          // We'll skip NOT NULL constraint to be safe during migration unless it's PK
          
          return `  "${col.name}" ${type} ${constraints}`;
        });
        createQuery += columnDefs.join(',\n');
        createQuery += '\n);';

        await destDb.execute(createQuery);

        // 6. Transfer Data
        const rows = await sourceDb.select<any[]>(`SELECT * FROM "${tableName}"`);
        
        if (rows.length > 0) {
            const colNames = columns.map(c => `"${c.name}"`).join(', ');
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            
            // Insert row by row to ensure safety (slower but safer) or batch if possible
            // Tauri SQL plugin execute supports params array
            for (const row of rows) {
                const values = columns.map(c => {
                    const val = row[c.name];
                    // Handle boolean conversion if necessary
                    if (typeof val === 'boolean') return val; // Postgres driver handles boolean
                    return val;
                });
                
                await destDb.execute(
                    `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                    values
                );
            }
        }
      }

      // 7. Save new configuration
      localStorage.setItem('db_url', postgresUrl);
      
      logger.info('Migração concluída com sucesso!', undefined, 'MIGRATION');
      return { success: true };

    } catch (error: any) {
      logger.error('Erro durante a migração', { error: error.message }, 'MIGRATION');
      return { success: false, error: error.message };
    }
  }
};
