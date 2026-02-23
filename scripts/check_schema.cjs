require('dotenv').config();
const postgres = require('postgres');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  ssl: { rejectUnauthorized: false },
  max: 1
});

const tableName = process.argv[2] || 'system_settings';

async function checkSchema() {
  console.log(`Checking schema for ${tableName}...`);
  
  try {
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = ${tableName}
    `;

    console.log(`Columns in ${tableName}:`, columns);
  } catch (error) {
    console.error('ERROR querying database:', error);
  } finally {
    await sql.end();
  }
}

checkSchema();
