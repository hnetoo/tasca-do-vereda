import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API para salvar categorias no Supabase
export async function POST(request: NextRequest) {
  console.log('📁 menu_categories API: Saving category...');
  
  try {
    const body = await request.json();
    const { name, description, color, sort_order, icon } = body;
    
    // Validar campos obrigatórios
    if (!name) {
      return NextResponse.json(
        { error: 'Campo name é obrigatório' },
        { status: 400 }
      );
    }
    
    // Validar ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      );
    }
    
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Inserir categoria
    const { data, error } = await supabase
      .from('menu_menu_categories')
      .insert({
        name: name,
        description: description || null,
        color: color || '#6b7280',
        sort_order: sort_order || 0,
        icon: icon || 'Grid3X3',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ menu_categories API: Error saving category:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ menu_categories API: Category saved successfully:', data);
    
    return NextResponse.json(
      { 
        success: true,
        data: data,
        message: 'Categoria salva com sucesso'
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ menu_categories API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// API para listar categorias
export async function GET(request: NextRequest) {
  console.log('📁 menu_categories API: Loading menu_categories...');
  
  try {
    // Validar ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      );
    }
    
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('menu_menu_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error('❌ menu_categories API: Error loading menu_categories:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ menu_categories API: menu_categories loaded successfully:', data?.length || 0);
    
    return NextResponse.json(
      { 
        success: true,
        data: data || [],
        count: data?.length || 0
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ menu_categories API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

