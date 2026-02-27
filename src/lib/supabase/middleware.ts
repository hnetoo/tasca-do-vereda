import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // MIDDLEWARE DESATIVADO TEMPORARIAMENTE PARA TESTE
  console.log(' Supabase middleware desativado para teste');
  return NextResponse.next();
}
