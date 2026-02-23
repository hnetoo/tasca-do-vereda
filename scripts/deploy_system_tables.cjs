const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is not set in .env file.');
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  ssl: { rejectUnauthorized: false },
  max: 1
});

async function deploySystemTables() {
  console.log('Deploying system tables migration...');
  
  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260223130000_create_system_tables.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration SQL...');
    
    // Split by statement if needed, but simple create statements usually work fine in a block 
    // unless they contain specific transaction commands that postgres.js handles differently.
    // However, postgres.js `unsafe` executes the whole string as a query.
    await sql.unsafe(migrationSql);
    
    console.log('SUCCESS: System tables deployed.');
    
    // Validate creation
    const tables = ['biometric_devices', 'api_keys', 'webhooks', 'system_health_logs', 'integration_logs'];
    for (const table of tables) {
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        );
      `;
      if (result && result[0] && result[0].exists) {
        console.log(`Verified: Table "${table}" exists.`);
      } else {
        console.error(`ERROR: Table "${table}" failed to create.`);
      }
    }

  } catch (error) {
    console.error('ERROR deploying migration:', error);
  } finally {
    await sql.end();
  }
}

deploySystemTables();
