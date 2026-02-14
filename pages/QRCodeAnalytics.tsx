import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { MenuAccessStats } from '../types';
import {
  QrCode, TrendingUp, Calendar, Eye, BarChart3, Download, Trash2
} from 'lucide-react';

const QRCodeAnalytics = () => {
  const { menuAccessLogs, getMenuAccessStats, clearMenuAccessLogs, addNotification } = useStore();
  type FilterType = 'ALL' | 'PUBLIC_MENU' | 'TABLE_MENU';
  type TimeRange = 'today' | 'week' | 'month' | 'all';
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [timeRange, setTimeRange] = useState<TimeRange>('today');

  const stats = getMenuAccessStats() as MenuAccessStats;

  // Filter logs based on selected filters
  const filteredLogs = menuAccessLogs.filter(log => {
    if (filterType !== 'ALL' && log.type !== filterType) return false;

    const logDate = new Date(log.timestamp);
    const now = new Date();

    switch (timeRange) {
      case 'today':
        return logDate.toDateString() === now.toDateString();
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return logDate >= weekAgo;
      }
      case 'month': {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return logDate >= monthAgo;
      }
      default:
        return true;
    }
  });

  // Calculate analytics
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const count = filteredLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate.getHours() === i;
    }).length;
    return { hour: i, count };
  });

  const maxHourly = Math.max(...hourlyData.map(d => d.count), 1);

  const tableAccessData = menuAccessLogs
    .filter(log => log.tableId)
    .reduce((acc, log) => {
      if (log.tableId) {
        acc[log.tableId] = (acc[log.tableId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

  const topTables = (Object.entries(tableAccessData) as Array<[string, number]>)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const topTableMax = topTables[0]?.[1] || 1;

  const handleClearLogs = () => {
    if (window.confirm('Tem a certeza que quer limpar todos os registos?')) {
      clearMenuAccessLogs();
      addNotification('success', 'Registos limpos!');
    }
  };

  const handleExportData = () => {
    const csv = [
      ['Tipo', 'Data/Hora', 'IP', 'User Agent', 'Tabela'],
      ...filteredLogs.map(log => [
        log.type,
        new Date(log.timestamp).toLocaleString('pt-PT'),
        log.ip || 'N/A',
        log.userAgent || 'N/A',
        log.tableId || 'N/A'
      ])
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `menu-access-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    addNotification('success', 'Dados exportados!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-background to-slate-900 text-white p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 size={32} className="text-primary" />
          <h1 className="text-4xl font-black">Análise QR Code</h1>
        </div>
        <p className="text-slate-400">Monitore o acesso ao menu online</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase">Total Acessos</p>
              <p className="text-4xl font-black mt-2">{stats.total}</p>
            </div>
            <Eye size={24} className="text-primary opacity-50" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase">Hoje</p>
              <p className="text-4xl font-black mt-2">{stats.todayAccesses}</p>
              <p className="text-xs text-slate-400 mt-2">acesso hoje</p>
            </div>
            <Calendar size={24} className="text-blue-400 opacity-50" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase">Menu Público</p>
              <p className="text-4xl font-black mt-2">{stats.publicMenus}</p>
              <p className="text-xs text-slate-400 mt-2">acessos diretos</p>
            </div>
            <QrCode size={24} className="text-green-400 opacity-50" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase">Por Tabela</p>
              <p className="text-4xl font-black mt-2">{stats.tableMenus}</p>
              <p className="text-xs text-slate-400 mt-2">acessos específicos</p>
            </div>
            <TrendingUp size={24} className="text-purple-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 mb-8">
        <h3 className="font-black mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400 font-bold uppercase block mb-2">
              Tipo de Acesso
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary outline-none"
            >
              <option value="ALL">Todos</option>
              <option value="PUBLIC_MENU">Menu Público</option>
              <option value="TABLE_MENU">Por Tabela</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-400 font-bold uppercase block mb-2">
              Período
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary outline-none"
            >
              <option value="today">Hoje</option>
              <option value="week">Última semana</option>
              <option value="month">Último mês</option>
              <option value="all">Tudo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hourly Distribution */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 mb-8">
        <h3 className="font-black mb-4">Acessos por Hora</h3>
        <div className="flex items-end justify-between gap-1 h-48">
          {hourlyData.map(({ hour, count }) => (
            <div key={hour} className="flex-1 flex flex-col items-center group">
              <div
                className="w-full bg-gradient-to-t from-primary to-blue-400 rounded-t transition-all hover:opacity-80"
                style={{
                  height: maxHourly > 0 ? `${(count / maxHourly) * 100}%` : '0%',
                  minHeight: count > 0 ? '4px' : '0px'
                }}
                title={`${hour}:00 - ${count} acessos`}
              />
              <span className="text-xs text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-all">
                {hour}h
              </span>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-400 mt-4">
          Total em período selecionado: <span className="font-bold text-white">{filteredLogs.length}</span> acessos
        </p>
      </div>

      {/* Top Tables */}
      {topTables.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-white/10 mb-8">
          <h3 className="font-black mb-4">Tabelas Mais Acessadas</h3>
          <div className="space-y-3">
            {topTables.map(([tableId, count], index) => (
              <div key={tableId} className="flex items-center gap-3">
                <span className="text-2xl font-black text-slate-600 w-8 text-center">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">Tabela {tableId}</span>
                    <span className="text-sm text-slate-400">{count} acessos</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full"
                      style={{ width: `${(count / topTableMax) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Accesses */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black">Acessos Recentes</h3>
          <div className="flex gap-2">
            <button
              onClick={handleExportData}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 transition-all"
            >
              <Download size={16} /> Exportar
            </button>
            {menuAccessLogs.length > 0 && (
              <button
                onClick={handleClearLogs}
                className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 font-bold text-sm flex items-center gap-2 transition-all"
              >
                <Trash2 size={16} /> Limpar
              </button>
            )}
          </div>
        </div>

        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-slate-400 text-xs font-bold uppercase">
                  <th className="text-left py-3">Tipo</th>
                  <th className="text-left py-3">Data/Hora</th>
                  <th className="text-left py-3">Tabela</th>
                  <th className="text-left py-3">IP</th>
                  <th className="text-left py-3">Device</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {filteredLogs.slice(-20).reverse().map((log, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        log.type === 'PUBLIC_MENU'
                          ? 'bg-green-600/20 text-green-400'
                          : 'bg-blue-600/20 text-blue-400'
                      }`}>
                        {log.type === 'PUBLIC_MENU' ? '🌐 Público' : '📱 Tabela'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300">
                      {new Date(log.timestamp).toLocaleString('pt-PT')}
                    </td>
                    <td className="py-3 text-slate-400">
                      {log.tableId ? `Mesa ${log.tableId}` : '-'}
                    </td>
                    <td className="py-3 text-slate-400 font-mono text-xs">
                      {log.ip || '-'}
                    </td>
                    <td className="py-3 text-slate-400 text-xs">
                      {log.userAgent ? log.userAgent.substring(0, 30) + '...' : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <QrCode size={48} className="mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400">Nenhum acesso registado no período selecionado</p>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="glass-panel rounded-2xl p-6 border border-primary/20 bg-primary/5">
        <h3 className="font-black mb-3">💡 Insights</h3>
        <ul className="text-sm space-y-2 text-slate-300">
          <li>✓ Monitore quantas pessoas acessam o menu via QR code</li>
          <li>✓ Veja o padrão de acessos por hora do dia</li>
          <li>✓ Identifique quais tabelas têm mais interesse</li>
          <li>✓ Exporte dados para análise externa</li>
        </ul>
      </div>
    </div>
  );
};

export default QRCodeAnalytics;
