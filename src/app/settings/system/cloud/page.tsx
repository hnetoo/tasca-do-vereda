'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Cloud, Upload, Download, RefreshCw, CheckCircle, AlertCircle, Wifi, Database, Smartphone, Globe, Settings, Trash2 } from 'lucide-react';

export default function SettingsCloudPage() {
  const { addNotification } = useStore();
  const [cloudConfig, setCloudConfig] = useState({
    enabled: true,
    autoSync: true,
    lastSync: '2024-01-15T10:30:00',
    provider: 'supabase',
    url: 'https://your-project.supabase.co',
    apiKey: '••••••••••••••••••••••••••••••••',
    storageUsed: 245.6,
    storageLimit: 1000,
    syncStatus: 'synced'
  });

  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleTestConnection = () => {
    addNotification('info', 'Testando conexão com nuvem...');
    setTimeout(() => {
      addNotification('success', 'Conexão estabelecida com sucesso!');
    }, 2000);
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setSyncProgress(0);
    
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          setCloudConfig(prev => ({ ...prev, lastSync: new Date().toISOString(), syncStatus: 'synced' }));
          addNotification('success', 'Sincronização concluída com sucesso!');
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleExportData = () => {
    addNotification('info', 'Exportando dados...');
    setTimeout(() => {
      addNotification('success', 'Dados exportados com sucesso!');
    }, 1500);
  };

  const handleImportData = () => {
    addNotification('info', 'Importando dados...');
    setTimeout(() => {
      addNotification('success', 'Dados importados com sucesso!');
    }, 2000);
  };

  const handleClearCache = () => {
    if (confirm('Tem certeza que deseja limpar o cache local?')) {
      addNotification('success', 'Cache limpo com sucesso!');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'syncing': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'error': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced': return <CheckCircle size={16} />;
      case 'syncing': return <RefreshCw size={16} className="animate-spin" />;
      case 'error': return <AlertCircle size={16} />;
      default: return <Wifi size={16} />;
    }
  };

  const storagePercentage = (cloudConfig.storageUsed / cloudConfig.storageLimit) * 100;

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Nuvem e Sincronização</h1>
        <p className="text-slate-400">Configurações de nuvem e sincronização de dados</p>
      </div>

      <div className="space-y-6">
        {/* Connection Status */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <Cloud size={20} className="text-primary" />
              Status da Conexão
            </h3>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full border flex items-center gap-2 ${getStatusColor(cloudConfig.syncStatus)}`}>
                {getStatusIcon(cloudConfig.syncStatus)}
                {cloudConfig.syncStatus === 'synced' ? 'Sincronizado' : 
                 cloudConfig.syncStatus === 'syncing' ? 'Sincronizando' : 'Erro'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <Wifi size={14} />
                <span>Conexão</span>
              </div>
              <p className="text-lg font-bold text-white">Ativa</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <Database size={14} />
                <span>Última Sincronização</span>
              </div>
              <p className="text-lg font-bold text-white">
                {new Date(cloudConfig.lastSync).toLocaleDateString()}
              </p>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <Globe size={14} />
                <span>Provedor</span>
              </div>
              <p className="text-lg font-bold text-white capitalize">{cloudConfig.provider}</p>
            </div>
          </div>
        </div>

        {/* Storage Usage */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            <Database size={20} className="text-primary" />
            Uso de Armazenamento
          </h3>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">
                {cloudConfig.storageUsed.toFixed(1)} MB de {cloudConfig.storageLimit} MB
              </span>
              <span className="text-white font-medium">{storagePercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-primary to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <Upload size={14} />
                <span>Upload Hoje</span>
              </div>
              <p className="text-lg font-bold text-white">12.4 MB</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <Download size={14} />
                <span>Download Hoje</span>
              </div>
              <p className="text-lg font-bold text-white">8.7 MB</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <Smartphone size={14} />
                <span>Dispositivos</span>
              </div>
              <p className="text-lg font-bold text-white">3 ativos</p>
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            <Settings size={20} className="text-primary" />
            Configurações
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
              <div>
                <p className="font-medium text-white">Sincronização Automática</p>
                <p className="text-sm text-slate-400">Sincronizar dados automaticamente</p>
              </div>
              <button
                onClick={() => setCloudConfig(prev => ({ ...prev, autoSync: !prev.autoSync }))}
                className={`w-14 h-8 rounded-full transition-colors ${
                  cloudConfig.autoSync ? 'bg-primary' : 'bg-slate-600'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  cloudConfig.autoSync ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
              <div>
                <p className="font-medium text-white">Modo Offline</p>
                <p className="text-sm text-slate-400">Trabalhar sem conexão</p>
              </div>
              <button
                onClick={() => setCloudConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`w-14 h-8 rounded-full transition-colors ${
                  cloudConfig.enabled ? 'bg-primary' : 'bg-slate-600'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  cloudConfig.enabled ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            <RefreshCw size={20} className="text-primary" />
            Ações
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={handleTestConnection}
              className="p-4 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors flex flex-col items-center gap-2"
            >
              <Wifi size={24} />
              <span className="text-sm font-medium">Testar Conexão</span>
            </button>
            
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="p-4 bg-primary/20 text-primary rounded-xl hover:bg-primary/30 transition-colors flex flex-col items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={24} className={isSyncing ? 'animate-spin' : ''} />
              <span className="text-sm font-medium">
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
              </span>
            </button>
            
            <button
              onClick={handleExportData}
              className="p-4 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors flex flex-col items-center gap-2"
            >
              <Download size={24} />
              <span className="text-sm font-medium">Exportar Dados</span>
            </button>
            
            <button
              onClick={handleImportData}
              className="p-4 bg-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500/30 transition-colors flex flex-col items-center gap-2"
            >
              <Upload size={24} />
              <span className="text-sm font-medium">Importar Dados</span>
            </button>
            
            <button
              onClick={handleClearCache}
              className="p-4 bg-yellow-500/20 text-yellow-400 rounded-xl hover:bg-yellow-500/30 transition-colors flex flex-col items-center gap-2"
            >
              <Trash2 size={24} />
              <span className="text-sm font-medium">Limpar Cache</span>
            </button>
          </div>
        </div>

        {/* Sync Progress */}
        {isSyncing && (
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Progresso da Sincronização</h3>
            <div className="w-full bg-slate-700 rounded-full h-4 mb-2">
              <div 
                className="bg-gradient-to-r from-primary to-blue-500 h-4 rounded-full transition-all duration-300"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
            <p className="text-center text-sm text-slate-400">{syncProgress}% concluído</p>
          </div>
        )}
      </div>
    </div>
  );
}
