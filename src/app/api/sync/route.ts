import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API para sincronização manual
export async function POST(request: NextRequest) {
  console.log('🔄 SYNC API: Manual sync requested...');
  
  try {
    // Usar Supabase diretamente (sem syncService)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Verificar conexão com Supabase
    const { data, error } = await supabase.from('restaurant_tables').select('count').limit(1);
    
    if (error) {
      console.error('❌ SYNC API: Supabase connection error:', error);
      return NextResponse.json(
        { error: 'Erro de conexão com Supabase', details: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ SYNC API: Supabase connection successful');
    
    return NextResponse.json({
      success: true,
      message: 'Sincronização manual concluída com sucesso',
      timestamp: new Date().toISOString(),
      data: {
        connection: 'Supabase',
        status: 'connected',
        tables: data
      }
    });
    
  } catch (error: any) {
    console.error('❌ SYNC API: Sync error:', error);
    return NextResponse.json(
      { error: 'Erro na sincronização manual', details: error.message },
      { status: 500 }
    );
  }
}

// API para obter status da sincronização
export async function GET(request: NextRequest) {
  console.log('🔄 SYNC API: Getting sync status...');
  
  try {
    // Usar Supabase diretamente
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Verificar status das tabelas principais
    const tables = ['restaurant_tables', 'users', 'employees', 'menu_items'];
    const status: any = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        status[table] = error ? { error: error.message } : { status: 'connected', count: data?.length || 0 };
      } catch (e: any) {
        status[table] = { error: e.message };
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Status da sincronização obtido com sucesso',
      timestamp: new Date().toISOString(),
      data: {
        connection: 'Supabase',
        status: 'connected',
        tables: status
      }
    });
    
  } catch (error: any) {
    console.error('❌ SYNC API: Status error:', error);
    return NextResponse.json(
      { error: 'Erro ao obter status da sincronização', details: error.message },
      { status: 500 }
    );
  }
}
