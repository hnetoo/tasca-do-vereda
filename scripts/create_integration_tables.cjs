const postgres = require('postgres');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

const sql = postgres(databaseUrl, {
  ssl: { rejectUnauthorized: false },
  max: 1
});

async function createIntegrationTables() {
  console.log('Creating integration tables...');
  
  try {
    // 1. API Keys
    await sql`
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        key TEXT NOT NULL UNIQUE,
        secret TEXT NOT NULL,
        scopes TEXT[] DEFAULT '{}',
        status TEXT DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_used TIMESTAMPTZ
      );
    `;
    console.log('Table api_keys created/verified.');

    // 2. Webhooks
    await sql`
      CREATE TABLE IF NOT EXISTS webhooks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        events TEXT[] DEFAULT '{}',
        headers JSONB DEFAULT '{}'::jsonb,
        status TEXT DEFAULT 'ACTIVE',
        failure_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_triggered TIMESTAMPTZ
      );
    `;
    console.log('Table webhooks created/verified.');

    // 3. Biometric Devices
    await sql`
      CREATE TABLE IF NOT EXISTS biometric_devices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        type TEXT DEFAULT 'ZKTECO',
        ip_address TEXT NOT NULL,
        port INTEGER DEFAULT 4370,
        location TEXT,
        api_key TEXT,
        status TEXT DEFAULT 'DISCONNECTED',
        sync_interval INTEGER DEFAULT 60,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        last_sync TIMESTAMPTZ
      );
    `;
    console.log('Table biometric_devices created/verified.');

    // 4. System Health
    await sql`
      CREATE TABLE IF NOT EXISTS system_health (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        component TEXT NOT NULL,
        status TEXT NOT NULL,
        latency INTEGER,
        details JSONB DEFAULT '{}'::jsonb,
        last_checked TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log('Table system_health created/verified.');

    // Enable RLS for all
    await sql`ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY`;
    await sql`ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY`;
    await sql`ALTER TABLE biometric_devices ENABLE ROW LEVEL SECURITY`;
    await sql`ALTER TABLE system_health ENABLE ROW LEVEL SECURITY`;

    // Create default permissive policies (to be refined)
    const tables = ['api_keys', 'webhooks', 'biometric_devices', 'system_health'];
    
    for (const table of tables) {
      await sql`DROP POLICY IF EXISTS "Enable read access for all users" ON ${sql(table)}`;
      await sql`DROP POLICY IF EXISTS "Enable insert for all users" ON ${sql(table)}`;
      await sql`DROP POLICY IF EXISTS "Enable update for all users" ON ${sql(table)}`;
      await sql`DROP POLICY IF EXISTS "Enable delete for all users" ON ${sql(table)}`;

      await sql`
        CREATE POLICY "Enable read access for all users" ON ${sql(table)}
        FOR SELECT USING (true);
      `;
      await sql`
        CREATE POLICY "Enable insert for all users" ON ${sql(table)}
        FOR INSERT WITH CHECK (true);
      `;
      await sql`
        CREATE POLICY "Enable update for all users" ON ${sql(table)}
        FOR UPDATE USING (true);
      `;
      await sql`
        CREATE POLICY "Enable delete for all users" ON ${sql(table)}
        FOR DELETE USING (true);
      `;
    }
    console.log('RLS policies applied to integration tables.');

  } catch (error) {
    console.error('Error creating integration tables:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

createIntegrationTables();
