import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Error: DATABASE_URL must be set in .env.local');
  process.exit(1);
}

const sql = postgres(databaseUrl, { ssl: 'require' });

async function fixOrdersRls() {
  console.log('Fixing RLS policies for orders table...');
  try {
    // 1. Enable RLS on orders table
    await sql`ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY`;
    console.log('RLS enabled for orders table.');

    // 2. Grant permissions to roles
    await sql`GRANT ALL ON orders TO anon, authenticated, service_role`;
    console.log('Permissions granted for orders table.');

    // 3. Create policies
    // Drop existing policies to avoid conflicts
    await sql`DROP POLICY IF EXISTS "Enable read access for all users" ON orders`;
    await sql`DROP POLICY IF EXISTS "Enable insert for all users" ON orders`;
    await sql`DROP POLICY IF EXISTS "Enable update for all users" ON orders`;
    await sql`DROP POLICY IF EXISTS "Enable delete for all users" ON orders`;

    // Create new permissive policies (for development/testing purposes as per request)
    await sql`CREATE POLICY "Enable read access for all users" ON orders FOR SELECT USING (true)`;
    await sql`CREATE POLICY "Enable insert for all users" ON orders FOR INSERT WITH CHECK (true)`;
    await sql`CREATE POLICY "Enable update for all users" ON orders FOR UPDATE USING (true)`;
    await sql`CREATE POLICY "Enable delete for all users" ON orders FOR DELETE USING (true)`;
    
    console.log('Policies created for orders table.');

    // Also fix for order_items if it exists
    const orderItemsExists = await sql`SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'order_items'
    )`;

    if (orderItemsExists[0].exists) {
        console.log('Fixing RLS policies for order_items table...');
        await sql`ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY`;
        await sql`GRANT ALL ON order_items TO anon, authenticated, service_role`;
        
        await sql`DROP POLICY IF EXISTS "Enable read access for all users" ON order_items`;
        await sql`DROP POLICY IF EXISTS "Enable insert for all users" ON order_items`;
        await sql`DROP POLICY IF EXISTS "Enable update for all users" ON order_items`;
        await sql`DROP POLICY IF EXISTS "Enable delete for all users" ON order_items`;

        await sql`CREATE POLICY "Enable read access for all users" ON order_items FOR SELECT USING (true)`;
        await sql`CREATE POLICY "Enable insert for all users" ON order_items FOR INSERT WITH CHECK (true)`;
        await sql`CREATE POLICY "Enable update for all users" ON order_items FOR UPDATE USING (true)`;
        await sql`CREATE POLICY "Enable delete for all users" ON order_items FOR DELETE USING (true)`;
        console.log('Policies created for order_items table.');
    }

  } catch (error: any) {
    console.error('Error fixing RLS policies:', error);
  } finally {
    await sql.end();
  }
}

fixOrdersRls();
