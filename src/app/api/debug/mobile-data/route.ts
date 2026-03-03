import { NextResponse } from 'next/server';
import { getOwnerMobileData } from '@/app/actions/ownerMobile';

export async function GET() {
  console.log('🔍 DEBUG: Testing mobile data API...');
  
  try {
    const data = await getOwnerMobileData();
    
    console.log('🔍 DEBUG: Mobile data result:', {
      orders: data.orders?.length || 0,
      expenses: data.expenses?.length || 0,
      payroll: data.payroll?.length || 0,
      dishes: data.dishes?.length || 0,
      categories: data.categories?.length || 0,
      errors: (data as any).errors,
      hasError: data && typeof data === 'object' && 'error' in data
    });
    
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      debug: {
        ordersCount: data.orders?.length || 0,
        expensesCount: data.expenses?.length || 0,
        sampleOrders: data.orders?.slice(0, 3),
        sampleExpenses: data.expenses?.slice(0, 3)
      }
    });
    
  } catch (error: any) {
    console.error('❌ DEBUG: Error in mobile data API:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
