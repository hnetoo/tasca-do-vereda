const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://myppylcyupoirizyxhpo.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não encontrado');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsertManual() {
  try {
    console.log('🔍 [TESTE MANUAL] Iniciando teste de insert manual...');
    
    // 1. Tentar insert manual simples
    const testData = {
      table_id: 'balcao-999',
      total: 10.50,
      items: [],
      status: 'ABERTO',
      payment_method: 'PENDING',
      customer_name: 'Teste Manual',
      customer_nif: null,
      order_number: `TEST-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('🔍 [TESTE MANUAL] Dados a inserir:', JSON.stringify(testData, null, 2));
    
    const { data, error } = await supabase
      .from('orders')
      .insert(testData);
    
    if (error) {
      console.error('❌ [TESTE MANUAL] Erro no insert manual:', error);
      console.error('❌ [TESTE MANUAL] Código:', error.code);
      console.error('❌ [TESTE MANUAL] Mensagem:', error.message);
      console.error('❌ [TESTE MANUAL] Detalhes:', error.details);
      console.error('❌ [TESTE MANUAL] Hint:', error.hint);
      
      // 2. Tentar verificar se é VIEW ou tabela
      console.log('🔍 [TESTE MANUAL] Verificando se orders é tabela ou VIEW...');
      
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('get_table_info', { table_name: 'orders' })
        .catch(() => ({ data: null, error: { message: 'RPC não disponível' } }));
      
      if (tableError) {
        console.log('🔍 [TESTE MANUAL] RPC não disponível, tentando método alternativo...');
        
        // Tentar ler estrutura da tabela
        const { data: structure, error: structError } = await supabase
          .from('orders')
          .select('*')
          .limit(1);
        
        if (structError) {
          console.error('❌ [TESTE MANUAL] Erro ao ler estrutura:', structError);
        } else {
          console.log('✅ [TESTE MANUAL] Estrutura da tabela orders:');
          if (structure && structure.length > 0) {
            console.log('📋 [TESTE MANUAL] Colunas encontradas:', Object.keys(structure[0]));
          } else {
            console.log('📋 [TESTE MANUAL] Tabela vazia, mas estrutura acessível');
          }
        }
      }
      
    } else {
      console.log('✅ [TESTE MANUAL] Insert manual bem-sucedido!');
      console.log('🔍 [TESTE MANUAL] Dados retornados:', data);
      
      // 3. Tentar ler o registro inserido
      if (data && data.length > 0) {
        const insertedId = data[0].id;
        console.log('🔍 [TESTE MANUAL] ID do registro inserido:', insertedId);
        
        const { data: readData, error: readError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', insertedId)
          .single();
        
        if (readError) {
          console.error('❌ [TESTE MANUAL] Erro ao ler registro inserido:', readError);
        } else {
          console.log('✅ [TESTE MANUAL] Registro lido com sucesso:', readData);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ [TESTE MANUAL] Exceção:', error.message);
  }
}

testInsertManual();
