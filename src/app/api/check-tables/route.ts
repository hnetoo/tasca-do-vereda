import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  console.log('🔍 CHECKING TABLES: Starting table check...');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing environment variables' },
        { status: 500 }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar tabelas existentes
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (tablesError) {
      console.error('❌ CHECKING TABLES: Error checking tables:', tablesError);
      return NextResponse.json(
        { error: String(tablesError) },
        { status: 500 }
      );
    }
    
    const tableNames = tables?.map(t => t.table_name) || [];
    
    console.log('✅ CHECKING TABLES: Found tables:', tableNames);
    
    // Verificar registros em cada tabela de interesse
    const tablesToCheck = ['orders', 'expenses', 'payroll_records'];
    const tableData: any = {};
    
    for (const tableName of tablesToCheck) {
      if (tableNames.includes(tableName)) {
        try {
          const { data: records, error: recordsError } = await supabaseAdmin
            .from(tableName)
            .select('count')
            .limit(1);
          
          tableData[tableName] = {
            exists: true,
            count: records?.[0]?.count || 0,
            error: recordsError ? String(recordsError) : null
          };
        } catch (err) {
          tableData[tableName] = {
            exists: true,
            count: 0,
            error: String(err)
          };
        }
      } else {
        tableData[tableName] = {
          exists: false,
          count: 0,
          error: 'Table does not exist'
        };
      }
    }
    
    console.log('📊 CHECKING TABLES: Table data:', tableData);
    
    return NextResponse.json({
      tables: tableNames,
      tableData,
      success: true
    });
    
  } catch (error: any) {
    console.error('❌ CHECKING TABLES: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
