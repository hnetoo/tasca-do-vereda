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

async function fixAnalyticsRls() {
  console.log('Fixing RLS policies for daily_analytics table...');
  try {
    // Check if table exists
    const tableExists = await sql`SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'daily_analytics'
    )`;

    if (tableExists[0].exists) {
        // 1. Enable RLS
        await sql`ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY`;
        console.log('RLS enabled for daily_analytics table.');

        // 2. Grant permissions
        await sql`GRANT ALL ON daily_analytics TO anon, authenticated, service_role`;
        console.log('Permissions granted for daily_analytics table.');

        // 3. Create policies
        await sql`DROP POLICY IF EXISTS "Enable read access for all users" ON daily_analytics`;
        await sql`DROP POLICY IF EXISTS "Enable insert for all users" ON daily_analytics`;
        await sql`DROP POLICY IF EXISTS "Enable update for all users" ON daily_analytics`;
        await sql`DROP POLICY IF EXISTS "Enable delete for all users" ON daily_analytics`;

        await sql`CREATE POLICY "Enable read access for all users" ON daily_analytics FOR SELECT USING (true)`;
        await sql`CREATE POLICY "Enable insert for all users" ON daily_analytics FOR INSERT WITH CHECK (true)`;
        await sql`CREATE POLICY "Enable update for all users" ON daily_analytics FOR UPDATE USING (true)`;
        await sql`CREATE POLICY "Enable delete for all users" ON daily_analytics FOR DELETE USING (true)`;
        
        console.log('Policies created for daily_analytics table.');
    } else {
        console.log('Table daily_analytics does not exist.');
    }

  } catch (error: any) {
    console.error('Error fixing RLS policies:', error);
  } finally {
    await sql.end();
  }
}

fixAnalyticsRls();
