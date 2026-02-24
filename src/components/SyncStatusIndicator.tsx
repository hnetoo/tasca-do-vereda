import React from 'react';
import { useStore } from '@/store/useStore';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

const SyncStatusIndicator = () => {
  const { supabaseSyncStatus, settings, retrySync } = useStore();

  if (!settings.supabaseConfig?.enabled) return null;

  const { status, isConnected, errorMessage } = supabaseSyncStatus;

  // Determine styles and icon based on status
  let statusColor = 'text-slate-500';
  let bgColor = 'bg-slate-500/10';
  let borderColor = 'border-slate-500/20';
  let Icon = WifiOff;
  let text = 'Desconectado';
  let canRetry = false;

  if (status === 'connected' || isConnected) {
    statusColor = 'text-emerald-400';
    bgColor = 'bg-emerald-500/10';
    borderColor = 'border-emerald-500/20';
    Icon = Wifi;
    text = 'Online';
  } else if (status === 'connecting' || status === 'syncing') {
    statusColor = 'text-blue-400';
    bgColor = 'bg-blue-500/10';
    borderColor = 'border-blue-500/20';
    Icon = RefreshCw;
    text = 'Sincronizando...';
  } else if (status === 'error' || status === 'disconnected' || status === 'retrying') {
    statusColor = 'text-red-400';
    bgColor = 'bg-red-500/10';
    borderColor = 'border-red-500/20';
    Icon = AlertTriangle;
    text = status === 'retrying' ? 'Reconectando...' : 'Erro Sinc';
    canRetry = true;
  }

  const handleRetry = () => {
    if (canRetry) {
      retrySync();
    }
  };

  return (
    <button 
      onClick={handleRetry}
      disabled={!canRetry}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${bgColor} ${borderColor} ${statusColor} transition-all duration-300 relative group ${canRetry ? 'cursor-pointer hover:bg-red-500/20' : 'cursor-default'}`}
      title={errorMessage || text}
    >
      <Icon size={14} className={status === 'connecting' || status === 'syncing' ? 'animate-spin' : ''} />
      <span className="text-[10px] font-mono font-bold uppercase tracking-widest hidden sm:inline-block">
        {text}
      </span>
      {(status === 'error' || status === 'disconnected') && (
        <span className="absolute top-full mt-1 right-0 w-48 p-2 bg-red-900/90 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-left">
          <div className="font-bold mb-1">Erro de Conexão</div>
          <div className="opacity-80 mb-2">{errorMessage || 'Falha na comunicação com o servidor.'}</div>
          <div className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded w-fit">Clique para reconectar</div>
        </span>
      )}
    </button>
  );
};

export default SyncStatusIndicator;
