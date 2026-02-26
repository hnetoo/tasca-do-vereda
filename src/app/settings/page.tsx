'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from '@/store/slices/authSlice';
import {
  Settings as SettingsIcon, Users, Save, Shield,
  CheckCircle, ShieldCheck, QrCode, Share2, Terminal, Smartphone,
  Database, ChefHat, Upload, Link as LinkIcon, MonitorPlay, ToggleRight, ToggleLeft, Rocket, FileText, DownloadCloud, Download, KeyRound, Wifi, Cpu, RefreshCw, Trash2, DollarSign, AlertCircle, Printer, UploadCloud,
  Activity, Zap, Server, Globe, Lock, HardDrive, BarChart3, Bug, Plus, Edit, Cloud, History
} from 'lucide-react';
import { useRealtimeAuditLogs } from '@/hooks/useRealtimeAuditLogs';
import { useRealtimeSystemSettings } from '@/hooks/useRealtimeSystemSettings';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { User, MenuCategory, Product, SystemSettings, StoreState, FinancialClearanceReport, FullApplicationState, BiometricDevice, APIKey, WebhookConfig } from '@/types';
import UserManagementModal from '@/components/UserManagementModal';
import { formatDateInLuanda } from '@/utils/date';
import QRMenuConfig from '@/components/QRMenuConfig';
import POSAccessManagement from '@/components/POSAccessManagement';
import RoleManagementModal from '@/components/RoleManagementModal';
import { BiometricManager } from '@/components/BiometricManager';
import { ApiManager } from '@/components/ApiManager';
import { DataImportManager } from '@/components/DataImportManager';
import { AgtManager } from '@/components/AgtManager';
import { DlpManager } from '@/components/DlpManager';

import { downloadManual } from '@/services/manualService';
import { generateSQLSchema } from '@/services/sqlExportService';

import { clearAllDataActionClient, hardResetActionClient, testCloudConnectionActionClient, fetchRemoteCategoriesActionClient, fetchRemoteProductsActionClient, setupRLSActionClient, setupBucketsActionClient, getDatabaseConfigActionClient, saveDatabaseConfigActionClient, testDatabaseConnectionActionClient, runMigrationsActionClient, renameCategoryGrelhoesActionClient, captureFullStateActionClient, restoreFullStateActionClient } from '@/utils/clientSettingsActions';

import { healthMonitorService, SystemHealthReport, SystemIssue } from '@/services/healthMonitorService';

const Settings = () => {
  const pathname = usePathname();
  const { 
    settings, updateSettings, addNotification, categories, dishes, hardResetMenu, tables, removeTable, addTable, updateTable,
    biometricDevices, registerBiometricDevice, removeBiometricDevice, updateBiometricDevice,
    apiKeys, generateApiKey, revokeApiKey,
    webhooks, registerWebhook, removeWebhook
  } = useStore();
  const user = useSelector(selectUser);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isQRMenuConfigOpen, setIsQRMenuConfigOpen] = useState(false);
  const [isRoleManagementOpen, setIsRoleManagementOpen] = useState(false);
  
  // Integrations State
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [editingBioDevice, setEditingBioDevice] = useState<BiometricDevice | null>(null);
  const [bioDeviceForm, setBioDeviceForm] = useState<Partial<BiometricDevice>>({ name: '', ipAddress: '', port: 4370, type: 'ZKTECO' });
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['order.created']);

  // Database Config State
  const [dbConfig, setDbConfig] = useState<{ type: 'local_storage' | 'postgres' | 'sqlite', connectionString?: string }>({ type: 'local_storage' });

  useEffect(() => {
    getDatabaseConfigActionClient().then(res => {
      if (res.success && res.data) setDbConfig(res.data);
    });
  }, []);

  const settingsTabs = [
    { path: '/settings/general', icon: <SettingsIcon size={20} />, label: 'Geral' },
    { path: '/settings/fiscal', icon: <DollarSign size={20} />, label: 'Fiscal' },
    { path: '/settings/tables', icon: <ChefHat size={20} />, label: 'Mesas' },
    { path: '/settings/qr', icon: <QrCode size={20} />, label: 'Menu QR' },
    { path: '/settings/finance', icon: <DollarSign size={20} />, label: 'Financeiro' },
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

  const isActive = (path: string) => pathname === path;

  // Funções do conteúdo original
  const handleTestCloudConnection = async () => {
    addNotification('info', 'Função temporariamente desativada para build');
  };

  const handleSetupRLS = async () => {
    const result = await setupRLSActionClient();
    if (result.success) {
      addNotification('success', 'RLS configurado com sucesso!');
    } else {
      addNotification('error', 'Falha ao configurar RLS: ' + result.error);
    }
  };

  const handleSetupBuckets = async () => {
    const result = await setupBucketsActionClient();
    if (result.success) {
      addNotification('success', 'Buckets configurados com sucesso!');
    } else {
      addNotification('error', 'Falha ao configurar buckets: ' + result.error);
    }
  };

  const handleRunMigrations = async () => {
    const result = await runMigrationsActionClient();
    if (result.success) {
      addNotification('success', 'Migrações executadas com sucesso!');
    } else {
      addNotification('error', 'Falha ao executar migrações: ' + result.error);
    }
  };

  const handleHardReset = async () => {
    if (confirm('Tem certeza que deseja fazer hard reset? Isso irá apagar todos os dados!')) {
      const result = await hardResetActionClient();
      if (result.success) {
        addNotification('success', 'Hard reset concluído com sucesso!');
        window.location.reload();
      } else {
        addNotification('error', 'Falha ao fazer hard reset: ' + result.error);
      }
    }
  };

  const handleGenerateSQLSchema = async () => {
    addNotification('info', 'Função temporariamente desativada para build');
  };

  const handleDownloadManual = async () => {
    addNotification('info', 'Função temporariamente desativada para build');
  };

  const handleCaptureFullState = async () => {
    const result = await captureFullStateActionClient();
    if (result.success) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `full-state-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addNotification('success', 'Estado completo capturado com sucesso!');
    } else {
      addNotification('error', 'Falha ao capturar estado: ' + result.error);
    }
  };

  const handleRestoreFullState = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const parsed = JSON.parse(content);
      
      let stateToApply: any = null;
      if (parsed.state) {
          stateToApply = parsed.state;
      } else if (parsed.categories || parsed.menu) {
          stateToApply = parsed;
      }

      if (stateToApply) {
           const state: any = stateToApply;
           
           const rawCategories = (Array.isArray(state.categories) ? state.categories : []) as MenuCategory[];
           const uniqueCategories: MenuCategory[] = [];
           const nameToIdMap = new Map<string, string>();
           const idMap = new Map<string, string>();

           for (const cat of rawCategories) {
               if (!cat.id || !cat.name) continue;
               const normalizedName = cat.name.trim().toLowerCase();
               if (nameToIdMap.has(normalizedName)) {
                   const existingId = nameToIdMap.get(normalizedName)!;
                   idMap.set(cat.id, existingId);
               } else {
                   uniqueCategories.push(cat);
                   nameToIdMap.set(normalizedName, cat.id);
                   idMap.set(cat.id, cat.id);
               }
           }
           
           let cleanCategories = uniqueCategories;

           let cleanMenu = (Array.isArray(state.products || state.menu) ? (state.products || state.menu) : []) as Product[];
           const validCatIds = new Set(cleanCategories.map((c) => c.id));
           
           cleanMenu = cleanMenu.map((d: any) => {
               let effectiveCatId = d.categoryId || d.category_id;
           if (effectiveCatId && idMap.has(effectiveCatId)) {
               effectiveCatId = idMap.get(effectiveCatId);
           }
               return { ...d, categoryId: effectiveCatId };
           }).filter((d: any) => validCatIds.has(d.categoryId));

           const result = await restoreFullStateActionClient({ 
               categories: cleanCategories, 
               menu: cleanMenu,
               tables: state.tables || [],
               users: state.users || []
           });
           
           if (result.success) {
               addNotification('success', 'Estado restaurado com sucesso!');
               setTimeout(() => window.location.reload(), 1500);
           } else {
               addNotification('error', 'Falha ao restaurar estado: ' + result.error);
           }
      } else {
          addNotification('error', 'Formato de arquivo inválido');
      }
    } catch (error: any) {
      addNotification('error', 'Erro ao processar arquivo: ' + error.message);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-background text-slate-200 no-scrollbar">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3 italic uppercase">
            <SettingsIcon className="text-primary" /> Configuração do Sistema
        </h2>
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Infraestrutura, Fiscalidade e Hardware Externo</p>
      </header>

      {/* Submenus Horizontais */}
      <div className="flex flex-wrap gap-2 p-4 bg-slate-800 rounded-lg border border-slate-700 mb-8">
        {settingsTabs.map((tab) => (
          <Link
            key={tab.path}
            href={tab.path}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              isActive(tab.path)
                ? 'bg-primary text-white'
                : 'text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {tab.icon}
            <span className="text-sm font-medium">{tab.label}</span>
          </Link>
        ))}
      </div>

      {/* Conteúdo Original - Visão Geral */}
      <div className="glass-panel rounded-[2.5rem] p-8 min-h-[500px] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

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
                    onChange={(e) => setDbConfig({ type: e.target.value as any, connectionString: dbConfig.connectionString })}
                    className="w-full mt-2 p-3 bg-black/40 border border-white/10 rounded-xl text-white"
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
                      value={dbConfig.connectionString || ''}
                      onChange={(e) => setDbConfig({ ...dbConfig, connectionString: e.target.value })}
                      placeholder="postgresql://user:password@localhost:5432/dbname"
                      className="w-full mt-2 p-3 bg-black/40 border border-white/10 rounded-xl text-white"
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => saveDatabaseConfigActionClient(dbConfig)}
                  className="w-full py-3 bg-primary text-black rounded-xl font-black text-xs uppercase tracking-widest shadow-glow hover:brightness-110 transition-all"
                >
                  Guardar Configuração
                </button>
                <button 
                  onClick={() => testDatabaseConnectionActionClient(dbConfig.type, dbConfig.connectionString || "")}
                  className="w-full py-3 bg-slate-700 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-600 transition-all"
                >
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
                {settings.supabaseConfig?.enabled && (
                  <>
                    <button 
                      onClick={handleSetupRLS}
                      className="w-full py-3 bg-slate-700 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-600 transition-all"
                    >
                      Configurar RLS
                    </button>
                    <button 
                      onClick={handleSetupBuckets}
                      className="w-full py-3 bg-slate-700 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-600 transition-all"
                    >
                      Configurar Buckets
                    </button>
                  </>
                )}
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
              
              <button 
                onClick={handleGenerateSQLSchema}
                className="p-4 bg-slate-800 rounded-xl border border-white/5 hover:bg-slate-700 transition-all"
              >
                <Database className="mx-auto mb-2 text-green-400" size={24} />
                <div className="text-xs font-bold text-white">Gerar Schema SQL</div>
              </button>
              
              <button 
                onClick={handleDownloadManual}
                className="p-4 bg-slate-800 rounded-xl border border-white/5 hover:bg-slate-700 transition-all"
              >
                <FileText className="mx-auto mb-2 text-purple-400" size={24} />
                <div className="text-xs font-bold text-white">Baixar Manual</div>
              </button>
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 text-yellow-500 rounded-xl">
                <Save size={20} />
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Backup & Restore</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <button 
                  onClick={handleCaptureFullState}
                  className="w-full py-4 bg-primary/10 text-primary rounded-xl font-black text-xs uppercase tracking-widest border border-primary/20 hover:bg-primary/20 transition-all"
                >
                  <DownloadCloud className="inline-block mr-2" size={16} />
                  Exportar Estado Completo
                </button>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Importar Estado Completo
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreFullState}
                    className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-primary file:text-black hover:file:bg-primary/80"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-red-900/20 rounded-xl border border-red-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <Trash2 className="text-red-400" size={20} />
                  <h5 className="text-xs font-black text-red-400 uppercase tracking-widest">ZONA DE PERIGO</h5>
                </div>
                <p className="text-xs text-red-300 mb-4">
                  Esta ação irá apagar IRREVERSIVELMENTE todos os dados do sistema.
                </p>
                <button 
                  onClick={handleHardReset}
                  className="w-full py-3 bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all"
                >
                  Hard Reset Completo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isUserModalOpen && (
        <UserManagementModal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
        />
      )}
      
      {isQRMenuConfigOpen && (
        <QRMenuConfig
          isOpen={isQRMenuConfigOpen}
          onClose={() => setIsQRMenuConfigOpen(false)}
        />
      )}
      
      {isRoleManagementOpen && (
        <RoleManagementModal
          isOpen={isRoleManagementOpen}
          onClose={() => setIsRoleManagementOpen(false)}
        />
      )}
    </div>
  );
};

export default Settings;


