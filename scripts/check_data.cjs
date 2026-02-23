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

async function checkData() {
  console.log('Checking data in system_settings...');
  
  try {
    const data = await sql`SELECT * FROM system_settings`;
    console.log('Data in system_settings:', data);
  } catch (error) {
    console.error('ERROR querying database:', error);
  } finally {
    await sql.end();
  }
}

checkData();
