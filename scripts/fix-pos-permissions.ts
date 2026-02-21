
import dotenv from 'dotenv';
import postgres from 'postgres';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is missing in .env.local');
  process.exit(1);
}

const sql = postgres(databaseUrl, { ssl: 'require' });

async function fixPermissions() {
  console.log('Fixing permissions for restaurant_tables...');
  try {
    // 1. Grant usage on schema public (idempotent)
    await sql`GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role`;

    // 2. Grant ALL on restaurant_tables to authenticated and service_role
    await sql`GRANT ALL ON restaurant_tables TO authenticated, service_role`;
    
    // 3. Grant SELECT on restaurant_tables to anon (so public/kiosk can see tables)
    await sql`GRANT SELECT ON restaurant_tables TO anon`;

    // 4. Ensure RLS is enabled
    await sql`ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY`;

    // 5. Create/Update Policies
    
    // Policy for Authenticated Users (Full Access)
    // Drop first to avoid conflict
    await sql`DROP POLICY IF EXISTS "Authenticated users can do everything on restaurant_tables" ON restaurant_tables`;
    await sql`CREATE POLICY "Authenticated users can do everything on restaurant_tables" ON restaurant_tables FOR ALL TO authenticated USING (true) WITH CHECK (true)`;

    // Policy for Anon Users (Read Only)
    await sql`DROP POLICY IF EXISTS "Anon users can view restaurant_tables" ON restaurant_tables`;
    await sql`CREATE POLICY "Anon users can view restaurant_tables" ON restaurant_tables FOR SELECT TO anon USING (true)`;

    console.log('Permissions fixed successfully!');
    
    // 6. Verify Realtime
    const publication = await sql`SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'restaurant_tables'`;
    if (publication.length === 0) {
        console.log('Adding restaurant_tables to supabase_realtime publication...');
        await sql`ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_tables`;
    } else {
        console.log('restaurant_tables is already in supabase_realtime publication.');
    }

  } catch (error) {
    console.error('Error fixing permissions:', error);
  } finally {
    await sql.end();
  }
}

fixPermissions();
