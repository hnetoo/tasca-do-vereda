-- Enable read access for financial tables for anonymous users (Dashboard)
-- This ensures the admin dashboard can read all financial data without Supabase Auth login

-- Expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON expenses;
CREATE POLICY "Enable read access for all users" ON expenses FOR SELECT TO anon USING (true);
GRANT SELECT ON TABLE expenses TO anon;

-- Revenues
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON revenues;
CREATE POLICY "Enable read access for all users" ON revenues FOR SELECT TO anon USING (true);
GRANT SELECT ON TABLE revenues TO anon;

-- Cash Shifts
ALTER TABLE cash_shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON cash_shifts;
CREATE POLICY "Enable read access for all users" ON cash_shifts FOR SELECT TO anon USING (true);
GRANT SELECT ON TABLE cash_shifts TO anon;
