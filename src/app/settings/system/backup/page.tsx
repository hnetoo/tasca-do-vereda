'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Save, Download, Upload, RefreshCw, Calendar, Clock, FileText, Trash2, Database, CheckCircle, AlertCircle, Play, Pause, Settings } from 'lucide-react';

export default function SettingsBackupPage() {
  const { addNotification } = useStore();
  const [backups, setBackups] = useState([
    {
      id: '1',
      name: 'backup_completo_2024_01_15',
      date: '2024-01-15T02:00:00',
      size: 245.6,
      type: 'full',
      status: 'completed',
      location: 'cloud'
    },
    {
      id: '2',
      name: 'backup_diario_2024_01_14',
      date: '2024-01-14T02:00:00',
      size: 238.2,
      type: 'incremental',
      status: 'completed',
      location: 'local'
    },
    {
      id: '3',
      name: 'backup_completo_2024_01_13',
      date: '2024-01-13T02:00:00',
      size: 242.8,
      type: 'full',
      status: 'completed',
      location: 'cloud'
    }
  ]);

  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    retentionDays: 30,
    compressBackups: true,
    encryptBackups: true,
    backupLocation: 'both'
  });

  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  const handleCreateBackup = (type: 'full' | 'incremental') => {
    setIsCreatingBackup(true);
    setBackupProgress(0);
    
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsCreatingBackup(false);
          
          const newBackup = {
            id: Date.now().toString(),
            name: `backup_${type}_${new Date().toISOString().split('T')[0]}`,
            date: new Date().toISOString(),
            size: Math.random() * 50 + 200,
            type,
            status: 'completed',
            location: 'local'
          };
          
          setBackups(prev => [newBackup, ...prev]);
          addNotification('success', `Backup ${type} criado com sucesso!`);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleRestoreBackup = (backupId: string) => {
    const backup = backups.find(b => b.id === backupId);
    if (confirm(`Tem certeza que deseja restaurar o backup "${backup?.name}"?`)) {
      addNotification('info', 'Restaurando backup...');
      setTimeout(() => {
        addNotification('success', 'Backup restaurado com sucesso!');
      }, 3000);
    }
  };

  const handleDeleteBackup = (backupId: string) => {
    const backup = backups.find(b => b.id === backupId);
    if (confirm(`Tem certeza que deseja excluir o backup "${backup?.name}"?`)) {
      setBackups(prev => prev.filter(b => b.id !== backupId));
      addNotification('success', 'Backup excluído com sucesso!');
    }
  };

  const handleDownloadBackup = (backupId: string) => {
    const backup = backups.find(b => b.id === backupId);
    addNotification('info', `Baixando backup ${backup?.name}...`);
    setTimeout(() => {
      addNotification('success', 'Backup baixado com sucesso!');
    }, 2000);
  };

  const handleUploadBackup = () => {
    addNotification('info', 'Upload de backup...');
    setTimeout(() => {
      addNotification('success', 'Backup enviado para nuvem com sucesso!');
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'in_progress': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'failed': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'full' 
      ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      : 'text-purple-400 bg-purple-500/10 border-purple-500/20';
  };

  const getLocationIcon = (location: string) => {
    return location === 'cloud' ? '☁️' : '💾';
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Backup e Restauração</h1>
        <p className="text-slate-400">Gestão de backups e recuperação de dados</p>
      </div>

      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            <Save size={20} className="text-primary" />
            Ações Rápidas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => handleCreateBackup('full')}
              disabled={isCreatingBackup}
              className="p-4 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors flex flex-col items-center gap-2 disabled:opacity-50"
            >
              <Database size={24} />
              <span className="text-sm font-medium">Backup Completo</span>
            </button>
            
            <button
              onClick={() => handleCreateBackup('incremental')}
              disabled={isCreatingBackup}
              className="p-4 bg-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500/30 transition-colors flex flex-col items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={24} />
              <span className="text-sm font-medium">Backup Incremental</span>
            </button>
            
            <button
              onClick={handleUploadBackup}
              className="p-4 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors flex flex-col items-center gap-2"
            >
              <Upload size={24} />
              <span className="text-sm font-medium">Upload Backup</span>
            </button>
            
            <button
              className="p-4 bg-yellow-500/20 text-yellow-400 rounded-xl hover:bg-yellow-500/30 transition-colors flex flex-col items-center gap-2"
            >
              <Calendar size={24} />
              <span className="text-sm font-medium">Agendar</span>
            </button>
          </div>
        </div>

        {/* Backup Progress */}
        {isCreatingBackup && (
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Criando Backup...</h3>
            <div className="w-full bg-slate-700 rounded-full h-4 mb-2">
              <div 
                className="bg-gradient-to-r from-primary to-blue-500 h-4 rounded-full transition-all duration-300"
                style={{ width: `${backupProgress}%` }}
              />
            </div>
            <p className="text-center text-sm text-slate-400">{backupProgress}% concluído</p>
          </div>
        )}

        {/* Backup List */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <FileText size={20} className="text-primary" />
              Histórico de Backups
            </h3>
            <div className="text-sm text-slate-400">
              Total: {backups.length} backups
            </div>
          </div>
          
          <div className="space-y-3">
            {backups.map((backup) => (
              <div key={backup.id} className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{getLocationIcon(backup.location)}</div>
                    <div>
                      <h4 className="font-medium text-white">{backup.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(backup.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(backup.date).toLocaleTimeString()}
                        </span>
                        <span>{backup.size.toFixed(1)} MB</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(backup.type)}`}>
                      {backup.type === 'full' ? 'Completo' : 'Incremental'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(backup.status)}`}>
                      {backup.status === 'completed' ? 'Concluído' : 
                       backup.status === 'in_progress' ? 'Em Progresso' : 'Falhou'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleRestoreBackup(backup.id)}
                    className="flex-1 p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium"
                  >
                    Restaurar
                  </button>
                  <button
                    onClick={() => handleDownloadBackup(backup.id)}
                    className="flex-1 p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDeleteBackup(backup.id)}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Backup Settings */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            <Settings size={20} className="text-primary" />
            Configurações Automáticas
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
              <div>
                <p className="font-medium text-white">Backup Automático</p>
                <p className="text-sm text-slate-400">Criar backups automaticamente</p>
              </div>
              <button
                onClick={() => setBackupSettings(prev => ({ ...prev, autoBackup: !prev.autoBackup }))}
                className={`w-14 h-8 rounded-full transition-colors ${
                  backupSettings.autoBackup ? 'bg-primary' : 'bg-slate-600'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  backupSettings.autoBackup ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Frequência</label>
                <select
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={backupSettings.backupFrequency}
                  onChange={(e) => setBackupSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
                >
                  <option value="hourly">A cada hora</option>
                  <option value="daily">Diariamente</option>
                  <option value="weekly">Semanalmente</option>
                  <option value="monthly">Mensalmente</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Horário</label>
                <input
                  type="time"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={backupSettings.backupTime}
                  onChange={(e) => setBackupSettings(prev => ({ ...prev, backupTime: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Retenção (dias)</label>
              <input
                type="number"
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                value={backupSettings.retentionDays}
                onChange={(e) => setBackupSettings(prev => ({ ...prev, retentionDays: Number(e.target.value) }))}
                min="1"
                max="365"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                <div>
                  <p className="font-medium text-white">Compressão</p>
                  <p className="text-sm text-slate-400">Comprimir backups</p>
                </div>
                <button
                  onClick={() => setBackupSettings(prev => ({ ...prev, compressBackups: !prev.compressBackups }))}
                  className={`w-14 h-8 rounded-full transition-colors ${
                    backupSettings.compressBackups ? 'bg-primary' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    backupSettings.compressBackups ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                <div>
                  <p className="font-medium text-white">Criptografia</p>
                  <p className="text-sm text-slate-400">Criptografar backups</p>
                </div>
                <button
                  onClick={() => setBackupSettings(prev => ({ ...prev, encryptBackups: !prev.encryptBackups }))}
                  className={`w-14 h-8 rounded-full transition-colors ${
                    backupSettings.encryptBackups ? 'bg-primary' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    backupSettings.encryptBackups ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
