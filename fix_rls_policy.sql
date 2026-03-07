-- Fix RLS Policy for Payroll Table
-- This script creates/updates RLS policies to allow proper access

-- Enable RLS on payroll table
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own payroll";
DROP POLICY IF EXISTS "Users can insert own payroll";
DROP POLICY IF EXISTS "Users can update own payroll";
DROP POLICY IF EXISTS "Users can delete own payroll";

-- Create comprehensive RLS policies
-- 1. Allow authenticated users to read all payroll records
CREATE POLICY "Users can view all payroll" ON payroll
    FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Allow authenticated users to insert payroll records
CREATE POLICY "Users can insert payroll" ON payroll
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Allow authenticated users to update payroll records
CREATE POLICY "Users can update payroll" ON payroll
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. Allow authenticated users to delete payroll records
CREATE POLICY "Users can delete payroll" ON payroll
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL ON payroll TO authenticated;
GRANT ALL ON payroll TO anon;

-- Verify policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'payroll';
