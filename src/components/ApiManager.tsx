import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { APIKey, WebhookConfig } from '@/types';
import { 
  Key, Plus, Trash2, Eye, EyeOff, Copy, RefreshCw, 
  Globe, Activity, Save, X, AlertCircle 
} from 'lucide-react';

export const ApiManager = () => {
  const { 
    apiKeys, generateApiKey, revokeApiKey, 
    webhooks, registerWebhook, removeWebhook,
    addNotification 
  } = useStore();

  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  
  // Forms
  const [keyName, setKeyName] = useState('');
  const [webhookForm, setWebhookForm] = useState<Partial<WebhookConfig>>({
    name: '',
    url: '',
    events: ['order.created'],
    status: 'ACTIVE'
  });

  const availableEvents = [
    'order.created', 'order.updated', 'order.cancelled',
    'payment.processed', 'stock.low', 'shift.started', 'shift.ended'
  ];

  // API Key Handlers
  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName) return;

    try {
      generateApiKey(keyName, ['read', 'write']);
      addNotification('success', 'Chave API gerada com sucesso');
      setIsKeyModalOpen(false);
      setKeyName('');
    } catch (error) {
      addNotification('error', 'Erro ao gerar chave API');
    }
  };

  const handleRevokeKey = (id: string) => {
    if (confirm('Tem certeza que deseja revogar esta chave? Aplicações que a utilizam deixarão de funcionar.')) {
      revokeApiKey(id);
      addNotification('success', 'Chave revogada');
    }
  };

  const toggleSecret = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addNotification('info', 'Copiado para a área de transferência');
  };

  // Webhook Handlers
  const handleRegisterWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookForm.name || !webhookForm.url) {
      addNotification('error', 'Preencha os campos obrigatórios');
      return;
    }

    try {
      const newWebhook: WebhookConfig = {
        ...webhookForm as WebhookConfig,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        failureCount: 0,
      };
      registerWebhook(newWebhook);
      addNotification('success', 'Webhook registado com sucesso');
      setIsWebhookModalOpen(false);
      setWebhookForm({ name: '', url: '', events: ['order.created'], status: 'ACTIVE' });
    } catch (error) {
      addNotification('error', 'Erro ao registar webhook');
    }
  };

  const handleDeleteWebhook = (id: string) => {
    if (confirm('Remover este webhook?')) {
      removeWebhook(id);
      addNotification('success', 'Webhook removido');
    }
  };

  const toggleWebhookEvent = (event: string) => {
    setWebhookForm(prev => {
      const events = prev.events || [];
      if (events.includes(event)) {
        return { ...prev, events: events.filter(e => e !== event) };
      } else {
        return { ...prev, events: [...events, event] };
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* API Keys Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-bold text-white uppercase text-xs tracking-widest flex items-center gap-2">
              <Key size={16} className="text-purple-500" />
              Chaves de API
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">Gerencie o acesso de aplicações externas</p>
          </div>
          <button 
            onClick={() => setIsKeyModalOpen(true)}
            className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-purple-500/20 flex items-center gap-2"
          >
            <Plus size={14} /> Nova Chave
          </button>
        </div>

        <div className="space-y-3">
          {apiKeys.map((key: any) => (
            <div key={key.id} className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 group hover:border-purple-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${key.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    <Key size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">{key.name}</h5>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                      key.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {key.status}
                    </span>
                  </div>
                </div>
                {key.status === 'ACTIVE' && (
                  <button onClick={() => handleRevokeKey(key.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div className="bg-black/40 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Client ID</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-slate-300">{key.key}</code>
                    <button onClick={() => copyToClipboard(key.key)} className="text-slate-500 hover:text-white"><Copy size={12} /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Secret</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-slate-300">
                      {showSecrets[key.id] ? key.secret : '••••••••••••••••••••••••'}
                    </code>
                    <button onClick={() => toggleSecret(key.id)} className="text-slate-500 hover:text-white">
                      {showSecrets[key.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                    <button onClick={() => copyToClipboard(key.secret)} className="text-slate-500 hover:text-white"><Copy size={12} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {apiKeys.length === 0 && (
            <div className="py-6 text-center border-2 border-dashed border-white/5 rounded-2xl">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Nenhuma chave API ativa</p>
            </div>
          )}
        </div>
      </div>

      {/* Webhooks Section */}
      <div className="space-y-6 pt-6 border-t border-white/5">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-bold text-white uppercase text-xs tracking-widest flex items-center gap-2">
              <Globe size={16} className="text-blue-500" />
              Webhooks
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">Notificações de eventos em tempo real</p>
          </div>
          <button 
            onClick={() => setIsWebhookModalOpen(true)}
            className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-blue-500/20 flex items-center gap-2"
          >
            <Plus size={14} /> Novo Webhook
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {webhooks.map((hook: any) => (
            <div key={hook.id} className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">{hook.name}</h5>
                    <p className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">{hook.url}</p>
                  </div>
                </div>
                <button onClick={() => handleDeleteWebhook(hook.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {hook.events.map((event: any) => (
                  <span key={event} className="px-2 py-1 bg-white/5 rounded-md text-[9px] text-slate-400 uppercase font-bold tracking-wider">
                    {event.split('.')[0]}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {webhooks.length === 0 && (
            <div className="col-span-1 md:col-span-2 py-6 text-center border-2 border-dashed border-white/5 rounded-2xl">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Nenhum webhook configurado</p>
            </div>
          )}
        </div>
      </div>

      {/* API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
              <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Key size={18} className="text-purple-500" />
                Nova Chave API
              </h3>
              <button onClick={() => setIsKeyModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleGenerateKey} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome da Aplicação</label>
                <input 
                  type="text" 
                  value={keyName}
                  onChange={e => setKeyName(e.target.value)}
                  className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:border-purple-500 outline-none transition-colors"
                  placeholder="Ex: Integração Mobile"
                  autoFocus
                  required
                />
              </div>
              <button type="submit" className="w-full py-3 bg-purple-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-purple-600 transition-all shadow-glow flex items-center justify-center gap-2">
                <Plus size={14} /> Gerar Chaves
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Webhook Modal */}
      {isWebhookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
              <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Globe size={18} className="text-blue-500" />
                Novo Webhook
              </h3>
              <button onClick={() => setIsWebhookModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRegisterWebhook} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome</label>
                <input 
                  type="text" 
                  value={webhookForm.name}
                  onChange={e => setWebhookForm({...webhookForm, name: e.target.value})}
                  className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:border-blue-500 outline-none transition-colors"
                  placeholder="Ex: Notificação de Pedidos"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Endpoint URL</label>
                <input 
                  type="url" 
                  value={webhookForm.url}
                  onChange={e => setWebhookForm({...webhookForm, url: e.target.value})}
                  className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm font-mono focus:border-blue-500 outline-none transition-colors"
                  placeholder="https://api.exemplo.com/webhook"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Eventos Subscritos</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableEvents.map(event => (
                    <label key={event} className="flex items-center gap-2 p-2 rounded-lg bg-black/20 cursor-pointer hover:bg-black/40 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={webhookForm.events?.includes(event)}
                        onChange={() => toggleWebhookEvent(event)}
                        className="rounded border-white/20 bg-black/40 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{event.replace('.', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all shadow-glow flex items-center justify-center gap-2">
                <Save size={14} /> Registar Webhook
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
