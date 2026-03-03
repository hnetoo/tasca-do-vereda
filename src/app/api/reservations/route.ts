import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API para salvar reservas no Supabase
export async function POST(request: NextRequest) {
  console.log('📅 RESERVATIONS API: Saving reservation...');
  
  try {
    const body = await request.json();
    const { customerName, customerPhone, date, time, guests, tableId, status } = body;
    
    // Validar campos obrigatórios
    if (!customerName || !date || !time || !guests) {
      return NextResponse.json(
        { error: 'Campos customerName, date, time e guests são obrigatórios' },
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
    
    // Combinar data e time para datetime
    const reservationDateTime = new Date(`${date}T${time}`);
    
    // Inserir reserva
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        customer_name: customerName,
        customer_phone: customerPhone || null,
        date: reservationDateTime.toISOString(),
        time: time,
        guests: parseInt(guests),
        table_id: tableId || null,
        status: status || 'CONFIRMADA',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ RESERVATIONS API: Error saving reservation:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ RESERVATIONS API: Reservation saved successfully:', data);
    
    return NextResponse.json(
      { 
        success: true,
        data: data,
        message: 'Reserva salva com sucesso'
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ RESERVATIONS API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// API para listar reservas
export async function GET(request: NextRequest) {
  console.log('📅 RESERVATIONS API: Loading reservations...');
  
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    
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
      .from('reservations')
      .select('*');
    
    // Aplicar filtros
    if (date) {
      query = query.gte('date', `${date}T00:00:00`).lte('date', `${date}T23:59:59`);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('date', { ascending: true });
    
    if (error) {
      console.error('❌ RESERVATIONS API: Error loading reservations:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ RESERVATIONS API: Reservations loaded successfully:', data?.length || 0);
    
    return NextResponse.json(
      { 
        success: true,
        data: data || [],
        count: data?.length || 0
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ RESERVATIONS API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
