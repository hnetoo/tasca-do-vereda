import postgres from 'postgres';
import { dbConfig } from '@/services/database/config';

// Use connection string from dbConfig or fallback to env
const connectionString = dbConfig.connectionString || process.env.DATABASE_URL;

let sql: postgres.Sql<{}>;

if (connectionString) {
  // Create a singleton connection instance
  sql = postgres(connectionString, {
    ssl: { rejectUnauthorized: false }, // Required for Supabase
    max: 10, // Connection pool size
    idle_timeout: 20,
    connect_timeout: 10,
  });
} else {
  // Mock sql for local_storage mode to prevent crash on import
  // But throw error if used
  sql = ((...args: any[]) => {
    throw new Error('Database not configured. Please set up SQL Driver in Settings.');
  }) as any;
  // Mock methods like begin, etc. if needed
  (sql as any).begin = async () => { throw new Error('Database not configured. Please set up SQL Driver in Settings.'); };
}

export default sql;
