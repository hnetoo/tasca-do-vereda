'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { 
  DollarSign, TrendingUp, Calendar, CreditCard, 
  Download, Filter, ChevronDown, ChevronUp, PieChart,
  ArrowUpRight, ArrowDownRight, Printer, Plus, Eye,
  Edit2, Trash2, Search, RefreshCw, BarChart3,
  Wallet, Receipt, Target, Activity, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { formatDateInLuanda } from '@/utils/date';
import { formatKz } from '@/services/utils/currencyFormatter';

export default function FinancePage() {
  const { 
    orders, 
    dishes, 
    settings,
    expenses,
    employees,
    addExpense,
    addNotification
  } = useStore();

  const [dateRange, setDateRange] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'payroll' | 'reports'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Calculate financial metrics
  const calculateMetrics = () => {
    const currentOrders = orders || [];
    const currentDishes = dishes || [];
    
    const completedOrders = currentOrders.filter(o => o.status === 'FECHADO');
    const currentRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalRevenue = currentRevenue + (settings?.legacyTotalRevenue || 0);
    const avgTicket = completedOrders.length > 0 ? currentRevenue / completedOrders.length : 0;
    
    return {
      totalRevenue,
      orderCount: completedOrders.length,
      avgTicket,
      topProducts: currentDishes.slice(0, 5)
    };
  };

  const metrics = calculateMetrics();

  // Mock data for charts
  const weeklyRevenue = [
    { day: 'Seg', value: 120000 },
    { day: 'Ter', value: 190000 },
    { day: 'Qua', value: 150000 },
    { day: 'Qui', value: 220000 },
    { day: 'Sex', value: 280000 },
    { day: 'Sáb', value: 350000 },
    { day: 'Dom', value: 310000 }
  ];

  const paymentMethods = [
    { name: 'Dinheiro', value: 45, color: 'bg-green-500' },
    { name: 'Multicaixa', value: 35, color: 'bg-blue-500' },
    { name: 'Transferência', value: 20, color: 'bg-yellow-500' }
  ];

  const filteredExpenses = expenses?.filter(expense => 
    expense.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-950">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-6 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Finanças</h1>
          <p className="text-slate-400 text-sm">Gestão financeira e relatórios de vendas</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:bg-slate-800 text-sm"
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filtros</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 text-sm">
            <Download size={16} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
            >
              <option value="today">Hoje</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="year">Este Ano</option>
              <option value="custom">Personalizado</option>
            </select>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              placeholder="Data Início"
            />
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              placeholder="Data Fim"
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-900/50 p-1 rounded-lg border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all text-sm whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-primary text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 size={16} />
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all text-sm whitespace-nowrap ${
            activeTab === 'expenses'
              ? 'bg-primary text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Receipt size={16} />
          Despesas
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all text-sm whitespace-nowrap ${
            activeTab === 'payroll'
              ? 'bg-primary text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wallet size={16} />
          Folha Salarial
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all text-sm whitespace-nowrap ${
            activeTab === 'reports'
              ? 'bg-primary text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Target size={16} />
          Relatórios
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-green-900/20 rounded-lg">
                  <DollarSign className="text-green-500" size={20} />
                </div>
                <span className="flex items-center text-green-500 text-xs font-medium bg-green-900/10 px-2 py-1 rounded">
                  <ArrowUpRight size={12} className="mr-1" />
                  +12.5%
                </span>
              </div>
              <h3 className="text-slate-400 text-xs font-medium mb-1">Receita Total</h3>
              <p className="font-bold text-white text-lg truncate">
                {formatKz(metrics.totalRevenue)}
              </p>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-blue-900/20 rounded-lg">
                  <TrendingUp className="text-blue-500" size={20} />
                </div>
                <span className="flex items-center text-green-500 text-xs font-medium bg-green-900/10 px-2 py-1 rounded">
                  <ArrowUpRight size={12} className="mr-1" />
                  +5.2%
                </span>
              </div>
              <h3 className="text-slate-400 text-xs font-medium mb-1">Valor Médio</h3>
              <p className="font-bold text-white text-lg truncate">
                {formatKz(metrics.avgTicket)}
              </p>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-purple-900/20 rounded-lg">
                  <CreditCard className="text-purple-500" size={20} />
                </div>
                <span className="flex items-center text-red-500 text-xs font-medium bg-red-900/10 px-2 py-1 rounded">
                  <ArrowDownRight size={12} className="mr-1" />
                  -2.1%
                </span>
              </div>
              <h3 className="text-slate-400 text-xs font-medium mb-1">Total Pedidos</h3>
              <p className="font-bold text-white text-lg truncate">{metrics.orderCount}</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-orange-900/20 rounded-lg">
                  <Activity className="text-orange-500" size={20} />
                </div>
                <span className="text-slate-400 text-xs">Turno</span>
              </div>
              <h3 className="text-slate-400 text-xs font-medium mb-1">Status</h3>
              <p className="font-bold text-white text-lg truncate">
                Operacional
              </p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Revenue Chart */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-4">Receita Semanal</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {weeklyRevenue.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t-lg transition-all hover:from-primary hover:to-primary"
                      style={{ height: `${(day.value / 350000) * 100}%` }}
                    />
                    <span className="text-xs text-slate-400">{day.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-4">Métodos de Pagamento</h3>
              <div className="space-y-3">
                {paymentMethods.map((method, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${method.color}`} />
                      <span className="text-sm text-slate-300">{method.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${method.color}`}
                          style={{ width: `${method.value}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-400 w-10 text-right">{method.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="space-y-6">
          {/* Add Expense Form */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4">Adicionar Despesa</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const desc = (form.elements.namedItem('desc') as HTMLInputElement).value;
                const amount = Number((form.elements.namedItem('amount') as HTMLInputElement).value);
                if (!desc || !Number.isFinite(amount)) return;
                addExpense({ 
                  id: `exp-${Date.now()}`, 
                  description: desc, 
                  amount, 
                  date: new Date(), 
                  category: 'VARIAVEL' 
                } as any);
                form.reset();
                addNotification('success', 'Despesa adicionada com sucesso!');
              }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <input 
                name="desc" 
                placeholder="Descrição" 
                className="p-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-primary outline-none" 
              />
              <input 
                name="amount" 
                type="number" 
                placeholder="Valor (AOA)" 
                className="p-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-primary outline-none" 
              />
              <select className="p-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-primary outline-none">
                <option value="VARIAVEL">Variável</option>
                <option value="FIXA">Fixa</option>
                <option value="EMERGENCIA">Emergência</option>
              </select>
              <button type="submit" className="px-4 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors">
                <Plus size={16} className="inline mr-2" />
                Adicionar
              </button>
            </form>
          </div>

          {/* Expenses List */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Lista de Despesas</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar despesas..."
                    className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-primary outline-none w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Categoria</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredExpenses.slice(0, 10).map((expense: any) => (
                    <tr key={expense.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {formatDateInLuanda(expense.date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-white truncate max-w-xs">{expense.description}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{expense.category}</td>
                      <td className="px-4 py-3 text-sm font-bold text-white">{formatKz(expense.amount)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button className="text-blue-400 hover:text-blue-300 transition-colors">
                            <Eye size={16} />
                          </button>
                          <button className="text-yellow-400 hover:text-yellow-300 transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button className="text-red-400 hover:text-red-300 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4">Folha Salarial</h3>
            <div className="text-center py-8">
              <Wallet className="mx-auto h-12 w-12 text-slate-600 mb-4" />
              <h4 className="text-lg font-medium text-white mb-2">Gestão de Folha Salarial</h4>
              <p className="text-slate-400 mb-4">Funcionalidade em desenvolvimento</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4">Relatórios Financeiros</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="p-4 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors text-left">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="text-primary" size={20} />
                  <span className="font-medium text-white">Relatório de Vendas</span>
                </div>
                <p className="text-sm text-slate-400">Análise detalhada das vendas por período</p>
              </button>
              <button className="p-4 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors text-left">
                <div className="flex items-center gap-3 mb-2">
                  <Receipt className="text-primary" size={20} />
                  <span className="font-medium text-white">Relatório de Despesas</span>
                </div>
                <p className="text-sm text-slate-400">Controle detalhado de todas as despesas</p>
              </button>
              <button className="p-4 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors text-left">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="text-primary" size={20} />
                  <span className="font-medium text-white">Relatório de Metas</span>
                </div>
                <p className="text-sm text-slate-400">Acompanhamento de metas e objetivos</p>
              </button>
              <button className="p-4 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors text-left">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="text-primary" size={20} />
                  <span className="font-medium text-white">Relatório Completo</span>
                </div>
                <p className="text-sm text-slate-400">Visão geral completa do negócio</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
