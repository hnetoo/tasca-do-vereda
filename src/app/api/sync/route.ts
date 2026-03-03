import { NextRequest, NextResponse } from 'next/server';
import { syncService } from '@/services/syncService';

// API para sincronização manual
export async function POST(request: NextRequest) {
  console.log('🔄 SYNC API: Manual sync requested...');
  
  try {
    // Forçar sincronização manual
    const result = await syncService.forceSync();
    
    if (result.success) {
      console.log('✅ Manual sync completed successfully');
      return NextResponse.json(
        { 
          success: true,
          message: 'Sincronização concluída com sucesso',
          synced: result.synced,
          errors: result.errors
        },
        { status: 200 }
      );
    } else {
      console.error('❌ Manual sync failed:', result.errors);
      return NextResponse.json(
        { 
          success: false,
          message: 'Sincronização falhou',
          synced: result.synced,
          errors: result.errors
        },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('❌ SYNC API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// API para obter status da sincronização
export async function GET(request: NextRequest) {
  console.log('🔄 SYNC API: Getting sync status...');
  
  try {
    const status = syncService.getStatus();
    
    return NextResponse.json(
      { 
        success: true,
        status: status,
        message: status.isRunning ? 'Serviço de sincronização ativo' : 'Serviço de sincronização inativo'
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ SYNC API: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
