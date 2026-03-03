import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Verificar se a coluna já existe
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'restaurant_tables')
      .eq('column_name', 'ambiente');
    
    if (checkError) {
      console.error('Erro ao verificar coluna:', checkError);
      return NextResponse.json(
        { error: 'Erro ao verificar se coluna existe', details: checkError },
        { status: 500 }
      );
    }
    
    // Se coluna já existe, retornar sucesso
    if (columns && columns.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Coluna ambiente já existe' 
      });
    }
    
    // Adicionar coluna 'ambiente' à tabela restaurant_tables
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE restaurant_tables 
        ADD COLUMN ambiente TEXT DEFAULT 'INTERIOR';
        
        -- Criar índice para melhor performance
        CREATE INDEX idx_restaurant_tables_ambiente 
        ON restaurant_tables(ambiente);
      `
    });

    if (alterError) {
      console.error('Erro ao adicionar coluna ambiente:', alterError);
      
      // Tentar abordagem alternativa sem RPC
      const { error: directError } = await supabase
        .from('restaurant_tables')
        .update({ ambiente: 'INTERIOR' })
        .eq('id', '00000000-0000-0000-0000-000000000000'); // ID que não existe
        
      if (directError && directError.message.includes('column "ambiente" does not exist')) {
        return NextResponse.json(
          { 
            error: 'Coluna ambiente não existe na tabela', 
            details: 'Execute manualmente: ALTER TABLE restaurant_tables ADD COLUMN ambiente TEXT DEFAULT \'INTERIOR\';' 
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Erro ao adicionar coluna ambiente', details: alterError },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Coluna ambiente adicionada com sucesso' 
    });

  } catch (error: any) {
    console.error('Erro na migration:', error);
    return NextResponse.json(
      { error: 'Erro interno na migration', details: error.message },
      { status: 500 }
    );
  }
}
