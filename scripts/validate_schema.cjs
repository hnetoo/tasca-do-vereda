
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Service Role Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateSchema() {
  console.log('Validating schema...');
  
  // Check if system_settings table exists by selecting from it
  const { data, error } = await supabase
    .from('system_settings')
    .select('id')
    .limit(1);

  if (error) {
    // If error is "relation does not exist", table is missing
    if (error.code === '42P01') {
      console.error('FAIL: Table "system_settings" does not exist.');
      process.exit(1);
    }
    console.error('ERROR querying system_settings:', error);
    process.exit(1);
  }

  console.log('SUCCESS: Table "system_settings" exists.');
  process.exit(0);
}

validateSchema();
