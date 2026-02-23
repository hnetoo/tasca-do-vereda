const postgres = require('postgres');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
const sql = postgres(databaseUrl, { ssl: { rejectUnauthorized: false }, max: 1 });

async function checkOwnerDashboardRLS() {
  console.log('Checking Owner Dashboard RLS (Orders)...');
  try {
    const policies = await sql`
      SELECT policyname, cmd, roles 
      FROM pg_policies 
      WHERE tablename = 'orders'
    `;
    
    const selectPolicy = policies.find(p => p.cmd === 'SELECT');
    
    if (selectPolicy) {
      console.log('SUCCESS: Select policy exists for orders.');
      // Optionally check if it allows authenticated users
      // Assuming verification script handled logic details
    } else {
      console.warn('WARNING: Missing Select policy for orders.');
    }
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('ERROR checking Owner Dashboard RLS:', error);
    await sql.end();
    process.exit(1);
  }
}

checkOwnerDashboardRLS();
