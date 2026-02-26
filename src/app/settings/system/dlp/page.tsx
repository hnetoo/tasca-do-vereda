'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Lock, Shield, Eye, EyeOff, AlertTriangle, CheckCircle, Clock, Users, FileText, Key, Database, Activity, Settings } from 'lucide-react';

export default function SettingsDLPPage() {
  const { addNotification } = useStore();
  const [dlpConfig, setDlpConfig] = useState({
    enabled: true,
    dataEncryption: true,
    accessLogging: true,
    screenCapture: false,
    usbBlocking: true,
    printProtection: true,
    clipboardMonitoring: true,
    fileTransferControl: true,
    sensitiveDataDetection: true,
    alertThreshold: 3,
    retentionDays: 90
  });

  const [alerts, setAlerts] = useState([
    {
      id: '1',
      type: 'warning',
      message: 'Tentativa de acesso a dados sensíveis detectada',
      user: 'joao.silva',
      time: '2024-01-15T14:30:00',
      severity: 'medium'
    },
    {
      id: '2',
      type: 'error',
      message: 'Transferência de arquivo bloqueada',
      user: 'maria.santos',
      time: '2024-01-15T13:15:00',
      severity: 'high'
    },
    {
      id: '3',
      type: 'info',
      message: 'Acesso autorizado a dados financeiros',
      user: 'admin',
      time: '2024-01-15T12:00:00',
      severity: 'low'
    }
  ]);

  const [policies, setPolicies] = useState([
    {
      id: '1',
      name: 'Dados Financeiros',
      description: 'Proteção de informações financeiras e contábeis',
      enabled: true,
      rules: ['encrypt', 'audit', 'restrict_access']
    },
    {
      id: '2',
      name: 'Informações de Clientes',
      description: 'Proteção de dados pessoais dos clientes',
      enabled: true,
      rules: ['encrypt', 'mask_data', 'audit']
    },
    {
      id: '3',
      name: 'Dados de Funcionários',
      description: 'Proteção de informações de RH',
      enabled: true,
      rules: ['encrypt', 'restrict_access', 'audit']
    }
  ]);

  const handleSaveConfig = () => {
    addNotification('success', 'Configurações DLP salvas com sucesso!');
  };

  const handleTogglePolicy = (policyId: string) => {
    setPolicies(prev => prev.map(policy => 
      policy.id === policyId 
        ? { ...policy, enabled: !policy.enabled }
        : policy
    ));
    addNotification('success', 'Política atualizada com sucesso!');
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    addNotification('success', 'Alerta resolvido com sucesso!');
  };

  const handleRunDiagnostics = () => {
    addNotification('info', 'Executando diagnóstico DLP...');
    setTimeout(() => {
      addNotification('success', 'Diagnóstico concluído - Sistema seguro!');
    }, 3000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">DLP - Prevenção de Perda de Dados</h1>
        <p className="text-slate-400">Proteção e monitoramento de dados sensíveis</p>
      </div>

      <div className="space-y-6">
        {/* DLP Status */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <Shield size={20} className="text-primary" />
              Status DLP
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-glow animate-pulse"></div>
              <span className="text-sm text-emerald-400 font-medium">Proteção Ativa</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <Activity size={14} />
                <span>Alertas Hoje</span>
              </div>
              <p className="text-2xl font-bold text-white">{alerts.length}</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <Lock size={14} />
                <span>Políticas Ativas</span>
              </div>
              <p className="text-2xl font-bold text-white">{policies.filter(p => p.enabled).length}</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <Database size={14} />
                <span>Dados Monitorados</span>
              </div>
              <p className="text-2xl font-bold text-white">2.4 TB</p>
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            <Settings size={20} className="text-primary" />
            Configurações DLP
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
              <div>
                <p className="font-medium text-white">Criptografia de Dados</p>
                <p className="text-sm text-slate-400">Criptografar dados sensíveis</p>
              </div>
              <button
                onClick={() => setDlpConfig(prev => ({ ...prev, dataEncryption: !prev.dataEncryption }))}
                className={`w-14 h-8 rounded-full transition-colors ${
                  dlpConfig.dataEncryption ? 'bg-primary' : 'bg-slate-600'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  dlpConfig.dataEncryption ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
              <div>
                <p className="font-medium text-white">Registro de Acesso</p>
                <p className="text-sm text-slate-400">Monitorar acessos aos dados</p>
              </div>
              <button
                onClick={() => setDlpConfig(prev => ({ ...prev, accessLogging: !prev.accessLogging }))}
                className={`w-14 h-8 rounded-full transition-colors ${
                  dlpConfig.accessLogging ? 'bg-primary' : 'bg-slate-600'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  dlpConfig.accessLogging ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
              <div>
                <p className="font-medium text-white">Bloqueio de USB</p>
                <p className="text-sm text-slate-400">Bloquear transferências USB</p>
              </div>
              <button
                onClick={() => setDlpConfig(prev => ({ ...prev, usbBlocking: !prev.usbBlocking }))}
                className={`w-14 h-8 rounded-full transition-colors ${
                  dlpConfig.usbBlocking ? 'bg-primary' : 'bg-slate-600'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  dlpConfig.usbBlocking ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
              <div>
                <p className="font-medium text-white">Proteção de Impressão</p>
                <p className="text-sm text-slate-400">Controlar impressão de dados</p>
              </div>
              <button
                onClick={() => setDlpConfig(prev => ({ ...prev, printProtection: !prev.printProtection }))}
                className={`w-14 h-8 rounded-full transition-colors ${
                  dlpConfig.printProtection ? 'bg-primary' : 'bg-slate-600'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  dlpConfig.printProtection ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
              <div>
                <p className="font-medium text-white">Monitoramento de Área</p>
                <p className="text-sm text-slate-400">Monitorar área de transferência</p>
              </div>
              <button
                onClick={() => setDlpConfig(prev => ({ ...prev, clipboardMonitoring: !prev.clipboardMonitoring }))}
                className={`w-14 h-8 rounded-full transition-colors ${
                  dlpConfig.clipboardMonitoring ? 'bg-primary' : 'bg-slate-600'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  dlpConfig.clipboardMonitoring ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
              <div>
                <p className="font-medium text-white">Detecção de Dados Sensíveis</p>
                <p className="text-sm text-slate-400">Identificar informações sensíveis</p>
              </div>
              <button
                onClick={() => setDlpConfig(prev => ({ ...prev, sensitiveDataDetection: !prev.sensitiveDataDetection }))}
                className={`w-14 h-8 rounded-full transition-colors ${
                  dlpConfig.sensitiveDataDetection ? 'bg-primary' : 'bg-slate-600'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  dlpConfig.sensitiveDataDetection ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Limite de Alertas</label>
              <input
                type="number"
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                value={dlpConfig.alertThreshold}
                onChange={(e) => setDlpConfig(prev => ({ ...prev, alertThreshold: Number(e.target.value) }))}
                min="1"
                max="10"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Retenção de Logs (dias)</label>
              <input
                type="number"
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                value={dlpConfig.retentionDays}
                onChange={(e) => setDlpConfig(prev => ({ ...prev, retentionDays: Number(e.target.value) }))}
                min="7"
                max="365"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSaveConfig}
              className="px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Salvar Configurações
            </button>
          </div>
        </div>

        {/* Security Policies */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            <FileText size={20} className="text-primary" />
            Políticas de Segurança
          </h3>
          
          <div className="space-y-3">
            {policies.map((policy) => (
              <div key={policy.id} className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Key className="text-primary" size={20} />
                    <div>
                      <h4 className="font-medium text-white">{policy.name}</h4>
                      <p className="text-sm text-slate-400">{policy.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTogglePolicy(policy.id)}
                    className={`w-14 h-8 rounded-full transition-colors ${
                      policy.enabled ? 'bg-primary' : 'bg-slate-600'
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                      policy.enabled ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {policy.rules.map((rule, index) => (
                    <span key={index} className="px-2 py-1 bg-slate-700 text-xs text-slate-300 rounded">
                      {rule.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <AlertTriangle size={20} className="text-yellow-400" />
              Alertas Recentes
            </h3>
            <button
              onClick={handleRunDiagnostics}
              className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-2"
            >
              <Activity size={16} />
              Executar Diagnóstico
            </button>
          </div>
          
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-xl border ${getAlertColor(alert.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {alert.type === 'error' ? <AlertTriangle size={16} /> : 
                     alert.type === 'warning' ? <Eye size={16} /> : <CheckCircle size={16} />}
                    <div>
                      <p className="font-medium text-white">{alert.message}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-300 mt-1">
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {alert.user}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(alert.time).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(alert.severity)}`}>
                      {alert.severity === 'high' ? 'Alta' : 
                       alert.severity === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                    >
                      <EyeOff size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
