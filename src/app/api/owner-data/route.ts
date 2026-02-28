import { NextResponse } from 'next/server';

export async function GET() {
  console.log('� EMERGENCY: API called at:', new Date().toISOString());
  
  try {
    // TESTE ULTRA-SIMPLES - SEM SUPABASE
    console.log('� EMERGENCY: Returning simple test data');
    
    const simpleData = {
      orders: [
        { id: 1, total: 300, created_at: new Date().toISOString(), status: 'completed' },
        { id: 2, total: 500, created_at: new Date().toISOString(), status: 'completed' }
      ],
      expenses: [
        { id: 1, amount: 150, description: 'Despesa real', date: new Date().toISOString() }
      ],
      dishes: [],
      categories: [],
      errors: null,
      emergency: true,
      message: 'DADOS DE TESTE - API ESTÁ SENDO CHAMADA'
    };
    
    console.log('🚨 EMERGENCY: Simple data returned');
    
    return NextResponse.json(simpleData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
  } catch (error: any) {
    console.error('🚨 EMERGENCY ERROR:', error);
    return NextResponse.json(
      { 
        error: error.message,
        emergency: true,
        orders: [],
        expenses: [],
        dishes: [],
        categories: []
      },
      { status: 500 }
    );
  }
}
