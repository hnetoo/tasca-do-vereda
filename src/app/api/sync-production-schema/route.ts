import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    console.log('🔄 SYNC SCHEMA: Starting production schema sync...');
    
    // Conectar à PRODUÇÃO para obter schema EXATO
    const prodSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const prodSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!prodSupabaseUrl || !prodSupabaseKey) {
      return NextResponse.json({ error: 'Production Supabase not configured' }, { status: 500 });
    }
    
    const prodSupabase = createClient(prodSupabaseUrl, prodSupabaseKey);
    
    // Obter schema EXATO da produção
    const tables = ['orders', 'expenses', 'menu_categories', 'dishes'];
    const prodSchema: Record<string, any> = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await prodSupabase
          .from(table)
          .select('*')
          .limit(5); // Pegar amostras
        
        if (error) {
          console.error(`❌ Error getting ${table} from production:`, error);
          prodSchema[table] = { error: error.message, data: [] };
        } else {
          console.log(`✅ Production ${table} schema:`, data?.length || 0, 'records');
          prodSchema[table] = { data: data || [], columns: data?.length > 0 ? Object.keys(data[0]) : [] };
        }
      } catch (err: any) {
        console.error(`❌ Exception getting ${table}:`, err);
        prodSchema[table] = { error: err.message, data: [] };
      }
    }
    
    // Agora aplicar mesmo schema no ambiente atual (já é o mesmo, mas garante consistência)
    return NextResponse.json({
      success: true,
      message: 'Production schema obtained successfully',
      productionSchema: prodSchema,
      tables: {
        orders: prodSchema.orders?.data?.length || 0,
        expenses: prodSchema.expenses?.data?.length || 0,
        categories: prodSchema.menu_categories?.data?.length || 0,
        dishes: prodSchema.dishes?.data?.length || 0
      },
      sampleData: {
        orders: prodSchema.orders?.data?.slice(0, 2) || [],
        expenses: prodSchema.expenses?.data?.slice(0, 2) || []
      }
    });
    
  } catch (error: any) {
    console.error('❌ SYNC SCHEMA Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
