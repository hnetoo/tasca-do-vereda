import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Adicionar coluna 'ambiente' à tabela restaurant_tables
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE restaurant_tables 
        ADD COLUMN IF NOT EXISTS ambiente TEXT DEFAULT 'INTERIOR';
        
        -- Criar índice para melhor performance
        CREATE INDEX IF NOT EXISTS idx_restaurant_tables_ambiente 
        ON restaurant_tables(ambiente);
        
        -- Adicionar comentário à coluna
        COMMENT ON COLUMN restaurant_tables.ambiente IS 'Ambiente da mesa: INTERIOR, EXTERIOR ou BALCAO';
      `
    });

    if (alterError) {
      console.error('Erro ao adicionar coluna ambiente:', alterError);
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
