import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API para salvar clientes no Supabase
export async function POST(request: NextRequest) {
  console.log('👥 CUSTOMERS API: Saving customer...');
  
  try {
    const body = await request.json();
    const { name, phone, nif, points, balance, visits } = body;
    
    // Validar campos obrigatórios
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Campos name e phone são obrigatórios' },
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
    
    // Inserir cliente
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: name,
        phone: phone,
        nif: nif || null,
        points: points || 0,
        balance: balance || 0,
        visits: visits || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ CUSTOMERS API: Error saving customer:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ CUSTOMERS API: Customer saved successfully:', data);
    
    return NextResponse.json(
      { 
        success: true,
        data: data,
        message: 'Cliente salvo com sucesso'
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ CUSTOMERS API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// API para listar clientes
export async function GET(request: NextRequest) {
  console.log('👥 CUSTOMERS API: Loading customers...');
  
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
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
      .from('customers')
      .select('*');
    
    // Aplicar busca se especificado
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    
    const { data, error } = await query.order('name', { ascending: true });
    
    if (error) {
      console.error('❌ CUSTOMERS API: Error loading customers:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ CUSTOMERS API: Customers loaded successfully:', data?.length || 0);
    
    return NextResponse.json(
      { 
        success: true,
        data: data || [],
        count: data?.length || 0
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ CUSTOMERS API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
