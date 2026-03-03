import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('🔍 SIMPLE DEBUG: Checking environment...');
  
  try {
    // Verificar variáveis de ambiente
    const env = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    };
    
    console.log('🔍 Environment check:', env);
    
    // Tentar conectar ao Supabase
    let supabaseResult = { connected: false, error: null as string | null };
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Teste simples
        const { data, error } = await supabase
          .from('orders')
          .select('count')
          .limit(1);
        
        supabaseResult = {
          connected: !error,
          error: error?.message || null
        };
      }
    } catch (e: any) {
      supabaseResult.error = e.message;
    }
    
    return NextResponse.json({
      environment: env,
      supabase: supabaseResult,
      timestamp: new Date().toISOString(),
      message: 'Simple debug completed'
    });
    
  } catch (error: any) {
    console.error('❌ SIMPLE DEBUG Error:', error);
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
