'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Activity, Cpu, HardDrive, Globe, Zap, BarChart3, RefreshCw, AlertCircle, CheckCircle, Server, Database, Wifi } from 'lucide-react';

export default function SettingsHealthPage() {
  const { addNotification } = useStore();
  const [healthData, setHealthData] = useState({
    uptime: 86400,
    cpuUsage: 15.2,
    memoryUsage: 256,
    diskUsage: 45.8,
    networkLatency: 12,
    databaseConnections: 8,
    activeUsers: 12,
    systemLoad: 0.65,
    stabilityScore: 98
  });

  const [metricsHistory, setMetricsHistory] = useState([
    { time: '10:00', cpu: 12, memory: 240, disk: 45 },
    { time: '10:15', cpu: 18, memory: 260, disk: 45 },
    { time: '10:30', cpu: 15, memory: 250, disk: 46 },
    { time: '10:45', cpu: 22, memory: 280, disk: 46 },
    { time: '11:00', cpu: 16, memory: 245, disk: 46 }
  ]);

  const [services, setServices] = useState([
    { name: 'Database', status: 'healthy', uptime: '99.9%', responseTime: '12ms' },
    { name: 'API Server', status: 'healthy', uptime: '99.8%', responseTime: '8ms' },
    { name: 'Cache', status: 'healthy', uptime: '99.9%', responseTime: '2ms' },
    { name: 'File Storage', status: 'warning', uptime: '98.5%', responseTime: '45ms' }
  ]);

  const [alerts, setAlerts] = useState([
    { id: '1', type: 'warning', message: 'Uso de disco acima de 80%', time: '10:30' },
    { id: '2', type: 'info', message: 'Backup automático concluído', time: '09:00' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHealthData(prev => ({
        ...prev,
        cpuUsage: Math.random() * 30 + 10,
        memoryUsage: Math.random() * 100 + 200,
        networkLatency: Math.random() * 20 + 5
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    addNotification('success', 'Dados de saúde atualizados!');
  };

  const handleRunDiagnostics = () => {
    addNotification('info', 'Executando diagnóstico completo...');
    setTimeout(() => {
      addNotification('success', 'Diagnóstico concluído - Sistema saudável!');
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'error': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'warning': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Monitorização do Sistema</h1>
        <p className="text-slate-400">Saúde e desempenho em tempo real</p>
      </div>

      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-glow animate-pulse"></div>
              <span className="text-sm text-emerald-400 font-medium">Sistema Online</span>
            </div>
            <div className="text-sm text-slate-400">
              Uptime: {formatUptime(healthData.uptime)}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <RefreshCw size={16} />
              Atualizar
            </button>
            <button
              onClick={handleRunDiagnostics}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Activity size={16} />
              Diagnóstico
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'CPU', value: `${healthData.cpuUsage.toFixed(1)}%`, icon: Cpu, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Memória', value: `${healthData.memoryUsage}MB`, icon: HardDrive, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { label: 'Disco', value: `${healthData.diskUsage.toFixed(1)}%`, icon: Database, color: 'text-green-500', bg: 'bg-green-500/10' },
            { label: 'Rede', value: `${healthData.networkLatency}ms`, icon: Wifi, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
            { label: 'Carga', value: healthData.systemLoad.toFixed(2), icon: BarChart3, color: 'text-red-500', bg: 'bg-red-500/10' },
            { label: 'Conexões DB', value: healthData.databaseConnections, icon: Server, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Usuários Ativos', value: healthData.activeUsers, icon: Globe, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
            { label: 'Estabilidade', value: `${healthData.stabilityScore}%`, icon: CheckCircle, color: 'text-cyan-500', bg: 'bg-cyan-500/10' }
          ].map((metric, index) => (
            <div key={index} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${metric.bg} ${metric.color} rounded-xl`}>
                  <metric.icon size={20} />
                </div>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div 
                      key={i} 
                      className={`w-1 h-3 rounded-full ${
                        (typeof metric.value === 'string' ? parseFloat(metric.value) : metric.value) > (i * 20) ? 'bg-primary' : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{metric.label}</p>
              <p className="text-xl font-mono font-black text-white tracking-tighter">{typeof metric.value === 'string' ? metric.value : String(metric.value)}</p>
            </div>
          ))}
        </div>

        {/* Services Status */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            <Server size={20} className="text-primary" />
            Status dos Serviços
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service, index) => (
              <div key={index} className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      service.status === 'healthy' ? 'bg-emerald-500' : 
                      service.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <h4 className="font-medium text-white">{service.name}</h4>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(service.status)}`}>
                    {service.status === 'healthy' ? 'Saudável' : 
                     service.status === 'warning' ? 'Atenção' : 'Erro'}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Uptime:</span>
                    <span className="text-white">{service.uptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tempo Resposta:</span>
                    <span className="text-white">{service.responseTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            <AlertCircle size={20} className="text-yellow-400" />
            Alertas do Sistema
          </h3>
          
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={alert.id} className={`p-4 rounded-xl border ${getAlertColor(alert.type)}`}>
                <div className="flex items-start gap-3">
                  <AlertCircle size={16} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs opacity-75 mt-1">{alert.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            <BarChart3 size={20} className="text-primary" />
            Histórico de Performance
          </h3>
          
          <div className="h-64 bg-slate-800/50 rounded-xl flex items-center justify-center">
            <p className="text-slate-400">Gráfico de performance (implementar com biblioteca de gráficos)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
