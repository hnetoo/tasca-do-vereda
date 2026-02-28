import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { type } = await request.json();
    
    if (!type || (type !== 'orders' && type !== 'expenses')) {
      return NextResponse.json({ error: 'Invalid type. Must be "orders" or "expenses"' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

  } catch (error: any) {
    console.error('❌ Error clearing production data:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to clear data' 
    }, { status: 500 });
  }
}
