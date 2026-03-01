import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { type } = await request.json();
    
    if (!type || (type !== 'orders' && type !== 'expenses' && type !== 'all')) {
      return NextResponse.json({ error: 'Invalid type. Must be "orders", "expenses", or "all"' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let results = [];
    
    if (type === 'all') {
      // Verificar se tabelas existem antes de limpar
      const tablesToCheck = ['orders', 'expenses'];
      const existingTables = [];
      
      for (const tableName of tablesToCheck) {
        try {
          const { error } = await supabase.from(tableName).select('id').limit(1);
          if (!error || error.code !== 'PGRST116') { // PGRST116 = relation does not exist
            existingTables.push(tableName);
          } else {
            console.log(`⚠️ Table ${tableName} does not exist, skipping...`);
          }
        } catch (e) {
          console.log(`⚠️ Error checking table ${tableName}, skipping...`);
        }
      }
      
      if (existingTables.length === 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'No production tables found to clear',
          cleared: { orders: 0, expenses: 0 }
        });
      }
      
      // Clear only existing tables
      for (const tableName of existingTables) {
        try {
          // Usar is null em vez de neq para UUID
          const deleteResult = await supabase.from(tableName).delete().is('id', null);
          
          if (deleteResult.error) {
            throw new Error(`Failed to clear ${tableName}: ${deleteResult.error.message}`);
          }
          
          results.push({
            type: tableName,
            result: deleteResult
          });
          
          console.log(`✅ Cleared ${tableName} from Supabase`);
          
        } catch (error: any) {
          console.error(`❌ Error clearing ${tableName}:`, error);
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
          // Usar is null em vez de neq para UUID
          const deleteResult = await supabase.from('orders').delete().is('id', null);
          result = deleteResult;
        } else if (type === 'expenses') {
          // Usar is null em vez de neq para UUID
          const deleteResult = await supabase.from('expenses').delete().is('id', null);
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
