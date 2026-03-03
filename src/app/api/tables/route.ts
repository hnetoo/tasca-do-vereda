import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API para salvar mesas no Supabase
export async function POST(request: NextRequest) {
  console.log('🪑 TABLES API: Saving table...');
  
  try {
    const body = await request.json();
    const { name, seats, status, x, y, zone, shape, rotation, color } = body;
    
    // Validar campos obrigatórios
    if (!name || !seats) {
      return NextResponse.json(
        { error: 'Campos name e seats são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Validar ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      );
    }
    
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Inserir mesa
    const { data, error } = await supabase
      .from('restaurant_tables')
      .insert({
        name: name,
        number: parseInt(name.replace(/\D/g, '')) || 1,
        seats: seats,
        status: status || 'AVAILABLE',
        x: x || 0,
        y: y || 0,
        zone: zone || 'INTERIOR',
        shape: shape || 'SQUARE',
        rotation: rotation || 0,
        color: color || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ TABLES API: Error saving table:', error);
      
      // Tratar erro específico de tabela não encontrada
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Tabela restaurant_tables não encontrada. Execute as migrações do Supabase.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: error.message || 'Erro ao salvar mesa' },
        { status: 500 }
      );
    }
    
    console.log('✅ TABLES API: Table saved successfully:', data);
    
    return NextResponse.json(
      { 
        success: true,
        data: data,
        message: 'Mesa salva com sucesso'
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ TABLES API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// API para listar mesas
export async function GET(request: NextRequest) {
  console.log('🪑 TABLES API: Loading tables...');
  
  try {
    // Validar ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      );
    }
    
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('restaurant_tables')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ TABLES API: Error loading tables:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ TABLES API: Tables loaded successfully:', data?.length || 0);
    
    return NextResponse.json(
      { 
        success: true,
        data: data || [],
        count: data?.length || 0
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ TABLES API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// API para atualizar mesa
export async function PUT(request: NextRequest) {
  console.log('🪑 TABLES API: Updating table...');
  
  try {
    const body = await request.json();
    const { id, name, seats, status, x, y, zone, shape, rotation, color } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da mesa é obrigatório' },
        { status: 400 }
      );
    }
    
    // Validar ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      );
    }
    
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('restaurant_tables')
      .update({
        name: name,
        number: parseInt(name.replace(/\D/g, '')) || 1,
        seats: seats,
        status: status,
        x: x,
        y: y,
        zone: zone,
        shape: shape,
        rotation: rotation,
        color: color,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ TABLES API: Error updating table:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ TABLES API: Table updated successfully:', data);
    
    return NextResponse.json(
      { 
        success: true,
        data: data,
        message: 'Mesa atualizada com sucesso'
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ TABLES API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// API para deletar mesa
export async function DELETE(request: NextRequest) {
  console.log('🪑 TABLES API: Deleting table...');
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da mesa é obrigatório' },
        { status: 400 }
      );
    }
    
    // Validar ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      );
    }
    
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('restaurant_tables')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ TABLES API: Error deleting table:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ TABLES API: Table deleted successfully');
    
    return NextResponse.json(
      { 
        success: true,
        message: 'Mesa deletada com sucesso'
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ TABLES API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
