const postgres = require('postgres');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
const sql = postgres(databaseUrl, { ssl: { rejectUnauthorized: false }, max: 1 });

async function checkSyncIndicatorLogic() {
  console.log('Verifying Sync Indicator Backend (system_health)...');
  try {
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_health'
      );
    `;

    if (tableExists[0].exists) {
      console.log('SUCCESS: system_health table exists for sync status tracking.');
      // Check if we can write to it
      try {
        await sql`
          INSERT INTO system_health (component, status, details)
          VALUES ('sync_test', 'healthy', '{"test": true}')
          ON CONFLICT DO NOTHING
        `;
        // Clean up
        await sql`DELETE FROM system_health WHERE component = 'sync_test'`;
        console.log('SUCCESS: system_health table is writable.');
      } catch (err) {
        console.warn('WARNING: Could not write to system_health:', err.message);
      }
    } else {
      console.error('FAILURE: system_health table missing.');
      process.exit(1);
    }
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('ERROR checking Sync Indicator:', error);
    await sql.end();
    process.exit(1);
  }
}

checkSyncIndicatorLogic();
