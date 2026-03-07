import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from '@/store/slices/authSlice';
import { 
  Lock, Eye, EyeOff, ShieldAlert, FileText, 
  UserCheck, Database, Save, AlertCircle, RefreshCw, CheckCircle, XCircle, Trash2, Check
} from 'lucide-react';
import { dlpAlertService, DLPAlert } from '@/services/dlpAlertService';
import { analyzeAndFixMenu, MenuConsistencyReport } from '@/services/categoryResolver';

export const DlpManager = () => {
  const { addNotification, dishes: products, categories, updateDish, batchUpdateDishes, addAuditLog } = useStore();
  const user = useSelector(selectUser);
  const [dlpSettings, setDlpSettings] = useState({
    maskNif: true,
    maskPhone: true,
    maskEmail: true,
    logAccess: true,
    retentionDays: 365,
    strictMode: false
  });

  const [alerts, setAlerts] = useState<DLPAlert[]>([]);
  const [consistencyReport, setConsistencyReport] = useState<MenuConsistencyReport | null>(null);
  const [isFixing, setIsFixing] = useState(false);

  useEffect(() => {
    if (addAuditLog) {
        dlpAlertService.setAuditLogger(addAuditLog);
    }
    return dlpAlertService.subscribe(setAlerts);
  }, [addAuditLog]);

  const handleToggle = (key: keyof typeof dlpSettings) => {
    setDlpSettings(prev => ({
      ...prev,
      [key]: typeof prev[key] === 'boolean' ? !prev[key] : prev[key]
    }));
  };

  const handleSave = () => {
    // Simulate API call
    addNotification('success', 'Políticas de DLP atualizadas com sucesso.');
  };

  const handleCheckConsistency = () => {
    const { report } = analyzeAndFixMenu(products, categories);
    setConsistencyReport(report);
    if (report.invalidProducts === 0) {
        addNotification('success', 'Nenhum problema de consistência encontrado.');
    } else {
        addNotification('warning', `${report.invalidProducts} problemas encontrados.`);
    }
  };

  const handleApplyFixes = async () => {
    setIsFixing(true);
    try {
        const { fixedMenu } = analyzeAndFixMenu(products, categories);
        
        // Find changed products
        const updates = fixedMenu
            .filter(fixed => {
                const original = products.find((p: any) => p.id === fixed.id);
                return original && original.categoryId !== fixed.categoryId;
            })
            .map(fixed => ({
                id: fixed.id,
                changes: { categoryId: fixed.categoryId }
            }));

        if (updates.length > 0) {
             if (batchUpdateDishes) {
                 const success = await batchUpdateDishes(updates);
                 if (success) {
                     addNotification('success', `${updates.length} produtos corrigidos com sucesso.`);
                     setConsistencyReport(null);
                 }
             } else {
                 // Fallback if batchUpdateDishes is not available (should not happen)
                 let successCount = 0;
                 for (const update of updates) {
                      const original = products.find((p: any) => p.id === update.id);
                      if (original) {
                          await updateDish({ ...original, ...update.changes });
                          successCount++;
                      }
                 }
                 addNotification('success', `${successCount} produtos corrigidos com sucesso.`);
                 setConsistencyReport(null);
             }
        } else {
             addNotification('info', 'Nenhuma correção necessária.');
        }
    } catch (e) {
        console.error(e);
        addNotification('error', 'Erro ao aplicar correções.');
    } finally {
        setIsFixing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center">
        <div className="p-4 bg-red-500/10 rounded-full mb-4">
            <Lock size={48} className="text-red-500" />
        </div>
        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Prevenção de Perda de Dados</h3>
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest max-w-lg mb-8">
            Políticas de Segurança e Mascaramento de Dados Sensíveis
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-8">
            {/* Masking Policies */}
            <div className="bg-black/40 p-6 rounded-3xl border border-white/5 text-left">
                <div className="flex items-center gap-3 mb-4">
                    <EyeOff size={20} className="text-slate-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Mascaramento</h4>
                </div>
                <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                        <span className="text-[10px] font-bold text-slate-300 uppercase">NIF / Tax ID</span>
                        <input 
                            type="checkbox" 
                            checked={dlpSettings.maskNif} 
                            onChange={() => handleToggle('maskNif')}
                            className="w-4 h-4 rounded border-slate-600 text-red-500 focus:ring-red-500 bg-slate-800"
                        />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                        <span className="text-[10px] font-bold text-slate-300 uppercase">Telefone</span>
                        <input 
                            type="checkbox" 
                            checked={dlpSettings.maskPhone} 
                            onChange={() => handleToggle('maskPhone')}
                            className="w-4 h-4 rounded border-slate-600 text-red-500 focus:ring-red-500 bg-slate-800"
                        />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                        <span className="text-[10px] font-bold text-slate-300 uppercase">Email</span>
                        <input 
                            type="checkbox" 
                            checked={dlpSettings.maskEmail} 
                            onChange={() => handleToggle('maskEmail')}
                            className="w-4 h-4 rounded border-slate-600 text-red-500 focus:ring-red-500 bg-slate-800"
                        />
                    </label>
                </div>
            </div>

            {/* Access Logging */}
            <div className="bg-black/40 p-6 rounded-3xl border border-white/5 text-left">
                <div className="flex items-center gap-3 mb-4">
                    <ShieldAlert size={20} className="text-yellow-500" />
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Monitorização</h4>
                </div>
                <div className="space-y-4">
                    <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                        <span className="text-[10px] font-bold text-slate-300 uppercase">Log de Acesso a Dados</span>
                        <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${dlpSettings.logAccess ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${dlpSettings.logAccess ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <input type="checkbox" checked={dlpSettings.logAccess} onChange={() => handleToggle('logAccess')} className="hidden" />
                    </label>
                    
                    <div>
                        <span className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Retenção de Logs (Dias)</span>
                        <input 
                            type="number" 
                            value={dlpSettings.retentionDays}
                            onChange={(e) => setDlpSettings({...dlpSettings, retentionDays: parseInt(e.target.value)})}
                            className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white font-mono text-sm focus:border-red-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Strict Mode */}
            <div className="bg-black/40 p-6 rounded-3xl border border-white/5 text-left flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <UserCheck size={20} className="text-purple-500" />
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Modo Estrito</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                        Força autenticação de dois fatores (2FA) para acesso a dados sensíveis e bloqueia exportações em massa.
                    </p>
                </div>
                
                <button 
                    onClick={() => handleToggle('strictMode')}
                    className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        dlpSettings.strictMode 
                        ? 'bg-purple-500 text-white border-purple-500 shadow-glow' 
                        : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                    }`}
                >
                    {dlpSettings.strictMode ? 'Modo Estrito Ativo' : 'Ativar Modo Estrito'}
                </button>
            </div>
        </div>

        {/* Data Consistency Section */}
        <div className="w-full bg-black/20 p-6 rounded-3xl border border-white/5 text-left mb-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Database size={20} className="text-blue-500" />
                    <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Integridade de Dados</h4>
                        <p className="text-[10px] text-slate-400">Verificação e correção automática de inconsistências no menu.</p>
                    </div>
                </div>
                <button 
                    onClick={handleCheckConsistency}
                    disabled={isFixing}
                    className="px-4 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
                >
                    <RefreshCw size={14} className={isFixing ? "animate-spin" : ""} />
                    Verificar Agora
                </button>
            </div>

            {consistencyReport && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Total Produtos</span>
                            <p className="text-2xl font-mono text-white">{consistencyReport.totalProducts}</p>
                        </div>
                        <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                            <span className="text-[10px] text-red-400 uppercase font-bold">Inválidos</span>
                            <p className="text-2xl font-mono text-red-500">{consistencyReport.invalidProducts}</p>
                        </div>
                        <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                            <span className="text-[10px] text-emerald-400 uppercase font-bold">Corrigíveis</span>
                            <p className="text-2xl font-mono text-emerald-500">{consistencyReport.fixedProducts}</p>
                        </div>
                        <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                            <span className="text-[10px] text-yellow-400 uppercase font-bold">Órfãos</span>
                            <p className="text-2xl font-mono text-yellow-500">{consistencyReport.orphanedProducts.length}</p>
                        </div>
                    </div>

                    {consistencyReport.invalidProducts > 0 && (
                        <div className="flex justify-end">
                             <button 
                                onClick={handleApplyFixes}
                                disabled={isFixing}
                                className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                            >
                                <CheckCircle size={16} />
                                {isFixing ? 'Aplicando Correções...' : `Corrigir ${consistencyReport.fixedProducts} Problemas`}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
            <div className="w-full bg-black/20 p-6 rounded-3xl border border-white/5 text-left mb-8">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={20} className="text-orange-500" />
                        <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Alertas de Sistema</h4>
                            <p className="text-[10px] text-slate-400">Notificações de segurança e integridade pendentes.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => dlpAlertService.resolveAll(user?.id)}
                        className="px-4 py-2 bg-white/5 text-slate-300 hover:text-white rounded-xl transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
                    >
                        <Check size={14} /> Resolver Todos
                    </button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {alerts.map(alert => (
                        <div key={alert.id} className="p-4 bg-slate-900 border border-white/10 rounded-xl flex items-start gap-4 group hover:border-white/20 transition-colors">
                            <div className={`mt-1 w-2 h-2 rounded-full ${
                                alert.severity === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                alert.severity === 'WARNING' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                                        alert.severity === 'CRITICAL' ? 'text-red-400' : 
                                        alert.severity === 'WARNING' ? 'text-yellow-400' : 'text-blue-400'
                                    }`}>
                                        {alert.severity}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-600">
                                        {new Date(alert.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300 font-medium leading-relaxed">{alert.message}</p>
                            </div>
                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => dlpAlertService.resolve(alert.id, user?.id)}
                                    title="Resolver"
                                    className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors"
                                >
                                    <Check size={14} />
                                </button>
                                <button 
                                    onClick={() => dlpAlertService.dismiss(alert.id)}
                                    title="Ignorar"
                                    className="p-2 bg-white/5 text-slate-500 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <button 
            onClick={handleSave}
            className="px-10 py-4 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:scale-105 transition-transform shadow-glow"
        >
            <Save size={18} /> Salvar Políticas
        </button>
      </div>

      <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-[2rem] flex items-start gap-4">
        <AlertCircle size={24} className="text-red-500 shrink-0" />
        <div>
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">Aviso Legal</p>
            <p className="text-[11px] text-slate-300 leading-relaxed">
                As configurações de DLP aplicam-se a todas as exportações e visualizações de dados no sistema. 
                Administradores com permissão &apos;Root&apos; podem sobrepor estas regras em casos de auditoria.
            </p>
        </div>
      </div>
    </div>
  );
};
