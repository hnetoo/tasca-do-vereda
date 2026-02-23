const postgres = require('postgres');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  ssl: { rejectUnauthorized: false },
  max: 1
});

async function createAuditLogsTable() {
  console.log('Creating audit_logs table if not exists...');
  
  try {
    // 1. Create table
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        action TEXT NOT NULL,
        details JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log('Table audit_logs created/verified.');

    // 2. Enable RLS
    await sql`ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY`;
    console.log('RLS enabled for audit_logs.');

    // 3. Create policies (Allow all for now to ensure functionality, verify later)
    // Drop existing policies to avoid conflicts
    await sql`DROP POLICY IF EXISTS "Enable read access for all users" ON audit_logs`;
    await sql`DROP POLICY IF EXISTS "Enable insert for all users" ON audit_logs`;
    
    await sql`
      CREATE POLICY "Enable read access for all users" ON audit_logs
      FOR SELECT USING (true);
    `;
    
    await sql`
      CREATE POLICY "Enable insert for all users" ON audit_logs
      FOR INSERT WITH CHECK (true);
    `;
    console.log('RLS policies applied to audit_logs.');

  } catch (error) {
    console.error('Error creating audit_logs table:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

createAuditLogsTable();
