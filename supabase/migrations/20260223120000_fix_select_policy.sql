
-- ==========================================
-- 9. Audit Logs (Read/Write)
-- ==========================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON audit_logs;
CREATE POLICY "Enable read access for all users" ON audit_logs FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON audit_logs;
CREATE POLICY "Enable insert for all users" ON audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON audit_logs;
CREATE POLICY "Enable update for all users" ON audit_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON audit_logs;
CREATE POLICY "Enable delete for all users" ON audit_logs FOR DELETE TO anon, authenticated USING (true);

GRANT ALL ON TABLE audit_logs TO anon, authenticated;

-- ==========================================
-- 10. System Settings (Read/Write)
-- ==========================================
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON system_settings;
CREATE POLICY "Enable read access for all users" ON system_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON system_settings;
CREATE POLICY "Enable insert for all users" ON system_settings FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON system_settings;
CREATE POLICY "Enable update for all users" ON system_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON system_settings;
CREATE POLICY "Enable delete for all users" ON system_settings FOR DELETE TO anon, authenticated USING (true);

GRANT ALL ON TABLE system_settings TO anon, authenticated;
