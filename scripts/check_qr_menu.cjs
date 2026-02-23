const postgres = require('postgres');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
const sql = postgres(databaseUrl, { ssl: { rejectUnauthorized: false }, max: 1 });

async function checkQRMenu() {
  console.log('Checking QR Menu Configuration...');
  try {
    const categories = await sql`SELECT count(*) FROM menu_categories`;
    const dishes = await sql`SELECT count(*) FROM dishes`;
    
    console.log(`Found ${categories[0].count} categories and ${dishes[0].count} dishes.`);
    
    // Check for public read policy
    const policies = await sql`
      SELECT policyname, cmd, roles 
      FROM pg_policies 
      WHERE tablename = 'menu_categories'
    `;
    
    const hasPublicRead = policies.some(p => p.roles.includes('public') || p.roles.includes('anon'));
    // Note: If no specific public policy, RLS might block. But usually "Enable read for all" is what we look for.
    // Or if RLS is disabled (not recommended).
    
    if (categories[0].count > 0) {
      console.log('SUCCESS: Menu data exists.');
    } else {
      console.warn('WARNING: No menu data found.');
    }
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('ERROR checking QR menu:', error);
    await sql.end();
    process.exit(1);
  }
}

checkQRMenu();
