const postgres = require('postgres');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

const sql = postgres(databaseUrl, {
  ssl: { rejectUnauthorized: false },
  max: 1
});

async function listTables() {
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.log('Tables in public schema:');
    tables.forEach(t => console.log(`- ${t.table_name}`));
  } catch (error) {
    console.error('Error listing tables:', error);
  } finally {
    await sql.end();
  }
}

listTables();
