import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  console.log('🔍 DEBUG: Checking Supabase configuration...');
  
  try {
    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔍 DEBUG: Environment variables:', {
      supabaseUrl: supabaseUrl ? 'DEFINED' : 'MISSING',
      supabaseServiceKey: supabaseServiceKey ? 'DEFINED' : 'MISSING'
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        details: {
          supabaseUrl: supabaseUrl ? 'OK' : 'MISSING',
          supabaseServiceKey: supabaseServiceKey ? 'OK' : 'MISSING'
        }
      }, { status: 500 });
    }
    
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Testar conexão
    const { data, error } = await supabase.from('expenses').select('id').limit(1);
    
    console.log('🔍 DEBUG: Connection test:', { data, error });
    
    // Verificar tabelas que existem
    const tables = [
      'expenses',
      'payroll_records', 
      'menu_categories',
      'dishes',
      'customers',
      'reservations',
      'orders',
      'order_items',
      'roles',
      'restaurant_tables'
    ];
    
    const tableStatus: Record<string, any> = {};
    
    for (const tableName of tables) {
      try {
        const { error: tableError } = await supabase.from(tableName).select('id').limit(1);
        tableStatus[tableName] = tableError ? {
          exists: false,
          error: tableError.message,
          code: tableError.code
        } : { exists: true };
      } catch (e: any) {
        tableStatus[tableName] = { exists: false, error: e.message };
      }
    }
    
    console.log('🔍 DEBUG: Table status:', tableStatus);
    
    return NextResponse.json({
      success: true,
      environment: {
        supabaseUrl: supabaseUrl ? 'OK' : 'MISSING',
        supabaseServiceKey: supabaseServiceKey ? 'OK' : 'MISSING'
      },
      connection: {
        success: !error,
        error: error?.message
      },
      tables: tableStatus
    });
    
  } catch (error: any) {
    console.error('🔍 DEBUG: Unexpected error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
