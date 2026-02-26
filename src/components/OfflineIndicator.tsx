'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { cacheManager } from '@/hooks/useOfflineCache';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export default function OfflineIndicator({ className = '', showDetails = false }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [cacheSize, setCacheSize] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(navigator.onLine);
      setPendingSync(cacheManager.getPendingSyncCount());
      setCacheSize(cacheManager.getCacheSize());
    };

    const interval = setInterval(updateStatus, 1000);
    updateStatus();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSync(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleClearCache = async () => {
    if (confirm('Tem certeza que deseja limpar todo o cache offline?')) {
      await cacheManager.clear();
      setCacheSize(0);
      setPendingSync(0);
    }
  };

  if (!showDetails) {
    return (
      <div className={`fixed top-4 right-4 z-50 ${className}`}>
        <div className={`
          flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium
          transition-all duration-300 shadow-lg
          ${isOnline 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }
        `}>
          {isOnline ? (
            <>
              <Wifi size={16} className="animate-pulse" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff size={16} />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className={`
        bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl
        min-w-80 max-w-96
      `}>
        {/* Status Principal */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-2 text-green-400">
                <Wifi size={20} className="animate-pulse" />
                <span className="font-medium">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-400">
                <WifiOff size={20} />
                <span className="font-medium">Offline</span>
              </div>
            )}
          </div>
          
          <button
            onClick={handleClearCache}
            className="text-slate-400 hover:text-white transition-colors"
            title="Limpar cache"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Informações Detalhadas */}
        <div className="space-y-3 text-sm">
          {/* Status da Sincronização */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Database size={16} />
              <span>Cache:</span>
            </div>
            <span className="text-slate-300">{cacheSize} itens</span>
          </div>

          {/* Itens Pendentes */}
          {pendingSync > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-400">
                <AlertTriangle size={16} />
                <span>Pendente:</span>
              </div>
              <span className="text-orange-400">{pendingSync} itens</span>
            </div>
          )}

          {/* Última Sincronização */}
          {lastSync && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Última sync:</span>
              <span className="text-slate-300">
                {lastSync.toLocaleTimeString('pt-PT')}
              </span>
            </div>
          )}

          {/* Aviso Offline */}
          {!isOnline && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-xs">
                Modo offline ativado. Os dados serão sincronizados automaticamente quando a conexão for restaurada.
              </p>
            </div>
          )}

          {/* Indicador de Sincronização */}
          {isOnline && pendingSync > 0 && (
            <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <RefreshCw size={16} className="animate-spin text-orange-400" />
                <p className="text-orange-400 text-xs">
                  Sincronizando {pendingSync} itens pendentes...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
