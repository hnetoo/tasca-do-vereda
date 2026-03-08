const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const sql = postgres(connectionString);

async function quickFix() {
  try {
    console.log('🚀 Quick UUID fix...');
    
    // Verificar tipo atual da coluna id
    const colType = await sql`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'id'
    `;
    
    console.log('📊 Current id column type:', colType[0]?.data_type);
    
    // Se for TEXT, converter para UUID
    if (colType[0]?.data_type === 'text') {
      console.log('🔧 Converting id column from TEXT to UUID...');
      await sql`ALTER TABLE orders ALTER COLUMN id TYPE UUID USING id::uuid`;
      console.log('✅ id column converted to UUID');
    }
    
    // Teste simples
    await sql`
      INSERT INTO orders (id, order_number, status, total, created_at, updated_at, items)
      VALUES (
        gen_random_uuid(),
        'FINAL-TEST',
        'pending',
        0.00,
        NOW(),
        NOW(),
        '[]'::jsonb
      ) ON CONFLICT (id) DO NOTHING
    `;
    
    console.log('✅ Final test successful');
    
    // Limpar
    await sql`DELETE FROM orders WHERE order_number = 'FINAL-TEST'`;
    
    console.log('🎉 UUID fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

quickFix();
