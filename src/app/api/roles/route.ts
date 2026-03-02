import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API para salvar cargos no Supabase
export async function POST(request: NextRequest) {
  console.log('👑 ROLES API: Saving role...');
  
  try {
    const body = await request.json();
    const { name, description, permissions, color } = body;
    
    // Validar campos obrigatórios
    if (!name || !description) {
      return NextResponse.json(
        { error: 'Campos name e description são obrigatórios' },
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
    
    // Inserir cargo
    const { data, error } = await supabase
      .from('roles')
      .insert({
        name: name,
        description: description,
        permissions: permissions || [],
        color: color || 'blue',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ ROLES API: Error saving role:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ ROLES API: Role saved successfully:', data);
    
    return NextResponse.json(
      { 
        success: true,
        data: data,
        message: 'Cargo salvo com sucesso'
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ ROLES API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// API para listar cargos
export async function GET(request: NextRequest) {
  console.log('👑 ROLES API: Loading roles...');
  
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
      .from('roles')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ ROLES API: Error loading roles:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ ROLES API: Roles loaded successfully:', data?.length || 0);
    
    return NextResponse.json(
      { 
        success: true,
        data: data || [],
        count: data?.length || 0
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ ROLES API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// API para atualizar cargo
export async function PUT(request: NextRequest) {
  console.log('👑 ROLES API: Updating role...');
  
  try {
    const body = await request.json();
    const { id, name, description, permissions, color } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do cargo é obrigatório' },
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
      .from('roles')
      .update({
        name: name,
        description: description,
        permissions: permissions || [],
        color: color || 'blue',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ ROLES API: Error updating role:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ ROLES API: Role updated successfully:', data);
    
    return NextResponse.json(
      { 
        success: true,
        data: data,
        message: 'Cargo atualizado com sucesso'
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ ROLES API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// API para deletar cargo
export async function DELETE(request: NextRequest) {
  console.log('👑 ROLES API: Deleting role...');
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do cargo é obrigatório' },
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
      .from('roles')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ ROLES API: Error deleting role:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ ROLES API: Role deleted successfully');
    
    return NextResponse.json(
      { 
        success: true,
        message: 'Cargo deletado com sucesso'
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ ROLES API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
