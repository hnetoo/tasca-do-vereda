import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { IntegrationLog } from '../types';
import {
  Copy, Eye, EyeOff, Trash2, Plus, TestTube, AlertCircle, CheckCircle,
  Webhook, Key, FileText, Code, Play, Save
} from 'lucide-react';

const DeveloperSettings = () => {
  const [selectedTab, setSelectedTab] = useState<'keys' | 'webhooks' | 'devices' | 'logs' | 'docs'>('keys');
  const [showSecret, setShowSecret] = useState<{ [key: string]: boolean }>({});
  const [testResults, setTestResults] = useState<{ [key: string]: { status: 'pending' | 'success' | 'failed'; message: string } }>({});

  // Mock data - seria do useStore em produção
  const apiKeys = [
    { id: 'key-1', name: 'Integração POS', key: 'sk_live_...xyz123', secret: 'secret_...abc', createdAt: new Date(2024, 0, 15), lastUsed: new Date(2024, 0, 25), status: 'active', scopes: ['orders.read', 'customers.read', 'attendance.write'] },
    { id: 'key-2', name: 'Mobile App', key: 'sk_live_...def456', secret: 'secret_...def', createdAt: new Date(2024, 1, 1), lastUsed: new Date(2024, 1, 5), status: 'active', scopes: ['dashboard.read', 'analytics.read'] },
  ];

  const webhooks = [
    { id: 'wh-1', name: 'Pedido Criado', url: 'https://seu-servidor.com/webhooks/order', events: ['order.created'], status: 'active', lastTriggered: new Date(2024, 1, 5, 14, 30), failureCount: 0 },
    { id: 'wh-2', name: 'Pagamento Realizado', url: 'https://seu-servidor.com/webhooks/payment', events: ['payment.completed'], status: 'active', lastTriggered: new Date(2024, 1, 5, 15, 0), failureCount: 1 },
  ];

  const biometricDevices = [
    { id: 'dev-1', name: 'Relógio Biométrico - Entrada', type: 'FINGERPRINT', ipAddress: '192.168.1.100', port: 4370, status: 'connected', lastSync: new Date(2024, 1, 5, 16, 45), syncInterval: 5 },
    { id: 'dev-2', name: 'Câmara Facial - Saída', type: 'FACIAL', ipAddress: '192.168.1.101', port: 8080, status: 'connected', lastSync: new Date(2024, 1, 5, 16, 50), syncInterval: 5 },
  ];

  const { integrationLogs } = useStore();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const testWebhook = (webhookId: string) => {
    setTestResults(prev => ({
      ...prev,
      [webhookId]: { status: 'pending', message: 'Testando...' }
    }));

    setTimeout(() => {
      setTestResults(prev => ({
        ...prev,
        [webhookId]: { status: 'success', message: 'Webhook respondeu com sucesso (200 OK)' }
      }));
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-background to-slate-900 text-white p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2">Desenvolvedor</h1>
        <p className="text-slate-400">Gerenie integrações, API keys e webhooks</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto border-b border-white/5 pb-4">
        {[
          { id: 'keys', label: '🔑 API Keys', icon: Key },
          { id: 'webhooks', label: '🔗 Webhooks', icon: Webhook },
          { id: 'devices', label: '📱 Biométricos', icon: Code },
          { id: 'logs', label: '📊 Logs', icon: FileText },
          { id: 'docs', label: '📖 Documentação', icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as 'keys' | 'webhooks' | 'devices' | 'logs' | 'docs')}
            className={`px-6 py-3 font-bold text-sm rounded-lg transition-all whitespace-nowrap
              ${selectedTab === tab.id
                ? 'bg-primary text-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* API KEYS */}
      {selectedTab === 'keys' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black">API Keys</h2>
            <button className="px-4 py-2 bg-primary text-black font-bold rounded-lg hover:scale-105 transition-all flex items-center gap-2">
              <Plus size={16} /> Gerar Nova
            </button>
          </div>

          <div className="space-y-4">
            {apiKeys.map(key => (
              <div key={key.id} className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-black text-white">{key.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">Criada em {new Date(key.createdAt).toLocaleDateString('pt-AO')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">Ativa</span>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {/* Public Key */}
                  <div>
                    <label className="text-xs text-slate-400 font-bold uppercase">Chave Pública</label>
                    <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-white/5 border border-white/5">
                      <code className="text-sm font-mono text-slate-200 flex-1">{key.key}</code>
                      <button onClick={() => copyToClipboard(key.key)} className="p-2 hover:bg-white/10 rounded">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button className="px-4 py-2 bg-primary text-black font-bold rounded-lg hover:scale-105 transition-all flex items-center gap-2">
                      <Save size={16} /> Salvar
                    </button>
                  </div>
                  
                  {/* Secret Key */}
                  <div>
                    <label className="text-xs text-slate-400 font-bold uppercase">Chave Secreta</label>
                    <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-white/5 border border-white/5">
                      <code className="text-sm font-mono text-slate-200 flex-1">
                        {showSecret[key.id] ? key.secret : '••••••••••••••••••••'}
                      </code>
                      <button onClick={() => setShowSecret(prev => ({ ...prev, [key.id]: !prev[key.id] }))} className="p-2 hover:bg-white/10 rounded">
                        {showSecret[key.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => copyToClipboard(key.secret)} className="p-2 hover:bg-white/10 rounded">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scopes */}
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase">Permissões</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {key.scopes.map((scope, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold">
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Último uso: {new Date(key.lastUsed).toLocaleDateString('pt-AO')} às {new Date(key.lastUsed).toLocaleTimeString('pt-AO')}</span>
                  <button className="text-primary hover:text-primary/80 font-bold">Revogar</button>
                </div>
              </div>
            ))}
          </div>

          {/* Como usar */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10 mt-8">
            <h3 className="text-lg font-black mb-4">Como Usar</h3>
            <div className="bg-slate-800 rounded-lg p-4 text-sm font-mono space-y-3">
              <div>
                <p className="text-slate-400 text-xs mb-2">cURL</p>
                <code className="text-slate-300">
                  curl -H "Authorization: Bearer sk_live_...xyz123" \<br/>
                  &nbsp;&nbsp;-H "X-API-Secret: secret_...abc" \<br/>
                  &nbsp;&nbsp;https://api.tascadovereda.com/api/dashboard/summary
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WEBHOOKS */}
      {selectedTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black">Webhooks</h2>
            <button className="px-4 py-2 bg-primary text-black font-bold rounded-lg hover:scale-105 transition-all flex items-center gap-2">
              <Plus size={16} /> Adicionar Webhook
            </button>
          </div>

          <div className="space-y-4">
            {webhooks.map(webhook => (
              <div key={webhook.id} className="glass-panel rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-black text-white">{webhook.name}</h3>
                    <p className="text-sm text-slate-400 mt-1 font-mono break-all">{webhook.url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">Ativo</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs text-slate-400 font-bold uppercase">Eventos</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {webhook.events.map((event, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => testWebhook(webhook.id)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <Play size={16} /> Testar
                  </button>
                  <button className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all">
                    Editar
                  </button>
                  <button className="p-2 hover:bg-red-600/20 rounded-lg transition-all">
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>

                {testResults[webhook.id] && (
                  <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
                    testResults[webhook.id].status === 'success'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {testResults[webhook.id].status === 'success' ? (
                      <CheckCircle size={16} />
                    ) : (
                      <AlertCircle size={16} />
                    )}
                    <span className="text-sm font-bold">{testResults[webhook.id].message}</span>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Última ativação: {new Date(webhook.lastTriggered).toLocaleString('pt-AO')}</span>
                  <span className={webhook.failureCount > 0 ? 'text-red-400' : 'text-green-400'}>
                    {webhook.failureCount} falhas
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BIOMETRIC DEVICES */}
      {selectedTab === 'devices' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black">Dispositivos Biométricos</h2>
            <button className="px-4 py-2 bg-primary text-black font-bold rounded-lg hover:scale-105 transition-all flex items-center gap-2">
              <Save size={16} /> Registrar Dispositivo
            </button>
          </div>

          <div className="space-y-4">
            {biometricDevices.map(device => (
              <div key={device.id} className="glass-panel rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-black text-white">{device.name}</h3>
                    <p className="text-sm text-slate-400 mt-1">{device.ipAddress}:{device.port}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Conectado
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-xs text-slate-400">Tipo</p>
                    <p className="font-bold text-sm">{device.type}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-xs text-slate-400">Sincronização</p>
                    <p className="font-bold text-sm">{device.syncInterval}s</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all">
                    <TestTube size={16} /> Testar Conexão
                  </button>
                  <button className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all">
                    Configurar
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 text-xs text-slate-400">
                  Última sincronização: {new Date(device.lastSync).toLocaleString('pt-AO')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOGS */}
      {selectedTab === 'logs' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black">Logs de Integração</h2>

          <div className="glass-panel rounded-2xl p-6 border border-white/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-slate-400 font-bold">Integração</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-bold">Evento</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-bold">Status</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-bold">Tempo</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-bold">Duração</th>
                </tr>
              </thead>
                <tbody>
                  {integrationLogs.map((l: IntegrationLog) => {
                    return (
                    <tr key={l.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                      <td className="py-3 px-4 font-bold">{l.integrationName}</td>
                      <td className="py-3 px-4 text-slate-300">{(l.request as any)?.message || (l as any).eventType}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          (l as any).status === 'FAILED'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {(l as any).status === 'FAILED' ? '✗ Falha' : '✓ Sucesso'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {(l as any).timestamp instanceof Date 
                          ? (l as any).timestamp.toLocaleTimeString('pt-AO') 
                          : new Date((l as any).timestamp).toLocaleTimeString('pt-AO')}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {(l.request as any)?.details ? JSON.stringify((l.request as any).details).substring(0, 30) + '...' : '-'}
                      </td>
                    </tr>
                  );
                  })}
                  {integrationLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Nenhum log de integração registado.
                      </td>
                    </tr>
                  )}
                </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DOCUMENTATION */}
      {selectedTab === 'docs' && (
        <div className="space-y-6 max-w-3xl">
          <h2 className="text-2xl font-black">Documentação API</h2>

          <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-6">
            <div>
              <h3 className="text-lg font-black mb-3">Autenticação</h3>
              <p className="text-slate-300 mb-4">Todas as requisições devem incluir headers de autenticação:</p>
              <div className="bg-slate-800 rounded-lg p-4 text-sm font-mono overflow-x-auto">
                <pre>{`Authorization: Bearer sk_live_xxxxx
X-API-Secret: secret_xxxxx`}</pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black mb-3">Endpoints Principais</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                  <p className="font-bold text-sm mb-1">Dashboard</p>
                  <code className="text-xs text-slate-400">GET /api/dashboard/summary</code>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                  <p className="font-bold text-sm mb-1">Pedidos</p>
                  <code className="text-xs text-slate-400">GET /api/orders • POST /api/orders</code>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                  <p className="font-bold text-sm mb-1">Clientes</p>
                  <code className="text-xs text-slate-400">GET /api/customers • POST /api/customers</code>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                  <p className="font-bold text-sm mb-1">Biométrico</p>
                  <code className="text-xs text-slate-400">POST /api/biometric/webhook</code>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black mb-3">Eventos Webhook</h3>
              <div className="space-y-2 text-sm">
                <p className="text-slate-300">• <code className="text-primary">order.created</code> - Novo pedido criado</p>
                <p className="text-slate-300">• <code className="text-primary">order.closed</code> - Pedido finalizado</p>
                <p className="text-slate-300">• <code className="text-primary">attendance.clockin</code> - Entrada registada</p>
                <p className="text-slate-300">• <code className="text-primary">attendance.clockout</code> - Saída registada</p>
                <p className="text-slate-300">• <code className="text-primary">payment.completed</code> - Pagamento completado</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperSettings;
