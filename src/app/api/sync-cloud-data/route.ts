import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let action: string = 'unknown';
  
  try {
    const body = await request.json();
    action = body.action;
    
    if (!action || (action !== 'syncFromCloud' && action !== 'restoreFromCloud')) {
      return NextResponse.json({ error: 'Invalid action. Must be "syncFromCloud" or "restoreFromCloud"' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar dados do Supabase
    console.log(`🔄 ${action}: Fetching data from Supabase...`);
    
    const [categoriesResult, dishesResult] = await Promise.all([
      supabase.from('menu_categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('dishes').select('*')
    ]);

    if (categoriesResult.error) {
      throw categoriesResult.error;
    }
    if (dishesResult.error) {
      throw dishesResult.error;
    }

    const categories = categoriesResult.data || [];
    const dishes = dishesResult.data || [];

    console.log(`✅ ${action}: Retrieved ${categories.length} categories and ${dishes.length} dishes`);

    return NextResponse.json({ 
      success: true, 
      action,
      data: {
        categories,
        dishes
      },
      message: `${action === 'syncFromCloud' ? 'Sincronização' : 'Restauração'} concluída com sucesso!`
    });

  } catch (error: any) {
    console.error(`❌ Error in ${action}:`, error);
    return NextResponse.json({ 
      error: error.message || `Failed to ${action}` 
    }, { status: 500 });
  }
}
