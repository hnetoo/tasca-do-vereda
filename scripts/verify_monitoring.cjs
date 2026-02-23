const postgres = require('postgres');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

const sql = postgres(databaseUrl, {
  ssl: { rejectUnauthorized: false },
  max: 1
});

async function verifyMonitoring() {
  console.log('Verifying Monitoring (System Health)...');
  
  try {
    const healthCheck = {
      component: 'test_component',
      status: 'healthy',
      latency: 50,
      details: { test: true }
    };
    
    const insertedHealth = await sql`
      INSERT INTO system_health ${sql(healthCheck)} RETURNING id
    `;
    console.log('PASS: Insert System Health Log');
    
    const readHealth = await sql`SELECT * FROM system_health WHERE id = ${insertedHealth[0].id}`;
    if (readHealth.length > 0) console.log('PASS: Read System Health Log');
    else throw new Error('Failed to read System Health Log');
    
    await sql`DELETE FROM system_health WHERE id = ${insertedHealth[0].id}`;
    console.log('PASS: Delete System Health Log');

  } catch (error) {
    console.error('Verification Failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

verifyMonitoring();
