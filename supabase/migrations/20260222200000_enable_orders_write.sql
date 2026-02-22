-- Enable write access for anon and authenticated users on orders and order_items
-- This is necessary because the admin operations now use the anon key as fallback

-- Policy for orders
DROP POLICY IF EXISTS "Enable insert for authenticated and anon users" ON "public"."orders";
DROP POLICY IF EXISTS "Enable update for authenticated and anon users" ON "public"."orders";
DROP POLICY IF EXISTS "Enable delete for authenticated and anon users" ON "public"."orders";

CREATE POLICY "Enable insert for authenticated and anon users" ON "public"."orders"
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated and anon users" ON "public"."orders"
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated and anon users" ON "public"."orders"
FOR DELETE
TO anon, authenticated
USING (true);

-- Policy for order_items
DROP POLICY IF EXISTS "Enable insert for authenticated and anon users" ON "public"."order_items";
DROP POLICY IF EXISTS "Enable update for authenticated and anon users" ON "public"."order_items";
DROP POLICY IF EXISTS "Enable delete for authenticated and anon users" ON "public"."order_items";

CREATE POLICY "Enable insert for authenticated and anon users" ON "public"."order_items"
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated and anon users" ON "public"."order_items"
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated and anon users" ON "public"."order_items"
FOR DELETE
TO anon, authenticated
USING (true);
