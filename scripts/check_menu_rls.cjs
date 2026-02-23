const postgres = require('postgres');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
const sql = postgres(databaseUrl, { ssl: { rejectUnauthorized: false }, max: 1 });

async function checkMenuRLS() {
  console.log('Checking Menu RLS Policies...');
  try {
    const policies = await sql`
      SELECT policyname, cmd, roles 
      FROM pg_policies 
      WHERE tablename = 'menu_categories'
    `;
    
    const insertPolicy = policies.find(p => p.cmd === 'INSERT');
    const updatePolicy = policies.find(p => p.cmd === 'UPDATE');
    
    if (insertPolicy && updatePolicy) {
      console.log('SUCCESS: Insert and Update policies exist for menu_categories.');
    } else {
      console.warn('WARNING: Missing Insert or Update policies for menu_categories.');
      // Attempt to fix?
      // Assuming fix is done via verify_rls_policies.cjs
    }
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('ERROR checking Menu RLS:', error);
    await sql.end();
    process.exit(1);
  }
}

checkMenuRLS();
