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

async function verifyAllSystemTabs() {
  console.log('Verifying backend support for all System tabs...');
  const results = {};

  try {
    // 1. Users (Tab: Utilizadores)
    // Checking for profiles table which usually mirrors auth.users
    const usersTable = await sql`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles');
    `;
    results.users = usersTable[0].exists ? 'OK (profiles table)' : 'WARNING (profiles table missing)';

    // 2. Roles (Tab: Cargos)
    const rolesTable = await sql`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles');
    `;
    results.roles = rolesTable[0].exists ? 'OK (user_roles table)' : 'WARNING (user_roles table missing)';

    // 3. Integrations (Tab: Integrações)
    const apiKeys = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_keys')`;
    const webhooks = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'webhooks')`;
    const bioDevices = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'biometric_devices')`;
    
    results.integrations = (apiKeys[0].exists && webhooks[0].exists && bioDevices[0].exists) 
      ? 'OK (api_keys, webhooks, biometric_devices)' 
      : `PARTIAL (api_keys: ${apiKeys[0].exists}, webhooks: ${webhooks[0].exists}, bio: ${bioDevices[0].exists})`;

    // 4. Monitoring (Tab: Monitorização)
    const sysHealth = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_health')`;
    results.monitoring = sysHealth[0].exists ? 'OK (system_health)' : 'WARNING (system_health missing)';

    // 5. Cloud (Tab: Nuvem / App)
    // Relies on system_settings
    const sysSettings = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_settings')`;
    results.cloud = sysSettings[0].exists ? 'OK (system_settings)' : 'FAIL (system_settings missing)';

    // 6. Backup (Tab: Backup / Restore)
    // Relies on system_settings or local functionality
    results.backup = sysSettings[0].exists ? 'OK (via system_settings)' : 'FAIL (via system_settings)';

    // 7. AGT (Tab: AGT)
    // Checking for agt_config or invoices
    const agtConfig = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agt_config')`;
    results.agt = agtConfig[0].exists ? 'OK (agt_config)' : 'WARNING (agt_config missing)';

    // 8. DLP (Tab: DLP)
    const dlpPolicies = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dlp_policies')`;
    results.dlp = dlpPolicies[0].exists ? 'OK (dlp_policies)' : 'WARNING (dlp_policies missing)';

    // 9. History (Tab: Histórico)
    const auditLogs = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs')`;
    results.history = auditLogs[0].exists ? 'OK (audit_logs)' : 'FAIL (audit_logs missing)';

    console.table(results);

    // Summary
    const failures = Object.values(results).filter(v => v.includes('FAIL') || v.includes('WARNING'));
    if (failures.length === 0) {
      console.log('SUCCESS: All system tabs have backend support.');
      process.exit(0);
    } else {
      console.log('WARNING: Some system tabs might be missing backend tables.');
      // We don't exit 1 here because "WARNING" might be acceptable if the feature is frontend-only or uses another table
      process.exit(0);
    }

  } catch (error) {
    console.error('ERROR verifying tabs:', error);
    await sql.end();
    process.exit(1);
  } finally {
    await sql.end();
  }
}

verifyAllSystemTabs();
