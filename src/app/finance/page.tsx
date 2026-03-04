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
    addExpense,
    addNotification
  } = useStore();

  const [dateRange, setDateRange] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'reports'>('overview');
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

  // Filter data based on date range
  const getFilteredData = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.setHours(23, 59, 59, 999));

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
        } else {
          startDate = new Date(now.setHours(0, 0, 0, 0));
        }
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    const filteredOrders = (orders || []).filter(order => {
      const orderDate = new Date(order.created_at || order.createdAt || 0);
      return orderDate >= startDate && orderDate <= endDate;
    });

    const filteredExpenses = (expenses || []).filter(expense => {
      const expenseDate = new Date(expense.date || 0);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    return { filteredOrders, filteredExpenses, startDate, endDate };
  };

  const { filteredOrders, filteredExpenses, startDate, endDate } = getFilteredData();

  // Calculate totals for filtered data
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  // Get recent transactions
  const recentTransactions = [
    ...filteredOrders.slice(-5).map(order => ({
      id: order.id,
      type: 'order',
      description: `Pedido #${order.id}`,
      amount: order.total,
      date: order.created_at || order.createdAt,
      status: order.status
    })),
    ...filteredExpenses.slice(-5).map(expense => ({
      id: expense.id,
      type: 'expense',
      description: expense.description || 'Despesa',
      amount: expense.amount,
      date: expense.date,
      status: 'completed'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Finanças</h1>
        <p className="text-slate-400">Visão geral financeira e gestão de despesas</p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-slate-800 p-4 rounded-lg mb-6 border border-slate-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="today">Hoje</option>
              <option value="week">Últimos 7 dias</option>
              <option value="month">Últimos 30 dias</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-slate-400">até</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-green-500 text-sm font-medium">
              <ArrowUpRight className="w-4 h-4 inline mr-1" />
              +12.5%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{formatKz(totalRevenue)}</h3>
          <p className="text-slate-400 text-sm">Receita Total</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Receipt className="w-6 h-6 text-red-500" />
            </div>
            <span className="text-red-500 text-sm font-medium">
              <ArrowDownRight className="w-4 h-4 inline mr-1" />
              +8.3%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{formatKz(totalExpenses)}</h3>
          <p className="text-slate-400 text-sm">Despesas Totais</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-blue-500 text-sm font-medium">
              <ArrowUpRight className="w-4 h-4 inline mr-1" />
              +15.2%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{formatKz(netProfit)}</h3>
          <p className="text-slate-400 text-sm">Lucro Líquido</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-500" />
            </div>
            <span className="text-purple-500 text-sm font-medium">
              <ArrowUpRight className="w-4 h-4 inline mr-1" />
              +5.7%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{formatKz(metrics.avgTicket)}</h3>
          <p className="text-slate-400 text-sm">Ticket Médio</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all text-sm whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-primary text-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity size={16} />
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

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Revenue Chart */}
              <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4">Receita vs Despesas</h3>
                <div className="h-64 flex items-center justify-center text-slate-400">
                  <PieChart className="w-16 h-16 mb-4" />
                  <p>Gráfico de receitas e despesas</p>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4">Transações Recentes</h3>
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          transaction.type === 'order' 
                            ? 'bg-green-500/20' 
                            : 'bg-red-500/20'
                        }`}>
                          {transaction.type === 'order' ? (
                            <DollarSign className="w-4 h-4 text-green-500" />
                          ) : (
                            <Receipt className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{transaction.description}</p>
                          <p className="text-slate-400 text-sm">
                            {formatDateInLuanda(new Date(transaction.date))}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.type === 'order' 
                            ? 'text-green-500' 
                            : 'text-red-500'
                        }`}>
                          {transaction.type === 'order' ? '+' : '-'}{formatKz(transaction.amount)}
                        </p>
                        <p className="text-slate-400 text-sm capitalize">{transaction.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-6">
              {/* Add Expense Button */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Gestão de Despesas</h3>
                <button
                  onClick={() => {
                    // TODO: Implement expense modal
                    addNotification('info', 'Funcionalidade em desenvolvimento');
                  }}
                  className="bg-primary text-black px-4 py-2 rounded-lg font-bold hover:bg-white transition-colors"
                >
                  <Plus size={16} className="inline mr-2" />
                  Adicionar Despesa
                </button>
              </div>

              {/* Expenses List */}
              <div className="space-y-4">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((expense) => (
                    <div key={expense.id} className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">{expense.description}</h4>
                          <p className="text-slate-400 text-sm">
                            {formatDateInLuanda(new Date(expense.date))}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-red-500 font-bold">{formatKz(expense.amount)}</p>
                          <p className="text-slate-400 text-sm capitalize">{expense.category}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Receipt className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                    <h4 className="text-lg font-medium text-white mb-2">Nenhuma Despesa</h4>
                    <p className="text-slate-400 mb-4">Não há despesas registradas neste período</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4">Relatórios Financeiros</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-primary transition-colors">
                    <Download className="w-6 h-6 text-primary mb-2" />
                    <h4 className="text-white font-medium">Relatório de Vendas</h4>
                    <p className="text-slate-400 text-sm">Exportar dados de vendas</p>
                  </button>
                  <button className="p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-primary transition-colors">
                    <Printer className="w-6 h-6 text-primary mb-2" />
                    <h4 className="text-white font-medium">Relatório de Despesas</h4>
                    <p className="text-slate-400 text-sm">Imprimir relatório de despesas</p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
