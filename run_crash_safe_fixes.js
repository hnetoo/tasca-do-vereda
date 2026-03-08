import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const sql = postgres(connectionString);

async function runCrashSafeFixes() {
  console.log('🚀 Starting CRASH-SAFE database fixes...');
  
  try {
    // Step 1: Executar fix_orders_crash_safe.sql
    console.log('📋 Executing fix_orders_crash_safe.sql...');
    const crashSafeSchema = fs.readFileSync(path.join(process.cwd(), 'fix_orders_crash_safe.sql'), 'utf8');
    await sql.unsafe(crashSafeSchema);
    console.log('✅ fix_orders_crash_safe.sql executed successfully');
    
    // Step 2: Verificar estrutura final
    console.log('🔍 Verifying final orders table structure...');
    const structureCheck = await sql`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `;
    
    console.log('📊 Orders table structure:', structureCheck);
    
    // Step 3: Teste de insert crash-safe
    console.log('🧪 Testing crash-safe insert...');
    const testInsert = await sql`
      INSERT INTO orders (
        id,
        order_number,
        table_id,
        status,
        total,
        tax_total,
        customer_name,
        created_at,
        updated_at,
        items
      ) VALUES (
        ${'crash-test-' + Date.now()},
        ${'CRASH-TEST-' + Date.now()},
        NULL,
        'pending',
        0.00,
        0.00,
        'Crash Test Customer',
        NOW(),
        NOW(),
        ${JSON.stringify([])}
      ) ON CONFLICT (id) DO NOTHING
      RETURNING id, order_number, status
    `;
    
    console.log('✅ Crash-safe test result:', testInsert);
    
    // Step 4: Limpar teste
    await sql`DELETE FROM orders WHERE order_number LIKE 'CRASH-TEST-%'`;
    
    console.log('🎉 All CRASH-SAFE fixes completed successfully!');
    console.log('📋 Orders table is now crash-safe and ready for POS!');
    
  } catch (error) {
    console.error('❌ Error in crash-safe fixes:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the crash-safe fixes
runCrashSafeFixes().catch(console.error);
