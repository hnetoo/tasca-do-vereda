// CHECK ORDERS TABLE STRUCTURE - Versão corrigida sem erros de template literals
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const sql = postgres(connectionString);

async function checkOrdersTable() {
  console.log('🔍 CHECKING ORDERS TABLE STRUCTURE...');
  
  try {
    // Step 1: Verificar se a tabela existe
    const tableExists = await sql(
      'SELECT ' +
        "'Table exists' as status, ' +
        'table_name, ' +
        'table_type ' +
        'FROM information_schema.tables ' +
        'WHERE table_name = $1',
      ['orders']
    );
    
    console.log('📊 Table exists:', tableExists);
    
    // Step 2: Verificar estrutura COMPLETA da tabela
    const tableStructure = await sql(
      'SELECT ' +
        'column_name, ' +
        'data_type, ' +
        'is_nullable, ' +
        'column_default, ' +
        'character_maximum_length, ' +
        'numeric_precision, ' +
        'numeric_scale ' +
        'FROM information_schema.columns ' +
        'WHERE table_name = $1 ' +
        'ORDER BY ordinal_position',
      ['orders']
    );
    
    console.log('📋 Table structure:');
    tableStructure.forEach(col => {
      console.log('  - ' + col.column_name + ': ' + col.data_type + ' (nullable: ' + col.is_nullable + ')');
    });
    
    // Step 3: Verificar se tem colunas específicas
    const columnCheck = await sql(
      'SELECT ' +
        "'Has id column' as has_id, ' +
        "'Has order_number column' as has_order_number, ' +
        "'Has table_id column' as has_table_id, ' +
        "'Has status column' as has_status, ' +
        "'Has total column' as has_total, ' +
        "'Has items column' as has_items, ' +
        "'Has created_at column' as has_created_at, ' +
        "'Has updated_at column' as has_updated_at ' +
        'FROM information_schema.columns ' +
        'WHERE table_name = $1 ' +
        'AND column_name IN ($2, $3, $4, $5, $6, $7, $8, $9) ' +
        'GROUP BY ' +
        'CASE ' +
        'WHEN column_name = $1 THEN $11 ' +
        'WHEN column_name = $2 THEN $12 ' +
        'WHEN column_name = $3 THEN $13 ' +
        'WHEN column_name = $4 THEN $14 ' +
        'WHEN column_name = $5 THEN $15 ' +
        'WHEN column_name = $6 THEN $16 ' +
        'WHEN column_name = $7 THEN $17 ' +
        'WHEN column_name = $8 THEN $18 ' +
        'ELSE $19 ' +
        'END ' +
        'ORDER BY ' +
        'CASE ' +
        'WHEN column_name = $1 THEN 1 ' +
        'WHEN column_name = $2 THEN 2 ' +
        'WHEN column_name = $3 THEN 3 ' +
        'WHEN column_name = $4 THEN 4 ' +
        'WHEN column_name = $5 THEN 5 ' +
        'WHEN column_name = $6 THEN 6 ' +
        'WHEN column_name = $7 THEN 7 ' +
        'WHEN column_name = $8 THEN 8 ' +
        'ELSE 9 ' +
        'END',
      ['id', 'order_number', 'table_id', 'status', 'total', 'items', 'created_at', 'updated_at']
    );
    
    console.log('📊 Column check results:');
    columnCheck.forEach(col => {
      console.log('  - ' + (col.has_id ? '✅' : '❌') + ' Has id column: ' + col.has_id);
      console.log('  - ' + (col.has_order_number ? '✅' : '❌') + ' Has order_number column: ' + col.has_order_number);
      console.log('  - ' + (col.has_table_id ? '✅' : '❌') + ' Has table_id column: ' + col.has_table_id);
      console.log('  - ' + (col.has_status ? '✅' : '❌') + ' Has status column: ' + col.has_status);
      console.log('  - ' + (col.has_total ? '✅' : '❌') + ' Has total column: ' + col.has_total);
      console.log('  - ' + (col.has_items ? '✅' : '❌') + ' Has items column: ' + col.has_items);
      console.log('  - ' + (col.has_created_at ? '✅' : '❌') + ' Has created_at column: ' + col.has_created_at);
      console.log('  - ' + (col.has_updated_at ? '✅' : '❌') + ' Has updated_at column: ' + col.has_updated_at);
    });
    
    // Step 4: Mostrar dados amostra
    const sampleData = await sql(
      'SELECT ' +
        "'Sample data' as info, ' +
        'id, ' +
        'order_number, ' +
        'table_id, ' +
        'status, ' +
        'total, ' +
        'created_at ' +
        'FROM orders ' +
        'LIMIT 3',
      []
    );
    
    console.log('📋 Sample data:');
    sampleData.forEach(row => {
      console.log('  - ' + row.order_number + ': ' + row.id + ' (' + row.table_id + ') - ' + row.status + ' - ' + row.total);
    });
    
  } catch (error) {
    console.error('❌ Error checking orders table:', error.message);
  } finally {
    await sql.end();
  }
}

checkOrdersTable();
