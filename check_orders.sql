
-- -- Check if there are any orders and their timestamps
SELECT id, created_at, status, total FROM orders ORDER BY created_at DESC LIMIT 10;

-- Check RLS policies on orders
SELECT * FROM pg_policies WHERE tablename = 'orders';
