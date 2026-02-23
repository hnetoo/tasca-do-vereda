const postgres = require('postgres');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is not defined in .env');
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  ssl: { rejectUnauthorized: false },
  max: 1
});

async function verifyRLS() {
  console.log('Verifying RLS Policies for critical tables...');
  
  const tablesToCheck = [
    'system_settings', 'audit_logs', 'api_keys', 'webhooks', 
    'biometric_devices', 'system_health', 'dlp_policies', 
    'user_roles', 'agt_config', 'orders', 'order_items', 
    'dishes', 'menu_categories'
  ];

  let allPassed = true;

  try {
    for (const table of tablesToCheck) {
      // Check if RLS is enabled
      const rlsCheck = await sql`
        SELECT relrowsecurity 
        FROM pg_class 
        WHERE oid = ${table}::regclass
      `;
      
      const isEnabled = rlsCheck[0]?.relrowsecurity;
      console.log(`Table '${table}': RLS Enabled = ${isEnabled}`);
      
      if (!isEnabled) {
        console.error(`FAILURE: RLS is NOT enabled for table '${table}'`);
        allPassed = false;
        
        // Attempt to fix
        console.log(`Attempting to enable RLS for '${table}'...`);
        try {
          await sql`ALTER TABLE ${sql(table)} ENABLE ROW LEVEL SECURITY`;
          console.log(`SUCCESS: RLS enabled for '${table}'`);
        } catch (err) {
          console.error(`ERROR enabling RLS for '${table}':`, err.message);
        }
      }

      // Check for policies
      const policies = await sql`
        SELECT policyname, cmd, roles 
        FROM pg_policies 
        WHERE tablename = ${table}
      `;

      if (policies.length === 0) {
        console.warn(`WARNING: No policies found for table '${table}'`);
      } else {
        console.log(`  - Policies found: ${policies.length}`);
        policies.forEach(p => {
          console.log(`    - ${p.policyname} (${p.cmd})`);
        });
      }
    }

    if (allPassed) {
      console.log('SUCCESS: All critical tables have RLS enabled.');
      process.exit(0);
    } else {
      console.error('FAILURE: Some tables have missing RLS protection.');
      process.exit(1);
    }

  } catch (error) {
    console.error('ERROR verifying RLS:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

verifyRLS();
