require('dotenv').config();
const postgres = require('postgres');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  ssl: { rejectUnauthorized: false }, // Supabase requires SSL, but pooler might need this
  max: 1
});

async function validateSchema() {
  console.log('Validating schema with direct Postgres connection...');
  
  try {
    // Check if system_settings table exists
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_settings'
      );
    `;

    if (result && result[0] && result[0].exists) {
      console.log('SUCCESS: Table "system_settings" exists.');
      await sql.end();
      process.exit(0);
    } else {
      console.error('FAIL: Table "system_settings" does not exist.');
      await sql.end();
      process.exit(1);
    }
  } catch (error) {
    console.error('ERROR querying database:', error);
    await sql.end();
    process.exit(1);
  }
}

validateSchema();
