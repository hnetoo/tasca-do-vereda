// Test script to verify Supabase connection and data
const { createClient } = require('@supabase/supabase-js');

// Use environment variables from .env
const supabaseUrl = 'https://myppylcyupoirizyxhpo.supabase.co';
const supabaseKey = 'sb_publishable_2SbZ5lNBbE9KHxbwRobOSQ_G4WQ2q6K';

console.log('🔍 Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Check if we can connect
    console.log('\n📡 Testing basic connection...');
    const { data, error } = await supabase.from('restaurant_tables').select('count');
    
    if (error) {
      console.error('❌ Connection error:', error);
      return;
    }
    
    console.log('✅ Connection successful!');
    console.log('📊 Tables count:', data);

    // Test 2: Get all tables
    console.log('\n🪑 Fetching restaurant tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('restaurant_tables')
      .select('*');
    
    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError);
      return;
    }
    
    console.log('✅ Tables fetched successfully!');
    console.log('📋 Tables found:', tables.length);
    tables.forEach(table => {
      console.log(`  - ${table.name} (ID: ${table.id}, Zone: ${table.zone || 'N/A'})`);
    });

    // Test 3: Get dishes
    console.log('\n🍽️ Fetching dishes...');
    const { data: dishes, error: dishesError } = await supabase
      .from('dishes')
      .select('*')
      .limit(5);
    
    if (dishesError) {
      console.error('❌ Error fetching dishes:', dishesError);
      return;
    }
    
    console.log('✅ Dishes fetched successfully!');
    console.log('🍴 Sample dishes:');
    dishes.forEach(dish => {
      console.log(`  - ${dish.name} (${dish.price} Kz)`);
    });

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testConnection();
