import { NextRequest, NextResponse } from 'next/server';
import { fixPayrollTable } from '@/app/actions/fixPayrollTable';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [API] Fixing payroll table...');
    
    const result = await fixPayrollTable();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        migrated: result.migrated
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        details: result.details
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ [API] Error fixing payroll table:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to fix payroll table migration',
    info: 'This will migrate data from payroll_records to payroll and fix table structure'
  });
}
