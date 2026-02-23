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

async function ensureSystemTables() {
  console.log('Ensuring system tables exist...');

  try {
    // 1. Audit Logs
    console.log('Checking/Creating audit_logs...');
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id TEXT,
        details JSONB DEFAULT '{}',
        user_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    // Add RLS for audit_logs
    await sql`ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY`;
    await sql`DROP POLICY IF EXISTS "Enable read for authenticated users" ON audit_logs`;
    await sql`CREATE POLICY "Enable read for authenticated users" ON audit_logs FOR SELECT USING (auth.role() = 'authenticated')`;
    await sql`DROP POLICY IF EXISTS "Enable insert for authenticated users" ON audit_logs`;
    await sql`CREATE POLICY "Enable insert for authenticated users" ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated')`;

    // 2. API Keys
    console.log('Checking/Creating api_keys...');
    await sql`
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        key_hash TEXT NOT NULL,
        scopes TEXT[] DEFAULT '{}',
        created_by UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        last_used_at TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT TRUE
      );
    `;
    await sql`ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY`;
    // Simplified RLS for now - allow all authenticated to read/write for admin dashboard
    await sql`DROP POLICY IF EXISTS "Enable all for authenticated users" ON api_keys`;
    await sql`CREATE POLICY "Enable all for authenticated users" ON api_keys USING (auth.role() = 'authenticated')`;

    // 3. Webhooks
    console.log('Checking/Creating webhooks...');
    await sql`
      CREATE TABLE IF NOT EXISTS webhooks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        url TEXT NOT NULL,
        events TEXT[] NOT NULL,
        secret TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY`;
    await sql`DROP POLICY IF EXISTS "Enable all for authenticated users" ON webhooks`;
    await sql`CREATE POLICY "Enable all for authenticated users" ON webhooks USING (auth.role() = 'authenticated')`;

    // 4. Biometric Devices
    console.log('Checking/Creating biometric_devices...');
    await sql`
      CREATE TABLE IF NOT EXISTS biometric_devices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        port INTEGER DEFAULT 4370,
        status TEXT DEFAULT 'offline',
        last_sync TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE biometric_devices ENABLE ROW LEVEL SECURITY`;
    await sql`DROP POLICY IF EXISTS "Enable all for authenticated users" ON biometric_devices`;
    await sql`CREATE POLICY "Enable all for authenticated users" ON biometric_devices USING (auth.role() = 'authenticated')`;

    // 5. System Health
    console.log('Checking/Creating system_health...');
    await sql`
      CREATE TABLE IF NOT EXISTS system_health (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        component TEXT NOT NULL,
        status TEXT NOT NULL,
        latency INTEGER,
        details JSONB DEFAULT '{}',
        checked_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE system_health ENABLE ROW LEVEL SECURITY`;
    await sql`DROP POLICY IF EXISTS "Enable all for authenticated users" ON system_health`;
    await sql`CREATE POLICY "Enable all for authenticated users" ON system_health USING (auth.role() = 'authenticated')`;
    
    // 6. DLP Policies
     console.log('Checking/Creating dlp_policies...');
    await sql`
      CREATE TABLE IF NOT EXISTS dlp_policies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        data_type TEXT NOT NULL,
        action TEXT NOT NULL, -- 'mask', 'block', 'audit'
        pattern TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE dlp_policies ENABLE ROW LEVEL SECURITY`;
    await sql`DROP POLICY IF EXISTS "Enable all for authenticated users" ON dlp_policies`;
    await sql`CREATE POLICY "Enable all for authenticated users" ON dlp_policies USING (auth.role() = 'authenticated')`;

    // 7. User Roles
    console.log('Checking/Creating user_roles...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        permissions JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, role)
      );
    `;
    await sql`ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY`;
    await sql`DROP POLICY IF EXISTS "Enable read for authenticated users" ON user_roles`;
    await sql`CREATE POLICY "Enable read for authenticated users" ON user_roles FOR SELECT USING (auth.role() = 'authenticated')`;
    
    // Fix: Ensure we drop the correct policy before creating it
    await sql`DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_roles`;
    // Also drop the old admin policy if it exists, to clean up
    await sql`DROP POLICY IF EXISTS "Enable all for admin users" ON user_roles`;
    
    // Simplified for now - allow authenticated users to manage roles (should be restricted in production)
    await sql`CREATE POLICY "Enable all for authenticated users" ON user_roles USING (auth.role() = 'authenticated')`;

    // 8. AGT Config
    console.log('Checking/Creating agt_config...');
    await sql`
      CREATE TABLE IF NOT EXISTS agt_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_nif TEXT,
        certificate_status TEXT DEFAULT 'missing',
        last_saft_export TIMESTAMPTZ,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE agt_config ENABLE ROW LEVEL SECURITY`;
    await sql`DROP POLICY IF EXISTS "Enable all for authenticated users" ON agt_config`;
    await sql`CREATE POLICY "Enable all for authenticated users" ON agt_config USING (auth.role() = 'authenticated')`;



    console.log('All system tables ensured successfully.');
    await sql.end();
    process.exit(0);

  } catch (error) {
    console.error('ERROR creating tables:', error);
    await sql.end();
    process.exit(1);
  }
}

ensureSystemTables();
