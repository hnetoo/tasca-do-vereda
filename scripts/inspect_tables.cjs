const postgres = require('postgres');
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

async function inspectTables() {
  console.log('Inspecting system tables...');
  
  const tables = ['biometric_devices', 'api_keys', 'webhooks', 'system_health_logs', 'integration_logs', 'permissions', 'role_permissions', 'profiles'];
  
  try {
    for (const table of tables) {
      console.log(`\n--- Table: ${table} ---`);
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${table}
        ORDER BY ordinal_position;
      `;
      
      if (columns.length === 0) {
        console.log('Table does not exist.');
      } else {
        console.table(columns);
      }
    }
  } catch (error) {
    console.error('Error inspecting tables:', error);
  } finally {
    await sql.end();
  }
}

inspectTables();
