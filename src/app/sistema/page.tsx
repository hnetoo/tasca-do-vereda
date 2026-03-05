'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Store, 
  Globe, 
  Clock, 
  DollarSign, 
  Bell, 
  Palette, 
  Shield, 
  Save, 
  Upload, 
  Image,
  Database,
  Activity,
  CheckCircle,
  AlertCircle,
  Settings,
  Users,
  ArrowLeft,
  Calendar
} from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function SistemaPage() {
  const router = useRouter();
  const { settings, updateSettings, addNotification } = useStore();
  const [activeTab, setActiveTab] = useState<'geral' | 'base-dados' | 'aparência' | 'utilizadores'>('geral');
  const [loading, setLoading] = useState(false);
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
    logo: settings?.logo || null,
    primaryColor: settings?.primaryColor || '#f97316',
    secondaryColor: settings?.secondaryColor || '#0f172a'
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      updateSettings(formData);
      addNotification('success', 'Configurações salvas com sucesso!');
    } catch (error) {
      addNotification('error', 'Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      // Simular teste de conexão com Supabase
      await new Promise(resolve => setTimeout(resolve, 2000));
      addNotification('success', 'Conexão com base de dados estabelecida!');
    } catch (error) {
      addNotification('error', 'Erro na conexão com base de dados');
    } finally {
      setLoading(false);
    }
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
        logo: null,
        primaryColor: '#f97316',
        secondaryColor: '#0f172a'
      };
      setFormData(defaultSettings);
      updateSettings(defaultSettings);
      addNotification('success', 'Configurações restauradas com sucesso!');
    }
  };

  const tabs = [
    { id: 'geral', label: '📍 Geral', icon: Store },
    { id: 'base-dados', label: '📊 Base de Dados', icon: Database },
    { id: 'aparência', label: '🎨 Aparência', icon: Palette },
    { id: 'utilizadores', label: '👥 Utilizadores', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-orange-500" />
                <h1 className="text-xl font-semibold">Sistema</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <span className="text-lg">{tab.label.split(' ')[0]}</span>
                  <span>{tab.label.split(' ')[1]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Geral Tab */}
        {activeTab === 'geral' && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Store className="w-5 h-5 text-orange-500" />
                Informações da Tasca
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Nome da Tasca
                  </label>
                  <input
                    type="text"
                    value={formData.restaurantName}
                    onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="Nome da tasca"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="Endereço"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="Telefone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="Email"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-orange-500" />
                Configurações de Moeda
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Moeda
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="AOA">Kwanza (AOA)</option>
                    <option value="USD">Dólar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Taxa de Imposto (%)
                  </label>
                  <input
                    type="number"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="14"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Taxa de Serviço (%)
                  </label>
                  <input
                    type="number"
                    value={formData.serviceCharge}
                    onChange={(e) => setFormData({ ...formData, serviceCharge: parseFloat(e.target.value) })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="10"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Base de Dados Tab */}
        {activeTab === 'base-dados' && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Database className="w-5 h-5 text-orange-500" />
                Status da Base de Dados
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="font-medium text-white">Supabase</div>
                      <div className="text-sm text-slate-400">Conectado e sincronizado</div>
                    </div>
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Testando...' : 'Testar Conexão'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="font-medium text-white">Backup Automático</div>
                      <div className="text-sm text-slate-400">Último backup: 2 horas atrás</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoBackup}
                      onChange={(e) => setFormData({ ...formData, autoBackup: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Operações de Risco
              </h2>
              
              <div className="space-y-4">
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita!')) {
                      addNotification('warning', 'Operação cancelada por segurança');
                    }
                  }}
                  className="w-full p-4 bg-red-600/20 border border-red-600/50 rounded-lg text-red-400 hover:bg-red-600/30 transition-colors"
                >
                  Limpar Todos os Dados
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Utilizadores Tab */}
        {activeTab === 'utilizadores' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Gestão de Utilizadores Card */}
              <Link
                href="/sistema/utilizadores"
                className="group bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-orange-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Gestão de Utilizadores</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Lista completa de funcionários, cargos e informações
                </p>
                <div className="flex items-center text-blue-400 group-hover:text-blue-300 transition-colors">
                  <span className="text-sm font-medium">Ver Lista</span>
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </div>
              </Link>

              {/* Códigos de Acesso Card */}
              <Link
                href="/settings/staff"
                className="group bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-orange-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
                    <Shield className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Códigos de Acesso</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Gerencie PINs e permissões de acesso ao sistema
                </p>
                <div className="flex items-center text-green-400 group-hover:text-green-300 transition-colors">
                  <span className="text-sm font-medium">Gerenciar PINs</span>
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </div>
              </Link>

              {/* Escalas Card */}
              <Link
                href="/escalas"
                className="group bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-orange-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                    <Calendar className="w-8 h-8 text-purple-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Escalas</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Calendário de turnos e horários da equipe
                </p>
                <div className="flex items-center text-purple-400 group-hover:text-purple-300 transition-colors">
                  <span className="text-sm font-medium">Gerenciar Escalas</span>
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </div>
              </Link>

              {/* Folha Salarial Card */}
              <Link
                href="/settings/payroll"
                className="group bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-orange-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-500/20 rounded-xl group-hover:bg-orange-500/30 transition-colors">
                    <DollarSign className="w-8 h-8 text-orange-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Folha Salarial</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Processamento de pagamentos e histórico em AOA
                </p>
                <div className="flex items-center text-orange-400 group-hover:text-orange-300 transition-colors">
                  <span className="text-sm font-medium">Gerenciar Pagamentos</span>
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </div>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Total de Utilizadores</p>
                    <p className="text-2xl font-bold text-white">12</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">PINs Ativos</p>
                    <p className="text-2xl font-bold text-white">12</p>
                  </div>
                  <Shield className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Escalas Ativas</p>
                    <p className="text-2xl font-bold text-white">8</p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Folha Mensal</p>
                    <p className="text-2xl font-bold text-white">450K AOA</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Aparência Tab */}
        {activeTab === 'aparência' && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Palette className="w-5 h-5 text-orange-500" />
                Cores do Tema
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Cor Principal
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-12 h-12 rounded-lg border border-slate-700"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                      placeholder="#f97316"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Cor Secundária
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-12 h-12 rounded-lg border border-slate-700"
                    />
                    <input
                      type="text"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                      placeholder="#0f172a"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-500" />
                Preferências
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                  <div>
                    <div className="font-medium text-white">Modo Escuro</div>
                    <div className="text-sm text-slate-400">Tema escuro para a interface</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.darkMode}
                      onChange={(e) => setFormData({ ...formData, darkMode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                  <div>
                    <div className="font-medium text-white">Notificações</div>
                    <div className="text-sm text-slate-400">Alertas do sistema</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications}
                      onChange={(e) => setFormData({ ...formData, notifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Restaurar Padrão
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
}
