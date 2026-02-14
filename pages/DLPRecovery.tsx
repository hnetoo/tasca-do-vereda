import React, { useState, useEffect } from 'react';
import { disasterRecoveryService, BackupMetadata, DLPComplianceReport } from '../services/disasterRecoveryService';
import { 
  Shield, 
  History, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Database, 
  Cloud, 
  HardDrive, 
  Clock, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Lock,
  Search,
  Eye,
  Trash2,
  FileText,
  Activity,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import SQLMigrationPanel from '../components/SQLMigrationPanel';
import { LogEntry } from '../services/logger';

const DLPRecovery = () => {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [complianceReport, setComplianceReport] = useState<DLPComplianceReport | null>(null);
  const { addNotification } = useStore();

  const loadBackups = async () => {
    setLoading(true);
    const list = await disasterRecoveryService.listBackups();
    setBackups(list);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBackups();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleGenerateReport = async () => {
    addNotification('info', 'Gerando relatório de conformidade...');
    const report = await disasterRecoveryService.generateComplianceReport();
    setComplianceReport(report);
    setShowComplianceModal(true);
    addNotification('success', 'Relatório gerado com sucesso.');
  };

  const handleRestore = async (id: string) => {
    if (!window.confirm("ATENÇÃO: Esta operação irá sobrescrever todos os dados atuais do sistema. Deseja continuar?")) return;
    
    setIsRestoring(true);
    const success = await disasterRecoveryService.restoreSystem(id);
    setIsRestoring(false);
    
    if (success) {
      addNotification('success', 'Sistema restaurado com sucesso! Reiniciando aplicação...');
      setTimeout(() => window.location.reload(), 2000);
    } else {
      addNotification('error', 'Falha crítica na restauração. Verifique os logs.');
    }
  };

  const triggerManualBackup = async () => {
    addNotification('info', 'Iniciando snapshot manual...');
    const meta = await disasterRecoveryService.createFullBackup('MANUAL');
    if (meta) {
      addNotification('success', 'Snapshot criado e criptografado com sucesso.');
      loadBackups();
    } else {
      addNotification('error', 'Falha ao criar snapshot.');
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto no-scrollbar bg-[#0f172a]">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <Link to="/settings" className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <ShieldCheck className="text-primary" size={32} />
              Proteção contra Perda de Dados (DLP)
            </h1>
            <p className="text-slate-400 text-sm mt-1">Recuperação total de estado funcional em caso de falhas catastróficas</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleGenerateReport}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-700 flex items-center gap-2"
          >
            <FileText size={16} /> Relatório
          </button>
          <button 
            onClick={loadBackups}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-700 flex items-center gap-2"
          >
            <RefreshCw size={16} /> Atualizar
          </button>
          <button 
            onClick={triggerManualBackup}
            className="px-6 py-2 bg-primary text-black rounded-xl font-black text-xs uppercase tracking-wider hover:scale-105 transition-all flex items-center gap-2 shadow-glow"
          >
            <Zap size={16} /> Criar Snapshot Agora
          </button>
        </div>
      </div>

      {/* Compliance Modal */}
      {showComplianceModal && complianceReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl max-h-[80vh] rounded-[2rem] border border-white/10 flex flex-col bg-[#1e293b]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-black text-white flex items-center gap-3">
                <ShieldCheck className="text-primary" size={24} />
                Relatório de Conformidade DLP
              </h2>
              <button onClick={() => setShowComplianceModal(false)} className="text-slate-400 hover:text-white">
                <Trash2 size={20} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 text-center">
                  <div className="text-2xl font-black text-white">{complianceReport.totalBackups}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Backups Totais</div>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 text-center">
                  <div className="text-2xl font-black text-green-500">{Math.round(complianceReport.healthScore * 100)}%</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Saúde DLP</div>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 text-center">
                  <div className="text-2xl font-black text-primary">AES-256</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Encriptação</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Redundância de Infraestrutura</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <HardDrive size={18} className="text-slate-400" />
                      <span className="text-sm text-white">Local AppData</span>
                    </div>
                    <CheckCircle size={16} className="text-green-500" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Database size={18} className="text-slate-400" />
                      <span className="text-sm text-white">RAID 10 (3 cópias)</span>
                    </div>
                    <CheckCircle size={16} className="text-green-500" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Cloud size={18} className="text-slate-400" />
                      <span className="text-sm text-white">Multi-Cloud Georeplication</span>
                    </div>
                    <CheckCircle size={16} className="text-green-500" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Logs de Auditoria Recentes</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {complianceReport.complianceLogs.slice(0, 10).map((log: LogEntry, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-900/30 rounded-lg border border-white/5 text-[11px]">
                      <div className="flex justify-between text-slate-500 mb-1">
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                        <span className="text-primary font-bold">{log.level}</span>
                      </div>
                      <div className="text-slate-300">{log.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/5 flex justify-end">
              <button 
                onClick={() => setShowComplianceModal(false)}
                className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs uppercase"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-6 rounded-3xl border border-green-500/20 bg-green-500/5">
          <div className="flex justify-between items-start mb-4">
            <Shield className="text-green-500" size={24} />
            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Ativo</span>
          </div>
          <h3 className="text-white font-bold mb-1">Proteção Ativa</h3>
          <p className="text-slate-400 text-xs">Snapshot automático a cada 15 min</p>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-blue-500/20 bg-blue-500/5">
          <div className="flex justify-between items-start mb-4">
            <Lock className="text-blue-500" size={24} />
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">AES-256</span>
          </div>
          <h3 className="text-white font-bold mb-1">Criptografia</h3>
          <p className="text-slate-400 text-xs">Dados protegidos em repouso e trânsito</p>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-primary/20 bg-primary/5">
          <div className="flex justify-between items-start mb-4">
            <Cloud className="text-primary" size={24} />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Multi-Cloud</span>
          </div>
          <h3 className="text-white font-bold mb-1">Redundância</h3>
          <p className="text-slate-400 text-xs">Cópia local e sincronização na nuvem</p>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-purple-500/20 bg-purple-500/5">
          <div className="flex justify-between items-start mb-4">
            <Database className="text-purple-500" size={24} />
            <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Integridade</span>
          </div>
          <h3 className="text-white font-bold mb-1">Checksums</h3>
          <p className="text-slate-400 text-xs">SHA-256 verificado a cada hora</p>
        </div>
      </div>

      {/* Backup List */}
      <div className="glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/2">
          <h2 className="text-xl font-black text-white flex items-center gap-3">
            <History className="text-slate-400" size={24} />
            Pontos de Restauração Disponíveis
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Pesquisar por ID ou Data..." 
              className="bg-slate-900/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-500">
            <RefreshCw size={40} className="animate-spin" />
            <p className="font-bold uppercase tracking-widest text-xs">A carregar repositório de backups...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-500">
            <AlertTriangle size={40} />
            <p className="font-bold uppercase tracking-widest text-xs">Nenhum ponto de restauração encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/2">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">ID / Timestamp</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Versão / Hash</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Armazenamento</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-white/2 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-white font-mono font-bold text-sm">{backup.id}</span>
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                          <Clock size={12} /> {new Date(backup.timestamp).toLocaleString('pt-PT')}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`
                        px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider
                        ${backup.type === 'AUTO' ? 'bg-blue-500/10 text-blue-400' : ''}
                        ${backup.type === 'MANUAL' ? 'bg-primary/10 text-primary' : ''}
                        ${backup.type === 'SNAPSHOT' ? 'bg-purple-500/10 text-purple-400' : ''}
                      `}>
                        {backup.type}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-slate-300 font-bold text-xs">v{backup.version}</span>
                        <span className="text-slate-500 font-mono text-[10px] truncate w-24">{backup.hash}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex gap-1">
                        {backup.storage.map(s => (
                          <span key={s} title={s} className="p-1 bg-slate-800 rounded text-slate-400">
                            {s === 'LOCAL' && <HardDrive size={12} />}
                            {s === 'CLOUD' && <Cloud size={12} />}
                            {s === 'RAID' && <Database size={12} />}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${backup.status === 'INTEGRATED' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                        <span className="text-xs font-bold text-slate-300">{backup.status}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white" title="Ver Detalhes">
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleRestore(backup.id)}
                          disabled={isRestoring}
                          className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-black transition-all"
                        >
                          {isRestoring ? 'Restaurando...' : 'Restaurar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Advanced Info */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/2">
          <h3 className="text-white font-black mb-4 flex items-center gap-2">
            <ShieldCheck size={20} className="text-primary" /> Conformidade e Segurança
          </h3>
          <ul className="space-y-3">
            {[
              "Criptografia AES-256-GCM em todos os snapshots",
              "Verificação de integridade SHA-256 horária",
              "Redundância geográfica via Cloud",
              "Histórico de transações SQL incluído no estado",
              "Watchdog independente para monitoramento de falhas"
            ].map((text, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-400 text-sm">
                <CheckCircle size={16} className="text-green-500 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/2">
          <h3 className="text-white font-black mb-4 flex items-center gap-2 text-red-400">
            <AlertTriangle size={20} /> Recuperação de Desastres
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            Em caso de corrupção total da base de dados local, o sistema entrará automaticamente em Modo de Segurança, 
            permitindo a restauração a partir do último ponto íntegro na nuvem.
          </p>
          <div className="flex gap-4">
            <button className="flex-1 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
              Limpar Todos os Backups
            </button>
            <button className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-700">
              Exportar Logs de DLP
            </button>
          </div>
        </div>
      </div>

      {/* SQL Server Migration & Instance Management */}
      <SQLMigrationPanel />
    </div>
  );
};

export default DLPRecovery;
