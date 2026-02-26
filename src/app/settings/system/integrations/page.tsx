'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Share2, AlertCircle, Plus, Trash2, Edit, KeyRound, Wifi } from 'lucide-react';

export default function SettingsIntegrationsPage() {
  const { addNotification } = useStore();
  const [biometricDevices, setBiometricDevices] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [showBioForm, setShowBioForm] = useState(false);
  const [showApiForm, setShowApiForm] = useState(false);
  const [showWebhookForm, setShowWebhookForm] = useState(false);

  const [bioForm, setBioForm] = useState({ name: '', ipAddress: '', port: 4370, type: 'ZKTECO' });
  const [apiForm, setApiForm] = useState({ name: '', key: '', permissions: [] });
  const [webhookForm, setWebhookForm] = useState({ url: '', events: ['order.created'] });

  const handleAddBiometric = () => {
    setBiometricDevices([...biometricDevices, { ...bioForm, id: Date.now().toString() }]);
    setBioForm({ name: '', ipAddress: '', port: 4370, type: 'ZKTECO' });
    setShowBioForm(false);
    addNotification('success', 'Dispositivo biométrico adicionado!');
  };

  const handleAddApiKey = () => {
    const newKey = { ...apiForm, id: Date.now().toString(), key: 'sk_' + Math.random().toString(36).substr(2, 9) };
    setApiKeys([...apiKeys, newKey]);
    setApiForm({ name: '', key: '', permissions: [] });
    setShowApiForm(false);
    addNotification('success', 'API Key gerada!');
  };

  const handleAddWebhook = () => {
    setWebhooks([...webhooks, { ...webhookForm, id: Date.now().toString() }]);
    setWebhookForm({ url: '', events: ['order.created'] });
    setShowWebhookForm(false);
    addNotification('success', 'Webhook configurado!');
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Integrações</h1>
        <p className="text-slate-400">Configurações de integrações externas</p>
      </div>

      <div className="space-y-8">
        {/* Biometric Devices */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-500">
                <Share2 size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Dispositivos Biométricos</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Leitores de Impressão Digital</p>
              </div>
            </div>
            <button
              onClick={() => setShowBioForm(true)}
              className="p-3 bg-primary text-black rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all"
            >
              <Plus size={16} />
            </button>
          </div>

          {showBioForm && (
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 mb-6">
              <h4 className="text-sm font-black text-white mb-4">Adicionar Dispositivo</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nome do dispositivo"
                  value={bioForm.name}
                  onChange={(e) => setBioForm({ ...bioForm, name: e.target.value })}
                  className="p-3 bg-black/40 border border-white/10 rounded-xl text-white"
                />
                <input
                  type="text"
                  placeholder="Endereço IP"
                  value={bioForm.ipAddress}
                  onChange={(e) => setBioForm({ ...bioForm, ipAddress: e.target.value })}
                  className="p-3 bg-black/40 border border-white/10 rounded-xl text-white"
                />
                <input
                  type="number"
                  placeholder="Porta"
                  value={bioForm.port}
                  onChange={(e) => setBioForm({ ...bioForm, port: Number(e.target.value) })}
                  className="p-3 bg-black/40 border border-white/10 rounded-xl text-white"
                />
                <select
                  value={bioForm.type}
                  onChange={(e) => setBioForm({ ...bioForm, type: e.target.value })}
                  className="p-3 bg-black/40 border border-white/10 rounded-xl text-white"
                >
                  <option value="ZKTECO">ZKTECO</option>
                  <option value="HID">HID</option>
                  <option value="Suprema">Suprema</option>
                </select>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={handleAddBiometric} className="px-6 py-2 bg-primary text-black rounded-xl font-black text-xs uppercase tracking-widest">
                  Adicionar
                </button>
                <button onClick={() => setShowBioForm(false)} className="px-6 py-2 bg-slate-700 text-white rounded-xl font-black text-xs uppercase tracking-widest">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {biometricDevices.map((device) => (
              <div key={device.id} className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-black text-white">{device.name}</h5>
                  <div className="flex gap-2">
                    <button className="p-1 text-blue-400 hover:text-blue-300">
                      <Edit size={14} />
                    </button>
                    <button className="p-1 text-red-400 hover:text-red-300">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-400">{device.ipAddress}:{device.port}</p>
                <p className="text-xs text-slate-500">Tipo: {device.type}</p>
              </div>
            ))}
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-500/20 rounded-xl text-green-500">
                <KeyRound size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">API Keys</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Chaves de Acesso à API</p>
              </div>
            </div>
            <button
              onClick={() => setShowApiForm(true)}
              className="p-3 bg-primary text-black rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all"
            >
              <Plus size={16} />
            </button>
          </div>

          {showApiForm && (
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 mb-6">
              <h4 className="text-sm font-black text-white mb-4">Gerar API Key</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nome da chave"
                  value={apiForm.name}
                  onChange={(e) => setApiForm({ ...apiForm, name: e.target.value })}
                  className="p-3 bg-black/40 border border-white/10 rounded-xl text-white"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={handleAddApiKey} className="px-6 py-2 bg-primary text-black rounded-xl font-black text-xs uppercase tracking-widest">
                  Gerar Key
                </button>
                <button onClick={() => setShowApiForm(false)} className="px-6 py-2 bg-slate-700 text-white rounded-xl font-black text-xs uppercase tracking-widest">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div key={key.id} className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-black text-white">{key.name}</h5>
                  <div className="flex gap-2">
                    <button className="p-1 text-blue-400 hover:text-blue-300">
                      <Edit size={14} />
                    </button>
                    <button className="p-1 text-red-400 hover:text-red-300">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-sm font-mono text-slate-400">{key.key}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Webhooks */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/20 rounded-xl text-purple-500">
                <Wifi size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Webhooks</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Integrações Externas</p>
              </div>
            </div>
            <button
              onClick={() => setShowWebhookForm(true)}
              className="p-3 bg-primary text-black rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all"
            >
              <Plus size={16} />
            </button>
          </div>

          {showWebhookForm && (
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 mb-6">
              <h4 className="text-sm font-black text-white mb-4">Configurar Webhook</h4>
              <div className="space-y-4">
                <input
                  type="url"
                  placeholder="URL do webhook"
                  value={webhookForm.url}
                  onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
                  className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white"
                />
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Eventos</label>
                  <div className="space-y-2">
                    {['order.created', 'order.updated', 'order.paid'].map((event) => (
                      <label key={event} className="flex items-center gap-3 text-sm text-slate-400">
                        <input
                          type="checkbox"
                          checked={webhookForm.events.includes(event)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setWebhookForm({ ...webhookForm, events: [...webhookForm.events, event] });
                            } else {
                              setWebhookForm({ ...webhookForm, events: webhookForm.events.filter((e) => e !== event) });
                            }
                          }}
                        />
                        {event}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={handleAddWebhook} className="px-6 py-2 bg-primary text-black rounded-xl font-black text-xs uppercase tracking-widest">
                  Adicionar
                </button>
                <button onClick={() => setShowWebhookForm(false)} className="px-6 py-2 bg-slate-700 text-white rounded-xl font-black text-xs uppercase tracking-widest">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-black text-white">{webhook.url}</h5>
                  <div className="flex gap-2">
                    <button className="p-1 text-blue-400 hover:text-blue-300">
                      <Edit size={14} />
                    </button>
                    <button className="p-1 text-red-400 hover:text-red-300">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500">Eventos: {webhook.events.join(', ')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Notice */}
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
    </div>
  );
}
