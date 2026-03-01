import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { type } = await request.json();
    
    if (!type || (type !== 'orders' && type !== 'expenses' && type !== 'all')) {
      return NextResponse.json({ error: 'Invalid type. Must be "orders", "expenses", or "all"' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let results = [];
    
    if (type === 'all') {
      // Clear both orders and expenses
      const ordersResult = await supabase.from('orders').delete().neq('id', '');
      const expensesResult = await supabase.from('expenses').delete().neq('id', '');
      
      results = [
        { type: 'orders', result: ordersResult },
        { type: 'expenses', result: expensesResult }
      ];
      
      // Check for errors
      for (const { type, result } of results) {
        if (result.error) {
          throw new Error(`Failed to clear ${type}: ${result.error.message}`);
        }
      }
      
      console.log('✅ Cleared all production data from Supabase');
      
      return NextResponse.json({ 
        success: true, 
        message: 'All production data cleared successfully',
        cleared: {
          orders: (results[0].result.data as any[] | null)?.length || 0,
          expenses: (results[1].result.data as any[] | null)?.length || 0
        }
      });
      
    } else {
      // Clear specific type (original logic)
      let result;
      if (type === 'orders') {
        const deleteResult = await supabase.from('orders').delete().neq('id', '');
        result = deleteResult;
      } else if (type === 'expenses') {
        const deleteResult = await supabase.from('expenses').delete().neq('id', '');
        result = deleteResult;
      }

      if (!result) {
        throw new Error('Failed to execute delete operation');
      }

      if (result.error) {
        throw result.error;
      }

      console.log(`✅ Cleared ${type} from Supabase`);

      return NextResponse.json({ 
        success: true, 
        message: `${type} cleared successfully`,
        count: (result.data as any[] | null)?.length || 0
      });
    }

  } catch (error: any) {
    console.error('❌ Error clearing production data:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to clear data' 
    }, { status: 500 });
  }
}
