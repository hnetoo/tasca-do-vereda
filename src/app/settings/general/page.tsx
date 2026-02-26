'use client';

import React, { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Settings as SettingsIcon, Store, Globe, Clock, DollarSign, Bell, Palette, Shield, Save, Upload, Image } from 'lucide-react';

export default function SettingsGeneralPage() {
  const { settings, updateSettings, addNotification } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    restaurantName: settings?.restaurantName || 'Tasca do Vereda',
    address: settings?.address || 'Luanda, Angola',
    phone: settings?.phone || '+244 900 000 000',
    email: settings?.email || 'contato@tascadovereda.com',
    currency: settings?.currency || 'AOA',
    timezone: settings?.timezone || 'Africa/Luanda',
    language: settings?.language || 'pt-AO',
    taxRate: settings?.taxRate || 14,
    serviceCharge: settings?.serviceCharge || 10,
    notifications: settings?.notifications || true,
    darkMode: settings?.darkMode || true,
    autoBackup: settings?.autoBackup || true,
    receiptHeader: settings?.receiptHeader || 'Tasca do Vereda',
    receiptFooter: settings?.receiptFooter || 'Obrigado pela sua preferência!',
    logo: settings?.logo || null
  });

  const handleSave = () => {
    updateSettings(formData);
    addNotification('success', 'Configurações gerais salvas com sucesso!');
  };

  const handleReset = () => {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      const defaultSettings = {
        restaurantName: 'Tasca do Vereda',
        address: 'Luanda, Angola',
        phone: '+244 900 000 000',
        email: 'contato@tascadovereda.com',
        currency: 'AOA',
        timezone: 'Africa/Luanda',
        language: 'pt-AO',
        taxRate: 14,
        serviceCharge: 10,
        notifications: true,
        darkMode: true,
        autoBackup: true,
        receiptHeader: 'Tasca do Vereda',
        receiptFooter: 'Obrigado pela sua preferência!',
        logo: null
      };
      setFormData(defaultSettings);
      updateSettings(defaultSettings);
      addNotification('success', 'Configurações restauradas com sucesso!');
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoData = e.target?.result as string;
        setFormData({ ...formData, logo: logoData });
        addNotification('success', 'Logo carregado com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoRemove = () => {
    if (confirm('Tem certeza que deseja remover o logo?')) {
      setFormData({ ...formData, logo: null });
      addNotification('success', 'Logo removido com sucesso!');
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Configurações Gerais</h1>
        <p className="text-slate-400">Configurações básicas do sistema</p>
      </div>

      <div className="space-y-8">
        {/* Logo Upload */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-purple-500/20 rounded-xl text-purple-500">
              <Image size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Logo do Restaurante</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Identidade Visual</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex-1">
              {formData.logo ? (
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center overflow-hidden">
                    <img 
                      src={formData.logo} 
                      alt="Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Logo carregado</p>
                    <p className="text-xs text-slate-400">Clique para alterar</p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/10 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center mb-4">
                    <Image className="text-slate-400" size={32} />
                  </div>
                  <p className="text-sm text-slate-400">Nenhum logo carregado</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-purple-500/20 text-purple-400 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-purple-500/30 transition-all flex items-center gap-2"
              >
                <Upload size={16} />
                {formData.logo ? 'Alterar Logo' : 'Carregar Logo'}
              </button>
              {formData.logo && (
                <button
                  onClick={handleLogoRemove}
                  className="px-6 py-3 bg-red-500/20 text-red-400 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-500/30 transition-all"
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-primary/20 rounded-xl text-primary">
              <Store size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Informações do Restaurante</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Dados Básicos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome do Restaurante</label>
              <input
                type="text"
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-bold"
                value={formData.restaurantName}
                onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                placeholder="Nome do restaurante"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Endereço</label>
              <input
                type="text"
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-bold"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Telefone</label>
              <input
                type="tel"
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-bold"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+244 900 000 000"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Email</label>
              <input
                type="email"
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-bold"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@restaurante.com"
              />
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-500">
              <Globe size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Configurações Regionais</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Localização e Idioma</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Moeda</label>
              <select
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-bold appearance-none"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="AOA">AOA - Kwanza</option>
                <option value="USD">USD - Dólar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Fuso Horário</label>
              <select
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-bold appearance-none"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              >
                <option value="Africa/Luanda">Africa/Luanda</option>
                <option value="Europe/Lisbon">Europe/Lisbon</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Idioma</label>
              <select
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-bold appearance-none"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              >
                <option value="pt-AO">Português (Angola)</option>
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Financial Settings */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-green-500/20 rounded-xl text-green-500">
              <DollarSign size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Configurações Financeiras</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Taxas e Custos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Taxa de Imposto (%)</label>
              <input
                type="number"
                step="0.1"
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-bold"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                placeholder="14"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Taxa de Serviço (%)</label>
              <input
                type="number"
                step="0.1"
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-bold"
                value={formData.serviceCharge}
                onChange={(e) => setFormData({ ...formData, serviceCharge: Number(e.target.value) })}
                placeholder="10"
              />
            </div>
          </div>
        </div>

        {/* System Preferences */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-purple-500/20 rounded-xl text-purple-500">
              <SettingsIcon size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Preferências do Sistema</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Personalização</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <Bell className="text-slate-400" size={20} />
                <div>
                  <p className="font-medium text-white">Notificações</p>
                  <p className="text-sm text-slate-400">Receber alertas do sistema</p>
                </div>
              </div>
              <button
                onClick={() => setFormData({ ...formData, notifications: !formData.notifications })}
                className={`w-14 h-8 rounded-full transition-colors ${
                  formData.notifications ? 'bg-primary' : 'bg-slate-600'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  formData.notifications ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <Palette className="text-slate-400" size={20} />
                <div>
                  <p className="font-medium text-white">Modo Escuro</p>
                  <p className="text-sm text-slate-400">Tema escuro da interface</p>
                </div>
              </div>
              <button
                onClick={() => setFormData({ ...formData, darkMode: !formData.darkMode })}
                className={`w-14 h-8 rounded-full transition-colors ${
                  formData.darkMode ? 'bg-primary' : 'bg-slate-600'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  formData.darkMode ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <Shield className="text-slate-400" size={20} />
                <div>
                  <p className="font-medium text-white">Backup Automático</p>
                  <p className="text-sm text-slate-400">Salvar dados automaticamente</p>
                </div>
              </div>
              <button
                onClick={() => setFormData({ ...formData, autoBackup: !formData.autoBackup })}
                className={`w-14 h-8 rounded-full transition-colors ${
                  formData.autoBackup ? 'bg-primary' : 'bg-slate-600'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  formData.autoBackup ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Receipt Settings */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-yellow-500/20 rounded-xl text-yellow-500">
              <Save size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Configurações de Recibo</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Cabeçalho e Rodapé</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cabeçalho do Recibo</label>
              <textarea
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-bold resize-none"
                value={formData.receiptHeader}
                onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                placeholder="Texto do cabeçalho"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Rodapé do Recibo</label>
              <textarea
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-bold resize-none"
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                placeholder="Texto do rodapé"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="px-8 py-4 bg-primary text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:brightness-110 transition-all shadow-glow"
          >
            Salvar Configurações
          </button>
          <button
            onClick={handleReset}
            className="px-8 py-4 bg-slate-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-600 transition-all"
          >
            Restaurar Padrão
          </button>
        </div>
      </div>
    </div>
  );
}
