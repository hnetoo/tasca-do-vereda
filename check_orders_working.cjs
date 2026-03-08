// CHECK ORDERS TABLE - Versão que funciona
const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const sql = postgres(connectionString);

async function checkOrdersTable() {
  console.log('🔍 CHECKING ORDERS TABLE STRUCTURE...');
  
  try {
    // Step 1: Verificar se a tabela existe
    const tableExistsResult = await sql`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_name = ${'orders'}
    `;
    
    const tableExists = tableExistsResult[0]?.count > 0;
    console.log('📊 Table exists:', tableExists ? 'YES' : 'NO');
    
    if (tableExists) {
      // Step 2: Verificar colunas que existem
      const columns = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = ${'orders'}
        ORDER BY ordinal_position
      `;
      
      console.log('📋 Table columns:');
      columns.forEach(col => {
        console.log('  - ' + col.column_name + ': ' + col.data_type);
      });
      
      // Step 3: Verificar colunas específicas
      const hasId = columns.some(col => col.column_name === 'id');
      const hasOrderNumber = columns.some(col => col.column_name === 'order_number');
      const hasTableId = columns.some(col => col.column_name === 'table_id');
      const hasStatus = columns.some(col => col.column_name === 'status');
      const hasTotal = columns.some(col => col.column_name === 'total');
      const hasItems = columns.some(col => col.column_name === 'items');
      const hasCreatedAt = columns.some(col => col.column_name === 'created_at');
      const hasUpdatedAt = columns.some(col => col.column_name === 'updated_at');
      
      console.log('📋 Column check results:');
      console.log('  - Has id column:', hasId ? 'YES' : 'NO');
      console.log('  - Has order_number column:', hasOrderNumber ? 'YES' : 'NO');
      console.log('  - Has table_id column:', hasTableId ? 'YES' : 'NO');
      console.log('  - Has status column:', hasStatus ? 'YES' : 'NO');
      console.log('  - Has total column:', hasTotal ? 'YES' : 'NO');
      console.log('  - Has items column:', hasItems ? 'YES' : 'NO');
      console.log('  - Has created_at column:', hasCreatedAt ? 'YES' : 'NO');
      console.log('  - Has updated_at column:', hasUpdatedAt ? 'YES' : 'NO');
      
      // Step 4: Mostrar dados amostra
      const sampleData = await sql`
        SELECT id, order_number, table_id, status, total, created_at
        FROM orders 
        LIMIT 3
      `;
      
      if (sampleData.length > 0) {
        console.log('📋 Sample data:');
        sampleData.forEach(row => {
          console.log('  - ' + row.order_number + ': ' + row.id + ' (' + row.table_id + ') - ' + row.status + ' - ' + row.total);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking orders table:', error.message);
  } finally {
    await sql.end();
  }
}

checkOrdersTable();
