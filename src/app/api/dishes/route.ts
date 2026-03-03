import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API para salvar produtos/pratos no Supabase
export async function POST(request: NextRequest) {
  console.log('🍽️ DISHES API: Saving dish...');
  
  try {
    const body = await request.json();
    const { name, description, price, category_id, image_url, is_available, tax_code, is_active } = body;
    
    // Validar campos obrigatórios
    if (!name || !price) {
      return NextResponse.json(
        { error: 'Campos name e price são obrigatórios' },
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
    
    // Inserir prato
    const { data, error } = await supabase
      .from('dishes')
      .insert({
        name: name,
        description: description || null,
        price: parseFloat(price),
        category_id: category_id || null,
        image_url: image_url || null,
        is_available: is_available !== false,
        tax_code: tax_code || 'NOR',
        is_active: is_active !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ DISHES API: Error saving dish:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ DISHES API: Dish saved successfully:', data);
    
    return NextResponse.json(
      { 
        success: true,
        data: data,
        message: 'Prato salvo com sucesso'
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ DISHES API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// API para listar pratos
export async function GET(request: NextRequest) {
  console.log('🍽️ DISHES API: Loading dishes...');
  
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    
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
    
    let query = supabase
      .from('dishes')
      .select('*');
    
    // Aplicar filtro por categoria se especificado
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    const { data, error } = await query.order('name', { ascending: true });
    
    if (error) {
      console.error('❌ DISHES API: Error loading dishes:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ DISHES API: Dishes loaded successfully:', data?.length || 0);
    
    return NextResponse.json(
      { 
        success: true,
        data: data || [],
        count: data?.length || 0
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ DISHES API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
