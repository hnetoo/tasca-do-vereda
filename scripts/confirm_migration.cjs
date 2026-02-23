const postgres = require('postgres');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
const sql = postgres(databaseUrl, { ssl: { rejectUnauthorized: false }, max: 1 });

async function confirmMigration() {
  console.log('Confirming Data Migration Integrity...');
  try {
    const tables = [
      'profiles', 'menu_categories', 'dishes', 'orders', 
      'order_items', 'system_settings', 'biometric_devices'
    ];
    
    for (const table of tables) {
      try {
        const count = await sql`SELECT count(*) FROM ${sql(table)}`;
        console.log(`Table '${table}' has ${count[0].count} records.`);
      } catch (err) {
        console.warn(`WARNING: Could not count table '${table}': ${err.message}`);
      }
    }
    
    console.log('Migration confirmation completed.');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('ERROR confirming migration:', error);
    await sql.end();
    process.exit(1);
  }
}

confirmMigration();
