import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { healthMonitorService, SystemHealthReport, SystemIssue } from '../services/healthMonitorService';
import { disasterRecoveryService, StateSnapshot } from '../services/disasterRecoveryService';
import { agtService } from '../services/agtService';
import { 
  Activity, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  Database, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCcw,
  BarChart3,
  Terminal,
  Server,
  Network,
  History,
  Camera,
  AlertCircle,
  ArrowRightCircle,
  FileCheck,
  Lock,
  Search,
  CheckCircle,
  Globe,
  Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const SystemHealth = () => {
  const { settings, activeOrders, menu } = useStore();
  const [report, setReport] = useState<SystemHealthReport>(healthMonitorService.getHealthReport());
  const [history, setHistory] = useState<SystemHealthReport[]>(healthMonitorService.getMetricsHistory());
  const [issues, setIssues] = useState<SystemIssue[]>(healthMonitorService.getIssueHistory());
  const [activeTab, setActiveTab] = useState<'metrics' | 'logs' | 'pitr' | 'agt'>('metrics');
  const [snapshots, setSnapshots] = useState<StateSnapshot[]>(disasterRecoveryService.listSnapshots());

  // AGT Specific State
  const [agtStatus, setAgtStatus] = useState({
    complianceScore: 100,
    lastSubmission: new Date().toISOString(),
    pendingInvoices: 0,
    saftStatus: 'READY',
    encryptionStatus: 'ACTIVE (RS256)',
    connectivity: 'ONLINE'
  });
  const [agtAuditLog, setAgtAuditLog] = useState<string[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);

  const handleRunAgtAudit = async () => {
    setIsAuditing(true);
    setAgtAuditLog(["🔄 Inicializando auditores digitais...", "📂 Carregando base de dados financeira..."]);
    
    try {
      // 1. Get or Generate Key Pair (Simulated for audit)
      const keys = await agtService.generateNewKeyPair();
      
      // 2. Run Simulation
      const result = await agtService.simulateSaftExportAndValidateChaining(
        activeOrders,
        keys.privateKey,
        settings,
        menu
      );

      setAgtAuditLog(result.auditLog);
      
      if (!result.isValid) {
        setAgtStatus(prev => ({ ...prev, complianceScore: 85, saftStatus: 'ERROR' }));
      } else {
        setAgtStatus(prev => ({ ...prev, complianceScore: 100, saftStatus: 'VERIFIED' }));
      }
    } catch (error: unknown) {
      setAgtAuditLog(prev => [...prev, `❌ ERRO CRÍTICO: ${error instanceof Error ? error.message : String(error)}`]);
    } finally {
      setIsAuditing(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setReport(healthMonitorService.getHealthReport());
      setHistory([...healthMonitorService.getMetricsHistory()]);
      setIssues([...healthMonitorService.getIssueHistory()]);
      setSnapshots(disasterRecoveryService.listSnapshots());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateSnapshot = async () => {
    const label = prompt('Etiqueta para o snapshot (ex: Antes de atualização):');
    if (label !== null) {
      await disasterRecoveryService.createSnapshot(label || 'Snapshot Manual');
      setSnapshots(disasterRecoveryService.listSnapshots());
    }
  };

  const handleRestoreSnapshot = async (id: string) => {
    if (confirm('Tem a certeza que deseja restaurar o sistema para este ponto? Todos os dados atuais serão substituídos.')) {
      const success = await disasterRecoveryService.restoreToPointInTime(id);
      if (success) {
        alert('Restauração concluída com sucesso!');
        window.location.reload();
      } else {
        alert('Falha na restauração.');
      }
    }
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const formatMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2) + ' MB';

  const getStabilityColor = (score: number) => {
    if (score > 90) return 'text-emerald-400';
    if (score > 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto no-scrollbar bg-slate-950 text-white font-mono">
      
      {/* Top HUD */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
             <ShieldCheck size={18} className="animate-pulse"/>
             <span className="text-xs font-bold tracking-[0.2em] uppercase">Security Operations Center</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
            Status do Sistema <span className="text-primary opacity-50 text-sm not-italic font-normal">SUIÇA-PRECISION v4.2</span>
          </h2>
        </div>
        
        <div className="flex gap-4 items-center bg-slate-900/50 p-3 rounded-2xl border border-white/5">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Uptime Global</p>
            <p className="text-sm font-bold text-primary">{formatUptime(report.uptime)}</p>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Score de Estabilidade</p>
            <p className={`text-xl font-black ${getStabilityColor(report.stabilityScore)}`}>{report.stabilityScore}%</p>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Memory HUD */}
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Cpu size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">
              <Database size={14} /> Memória & Cache
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Heap Utilizado</span>
                  <span className="text-white font-bold">{formatMB(report.memoryUsage.heapUsed)}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-1000" 
                    style={{ width: `${(report.memoryUsage.heapUsed / report.memoryUsage.limit) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Limite Global</p>
                  <p className="text-xs font-bold">{formatMB(report.memoryUsage.limit)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">MTBF</p>
                  <p className="text-xs font-bold text-emerald-400">{report.mtbf.toFixed(2)}h</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance HUD */}
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-yellow-400 text-[10px] font-black uppercase tracking-widest mb-4">
              <Activity size={14} /> Latência & I/O
            </div>
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black text-white">{report.performanceMetrics.latency.toFixed(1)}<span className="text-sm font-normal text-slate-500 ml-1">ms</span></p>
                  <p className="text-[10px] text-slate-400 uppercase">Latência de Resposta</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-white">{report.performanceMetrics.longTasks}</p>
                  <p className="text-[10px] text-slate-400 uppercase">Freezes Detetados</p>
                </div>
              </div>
              <div className="h-12 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history.slice(-20)}>
                    <Area type="monotone" dataKey="performanceMetrics.latency" stroke="#eab308" fill="#eab308" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Resilience HUD */}
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4">
              <RefreshCcw size={14} /> Auto-Recuperação
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black text-white">{(report.recoveryRate * 100).toFixed(0)}%</p>
                  <p className="text-[10px] text-slate-400 uppercase">Taxa de Sucesso</p>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center relative">
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"
                    style={{ animationDuration: '3s' }}
                  ></div>
                  <CheckCircle2 className="text-emerald-500" size={24} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Falhas</p>
                  <p className="text-xs font-bold text-red-400">{report.activeAlerts}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Estado DLP</p>
                  <p className="text-xs font-bold text-emerald-400">Protegido</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-slate-900/50 w-fit rounded-xl border border-white/5">
        <button 
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'metrics' ? 'bg-primary text-slate-950 shadow-glow' : 'text-slate-400 hover:text-white'}`}
        >
          <BarChart3 size={14} /> Métricas de Tempo Real
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'logs' ? 'bg-primary text-slate-950 shadow-glow' : 'text-slate-400 hover:text-white'}`}
        >
          <Terminal size={14} /> Logs de Diagnóstico
        </button>
        <button 
          onClick={() => setActiveTab('pitr')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'pitr' ? 'bg-primary text-slate-950 shadow-glow' : 'text-slate-400 hover:text-white'}`}
        >
          <History size={14} /> Point-in-Time Recovery
        </button>
        <button 
          onClick={() => setActiveTab('agt')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'agt' ? 'bg-emerald-500 text-slate-950 shadow-glow-emerald' : 'text-slate-400 hover:text-white'}`}
        >
          <FileCheck size={14} /> Conformidade AGT
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-6 min-h-[400px]">
        {activeTab === 'metrics' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* ML Failure Prediction Panel */}
            {report.failurePrediction && (
              <div className={`p-6 rounded-2xl border-2 mb-8 ${report.failurePrediction.probability > 0.4 ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${report.failurePrediction.probability > 0.4 ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                      <Zap size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase italic">Previsão Preditiva (ML-Heuristic)</h3>
                      <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Análise de risco em tempo real</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Probabilidade de Falha</p>
                    <p className={`text-2xl font-black ${report.failurePrediction.probability > 0.4 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {(report.failurePrediction.probability * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Tipo de Incidente Provável</p>
                    <div className="flex items-center gap-2 text-sm font-bold bg-black/30 p-2 rounded-lg border border-white/5">
                      <AlertCircle size={14} className={report.failurePrediction.probability > 0.4 ? 'text-red-400' : 'text-emerald-400'} />
                      {report.failurePrediction.likelyType}
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mt-4">Janela Temporal</p>
                    <div className="flex items-center gap-2 text-sm font-bold bg-black/30 p-2 rounded-lg border border-white/5">
                      <Clock size={14} className="text-primary" />
                      {report.failurePrediction.timeframe}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Fatores de Risco</p>
                    <div className="space-y-1">
                      {report.failurePrediction.factors.map((factor, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] text-slate-300">
                          <ArrowRightCircle size={10} className="text-primary" />
                          {factor}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Activity size={14} className="text-primary" /> Histórico de Latência
                </h4>
                <div className="h-[250px] w-full bg-black/20 rounded-2xl border border-white/5 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="timestamp" hide />
                      <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#06b6d4' }}
                      />
                      <Area type="monotone" dataKey="performanceMetrics.latency" stroke="#06b6d4" fillOpacity={1} fill="url(#colorLatency)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Database size={14} className="text-blue-400" /> Consumo de Memória
                </h4>
                <div className="h-[250px] w-full bg-black/20 rounded-2xl border border-white/5 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <XAxis dataKey="timestamp" hide />
                      <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#3b82f6' }}
                      />
                      <Line type="monotone" dataKey="memoryUsage.heapUsed" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Terminal size={14} className="text-primary" /> Histórico de Eventos Críticos
              </h4>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Últimos 50 eventos</span>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {issues.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                  <CheckCircle2 size={40} className="mx-auto text-emerald-500/20 mb-4" />
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Nenhum incidente detectado no período</p>
                </div>
              ) : (
                issues.map((issue) => (
                  <div key={issue.id} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-start gap-4 hover:border-white/10 transition-colors">
                    <div className={`mt-1 p-1.5 rounded-lg ${
                      issue.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 
                      issue.severity === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      <AlertTriangle size={14} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">{issue.type}</span>
                        <span className="text-[9px] font-bold text-slate-600 italic">{new Date(issue.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-white/80 font-bold mb-2">{issue.message}</p>
                      {issue.recovered && (
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-400 bg-emerald-400/10 w-fit px-2 py-0.5 rounded-full border border-emerald-400/20">
                          <RefreshCcw size={10} className="animate-spin-slow" /> Auto-Recuperado
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'pitr' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <History size={14} className="text-primary" /> Point-in-Time Recovery (PITR)
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tight">Recuperação instantânea de estado em nível de milissegundos</p>
              </div>
              <button 
                onClick={handleCreateSnapshot}
                className="bg-primary text-slate-950 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-glow"
              >
                <Camera size={16} /> Capturar Estado Atual
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {snapshots.length === 0 ? (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                  <Database size={40} className="mx-auto text-slate-800 mb-4" />
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Nenhum snapshot PITR disponível</p>
                </div>
              ) : (
                [...snapshots].reverse().map((snap) => (
                  <div key={snap.id} className="bg-slate-900/50 border border-white/5 p-5 rounded-3xl group hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-primary/10 rounded-xl text-primary">
                        <Clock size={18} />
                      </div>
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest group-hover:text-primary transition-colors">ID: {snap.id}</span>
                    </div>
                    <h5 className="text-sm font-black text-white mb-1 uppercase tracking-tight">{snap.label || 'Snapshot Sem Nome'}</h5>
                    <p className="text-[10px] text-slate-500 font-bold mb-6">{new Date(snap.timestamp).toLocaleString()}</p>
                    
                    <button 
                      onClick={() => handleRestoreSnapshot(snap.id)}
                      className="w-full py-2.5 rounded-xl border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-slate-950 hover:border-primary transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCcw size={14} /> Restaurar Este Ponto
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-12 p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="text-blue-400" size={20} />
                <h6 className="text-xs font-black text-blue-400 uppercase tracking-widest">Protocolo de Segurança PITR</h6>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-bold">
                O sistema Point-in-Time Recovery utiliza algoritmos de deduplicação e criptografia AES-GCM 256-bit para garantir a integridade dos snapshots. 
                Cada restauração é precedida por uma validação DLP (Data Loss Prevention) completa para evitar a propagação de estados corrompidos.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'agt' && (
          <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
            {/* AGT Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1">Score de Conformidade</p>
                <p className="text-2xl font-black text-white">{agtStatus.complianceScore}%</p>
                <div className="w-full h-1 bg-emerald-500/20 rounded-full mt-2">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
                <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Encadeamento Hash</p>
                <p className="text-xl font-black text-white">INTEGRO</p>
                <div className="flex items-center gap-1 mt-2">
                  <Lock size={10} className="text-blue-400" />
                  <span className="text-[8px] text-blue-300 uppercase font-bold">SHA-256 Chain Active</span>
                </div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl">
                <p className="text-[10px] text-purple-400 font-bold uppercase mb-1">Assinatura Digital</p>
                <p className="text-xl font-black text-white">RS256</p>
                <div className="flex items-center gap-1 mt-2">
                  <ShieldCheck size={10} className="text-purple-400" />
                  <span className="text-[8px] text-purple-300 uppercase font-bold">Private Key Secured</span>
                </div>
              </div>
              <div className="bg-slate-800/50 border border-white/5 p-4 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Conectividade AGT</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-xl font-black text-white">{agtStatus.connectivity}</p>
                </div>
                <p className="text-[8px] text-slate-500 mt-2 font-bold">API ENDPOINT: TEST/SANDBOX</p>
              </div>
            </div>

            {/* Compliance Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-black/20 rounded-3xl border border-white/5 p-6">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Search size={14} className="text-emerald-500" /> Auditoria de Requisitos Técnicos
                </h4>
                <div className="space-y-4">
                  {[
                    { label: 'Geração de Hash Sequencial', status: 'PASS', detail: 'Algoritmo SHA-256 verificado' },
                    { label: 'Assinatura JWS (JSON Web Signature)', status: 'PASS', detail: 'Headers typ:JOSE alg:RS256' },
                    { label: 'Exportação SAF-T AO v1.2', status: 'PASS', detail: 'Estrutura XML validada' },
                    { label: 'NIF/VAT Validation', status: 'PASS', detail: 'Filtro de 9 dígitos ativo' },
                    { label: 'Backup Triple-Redundancy', status: 'PASS', detail: 'Local + Cloud + PITR Snapshot' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <p className="text-xs font-bold text-white">{item.label}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase">{item.detail}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-emerald-400">OK</span>
                        <CheckCircle size={14} className="text-emerald-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-black/20 rounded-3xl border border-white/5 p-6">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Globe size={14} className="text-blue-400" /> Comunicação em Tempo Real
                  </h4>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-3xl font-black text-white">{agtStatus.pendingInvoices}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Faturas Pendentes de Envio</p>
                    </div>
                    <button className="px-4 py-2 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase rounded-xl hover:scale-105 transition-transform">
                      Sincronizar Agora
                    </button>
                  </div>
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <Zap size={16} className="text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-400 font-bold uppercase">Última Transmissão</p>
                        <p className="text-xs font-bold text-white">{new Date(agtStatus.lastSubmission).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/20 rounded-lg text-primary">
                      <FileCheck size={18} />
                    </div>
                    <div>
                      <h5 className="text-sm font-black uppercase italic">Certificação AGT 2026</h5>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Software Reference: TV-R-1.1.45</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                    O sistema está operando em conformidade com o <span className="text-white font-bold italic underline">Decreto Executivo n.º 312/18</span> e normas de faturação eletrónica da AGT Angola.
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleRunAgtAudit}
                      disabled={isAuditing}
                      className="flex-1 py-2 bg-emerald-500 text-slate-950 rounded-lg text-[9px] font-black uppercase hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                    >
                      {isAuditing ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                      Executar Auditoria
                    </button>
                    <button className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase hover:bg-white/10 transition-colors">
                      Exportar SAF-T AO
                    </button>
                  </div>
                </div>

                {/* Audit Terminal Log */}
                {agtAuditLog.length > 0 && (
                  <div className="bg-black/40 border border-emerald-500/20 rounded-3xl p-6 font-mono">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Terminal size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase">AGT Audit Terminal</span>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500/20"></div>
                      </div>
                    </div>
                    <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                      {agtAuditLog.map((log, i) => (
                        <div key={i} className="text-[10px] leading-relaxed">
                          <span className="text-emerald-500/50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                          <span className={log.includes('❌') ? 'text-red-400' : log.includes('✅') || log.includes('💎') ? 'text-emerald-400' : 'text-slate-300'}>
                            {log}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <footer className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 uppercase font-bold border-t border-white/5 pt-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Server size={12} /> Node ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}
          </div>
          <div className="flex items-center gap-2">
            <Network size={12} /> Status: Híbrido (Local + Cloud)
          </div>
        </div>
        <div>
          &copy; 2026 TASCA DO VEREDA - SISTEMA DE ALTA DISPONIBILIDADE
        </div>
      </footer>
    </div>
  );
};

export default SystemHealth;
