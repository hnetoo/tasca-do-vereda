'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { MonitorPlay, Users, Shield, Share2, Activity, Cloud, Save, FileText, Lock, History, AlertCircle, Cpu, HardDrive, Globe, Zap, BarChart3, RefreshCw, Database, DownloadCloud, Rocket, Trash2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function SettingsSystemPage() {
  const { settings, updateSettings, addNotification } = useStore();
  const [dbConfig, setDbConfig] = useState({ type: 'local_storage', connectionString: '' });
  const [healthReport, setHealthReport] = useState(() => ({
    uptime: 86400,
    stabilityScore: 98,
    performanceMetrics: {
      cpuUsage: 15.2,
      memoryUsage: 256,
      networkLatency: 12,
      latency: 8.5
    }
  }));
  const [metricsHistory, setMetricsHistory] = useState(() => {
    // Simular histórico de métricas
    return Array.from({ length: 20 }, (_, i) => ({
      time: new Date(Date.now() - (19 - i) * 60000).toLocaleTimeString(),
      cpu: Math.random() * 30 + 10,
      memory: Math.random() * 100 + 200,
      latency: Math.random() * 20 + 5
    }));
  });

  const handleTestCloudConnection = async () => {
    // addNotification('success', 'Conexão com cloud estabelecida com sucesso!');
    console.log('Cloud connection test');
  };

  const handleRunMigrations = async () => {
    // addNotification('success', 'Migrações executadas com sucesso!');
    console.log('Migrations run');
  };

  const handleHardReset = async () => {
    if (confirm('Tem certeza que deseja fazer hard reset? Isso irá apagar todos os dados!')) {
      // addNotification('success', 'Hard reset concluído com sucesso!');
      console.log('Hard reset executed');
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const systemTabs = [
    { path: '/settings/system/users', icon: <Users size={20} />, label: 'Utilizadores' },
    { path: '/settings/system/roles', icon: <Shield size={20} />, label: 'Cargos' },
    { path: '/settings/system/integrations', icon: <Share2 size={20} />, label: 'Integrações' },
    { path: '/settings/system/health', icon: <Activity size={20} />, label: 'Monitorização' },
    { path: '/settings/system/cloud', icon: <Cloud size={20} />, label: 'Nuvem / App' },
    { path: '/settings/system/backup', icon: <Save size={20} />, label: 'Backup / Restore' },
    { path: '/settings/system/agt', icon: <FileText size={20} />, label: 'AGT' },
    { path: '/settings/system/dlp', icon: <Lock size={20} />, label: 'DLP' },
    { path: '/settings/system/history', icon: <History size={20} />, label: 'Histórico' },
  ];

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Sistema</h1>
        <p className="text-slate-400">Configurações do sistema</p>
      </div>

      {/* Submenus do Sistema */}
      <div className="flex flex-wrap gap-2 p-4 bg-slate-800 rounded-lg border border-slate-700 mb-8">
        {systemTabs.map((tab) => (
          <a
            key={tab.path}
            href={tab.path}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-slate-400 hover:bg-slate-700 hover:text-white"
          >
            {tab.icon}
            <span className="text-sm font-medium">{tab.label}</span>
          </a>
        ))}
      </div>

      {/* Conteúdo Principal - Visão Geral do Sistema */}
      <div className="space-y-8">
        {/* Database Configuration */}
        <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-500 rounded-xl">
              <Database size={20} />
            </div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">Configuração da Base de Dados</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo de Base de Dados</label>
                <select 
                  value={dbConfig.type}
                  onChange={(e) => setDbConfig({ ...dbConfig, type: e.target.value })}
                  className="w-full mt-2 p-3 bg-black/40 border border-white/10 rounded-xl text-white"
                  title="Tipo de Base de Dados"
                >
                  <option value="local_storage">Armazenamento Local</option>
                  <option value="sqlite">SQLite</option>
                  <option value="postgres">PostgreSQL</option>
                </select>
              </div>
              
              {(dbConfig.type === 'postgres' || dbConfig.type === 'sqlite') && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Connection String</label>
                  <input
                    type="text"
                    value={dbConfig.connectionString}
                    onChange={(e) => setDbConfig({ ...dbConfig, connectionString: e.target.value })}
                    placeholder="postgresql://user:password@localhost:5432/dbname"
                    className="w-full mt-2 p-3 bg-black/40 border border-white/10 rounded-xl text-white"
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <button className="w-full py-3 bg-primary text-black rounded-xl font-black text-xs uppercase tracking-widest shadow-glow hover:brightness-110 transition-all">
                Guardar Configuração
              </button>
              <button className="w-full py-3 bg-slate-700 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-600 transition-all">
                Testar Conexão
              </button>
            </div>
          </div>
        </div>

        {/* Cloud Configuration */}
        <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 text-green-500 rounded-xl">
              <Cloud size={20} />
            </div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">Configuração da Cloud</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <input
                    type="checkbox"
                    checked={settings.supabaseConfig?.enabled || false}
                    onChange={(e) => updateSettings({ 
                      supabaseConfig: { 
                        enabled: e.target.checked,
                        url: settings.supabaseConfig?.url || "",
                        key: settings.supabaseConfig?.key || "",
                        autoSync: settings.supabaseConfig?.autoSync || false
                      } 
                    })}
                  />
                  Ativar Sincronização com Cloud
                </label>
              </div>
              
              {settings.supabaseConfig?.enabled && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">URL do Supabase</label>
                    <input
                      type="text"
                      value={settings.supabaseConfig?.url || ''}
                      onChange={(e) => updateSettings({ 
                        supabaseConfig: { 
                          enabled: settings.supabaseConfig?.enabled || false,
                          url: e.target.value,
                          key: settings.supabaseConfig?.key || "",
                          autoSync: settings.supabaseConfig?.autoSync || false
                        } 
                      })}
                      placeholder="https://your-project.supabase.co"
                      className="w-full mt-2 p-3 bg-black/40 border border-white/10 rounded-xl text-white"
                    />
                  </div>
                  
                  <form onSubmit={(e) => { e.preventDefault(); }}>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chave API</label>
                      <input
                        type="password"
                        value={settings.supabaseConfig?.key || ''}
                        onChange={(e) => updateSettings({ 
                          supabaseConfig: { 
                            enabled: settings.supabaseConfig?.enabled || false,
                            url: settings.supabaseConfig?.url || "",
                            key: e.target.value,
                            autoSync: settings.supabaseConfig?.autoSync || false
                          } 
                        })}
                        placeholder="sua-chave-supabase"
                        className="w-full mt-2 p-3 bg-black/40 border border-white/10 rounded-xl text-white"
                      />
                    </div>
                  </form>
                </>
              )}
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={handleTestCloudConnection}
                className="w-full py-3 bg-primary text-black rounded-xl font-black text-xs uppercase tracking-widest shadow-glow hover:brightness-110 transition-all"
              >
                Testar Conexão
              </button>
            </div>
          </div>
        </div>

        {/* System Actions */}
        <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 text-red-500 rounded-xl">
              <AlertCircle size={20} />
            </div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">Ações do Sistema</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={handleRunMigrations}
              className="p-4 bg-slate-800 rounded-xl border border-white/5 hover:bg-slate-700 transition-all"
            >
              <RefreshCw className="mx-auto mb-2 text-blue-400" size={24} />
              <div className="text-xs font-bold text-white">Executar Migrações</div>
            </button>
            
            <button className="p-4 bg-slate-800 rounded-xl border border-white/5 hover:bg-slate-700 transition-all">
              <Database className="mx-auto mb-2 text-green-400" size={24} />
              <div className="text-xs font-bold text-white">Gerar Schema SQL</div>
            </button>
            
            <button className="p-4 bg-slate-800 rounded-xl border border-white/5 hover:bg-slate-700 transition-all">
              <FileText className="mx-auto mb-2 text-purple-400" size={24} />
              <div className="text-xs font-bold text-white">Baixar Manual</div>
            </button>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-xl">
              <Activity size={20} />
            </div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">Saúde do Sistema</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'CPU Usage', value: healthReport?.performanceMetrics.cpuUsage.toFixed(1) + '%', icon: Cpu, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Memory', value: healthReport?.performanceMetrics.memoryUsage.toFixed(0) + 'MB', icon: HardDrive, color: 'text-purple-500', bg: 'bg-purple-500/10' },
              { label: 'Network', value: healthReport?.performanceMetrics.networkLatency.toFixed(0) + 'ms', icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Latency', value: healthReport?.performanceMetrics.latency.toFixed(1) + 'ms', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' }
            ].map((m, i) => (
              <div key={i} className="bg-slate-800/50 p-6 rounded-3xl border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 ${m.bg} ${m.color} rounded-xl`}>
                    <m.icon size={20} />
                  </div>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{m.label}</p>
                <p className="text-xl font-mono font-black text-white tracking-tighter">{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-900/20 p-8 rounded-[2.5rem] border border-red-500/20">
          <div className="flex items-center gap-3 mb-6">
            <Trash2 className="text-red-400" size={24} />
            <h4 className="text-sm font-black text-red-400 uppercase tracking-widest">ZONA DE PERIGO</h4>
          </div>
          <p className="text-sm text-red-300 mb-6">
            Esta ação irá apagar IRREVERSIVELMENTE todos os dados do sistema.
          </p>
          <button 
            onClick={handleHardReset}
            className="w-full py-4 bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all"
          >
            Hard Reset Completo
          </button>
        </div>
      </div>
    </div>
  );
}
