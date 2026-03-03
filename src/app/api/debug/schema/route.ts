import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar estrutura das tabelas principais
    const tables = ['orders', 'order_items', 'expenses', 'restaurant_tables', 'menu_categories', 'dishes'];
    const schema = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          schema[table] = {
            exists: false,
            error: error.message,
            details: error
          };
        } else {
          schema[table] = {
            exists: true,
            columns: data && data.length > 0 ? Object.keys(data[0]) : [],
            sample: data && data.length > 0 ? data[0] : null
          };
        }
      } catch (err: any) {
        schema[table] = {
          exists: false,
          error: err.message,
          exception: true
        };
      }
    }
    
    return NextResponse.json({
      environment: {
        supabaseUrl: supabaseUrl ? "SET" : "NOT_SET",
        supabaseKey: supabaseServiceKey ? "SET" : "NOT_SET",
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      },
      schema: schema,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Schema check error:', error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
