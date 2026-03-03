import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { type } = await request.json();
    
    console.log('🔄 CLEAR PRODUCTION API: Starting clear operation', { type });
    
    if (!type || (type !== 'orders' && type !== 'expenses' && type !== 'all')) {
      return NextResponse.json({ error: 'Invalid type. Must be "orders", "expenses", or "all"' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let results = [];
    
    if (type === 'all') {
      // Verificar se tabelas existem antes de limpar
      const tablesToCheck = ['orders', 'expenses', 'order_items', 'dishes', 'menu_categories'];
      const existingTables = [];
      
      console.log('🔍 CLEAR PRODUCTION API: Checking tables existence...');
      
      for (const tableName of tablesToCheck) {
        try {
          const { error } = await supabase.from(tableName).select('id').limit(1);
          if (!error || error.code !== 'PGRST116') { // PGRST116 = relation does not exist
            existingTables.push(tableName);
            console.log(`✅ CLEAR PRODUCTION API: Table ${tableName} exists`);
          } else {
            console.log(`⚠️ CLEAR PRODUCTION API: Table ${tableName} does not exist, skipping...`);
          }
        } catch (e) {
          console.log(`⚠️ CLEAR PRODUCTION API: Error checking table ${tableName}, skipping...`, e);
        }
      }
      
      // Verificar se order_items existe antes de limpar orders
      const hasOrderItems = existingTables.includes('order_items');
      const hasDishes = existingTables.includes('dishes');
      
      // REMOVIDO: Não bloquear reset se order_items/dishes não existem
      // Apenas limpar orders diretamente
      console.log(`🔍 CLEAR PRODUCTION API: Related tables - order_items: ${hasOrderItems}, dishes: ${hasDishes}`);
      
      if (existingTables.length === 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'No production tables found to clear',
          cleared: { orders: 0, expenses: 0 }
        });
      }
      
      // Clear only existing tables
      for (const tableName of existingTables) {
        // Pular order_items e dishes - apenas limpar orders e expenses
        if (tableName === 'order_items' || tableName === 'dishes') {
          console.log(`⚠️ CLEAR PRODUCTION API: Skipping ${tableName} - will clear orders instead`);
          continue;
        }
        
        try {
          console.log(`🗑️ CLEAR PRODUCTION API: Clearing table ${tableName}...`);
          
          let deleteResult;
          if (tableName === 'orders') {
            // Tentar limpar orders diretamente
            deleteResult = await supabase
              .from(tableName)
              .delete()
              .neq('id', '00000000-0000-0000-0000-000000000000'); // DELETE ALL
              
            // Se houver erro relacionado a dishes, tentar abordagem diferente
            if (deleteResult.error && deleteResult.error.message?.includes('dishes')) {
              console.log(`⚠️ CLEAR PRODUCTION API: dishes constraint detected, trying alternative approach`);
              
              // Tentar DELETE sem retornar dados (evita problemas com constraints)
              const silentDelete = await supabase
                .from(tableName)
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // DELETE ALL            
              if (silentDelete.error) {
                // Se ainda falhar, tentar apagar com TRUNCATE via RPC
                console.log(`⚠️ CLEAR PRODUCTION API: Trying RPC approach for ${tableName}`);
                const { error: rpcError } = await supabase.rpc('truncate_table', { table_name: tableName });
                
                if (rpcError) {
                  throw new Error(`Failed to clear ${tableName} with all methods: ${deleteResult.error.message}`);
                }
                
                deleteResult = { data: [], error: null }; // Success, but no count
              } else {
                deleteResult = { data: [], error: null }; // Success
              }
            }
          } else {
            // Para outras tabelas, usar método normal
            deleteResult = await supabase
              .from(tableName)
              .delete()
              .gte('id', '00000000-0000-0000-0000-000000000000');
          }
          
          if (deleteResult.error) {
            // Se for erro de dishes, tentar sem dependências
            if (deleteResult.error.message?.includes('dishes')) {
              console.log(`⚠️ CLEAR PRODUCTION API: dishes error detected, trying CASCADE DELETE`);
              // Tentar DELETE com CASCADE se disponível
              const cascadeResult = await supabase
                .from(tableName)
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');
              
              if (cascadeResult.error) {
                throw new Error(`Failed to clear ${tableName}: ${cascadeResult.error.message}`);
              }
              
              deleteResult = cascadeResult;
            } else {
              throw new Error(`Failed to clear ${tableName}: ${deleteResult.error.message}`);
            }
          }
          
          const deletedCount = (deleteResult.data as unknown as any[])?.length || 0;
          results.push({
            type: tableName,
            result: deleteResult,
            count: deletedCount
          });
          
          console.log(`✅ CLEAR PRODUCTION API: Cleared ${deletedCount} records from ${tableName}`);
          
        } catch (error: any) {
          console.error(`❌ CLEAR PRODUCTION API: Error clearing ${tableName}:`, error);
          results.push({
            type: tableName,
            error: error.message
          });
        }
      }
      
      // Check for errors in results
      const hasErrors = results.some(r => r.error);
      if (hasErrors) {
        const errorMessages = results.filter(r => r.error).map(r => r.error);
        return NextResponse.json({ 
          error: 'Some tables failed to clear: ' + errorMessages.join(', ')
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Production data cleared successfully',
        cleared: {
          orders: (results.find(r => r.type === 'orders')?.result?.data as any[] | null)?.length || 0,
          expenses: (results.find(r => r.type === 'expenses')?.result?.data as any[] | null)?.length || 0
        }
      });
      
    } else {
      // Clear specific type with table existence check
      try {
        const { error: checkError } = await supabase.from(type).select('id').limit(1);
        
        if (checkError && checkError.code === 'PGRST116') {
          return NextResponse.json({ 
            success: true, 
            message: `Table ${type} does not exist, nothing to clear`,
            count: 0
          });
        }
        
        let result;
        if (type === 'orders') {
          // Usar gte com UUID mínimo para apagar todos os registros
          const deleteResult = await supabase.from('orders').delete().gte('id', '00000000-0000-0000-0000-000000000000');
          result = deleteResult;
        } else if (type === 'expenses') {
          // Usar gte com UUID mínimo para apagar todos os registros
          const deleteResult = await supabase.from('expenses').delete().gte('id', '00000000-0000-0000-0000-000000000000');
          result = deleteResult;
        }

        if (!result) {
          throw new Error('Failed to execute delete operation');
        }

        if (result.error) {
          throw result.error;
        }

        console.log(`✅ Cleared ${type} from Supabase`);

        return NextResponse.json({ 
          success: true, 
          message: `${type} cleared successfully`,
          count: (result.data as any[] | null)?.length || 0
        });
        
      } catch (error: any) {
        if (error.message?.includes('does not exist')) {
          return NextResponse.json({ 
            success: true, 
            message: `Table ${type} does not exist, nothing to clear`,
            count: 0
          });
        }
        throw error;
      }
    }

  } catch (error: any) {
    console.error('❌ Error clearing production data:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to clear data' 
    }, { status: 500 });
  }
}
