'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { History, Search, Filter, Calendar, Clock, User, FileText, Download, Eye, EyeOff, Trash2, Activity, AlertCircle, CheckCircle } from 'lucide-react';

export default function SettingsHistoryPage() {
  const { addNotification } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('7days');

  const [history, setHistory] = useState([
    {
      id: '1',
      type: 'user_login',
      user: 'admin',
      action: 'Login no sistema',
      timestamp: '2024-01-15T10:30:00',
      ip: '192.168.1.100',
      status: 'success',
      details: 'Login realizado com sucesso'
    },
    {
      id: '2',
      type: 'order_created',
      user: 'joao.silva',
      action: 'Pedido criado',
      timestamp: '2024-01-15T10:25:00',
      ip: '192.168.1.105',
      status: 'success',
      details: 'Pedido #1234 criado - Mesa 5'
    },
    {
      id: '3',
      type: 'settings_changed',
      user: 'maria.santos',
      action: 'Configurações alteradas',
      timestamp: '2024-01-15T09:45:00',
      ip: '192.168.1.102',
      status: 'success',
      details: 'Preços atualizados na categoria Bebidas'
    },
    {
      id: '4',
      type: 'export_data',
      user: 'admin',
      action: 'Dados exportados',
      timestamp: '2024-01-15T09:00:00',
      ip: '192.168.1.100',
      status: 'success',
      details: 'SAFT exportado - período mensal'
    },
    {
      id: '5',
      type: 'failed_login',
      user: 'unknown',
      action: 'Tentativa de login falhou',
      timestamp: '2024-01-15T08:30:00',
      ip: '192.168.1.200',
      status: 'error',
      details: 'Senha incorreta - usuário: test@example.com'
    }
  ]);

  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});

  const handleExportHistory = () => {
    addNotification('info', 'Exportando histórico...');
    setTimeout(() => {
      addNotification('success', 'Histórico exportado com sucesso!');
    }, 2000);
  };

  const handleClearHistory = () => {
    if (confirm('Tem certeza que deseja limpar o histórico? Esta ação não pode ser desfeita.')) {
      setHistory([]);
      addNotification('success', 'Histórico limpo com sucesso!');
    }
  };

  const handleToggleDetails = (id: string) => {
    setShowDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user_login':
      case 'failed_login':
        return <User size={16} className="text-blue-400" />;
      case 'order_created':
      case 'order_updated':
        return <FileText size={16} className="text-green-400" />;
      case 'settings_changed':
        return <Activity size={16} className="text-yellow-400" />;
      case 'export_data':
      case 'import_data':
        return <Download size={16} className="text-purple-400" />;
      default:
        return <History size={16} className="text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'error': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user_login': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'order_created': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'settings_changed': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'export_data': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'failed_login': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || item.type === filterType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Histórico do Sistema</h1>
        <p className="text-slate-400">Registro de atividades e eventos do sistema</p>
      </div>

      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Buscar no histórico..."
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Todos os Tipos</option>
              <option value="user_login">Login de Usuários</option>
              <option value="order_created">Pedidos</option>
              <option value="settings_changed">Configurações</option>
              <option value="export_data">Exportações</option>
              <option value="failed_login">Falhas de Login</option>
            </select>
            
            <select
              className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="today">Hoje</option>
              <option value="7days">Últimos 7 dias</option>
              <option value="30days">Últimos 30 dias</option>
              <option value="90days">Últimos 90 dias</option>
            </select>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleExportHistory}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              <Download size={16} />
              Exportar Histórico
            </button>
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              <Trash2 size={16} />
              Limpar Histórico
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <Activity size={14} />
              <span>Total de Eventos</span>
            </div>
            <p className="text-2xl font-bold text-white">{history.length}</p>
          </div>
          
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <CheckCircle size={14} />
              <span>Sucessos</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {history.filter(h => h.status === 'success').length}
            </p>
          </div>
          
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <AlertCircle size={14} />
              <span>Erros</span>
            </div>
            <p className="text-2xl font-bold text-red-400">
              {history.filter(h => h.status === 'error').length}
            </p>
          </div>
          
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <User size={14} />
              <span>Usuários Ativos</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">
              {new Set(history.map(h => h.user)).size}
            </p>
          </div>
        </div>

        {/* History List */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6">Registro de Eventos</h3>
          
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <div key={item.id} className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 hover:border-slate-600 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-white">{item.action}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(item.status)}`}>
                          {item.status === 'success' ? 'Sucesso' : 
                           item.status === 'error' ? 'Erro' : 'Aviso'}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-slate-400">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {item.user}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            IP: {item.ip}
                          </span>
                        </div>
                        <p>{item.details}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleDetails(item.id)}
                      className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showDetails[item.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                
                {showDetails[item.id] && (
                  <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-600">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">ID do Evento:</span>
                        <span className="text-white ml-2">{item.id}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Tipo:</span>
                        <span className="text-white ml-2">{item.type}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Data Completa:</span>
                        <span className="text-white ml-2">{new Date(item.timestamp).toISOString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">User Agent:</span>
                        <span className="text-white ml-2">Mozilla/5.0 (Windows NT 10.0; Win64; x64)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredHistory.length === 0 && (
            <div className="text-center py-12">
              <History className="mx-auto h-16 w-16 text-slate-600 mb-4" />
              <h4 className="text-xl font-semibold text-white mb-2">Nenhum evento encontrado</h4>
              <p className="text-slate-400">
                Tente ajustar os filtros ou o termo de busca.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
