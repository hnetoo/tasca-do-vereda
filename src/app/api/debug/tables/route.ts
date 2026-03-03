import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  console.log('🔍 DEBUG: Checking table existence...');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar todas as tabelas que contêm 'categor'
    const { data: categoryTables, error: categoryError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%categor%');
    
    // Verificar se a tabela 'categories' existe especificamente
    const { data: categoriesTable, error: categoriesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'categories');
    
    // Verificar se a tabela 'menu_categories' existe
    const { data: menuCategoriesTable, error: menuCategoriesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'menu_categories');
    
    // Tentar acessar a tabela 'categories' diretamente
    let categoriesData = null;
    let categoriesDirectError = null;
    
    try {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .limit(1);
      
      categoriesData = data;
      categoriesDirectError = error;
    } catch (e: any) {
      categoriesDirectError = e.message;
    }
    
    // Tentar acessar a tabela 'menu_categories' diretamente
    let menuCategoriesData = null;
    let menuCategoriesDirectError = null;
    
    try {
      const { data, error } = await supabaseAdmin
        .from('menu_categories')
        .select('*')
        .limit(1);
      
      menuCategoriesData = data;
      menuCategoriesDirectError = error;
    } catch (e: any) {
      menuCategoriesDirectError = e.message;
    }
    
    return NextResponse.json({
      categoryTables: categoryTables || [],
      categoriesTable: categoriesTable || [],
      menuCategoriesTable: menuCategoriesTable || [],
      categoriesDirectAccess: {
        data: categoriesData,
        error: categoriesDirectError?.message || categoriesDirectError
      },
      menuCategoriesDirectAccess: {
        data: menuCategoriesData,
        error: menuCategoriesDirectError?.message || menuCategoriesDirectError
      },
      errors: {
        categoryError: categoryError?.message,
        categoriesError: categoriesError?.message,
        menuCategoriesError: menuCategoriesError?.message
      }
    });
    
  } catch (error: any) {
    console.error('❌ DEBUG Error:', error);
    return NextResponse.json({ error: error.message });
  }
}
