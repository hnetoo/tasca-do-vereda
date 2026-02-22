BEGIN;
SELECT plan(10);

-- 1. Test RLS is enabled
SELECT has_rls('public', 'employees', 'Employees table has RLS enabled');
SELECT has_rls('public', 'orders', 'Orders table has RLS enabled');
SELECT has_rls('public', 'transactions', 'Transactions table has RLS enabled');

-- 2. Test Policies exist
SELECT policy_cmd_is('public', 'employees', 'Admins/Owners can do everything on employees', 'ALL', 'Admin policy exists');
SELECT policy_cmd_is('public', 'orders', 'Staff can read orders', 'SELECT', 'Staff read policy exists');

-- 3. Test Function existence
SELECT has_function('public', 'is_admin_or_owner', 'is_admin_or_owner function exists');
SELECT has_function('public', 'handle_new_expense', 'handle_new_expense trigger function exists');

-- 4. Test Trigger existence
SELECT has_trigger('public', 'expenses', 'on_expense_insert', 'Expense trigger exists');
SELECT has_trigger('public', 'orders', 'on_order_completion', 'Order completion trigger exists');

SELECT * FROM finish();
ROLLBACK;
