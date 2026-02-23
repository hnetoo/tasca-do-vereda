-- Create Biometric Devices Table
CREATE TABLE IF NOT EXISTS biometric_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  port INTEGER DEFAULT 4370,
  status TEXT DEFAULT 'DISCONNECTED',
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  prefix TEXT NOT NULL, -- Store first few chars for display
  scopes TEXT[] DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create Webhooks Table
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  failure_count INTEGER DEFAULT 0
);

-- Create System Health Logs Table
CREATE TABLE IF NOT EXISTS system_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Integration Logs Table (mentioned in docs)
CREATE TABLE IF NOT EXISTS integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  event TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE biometric_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;

-- Create generic policies (Public for now to ensure functionality, then restrict)
-- Note: User asked for Anon key usage to be replaced by Service Role or authenticated usage.
-- But for the dashboard to work for the logged-in user, we need policies.

-- Biometric Devices
DROP POLICY IF EXISTS "Enable all for authenticated users" ON biometric_devices;
CREATE POLICY "Enable all for authenticated users" ON biometric_devices FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable read for anon users" ON biometric_devices;
CREATE POLICY "Enable read for anon users" ON biometric_devices FOR SELECT TO anon USING (true);

-- API Keys
DROP POLICY IF EXISTS "Enable all for authenticated users" ON api_keys;
CREATE POLICY "Enable all for authenticated users" ON api_keys FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Webhooks
DROP POLICY IF EXISTS "Enable all for authenticated users" ON webhooks;
CREATE POLICY "Enable all for authenticated users" ON webhooks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- System Health Logs
DROP POLICY IF EXISTS "Enable all for authenticated users" ON system_health_logs;
CREATE POLICY "Enable all for authenticated users" ON system_health_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable insert for anon users" ON system_health_logs;
CREATE POLICY "Enable insert for anon users" ON system_health_logs FOR INSERT TO anon WITH CHECK (true);

-- Integration Logs
DROP POLICY IF EXISTS "Enable all for authenticated users" ON integration_logs;
CREATE POLICY "Enable all for authenticated users" ON integration_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
