import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Test Mobile API: Request received at:', new Date().toISOString());
    
    const testData = {
      message: 'Mobile API Test Working!',
      timestamp: new Date().toISOString(),
      userAgent: 'API responding',
      orders: [
        { id: 1, total: 100, created_at: new Date().toISOString(), status: 'completed' },
        { id: 2, total: 200, created_at: new Date().toISOString(), status: 'completed' }
      ],
      expenses: [
        { id: 1, amount: 50, description: 'Test expense', date: new Date().toISOString() }
      ]
    };
    
    console.log('🧪 Test Mobile API: Returning test data');
    
    return NextResponse.json(testData, {
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
    console.error('❌ Test Mobile API Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
