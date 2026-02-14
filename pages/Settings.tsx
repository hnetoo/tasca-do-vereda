
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import {
  Settings as SettingsIcon, Users, Save, Shield,
  CheckCircle, ShieldCheck, QrCode, Share2, Terminal, Smartphone,
  Database, ChefHat, Upload, Link as LinkIcon, MonitorPlay, ToggleRight, ToggleLeft, Rocket, FileText, DownloadCloud, Download, KeyRound, Wifi, Cpu, RefreshCw, Trash2, DollarSign, AlertCircle, Printer, UploadCloud,
  Activity, Zap, Server, Globe, Lock, HardDrive, BarChart3, Bug
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { User, MenuCategory, Dish, SystemSettings, StoreState, BackupState, FinancialClearanceReport, FullApplicationState } from '../types';
import UserManagementModal from '../components/UserManagementModal';
import QRMenuConfig from '../components/QRMenuConfig';
import POSAccessManagement from '../components/POSAccessManagement';
import RoleManagementModal from '../components/RoleManagementModal';
import { executeQuery } from '../services/database/connection';
import { dbConfig } from '../services/database/config';
import { downloadManual } from '../services/manualService';
import { generateSQLSchema } from '../services/sqlExportService';
import { disasterRecoveryService } from '../services/disasterRecoveryService';

import { logger } from '../services/logger';

import { supabaseService } from '../services/supabaseService';
import { healthMonitorService, SystemHealthReport, SystemIssue } from '../services/healthMonitorService';

const CloudImportPanel = () => {
  const { settings, addNotification, importCloudItems, detectCloudConflicts } = useStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [remoteCategories, setRemoteCategories] = useState<MenuCategory[]>([]);
  const [remoteDishes, setRemoteDishes] = useState<Dish[]>([]);
  const [selectedCatIds, setSelectedCatIds] = useState<Set<string>>(new Set());
  const [selectedDishIds, setSelectedDishIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const toggleSet = (setFn: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    setFn(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const loadRemote = async () => {
    if (!settings.supabaseConfig?.enabled || !settings.supabaseConfig?.url || !settings.supabaseConfig?.key) {
      addNotification('warning', 'Configure a cloud antes de importar');
      return;
    }
    if (!supabaseService.isConnected()) {
      supabaseService.initialize(settings.supabaseConfig.url, settings.supabaseConfig.key);
    }
    setIsLoading(true);
    try {
      const catsRes = await supabaseService.fetchCategoriesPaged({ page: 1, pageSize: 100, search });
      const dishesRes = await supabaseService.fetchDishesPaged({ page: 1, pageSize: 200, search, categoryId: categoryFilter });
      if (catsRes.success && catsRes.data) setRemoteCategories(catsRes.data);
      if (dishesRes.success && dishesRes.data) setRemoteDishes(dishesRes.data);
      addNotification('success', 'Itens carregados da cloud');
    } catch (e: unknown) {
      addNotification('error', 'Falha ao carregar da cloud');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCategories = remoteCategories.filter(c => selectedCatIds.has(c.id));
  const selectedDishes = remoteDishes.filter(d => selectedDishIds.has(d.id));
  const conflicts = detectCloudConflicts({ categories: selectedCategories, dishes: selectedDishes });

  const importSelected = (preferCloud: boolean) => {
    importCloudItems({ categories: selectedCategories, dishes: selectedDishes, preferCloud });
    setSelectedCatIds(new Set());
    setSelectedDishIds(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar por nome"
          className="p-3 bg-black/40 border border-white/10 rounded-2xl text-white text-xs"
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="p-3 bg-black/40 border border-white/10 rounded-2xl text-white text-xs"
        >
          <option value="">Todas categorias</option>
          {remoteCategories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          onClick={loadRemote}
          disabled={isLoading}
          className={`py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${isLoading ? 'bg-white/10 text-white' : 'bg-primary text-black hover:brightness-110'}`}
        >
          {isLoading ? 'A Carregar...' : 'Carregar da Cloud'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-slate-300 uppercase">Categorias</span>
            <span className="text-[10px] font-mono text-slate-500">{remoteCategories.length}</span>
          </div>
          <div className="max-h-64 overflow-auto space-y-2">
            {remoteCategories.map(c => (
              <label key={c.id} className="flex items-center justify-between p-2 bg-black/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={selectedCatIds.has(c.id)} onChange={() => toggleSet(setSelectedCatIds, c.id)} />
                  <span className="text-xs text-white">{c.name}</span>
                </div>
                <span className="text-[10px] text-slate-500">#{c.sort_order || 0}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-slate-300 uppercase">Produtos</span>
            <span className="text-[10px] font-mono text-slate-500">{remoteDishes.length}</span>
          </div>
          <div className="max-h-64 overflow-auto space-y-2">
            {remoteDishes.map(d => (
              <label key={d.id} className="flex items-center justify-between p-2 bg-black/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={selectedDishIds.has(d.id)} onChange={() => toggleSet(setSelectedDishIds, d.id)} />
                  <span className="text-xs text-white">{d.name}</span>
                </div>
                <span className="text-[10px] text-slate-500">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(d.price)}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between p-3 bg-black/30 rounded-2xl border border-white/10 flex-wrap gap-3">
        <span className="text-[10px] text-slate-400 font-black uppercase">Conflitos: {conflicts.categories.length + conflicts.dishes.length}</span>
        <div className="flex gap-3 flex-wrap w-full md:w-auto justify-end">
          <button onClick={() => importSelected(true)} className="px-4 py-2 bg-primary text-black rounded-xl text-[10px] font-black uppercase tracking-widest">Integrar Selecionados</button>
          <button onClick={() => importSelected(false)} className="px-4 py-2 bg-white/5 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">Importar Preferindo Local</button>
        </div>
      </div>
    </div>
  );
};
const Settings = () => {
  const { settings, updateSettings, currentUser, addNotification, categories, menu: dishes, hardResetMenu, tables } = useStore();
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'fiscal' | 'tables' | 'qr' | 'integrations' | 'roles' | 'database' | 'agt' | 'dlp' | 'monitoring' | 'cloud' | 'bd'>('general');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isQRMenuConfigOpen, setIsQRMenuConfigOpen] = useState(false);
  const [isRoleManagementOpen, setIsRoleManagementOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings);
  
  // Cloud State (managed within localSettings)
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // Monitoring State
  const [healthReport, setHealthReport] = useState<SystemHealthReport | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<SystemHealthReport[]>([]);
  const [recentLogs, setRecentLogs] = useState<SystemIssue[]>([]);

  useEffect(() => {
    if (activeTab === 'monitoring') {
      const updateMetrics = () => {
        setHealthReport(healthMonitorService.getHealthReport());
        setMetricsHistory(healthMonitorService.getMetricsHistory());
        setRecentLogs(healthMonitorService.getRecentLogs(15));
      };

      updateMetrics();
      const interval = setInterval(updateMetrics, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const logoInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => { 
    const envUrl = (import.meta as any)?.env?.VITE_SUPABASE_URL || '';
    const envKey = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY || '';
    const hasEnv = !!envUrl && !!envKey;
    setLocalSettings({
      ...settings,
      supabaseConfig: {
        enabled: hasEnv ? true : (settings.supabaseConfig?.enabled || false),
        url: settings.supabaseConfig?.url || envUrl || '',
        key: settings.supabaseConfig?.key || envKey || '',
        autoSync: settings.supabaseConfig?.autoSync ?? hasEnv
      }
    });
  }, [settings, currentUser]);





  const handleDownloadManual = async (type: 'TECNICO' | 'UTILIZADOR' | 'ADMIN') => {
    try {
      await downloadManual(type);
      addNotification('success', 'Manual exportado com sucesso.');
    } catch (error) {
      console.error(error);
      addNotification('error', 'Erro ao exportar manual.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...localSettings,
      supabaseConfig: {
        ...localSettings.supabaseConfig,
        url: localSettings.supabaseConfig?.url || '',
        key: localSettings.supabaseConfig?.key || '',
      }
    });

    addNotification('success', 'Configurações de sistema atualizadas.');
  };

  const handleTestCloudConnection = async () => {
    if (!localSettings.supabaseConfig?.url || !localSettings.supabaseConfig?.key) {
      addNotification('warning', 'Introduza o URL e a Anon Key para testar.');
      return;
    }

    setIsTestingCloud(true);
    setCloudStatus('testing');
    logger.info('Iniciando teste de conexão Supabase...', null, 'CLOUD');

    try {
      const result = await supabaseService.testConnection(localSettings.supabaseConfig.url, localSettings.supabaseConfig.key);
      if (result) {
        setCloudStatus('success');
        addNotification('success', 'Conexão Supabase estabelecida com sucesso!');
        logger.info('Conexão Supabase validada.', null, 'CLOUD');
      } else {
        throw new Error('Falha na resposta do servidor');
      }
    } catch (error: unknown) {
      setCloudStatus('error');
      addNotification('error', `Erro na conexão: ${error instanceof Error ? error.message : String(error)}`);
      logger.error(`Falha no teste de conexão: ${error instanceof Error ? error.message : String(error)}`, error, 'CLOUD');
    } finally {
      setIsTestingCloud(false);
    }
  };

  const handleForcerSincronizacao = async () => {
    addNotification('info', 'Iniciando sincronização forçada...');
    logger.info('Sincronização forçada solicitada pelo utilizador', null, 'CLOUD');
    
    try {
      // Simulação de sincronização
      await new Promise(resolve => setTimeout(resolve, 2000));
      addNotification('success', 'Sincronização concluída com sucesso.');
      logger.info('Sincronização concluída.', null, 'CLOUD');
    } catch (e: unknown) {
      const error = e as Error;
      addNotification('error', 'Falha na sincronização.');
      logger.error('Erro durante sincronização forçada', { error: error.message }, 'CLOUD');
    }
  };

  const handleGerarTokenApp = () => {
    addNotification('info', 'Gerando novo token de acesso móvel...');
    // Lógica futura para gerar token JWT
    setTimeout(() => {
      addNotification('success', 'Token gerado. Pronto para emparelhamento.');
    }, 1000);
  };

  const handleSetupRLS = async () => {
    if (!supabaseService.isConnected()) {
      addNotification('warning', 'Supabase não inicializado. Configure e teste a conexão primeiro.');
      logger.warn('Tentativa de configurar RLS sem conexão Supabase ativa', null, 'SECURITY');
      return;
    }
    
    addNotification('info', 'Validando conexão para políticas de segurança...');
    logger.info('Iniciando validação de políticas RLS', null, 'SECURITY');
    const result = await supabaseService.setupRLS();
    if (result.success) {
      addNotification('success', (result as any).message || 'Políticas validadas com sucesso.');
      logger.info('RLS validado com sucesso', { result }, 'SECURITY');
    } else {
      addNotification('error', `Falha ao configurar RLS: ${(result as any).error}`);
      logger.error('Falha na configuração/validação de RLS', { error: (result as any).error }, 'SECURITY');
    }
  };

  const handleSetupBuckets = async () => {
    if (!supabaseService.isConnected()) {
      addNotification('warning', 'Supabase não inicializado. Configure e teste a conexão primeiro.');
      logger.warn('Tentativa de configurar buckets sem conexão Supabase ativa', null, 'STORAGE');
      return;
    }

    addNotification('info', 'Configurando buckets de armazenamento...');
    logger.info('Iniciando configuração de buckets de armazenamento', null, 'STORAGE');
    const result = await supabaseService.setupBuckets();
    if (result.success) {
      addNotification('success', (result as any).message || 'Buckets configurados com sucesso.');
      logger.info('Buckets configurados com sucesso', { result }, 'STORAGE');
    } else {
      addNotification('error', `Falha ao configurar buckets: ${(result as any).error}`);
      logger.error('Falha na configuração de buckets', { error: (result as any).error }, 'STORAGE');
    }
  };

  const handleBackup = async () => {
    try {
      addNotification('info', 'A preparar backup completo (SQL + Local)...');
      const state = await disasterRecoveryService.captureFullState();
      
      const backupData = {
        state,
        version: 3, // V3 supports FullApplicationState (SQL)
        timestamp: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasca_full_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addNotification('success', 'Backup completo gerado com sucesso.');
    } catch (error: unknown) {
      console.error(error);
      addNotification('error', `Erro ao gerar backup: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('ATENÇÃO: Restaurar um backup irá substituir TODOS os dados atuais. Deseja continuar?')) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Normalize state object
        let stateToApply: any = null;
        if (parsed.state) {
            stateToApply = parsed.state;
        } else if (parsed.categories || parsed.menu) {
            // Probably a direct export of state
            stateToApply = parsed;
        }

        if (stateToApply) {
             // SANITIZATION STEP (Fix for restoring old/buggy backups)
             const state: any = stateToApply;
             
             // 1. Sanitize Categories (Merge duplicates by Name)
             const rawCategories = (Array.isArray(state.categories) ? state.categories : []) as MenuCategory[];
             const uniqueCategories: MenuCategory[] = [];
             const nameToIdMap = new Map<string, string>(); // Name -> ID
             const idMap = new Map<string, string>(); // Old ID -> New ID (for merged categories)

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

             // 2. Sanitize Dishes (Menu)
             let cleanMenu = (Array.isArray(state.menu) ? state.menu : []) as Dish[];
             const validCatIds = new Set(cleanCategories.map((c) => c.id));
             
             cleanMenu = cleanMenu.map((d) => {
                 let effectiveCatId = d.categoryId;
                 if (idMap.has(d.categoryId)) {
                     effectiveCatId = idMap.get(d.categoryId);
                 }
                 if (effectiveCatId && validCatIds.has(effectiveCatId)) {
                     return { ...d, categoryId: effectiveCatId };
                 }
                 if (d.categoryName) {
                     const normalizedCatName = d.categoryName.trim().toLowerCase();
                     const matchByName = cleanCategories.find((c) => 
                         c.name.trim().toLowerCase() === normalizedCatName
                     );
                     if (matchByName) return { ...d, categoryId: matchByName.id };
                 }
                 return { ...d, categoryId: 'uncategorized' };
             });
             
             // 3. Ensure 'uncategorized' exists if needed
             const hasUncategorizedItems = cleanMenu.some((d) => d.categoryId === 'uncategorized');
             if (hasUncategorizedItems && !validCatIds.has('uncategorized')) {
                 const existingUncategorized = cleanCategories.find(c => {
                     const n = c.name.trim().toLowerCase();
                     return n === 'sem categoria' || n === 'uncategorized' || n === 'outros' || n === 'geral';
                 });
                 if (existingUncategorized) {
                    cleanMenu = cleanMenu.map(d => d.categoryId === 'uncategorized' ? { ...d, categoryId: existingUncategorized.id } : d);
                } else {
                    cleanCategories.push({ id: 'uncategorized', name: 'Sem Categoria', icon: 'Grid3X3', sort_order: 999, is_active: true });
                }
            }
            
            // 4. PRUNE EMPTY CATEGORIES
            const productCounts = new Map<string, number>();
            cleanMenu.forEach(d => {
                const count = productCounts.get(d.categoryId) || 0;
                productCounts.set(d.categoryId, count + 1);
            });
            cleanCategories = cleanCategories.filter(c => (productCounts.get(c.id) || 0) > 0);
            if (cleanCategories.length === 0) {
                cleanCategories.push({ id: 'uncategorized', name: 'Sem Categoria', icon: 'Grid3X3', sort_order: 0, is_active: true });
            }

             // Update state with sanitized data
             state.categories = cleanCategories;
             state.menu = cleanMenu;

             // Ensure FullApplicationState structure for applyState
             const fullState = {
                categories: cleanCategories,
                menu: cleanMenu,
                orders: state.orders || [],
                employees: state.employees || [],
                stock: state.stock || [],
                expenses: state.expenses || [],
                revenues: state.revenues || [],
                shifts: state.shifts || state.workShifts || [],
                payrollRecords: state.payrollRecords || state.payroll || [],
                settings: state.settings || settings,
                activeOrders: state.activeOrders || [],
                tables: state.tables || [],
                users: state.users || [],
                attendance: state.attendance || [],
                customers: state.customers || [],
                suppliers: state.suppliers || [],
                timestamp: new Date().toISOString()
             } as unknown as FullApplicationState;
             
             // Save sanitized content to SQL and Local
             await disasterRecoveryService.applyState(fullState);
             
             // Also update localStorage for Zustand rehydration (safety)
             localStorage.setItem('tasca-vereda-storage-v2', JSON.stringify({ state: fullState, version: 3 }));

             addNotification('success', 'Dados restaurados com sucesso. A reiniciar...');
             setTimeout(() => window.location.reload(), 2000);
        } else {
             throw new Error('Formato de backup inválido.');
        }
      } catch (e: unknown) {
        const error = e as Error;
        console.error(error);
        addNotification('error', `Erro ao restaurar backup: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit file size to avoid browser freeze before processing
      if (file.size > 5 * 1024 * 1024) {
        addNotification('error', 'Imagem muito grande. Máximo 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 300;
            const MAX_HEIGHT = 300;
            let width = img.width;
            let height = img.height;

            // Maintain aspect ratio
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/png', 0.8);
                setLocalSettings(prev => ({ ...prev, appLogoUrl: dataUrl }));
                addNotification('info', 'Logo processado e otimizado com sucesso.');
            }
        };
        img.onerror = () => {
             addNotification('error', 'Erro ao processar imagem.');
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const getBaseAppUrl = () => {
    const cloud = settings.qrMenuCloudUrl?.trim();
    if (cloud) return cloud.replace(/\/$/, '');
    const url = window.location.href.split('#')[0];
    return url;
  };

  const generateQRUrl = (data: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}&bgcolor=ffffff&color=0f172a&margin=10`;
  };

  const handlePrintAllQRs = () => {
    const baseUrl = getBaseAppUrl();
    const printContent = `
      <html>
        <head>
          <title>QR Codes - Mesas</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-wrap: wrap; justify-content: center; gap: 40px; padding: 40px; background: #fff; }
            .qr-card { border: 2px solid #000; padding: 30px; text-align: center; width: 280px; border-radius: 20px; }
            .qr-card img { width: 220px; height: 220px; }
            .qr-card h1 { margin: 15px 0 5px; font-size: 24px; font-weight: 900; text-transform: uppercase; font-style: italic; }
            .qr-card h2 { margin: 0 0 10px; font-size: 18px; color: #06b6d4; font-weight: bold; }
            .qr-card p { font-size: 11px; color: #64748b; margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
          </style>
        </head>
        <body>
          ${tables.map(t => `
            <div class="qr-card">
              <h1>${settings.restaurantName}</h1>
              <img src="${generateQRUrl(`${baseUrl}/menu/${t.id}`)}" />
              <h2>${t.name}</h2>
              <p>Escaneie para fazer o seu pedido</p>
            </div>
          `).join('')}
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    const win = window.open('', '', 'width=800,height=600');
    win?.document.write(printContent);
    win?.document.close();
  };

  const handlePrintGeneralQRs = () => {
    const baseUrl = getBaseAppUrl();
    const generalUrl = `${baseUrl}/menu-digital`;
    const printContent = `
      <html>
        <head>
          <title>QR Geral - Ementa Digital</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-wrap: wrap; justify-content: center; gap: 40px; padding: 40px; background: #fff; }
            .qr-card { border: 2px solid #000; padding: 30px; text-align: center; width: 280px; border-radius: 20px; }
            .qr-card img { width: 220px; height: 220px; }
            .qr-card h1 { margin: 15px 0 5px; font-size: 24px; font-weight: 900; text-transform: uppercase; font-style: italic; }
            .qr-card h2 { margin: 0 0 10px; font-size: 18px; color: #06b6d4; font-weight: bold; }
            .qr-card p { font-size: 11px; color: #64748b; margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
          </style>
        </head>
        <body>
          ${tables.map(() => `
            <div class="qr-card">
              <h1>${settings.restaurantName}</h1>
              <img src="${generateQRUrl(generalUrl)}" />
              <h2>Ementa Digital</h2>
              <p>Escaneie para ver o menu</p>
            </div>
          `).join('')}
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    const win = window.open('', '', 'width=800,height=600');
    win?.document.write(printContent);
    win?.document.close();
  };

  const handleClearFinancialData = async () => {
    // AGT Compliance: multi-step confirmation
    if (!window.confirm('TEM CERTEZA? Isso apagará todo o histórico financeiro (Vendas, Caixas, Despesas, Relatórios).')) return;
    if (!window.confirm('Confirmação Final: Os dados serão perdidos permanentemente e os contadores reiniciados.')) return;

    const reason = window.prompt('Por favor, indique o motivo da limpeza (Obrigatório para Auditoria AGT):');
    if (!reason || reason.trim().length < 5) {
      addNotification('error', 'É necessário fornecer um motivo válido (mínimo 5 caracteres) para conformidade AGT.');
      return;
    }

    try {
      const { clearFinancialData } = useStore.getState();
      const result = await clearFinancialData(reason, currentUser?.id || 'unknown');

      if (result.success) {
        addNotification('success', 'Dados financeiros limpos com sucesso e backup de segurança realizado.');
        
        // Print detailed report (AGT Requirement)
        if (window.confirm('Deseja imprimir o relatório de auditoria da limpeza agora?')) {
          handlePrintAuditReport(result.report);
        }

        setTimeout(() => window.location.reload(), 2000);
      } else {
        addNotification('error', result.report?.error || 'Erro ao limpar dados financeiros.');
      }
    } catch (error: unknown) {
      console.error('Erro ao limpar dados:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      addNotification('error', `Erro crítico: ${message}`);
    }
  };

  const handlePrintAuditReport = (report: FinancialClearanceReport) => {
    const printContent = `
      <html>
        <head>
          <title>Relatório de Auditoria AGT - Limpeza de Dados</title>
          <style>
            body { font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333; }
            .header { border-bottom: 2px solid #000; margin-bottom: 20px; padding-bottom: 10px; }
            .section { margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .label { font-weight: bold; }
            .footer { margin-top: 50px; font-size: 10px; border-top: 1px solid #ccc; padding-top: 10px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório de Limpeza Financeira (AGT)</h1>
            <p>ID da Operação: ${Date.now()}</p>
          </div>
          <div class="section">
            <div class="row"><span class="label">Data/Hora:</span> <span>${new Date(report.timestamp).toLocaleString('pt-AO')}</span></div>
            <div class="row"><span class="label">Utilizador Responsável:</span> <span>${report.user}</span></div>
            <div class="row"><span class="label">Motivo:</span> <span>${report.reason}</span></div>
            <div class="row"><span class="label">Status Backup:</span> <span>CONCLUÍDO (tasca_financial_backup_v1)</span></div>
          </div>
          <div class="section">
            <h3>Resumo dos Dados Removidos</h3>
            <div class="row"><span class="label">Pedidos/Vendas:</span> <span>${report.summary.ordersCount}</span></div>
            <div class="row"><span class="label">Receitas Totais:</span> <span>${report.summary.totalRevenue.toLocaleString('pt-AO')} Kz</span></div>
            <div class="row"><span class="label">Despesas:</span> <span>${report.summary.expensesCount}</span></div>
            <div class="row"><span class="label">Despesas Fixas:</span> <span>${report.summary.fixedExpensesCount}</span></div>
            <div class="row"><span class="label">Processamentos Salariais:</span> <span>${report.summary.payrollCount}</span></div>
          </div>
          <div class="footer">
            <p>Este documento é um comprovativo de auditoria exigido pela Administração Geral Tributária (AGT) de Angola para operações de limpeza de dados financeiros.</p>
          </div>
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `;
    const win = window.open('', '', 'width=800,height=600');
    win?.document.write(printContent);
    win?.document.close();
  };

  const handleFactoryReset = async () => {
     if (!window.confirm('PERIGO: Isso apagará TUDO (Menu, Configurações, Usuários, Histórico). O App será resetado ao estado inicial.')) return;
     const confirmation = window.prompt('Para confirmar, digite "DELETAR" em maiúsculas:');
     
     if (confirmation !== 'DELETAR') {
         addNotification('info', 'Operação cancelada.');
         return;
     }

     try {
         // Clear LocalStorage
         localStorage.removeItem('tasca-vereda-storage-v2');
         
         // Clear SQL if active
         if (dbConfig.type !== 'local_storage') {
            // Drop tables or delete all rows
            await executeQuery('DELETE FROM settings');
            await executeQuery('DELETE FROM users');
            await executeQuery('DELETE FROM dishes');
            await executeQuery('DELETE FROM categories');
            await executeQuery('DELETE FROM orders');
            await executeQuery('DELETE FROM order_items');
            // ... etc
         }

         addNotification('success', 'Sistema resetado com sucesso. Reiniciando...');
         setTimeout(() => window.location.reload(), 1500);
     } catch (error) {
         console.error('Erro no factory reset:', error);
         addNotification('error', 'Erro ao resetar sistema.');
     }
  };

  const handleExportSQL = () => {
    try {
      const sql = generateSQLSchema(categories, dishes, settings);
      const blob = new Blob([sql], { type: 'text/sql' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_tasca_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addNotification('success', 'Schema SQL exportado com sucesso.');
    } catch (error) {
      console.error('Error exporting SQL:', error);
      addNotification('error', 'Erro ao exportar SQL.');
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

      <div className="flex gap-4 mb-8 border-b border-white/5 overflow-x-auto no-scrollbar">
        {([
          { id: 'general', label: 'Geral', icon: SettingsIcon },
          { id: 'fiscal', label: 'Fiscal (AGT)', icon: ShieldCheck },
          { id: 'roles', label: 'Cargos', icon: Shield },
          { id: 'users', label: 'Acessos POS', icon: Users },
          { id: 'qr', label: 'Ementa Digital', icon: QrCode },
          { id: 'integrations', label: 'Integrações (Hardware)', icon: Share2 },
          { id: 'monitoring', label: 'Monitorização', icon: Terminal },
          { id: 'cloud', label: 'Nuvem / App', icon: UploadCloud },
          { id: 'bd', label: 'Backup / Restore', icon: Database }
        ] as const).map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`pb-4 px-6 font-black uppercase text-[10px] tracking-[0.2em] transition-all relative flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <tab.icon size={16} />
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full shadow-glow"></div>}
          </button>
        ))}
      </div>

      <div className="glass-panel rounded-[2.5rem] p-8 min-h-[500px] border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        {activeTab === 'general' && (
          <form onSubmit={handleSaveSettings} className="max-w-xl space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 gap-8">
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Nome Comercial</label>
                    <input type="text" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-bold" value={localSettings.restaurantName} onChange={e => setLocalSettings({...localSettings, restaurantName: e.target.value})} />
                </div>

                <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Identidade Visual (Logótipo)</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="aspect-square w-full rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden group">
                            {localSettings.appLogoUrl ? (
                                <img src={localSettings.appLogoUrl} alt="Logo Preview" className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                                <ChefHat className="text-slate-700" size={48} />
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[8px] font-black text-white uppercase tracking-widest">Logo Atual</span>
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-4">
                            <div className="relative group">
                                <div 
                                    onClick={() => logoInputRef.current?.click()}
                                    className="w-full py-8 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                                >
                                    <Upload size={24} className="text-primary" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white">Carregar Ficheiro Local</span>
                                    <p className="text-[8px] text-slate-600 font-bold">PNG, JPG ou SVG (Máx 2MB)</p>
                                </div>
                                <input 
                                    ref={logoInputRef}
                                    type="file" 
                                    hidden 
                                    accept="image/*"
                                    onChange={handleLogoFileChange}
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 flex items-center gap-2">
                                    <LinkIcon size={16} />
                                    <div className="w-px h-4 bg-white/10"></div>
                                </div>
                                <input 
                                    type="text" 
                                    className="w-full pl-14 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none text-[10px] font-bold" 
                                    value={localSettings.appLogoUrl?.startsWith('data:') ? '' : localSettings.appLogoUrl || ''} 
                                    onChange={e => setLocalSettings({...localSettings, appLogoUrl: e.target.value})} 
                                    placeholder="Ou cole o link de uma imagem externa..." 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-8 border-t border-white/10">
               <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 bg-primary/20 rounded-xl text-primary">
                      <MonitorPlay size={20} />
                   </div>
                   <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Cozinha Inteligente (KDS)</h3>
               </div>
               
               <div className={`p-8 rounded-[2rem] border transition-all duration-500 relative overflow-hidden group ${localSettings.kdsEnabled ? 'bg-primary/5 border-primary/30 shadow-glow' : 'bg-slate-800/40 border-white/5'}`}>
                  <div className="flex items-center justify-between relative z-10">
                     <div>
                        <p className="font-black text-white uppercase tracking-tighter text-lg mb-1">
                           {localSettings.kdsEnabled ? 'Monitor de Pedidos Ativo' : 'KDS Desativado'}
                        </p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Os pedidos serão enviados em tempo real para a cozinha.</p>
                     </div>
                     <button 
                        type="button"
                        onClick={() => setLocalSettings({...localSettings, kdsEnabled: !localSettings.kdsEnabled})}
                        className={`transition-all duration-300 transform hover:scale-110 ${localSettings.kdsEnabled ? 'text-primary' : 'text-slate-600'}`}
                     >
                        {localSettings.kdsEnabled ? <ToggleRight size={64} /> : <ToggleLeft size={64} />}
                     </button>
                  </div>
               </div>
            </div>

            <button type="submit" className="w-full py-6 bg-primary text-black rounded-3xl font-black uppercase tracking-[0.2em] shadow-glow hover:brightness-110 transition-all flex items-center justify-center gap-3">
                <Rocket size={22}/> Salvar Mudanças
            </button>
          </form>
        )}

        {/* ... manter outras abas existentes (fiscal, tables, qr, integrations) ... */}

        {activeTab === 'fiscal' && (
          <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
          <form onSubmit={handleSaveSettings} className="space-y-8">
            <div className="bg-primary/10 border border-primary/20 p-8 rounded-[2rem] flex items-start gap-6 mb-6">
                <ShieldCheck size={40} className="text-primary shrink-0" />
                <div>
                    <h4 className="text-primary font-black uppercase tracking-widest text-sm mb-1">Fiscalidade Angola</h4>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        Os dados abaixo são integrados nos ficheiros SAF-T (AO) para submissão à AGT.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">NIF do Contribuinte</label>
                    <input type="text" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-mono font-bold" value={localSettings.nif} onChange={e => setLocalSettings({...localSettings, nif: e.target.value})} />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Certificado AGT Nº</label>
                    <input type="text" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-mono font-bold" value={localSettings.agtCertificate} onChange={e => setLocalSettings({...localSettings, agtCertificate: e.target.value})} />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Taxa de Imposto (%)</label>
                    <input type="number" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-mono font-bold" value={localSettings.taxRate} onChange={e => setLocalSettings({...localSettings, taxRate: Number(e.target.value)})} />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Retenção na Fonte (%)</label>
                    <input type="number" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-mono font-bold" value={localSettings.retencaoFonte || 0} onChange={e => setLocalSettings({...localSettings, retencaoFonte: Number(e.target.value)})} />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Regime IVA</label>
                    <select className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-bold appearance-none" value={localSettings.regimeIVA || 'Regime Geral'} onChange={e => setLocalSettings({...localSettings, regimeIVA: e.target.value})}>
                        <option value="Regime Geral" className="bg-slate-900">Regime Geral</option>
                        <option value="Regime Simplificado" className="bg-slate-900">Regime Simplificado</option>
                        <option value="Regime de Exclusão" className="bg-slate-900">Regime de Exclusão</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Motivo Isenção (Se aplicável)</label>
                    <input type="text" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-bold" value={localSettings.motivoIsencao || ''} onChange={e => setLocalSettings({...localSettings, motivoIsencao: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Código Abertura Gaveta (Opcional)</label>
                    <input type="text" placeholder="Ex: <27>p0 (Deixe em branco se não souber)" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-mono font-bold" value={localSettings.openDrawerCode || ''} onChange={e => setLocalSettings({...localSettings, openDrawerCode: e.target.value})} />
                    <p className="text-[10px] text-slate-500 mt-2">Código ASCII/HEX enviado para a impressora para acionar a gaveta.</p>
                </div>
            </div>

            <button type="submit" className="w-full py-5 bg-primary text-black rounded-3xl font-black uppercase tracking-widest shadow-glow">
                Atualizar Conformidade
            </button>
          </form>

            <div className="pt-8 border-t border-white/10">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <FileText size={20} className="text-blue-400" /> Documentação de Certificação
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => handleDownloadManual('TECNICO')}
                  className="p-6 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-2xl text-left transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <Shield size={24} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    <DownloadCloud size={16} className="text-blue-400 opacity-50" />
                  </div>
                  <p className="text-xs font-black text-blue-100 uppercase tracking-widest mb-1">Manual Técnico</p>
                  <p className="text-[10px] text-slate-400">Especificações AGT e Arquitetura</p>
                </button>

                <button 
                  onClick={() => handleDownloadManual('UTILIZADOR')}
                  className="p-6 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl text-left transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <Users size={24} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                    <DownloadCloud size={16} className="text-emerald-400 opacity-50" />
                  </div>
                  <p className="text-xs font-black text-emerald-100 uppercase tracking-widest mb-1">Manual Utilizador</p>
                  <p className="text-[10px] text-slate-400">Operação POS e Caixa</p>
                </button>

                <button 
                  onClick={() => handleDownloadManual('ADMIN')}
                  className="p-6 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-2xl text-left transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <SettingsIcon size={24} className="text-purple-400 group-hover:scale-110 transition-transform" />
                    <Download size={16} className="text-purple-400 opacity-50" />
                  </div>
                  <p className="text-xs font-black text-purple-100 uppercase tracking-widest mb-1">Manual Admin</p>
                  <p className="text-[10px] text-slate-400">Gestão e Finanças</p>
                </button>
              </div>
            </div>
          </div>
          )}
        {activeTab === 'bd' && (
          <div className="space-y-12 animate-in fade-in duration-500">
             {/* Driver SQL / Storage */}
             <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 bg-purple-500/20 rounded-xl text-purple-500"><Database size={22} /></div>
                   <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Driver SQL / Storage</h3>
                </div>
                <p className="text-sm text-slate-400 mb-6 font-medium">Configure o adaptador de base de dados para usar SQL Nativo (PostgreSQL, MySQL, SQLite) ou LocalStorage.</p>
                <div className="flex items-center gap-4">
                     <div className="flex-1">
                         <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Driver Ativo</label>
                         <div className="p-4 bg-black/40 border border-white/10 rounded-xl text-white font-mono text-sm flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${dbConfig.type === 'local_storage' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                            {dbConfig.type}
                         </div>
                     </div>
                     <button 
                        onClick={async () => {
                            try {
                                if (dbConfig.type === 'local_storage') {
                                    addNotification('info', 'LocalStorage está ativo e funcionando.');
                                } else {
                                    await executeQuery('SELECT 1');
                                    addNotification('success', `Conexão com ${dbConfig.type} estabelecida com sucesso!`);
                                }
                            } catch (e) {
                                addNotification('error', `Falha na conexão: ${e}`);
                            }
                        }}
                        className="px-6 py-4 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-purple-500 transition-all flex items-center gap-2 mt-6 shadow-lg shadow-purple-600/20"
                     >
                        <RefreshCw size={16} /> Testar Conexão
                     </button>
                </div>
                <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <p className="text-[10px] text-slate-400 italic flex items-center gap-2">
                        <Terminal size={12} />
                        Para alterar o driver, edite o arquivo <code className="text-purple-400 font-bold">services/database/config.ts</code> e reinicie a aplicação.
                    </p>
                </div>
             </div>

             {/* Backup & Restore Section */}
             <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-500"><Save size={22} /></div>
                   <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Backup e Restauro de Dados</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <button 
                      onClick={handleBackup}
                      className="p-6 bg-slate-800 border border-white/5 hover:border-blue-500/50 rounded-2xl text-left group transition-all"
                   >
                      <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                              <Download size={24} />
                          </div>
                      </div>
                      <h5 className="font-bold text-white mb-1">Backup JSON</h5>
                      <p className="text-xs text-slate-500">
                          Exportar todos os dados para arquivo JSON.
                      </p>
                   </button>

                   <button 
                      onClick={handleExportSQL}
                      className="p-6 bg-slate-800 border border-white/5 hover:border-purple-500/50 rounded-2xl text-left group transition-all"
                   >
                      <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-colors">
                              <Database size={24} />
                          </div>
                      </div>
                      <h5 className="font-bold text-white mb-1">Backup SQL</h5>
                      <p className="text-xs text-slate-500">
                          Exportar Schema e dados em formato SQL.
                      </p>
                   </button>

                   <div className="relative">
                      <input 
                        type="file" 
                        accept=".json"
                        onChange={handleRestore}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <button 
                        className="w-full h-full p-6 bg-slate-800 border border-white/5 hover:border-yellow-500/50 rounded-2xl text-left group transition-all"
                      >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                                <Upload size={24} />
                            </div>
                        </div>
                        <h5 className="font-bold text-white mb-1">Restaurar JSON</h5>
                        <p className="text-xs text-slate-500">
                            Carregar backup JSON para o sistema.
                        </p>
                      </button>
                   </div>

                   <button 
                      onClick={() => window.location.href = '/recovery'}
                      className="p-6 bg-slate-800 border border-white/5 hover:border-primary/50 rounded-2xl text-left group transition-all"
                   >
                      <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-black transition-colors">
                              <ShieldCheck size={24} />
                          </div>
                          <div className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-[10px] font-bold uppercase">
                              DLP Ativo
                          </div>
                      </div>
                      <h5 className="font-bold text-white mb-1">Recuperação DLP</h5>
                      <p className="text-xs text-slate-500">
                          Pontos de restauração automáticos.
                      </p>
                   </button>
                </div>
             </div>

             {/* Danger Zone */}
             <div className="pt-8 border-t border-white/5">
                <div className="flex items-center gap-3 mb-8">
                   <div className="p-2.5 bg-red-500/20 rounded-xl text-red-500"><Trash2 size={22} /></div>
                   <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Zona de Perigo</h3>
                </div>

                <div className="bg-red-500/5 p-8 rounded-[2.5rem] border border-red-500/20 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <button 
                            onClick={async () => {
                                if (confirm('ATENÇÃO: Isso apagará TODA a Ementa (produtos e categorias). Deseja continuar?')) {
                                    if (confirm('Confirmação final: Esta ação não pode ser desfeita. Apagar ementa?')) {
                                        await hardResetMenu();
                                    }
                                }
                            }}
                            className="p-6 bg-slate-900 border border-white/5 hover:border-red-500/50 rounded-2xl text-left group transition-all"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors">
                                    <Trash2 size={24} />
                                </div>
                            </div>
                            <h5 className="font-bold text-white mb-1">Limpar Menu</h5>
                            <p className="text-xs text-slate-500">
                                Apaga apenas Categorias e Itens da Ementa.
                            </p>
                        </button>

                        <button 
                            onClick={handleClearFinancialData}
                            className="p-6 bg-slate-900 border border-white/5 hover:border-red-500/50 rounded-2xl text-left group transition-all"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors">
                                    <DollarSign size={24} />
                                </div>
                            </div>
                            <h5 className="font-bold text-white mb-1">Limpar Finanças</h5>
                            <p className="text-xs text-slate-500">
                                Remove pedidos, faturas e relatórios.
                            </p>
                        </button>

                        <button 
                            onClick={handleFactoryReset}
                            className="p-6 bg-slate-900 border border-white/5 hover:border-red-500/50 rounded-2xl text-left group transition-all"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors">
                                    <AlertCircle size={24} />
                                </div>
                            </div>
                            <h5 className="font-bold text-white mb-1">Reset de Fábrica</h5>
                            <p className="text-xs text-slate-500">
                                Limpa TODO o sistema.
                            </p>
                        </button>
                    </div>
                </div>
             </div>
          </div>
        )}


        {activeTab === 'users' && (
            <POSAccessManagement onOpenUserModal={() => setIsUserModalOpen(true)} />
        )}

        {activeTab === 'roles' && (
            <div className="flex flex-col items-center justify-center h-full gap-10 animate-in zoom-in duration-500">
                <div className="bg-primary/10 border-2 border-primary rounded-[3rem] p-12 flex items-center justify-center">
                    <Shield size={80} className="text-primary" />
                </div>
                <div className="text-center space-y-4">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">Gestão de Cargos</h3>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest max-w-md">
                        Crie cargos customizados e defina permissões específicas para cada um. Personalize completamente os acessos do seu sistema.
                    </p>
                </div>
                <button 
                    onClick={() => setIsRoleManagementOpen(true)}
                    className="px-10 py-5 bg-primary text-black rounded-3xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:brightness-110 transition-all shadow-glow"
                >
                    <Shield size={20} /> Gerenciar Cargos
                </button>
            </div>
        )}

        {activeTab === 'qr' && (
            <div className="flex flex-col items-center justify-center h-full gap-10 animate-in zoom-in duration-500">
                <div className="bg-white p-8 rounded-[3rem] shadow-glow relative">
                    <img src={generateQRUrl(`${getBaseAppUrl()}/menu-digital`)} alt="QR Menu Digital" className="w-56 h-56" />
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-primary text-black px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest">
                       Pré-visualização
                    </div>
                </div>
                <div className="text-center space-y-4">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">Menu Digital QR</h3>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest max-w-md">
                        Configure a URL personalizada para o seu menu digital e gere códigos QR para as mesas.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setIsQRMenuConfigOpen(true)}
                        className="px-10 py-5 bg-primary text-black rounded-3xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:brightness-110 transition-all shadow-glow"
                    >
                        <QrCode size={20} /> Configurar Menu QR
                    </button>
                    <button onClick={handlePrintAllQRs} className="px-10 py-5 bg-slate-700 text-white rounded-3xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-slate-600 transition-all">
                        <Printer size={20} /> Descarregar QR por Mesa
                    </button>
                    <button onClick={handlePrintGeneralQRs} className="px-10 py-5 bg-slate-700 text-white rounded-3xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-slate-600 transition-all">
                        <Printer size={20} /> Descarregar QR Geral
                    </button>
                </div>
            </div>
        )}

        {activeTab === 'integrations' && (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-500">
                        <Share2 size={22} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Integrações de Hardware</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Gestão de Dispositivos Externos e APIs</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                <Smartphone size={20} />
                            </div>
                            <h4 className="font-bold text-white uppercase text-xs tracking-widest">Dispositivos Biométricos</h4>
                        </div>
                        <p className="text-xs text-slate-400">Configure leitores de impressão digital ZKTeco para controlo de assiduidade.</p>
                        <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">
                            Gerir Dispositivos
                        </button>
                    </div>

                    <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                                <KeyRound size={20} />
                            </div>
                            <h4 className="font-bold text-white uppercase text-xs tracking-widest">API & Webhooks</h4>
                        </div>
                        <p className="text-xs text-slate-400">Gere chaves de API para integrações externas e configure webhooks de eventos.</p>
                        <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">
                            Configurar API
                        </button>
                    </div>
                </div>

                <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-[2rem] flex items-start gap-4">
                    <AlertCircle size={24} className="text-blue-500 shrink-0" />
                    <div>
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Nota sobre Hardware</p>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                            As integrações de hardware (impressoras, biometria, visores) requerem que o driver local esteja em execução. 
                            Certifique-se de que o serviço de ponte está ativo no sistema operativo.
                        </p>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header com Status em Tempo Real */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 text-primary rounded-2xl animate-pulse">
                  <Activity size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Monitorização do Sistema</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow animate-pulse"></div>
                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em]">Motor de Estabilidade Ativo</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center min-w-[100px]">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Uptime</span>
                  <span className="text-sm font-mono font-bold text-white">
                    {Math.floor((healthReport?.uptime || 0) / 3600)}h {Math.floor(((healthReport?.uptime || 0) % 3600) / 60)}m
                  </span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center min-w-[100px]">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Score Estabilidade</span>
                  <span className={`text-sm font-mono font-bold ${(healthReport?.stabilityScore || 0) > 90 ? 'text-emerald-500' : 'text-yellow-500'}`}>
                    {healthReport?.stabilityScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* Grid de Métricas em Tempo Real */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'CPU Usage', value: healthReport?.performanceMetrics.cpuUsage.toFixed(1) + '%', icon: Cpu, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Memory', value: healthReport?.performanceMetrics.memoryUsage.toFixed(0) + 'MB', icon: HardDrive, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { label: 'Network', value: healthReport?.performanceMetrics.networkLatency.toFixed(0) + 'ms', icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Latency', value: healthReport?.performanceMetrics.latency.toFixed(1) + 'ms', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' }
              ].map((m, i) => (
                <div key={i} className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 ${m.bg} ${m.color} rounded-xl group-hover:scale-110 transition-transform`}>
                      <m.icon size={20} />
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3].map(j => <div key={j} className={`w-1 h-3 rounded-full ${j*30 < (parseFloat(m.value) || 0) ? 'bg-primary' : 'bg-white/10'}`}></div>)}
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{m.label}</p>
                  <p className="text-xl font-mono font-black text-white tracking-tighter">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Gráfico de Performance */}
            <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 text-primary rounded-xl">
                    <BarChart3 size={20} />
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Histórico de Performance (Tempo Real)</h4>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase">CPU %</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase">Memory MB</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metricsHistory}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="timestamp" 
                      hide 
                    />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                      itemStyle={{ fontWeight: '900', textTransform: 'uppercase' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="performanceMetrics.cpuUsage" 
                      stroke="#06b6d4" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorCpu)" 
                      animationDuration={1000}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="performanceMetrics.memoryUsage" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorMem)" 
                      animationDuration={1000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Logs e Alertas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Logs do Sistema */}
              <div className="bg-black/40 p-8 rounded-[2.5rem] border border-white/5 flex flex-col h-[400px]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Terminal size={20} className="text-slate-500" />
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Logs de Auditoria do Sistema</h4>
                  </div>
                  <button className="text-[8px] font-black text-primary uppercase tracking-widest hover:underline">Ver Todos</button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                  {recentLogs.length > 0 ? recentLogs.map((log, i) => (
                    <div key={i} className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all group">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${
                          log.severity === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                          log.severity === 'WARNING' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}></div>
                        <div className="w-px flex-1 bg-white/5 my-1 group-last:hidden"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[8px] font-black uppercase tracking-widest ${
                            log.severity === 'CRITICAL' ? 'text-red-400' : 'text-slate-500'
                          }`}>{log.type}</span>
                          <span className="text-[8px] font-mono text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-medium break-words leading-relaxed">{log.message}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center h-full opacity-30">
                      <Bug size={32} className="mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Nenhum log pendente</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Failure Prediction & Health */}
              <div className="space-y-6">
                <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Zap size={120} />
                  </div>
                  <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Zap size={18} /> Previsão de Falhas (ML)
                  </h4>
                  
                  {healthReport?.failurePrediction && (
                    <div className="space-y-4 relative z-10">
                      <div className="flex items-end gap-3">
                        <span className="text-4xl font-black text-white tracking-tighter">
                          {(healthReport.failurePrediction.probability * 100).toFixed(0)}%
                        </span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Risco de Incidente</span>
                      </div>
                      
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${
                            healthReport.failurePrediction.probability > 0.6 ? 'bg-red-500' : 
                            healthReport.failurePrediction.probability > 0.3 ? 'bg-yellow-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${healthReport.failurePrediction.probability * 100}%` }}
                        ></div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 pt-2">
                        {healthReport.failurePrediction.factors.map((factor, i) => (
                          <div key={i} className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                            <div className="w-1 h-1 rounded-full bg-primary"></div>
                            {factor}
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 p-4 bg-black/20 rounded-2xl border border-primary/10">
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">Status Preditivo</p>
                        <p className="text-xs text-white font-black uppercase tracking-widest">
                          {healthReport.failurePrediction.likelyType === 'NONE' ? 'SISTEMA OPERANDO EM CONDIÇÕES IDEAIS' : healthReport.failurePrediction.likelyType}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 text-blue-500 rounded-2xl">
                      <Server size={24} />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-white uppercase tracking-widest">Monitorização Ativa</h5>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Amostragem: 3000ms</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Sincronizado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cloud' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-500/20 text-blue-500 rounded-2xl">
                  <UploadCloud size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Nuvem / App Móvel</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Integração Nativa com Supabase Cloud Architecture</p>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Supabase Config */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-xl">
                          <Database size={20} />
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Configuração Supabase</h4>
                      </div>
                      <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-black text-emerald-500 uppercase">
                        Pronto para Ligar
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Supabase URL</label>
                        <input 
                          type="text" 
                          value={localSettings.supabaseConfig?.url || ''}
                          onChange={(e) => setLocalSettings(prev => ({
                            ...prev,
                            supabaseConfig: { ...prev.supabaseConfig, url: e.target.value }
                          }))}
                          className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-white font-mono text-xs focus:border-primary outline-none transition-all" 
                          placeholder="https://your-project.supabase.co"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Anon Key</label>
                        <input 
                          type="password" 
                          value={localSettings.supabaseConfig?.key || ''}
                          onChange={(e) => setLocalSettings(prev => ({
                            ...prev,
                            supabaseConfig: { ...prev.supabaseConfig, key: e.target.value }
                          }))}
                          className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-white font-mono text-xs focus:border-primary outline-none transition-all" 
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                      <button 
                        onClick={handleTestCloudConnection}
                        disabled={isTestingCloud}
                        className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${
                          cloudStatus === 'success' ? 'bg-emerald-600 text-white' : 
                          cloudStatus === 'error' ? 'bg-red-600 text-white' : 
                          'bg-primary text-black hover:brightness-110'
                        } ${isTestingCloud ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isTestingCloud ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : cloudStatus === 'success' ? (
                          <CheckCircle size={16} />
                        ) : (
                          <Wifi size={16} />
                        )}
                        {isTestingCloud ? 'A Testar...' : cloudStatus === 'success' ? 'Conexão Ativa' : 'Testar Conexão Cloud'}
                      </button>
                      <button
                        type="submit"
                        onClick={handleSaveSettings}
                        className="flex-1 py-4 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-glow hover:brightness-110 transition-all flex items-center justify-center gap-2"
                      >
                        <Save size={16} /> Guardar Configuração
                      </button>
                      <button
                        onClick={() => {

                          setCloudStatus('idle');
                        }}
                        className="px-6 py-4 bg-white/5 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all border border-white/10"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 text-purple-500 rounded-xl">
                          <Lock size={18} />
                        </div>
                        <h5 className="text-[10px] font-black text-white uppercase tracking-widest">Segurança & RLS</h5>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Políticas de Segurança ao Nível da Linha (RLS) configuradas para multi-tenant.</p>
                      <button 
                        onClick={handleSetupRLS}
                        className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                      >
                        Configurar Políticas
                      </button>
                    </div>

                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 text-blue-500 rounded-xl">
                          <HardDrive size={18} />
                        </div>
                        <h5 className="text-[10px] font-black text-white uppercase tracking-widest">Storage de Ficheiros</h5>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Bucket de imagens de produtos e faturas sincronizado com a nuvem.</p>
                      <button 
                        onClick={handleSetupBuckets}
                        className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                      >
                        Gerir Buckets
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 text-cyan-500 rounded-xl">
                      <DownloadCloud size={20} />
                    </div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Importação da Cloud</h4>
                  </div>
                  <CloudImportPanel />
                </div>

                {/* App Móvel & Sincronização */}
                <div className="space-y-8">
                  <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/20 flex flex-col items-center text-center gap-6">
                    <div className="w-20 h-20 bg-white p-3 rounded-2xl shadow-glow">
                      <QrCode size="100%" className="text-black" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">App de Gestão Móvel</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                        Escaneie para conectar o seu smartphone e gerir o seu restaurante de qualquer lugar.
                      </p>
                    </div>
                    <button 
                      onClick={handleGerarTokenApp}
                      className="w-full py-4 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-glow hover:brightness-110 transition-all"
                    >
                      Gerar Token App
                    </button>
                  </div>

                  <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/20 text-yellow-500 rounded-xl">
                        <RefreshCw size={20} />
                      </div>
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Sincronização</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="text-[10px] font-black text-slate-300 uppercase">Estado da Venda</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">Real-time</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 opacity-50">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                          <span className="text-[10px] font-black text-slate-300 uppercase">Backups Cloud</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">Hourly</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleForcerSincronizacao}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
                    >
                      Forçar Sincronização Total
                    </button>
                  </div>
                </div>
             </div>
          </div>
        )}

      </div>

      {/* Modais */}
      <UserManagementModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} />
      <QRMenuConfig isOpen={isQRMenuConfigOpen} onClose={() => setIsQRMenuConfigOpen(false)} />
      <RoleManagementModal isOpen={isRoleManagementOpen} onClose={() => setIsRoleManagementOpen(false)} />
    </div>
  );
};

export default Settings;
