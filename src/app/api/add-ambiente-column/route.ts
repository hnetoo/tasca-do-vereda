import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'Para adicionar a coluna ambiente, execute manualmente no Supabase:',
    sql: 'ALTER TABLE restaurant_tables ADD COLUMN ambiente TEXT DEFAULT \'INTERIOR\';',
    instructions: [
      '1. Vá para o Supabase Dashboard',
      '2. Clique em SQL Editor',
      '3. Cole e execute: ALTER TABLE restaurant_tables ADD COLUMN ambiente TEXT DEFAULT \'INTERIOR\';',
      '4. Opcional: CREATE INDEX idx_restaurant_tables_ambiente ON restaurant_tables(ambiente);'
    ]
  });
}
