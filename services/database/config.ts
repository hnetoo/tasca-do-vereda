export type DatabaseType = 'local_storage' | 'sqlite' | 'postgres' | 'mysql';

export interface DatabaseConfig {
  type: DatabaseType;
  connectionString?: string; // Para Postgres/MySQL/SQLite
}

// Configuração padrão - Mude aqui para trocar de banco
export const dbConfig: DatabaseConfig = {
  type: 'sqlite',
  connectionString: 'sqlite:tasca.db',
  
  // Exemplo para Postgres:
  // type: 'postgres',
  // connectionString: 'postgres://user:pass@localhost/tasca',
  
  // Exemplo para MySQL:
  // type: 'mysql',
  // connectionString: 'mysql://user:pass@localhost/tasca',
  
  // Exemplo para LocalStorage:
  // type: 'local_storage',
};
