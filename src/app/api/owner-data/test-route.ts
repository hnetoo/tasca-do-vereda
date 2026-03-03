import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('🔍 TEST API: Returning test data...');
  
  try {
    // Verificar autenticação básica
    const cookieHeader = request.headers.get('cookie');
    let isAuthenticated = false;
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      const authCookie = cookies['tasca_auth_token'];
      const ownerCookie = cookies['owner_authenticated'];
      
      if (authCookie || ownerCookie === 'true') {
        isAuthenticated = true;
      }
    }
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { 
          error: 'UNAUTHORIZED',
          message: 'Authentication required',
          orders: [],
          expenses: [],
          payroll: [],
          dishes: [],
          categories: []
        },
        { status: 401 }
      );
    }
    
    // DADOS DE TESTE PARA VERIFICAR SE O FRONTEND FUNCIONA
    const testData = {
      orders: [
        {
          id: 'test-order-1',
          order_number: 'TEST-001',
          table_id: 'table-1',
          status: 'COMPLETED',
          total: 1500,
          subtotal: 1200,
          tax_amount: 300,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'test-order-2',
          order_number: 'TEST-002',
          table_id: 'table-2',
          status: 'COMPLETED',
          total: 800,
          subtotal: 650,
          tax_amount: 150,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      expenses: [
        {
          id: 'test-expense-1',
          amount: 500,
          category: 'Aluguel',
          description: 'Pagamento mensal',
          date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        },
        {
          id: 'test-expense-2',
          amount: 200,
          category: 'Água',
          description: 'Conta de água',
          date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        }
      ],
      dishes: [
        {
          id: 'test-dish-1',
          name: 'Frango Grelhado',
          price: 800,
          is_available: true,
          created_at: new Date().toISOString()
        }
      ],
      categories: [
        {
          id: 'test-category-1',
          name: 'Grelhados',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ],
      payroll: [],
      testData: true,
      message: 'DADOS DE TESTE - PARA VERIFICAR FRONTEND',
      timestamp: new Date().toISOString(),
      authenticated: true
    };
    
    console.log('✅ TEST API: Returning test data:', {
      orders: testData.orders.length,
      expenses: testData.expenses.length,
      dishes: testData.dishes.length,
      categories: testData.categories.length
    });
    
    return NextResponse.json(testData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error: any) {
    console.error('❌ TEST API Error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        orders: [],
        expenses: [],
        payroll: [],
        dishes: [],
        categories: []
      },
      { status: 500 }
    );
  }
}
