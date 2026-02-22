
BEGIN;

-- Install pgtap if not already installed
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Plan the tests
SELECT plan(20);

-- 1. Check if tables exist
SELECT has_table('employees');
SELECT has_table('orders');
SELECT has_table('expenses');

-- 2. Test RLS is enabled
SELECT results_eq(
    'SELECT relrowsecurity FROM pg_class WHERE relname = ''orders''',
    ARRAY[true],
    'RLS should be enabled on orders'
);

-- 3. Test Helper Functions
-- Mock auth.uid() for testing requires some setup or specific testing capabilities.
-- Here we just check function existence.
SELECT has_function('is_admin_or_owner');
SELECT has_function('get_current_user_role');

-- 4. Test Policy Existence
SELECT policy_on_table('orders', 'Staff can create orders');
SELECT policy_on_table('expenses', 'Admins/Owners can manage expenses');

-- 5. Test Column Existence
SELECT has_column('orders', 'total');
SELECT has_column('employees', 'role');

-- 6. Test Default Values
SELECT col_default_is('orders', 'status', 'OPEN'::text);

-- 7. Test Triggers
SELECT has_trigger('orders', 'update_orders_updated_at');

-- 8. Test Role Constraints
SELECT col_is_pk('employees', 'id');

-- Finish the tests
SELECT * FROM finish();

ROLLBACK;
