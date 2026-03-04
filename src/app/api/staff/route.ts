import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface StaffMember {
  id?: string;
  nome: string;
  cargo: string;
  telefone: string;
  salario_base: number;
  created_at?: string;
  updated_at?: string;
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ [STAFF] Error fetching staff:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        data: []
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (error: any) {
    console.error('❌ [STAFF] General error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      data: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('staff')
      .insert({
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ [STAFF] Error creating staff member:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('❌ [STAFF] General error creating:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { id } = await request.json();
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('staff')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ [STAFF] Error updating staff member:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('❌ [STAFF] General error updating:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { id } = await request.json();
    
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ [STAFF] Error deleting staff member:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true
    });
  } catch (error: any) {
    console.error('❌ [STAFF] General error deleting:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}
