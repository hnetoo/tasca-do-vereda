
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import postgres from 'postgres';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking schema for restaurant_tables...');

  if (databaseUrl) {
    console.log('Using direct SQL connection via DATABASE_URL to check schema...');
    const sql = postgres(databaseUrl, { ssl: 'require' });
    try {
        const columns = await sql`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'restaurant_tables'
            AND table_schema = 'public'
        `;
        
        if (columns.length > 0) {
            console.log('Table found in information_schema. Columns:');
            console.table(columns);
        } else {
            console.error('Table restaurant_tables NOT found in information_schema!');
        }

        // Check if RLS is enabled
        const rls = await sql`
            SELECT relname, relrowsecurity 
            FROM pg_class 
            WHERE relname = 'restaurant_tables'
        `;
        console.log('RLS Status:', rls);

    } catch (err) {
        console.error('Error querying database directly:', err);
    } finally {
        await sql.end();
    }
  } else {
    console.log('DATABASE_URL not found, falling back to Supabase client...');
  }
  
  // Try to select one row via Client to test RLS/Connectivity
  console.log('Testing Supabase Client connection...');
  const { data: rows, error: selectError } = await supabase
    .from('restaurant_tables')
    .select('*')
    .limit(1);
    
  if (selectError) {
    console.error('Error selecting from restaurant_tables via Client:', selectError);
  } else {
    console.log('Successfully selected from restaurant_tables via Client.');
    if (rows && rows.length > 0) {
        console.log('First row data:', rows[0]);
    } else {
        console.log('Table is empty (via Client).');
    }
  }
}

checkSchema();
