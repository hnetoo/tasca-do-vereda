const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://myppylcyupoirizyxhpo.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não encontrado');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTable() {
  try {
    console.log('🔍 [TESTE] Verificando tabela orders...');
    
    // 1. Verificar se tabela existe
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'orders');
    
    if (tablesError) {
      console.error('❌ [TESTE] Erro ao verificar tabela:', tablesError);
    } else {
      console.log('✅ [TESTE] Tabela orders encontrada:', tables?.length > 0 ? 'SIM' : 'NÃO');
    }
    
    // 2. Verificar colunas da tabela orders
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'orders')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ [TESTE] Erro ao verificar colunas:', columnsError);
    } else {
      console.log('📋 [TESTE] Colunas da tabela orders:');
      columns?.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }
    
    // 3. Tentar ler um registro
    const { data: orders, error: readError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (readError) {
      console.error('❌ [TESTE] Erro ao ler orders:', readError);
    } else {
      console.log('✅ [TESTE] Leitura bem-sucedida, registros:', orders?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ [TESTE] Exceção:', error.message);
  }
}

testTable();
