import { NextRequest, NextResponse } from 'next/server';
import { createStaffTableDirect } from '@/app/actions/createStaffTableDirect';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [API] Creating staff table directly...');
    
    const result = await createStaffTableDirect();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        requiresManualAction: result.requiresManualAction,
        sql: result.sql,
        details: result.details
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ [API] Error creating staff table:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}

export async function GET() {
  return POST(new NextRequest('https://tasca-do-vereda.vercel.app/api/create-staff-table-direct'));
}
