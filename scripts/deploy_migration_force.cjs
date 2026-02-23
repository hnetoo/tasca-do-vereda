require('dotenv').config();
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  ssl: { rejectUnauthorized: false },
  max: 1
});

async function deployMigration() {
  console.log('Deploying migration...');
  
  try {
    // 1. Drop existing system_settings table if it exists (since we know schema is wrong/old)
    console.log('Dropping system_settings table...');
    await sql`DROP TABLE IF EXISTS system_settings CASCADE`;
    
    // 2. Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260223120000_fix_select_policy.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // 3. Execute migration SQL
    // Note: postgres.js might not support multiple statements in one call easily unless using `file` or simple query
    // But let's try `sql.unsafe(migrationSql)` which allows executing raw SQL string
    console.log('Executing migration SQL...');
    await sql.unsafe(migrationSql);
    
    console.log('SUCCESS: Migration deployed.');
  } catch (error) {
    console.error('ERROR deploying migration:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

deployMigration();
