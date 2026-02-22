import postgres from 'postgres';

// Use DATABASE_URL from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

// Create a singleton connection instance
const sql = postgres(connectionString, {
  ssl: { rejectUnauthorized: false }, // Required for Supabase
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

export default sql;
