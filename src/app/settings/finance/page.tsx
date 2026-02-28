'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, Clock, 
  CreditCard, Target, BarChart3, PieChart, Activity,
  RefreshCw, Download, Upload, AlertCircle, CheckCircle,
  Filter, Search, Plus, Edit2, Trash2, Eye,
  Calculator, FileText, Receipt, Wallet, PiggyBank
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, AreaChart, Area, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';

interface FinancialData {
  totalRevenue: number;
  dailyRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  totalOrders: number;
  averageTicket: number;
  costs: number;
  profit: number;
  profitMargin: number;
  historicalRevenue?: number; // Valor arrecadado antes de usar o app
}

interface Transaction {
  id: string;
  type: 'revenue' | 'expense';
  description: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'cancelled';
}

interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: 'monthly' | 'quarterly' | 'yearly';
}

export default function SettingsFinancePage() {
  const { settings, updateSettings, addNotification, orders } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'goals' | 'analytics'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [dateRange, setDateRange] = useState('30days');

  const [financialData, setFinancialData] = useState<FinancialData>({
    totalRevenue: 12500000,
    dailyRevenue: 450000,
    monthlyRevenue: 13500000,
    yearlyRevenue: 162000000,
    totalOrders: 2847,
    averageTicket: 43850,
    costs: 8500000,
    profit: 4000000,
    profitMargin: 32,
    historicalRevenue: 0
  });

  const initialDate = useMemo(() => new Date('2026-02-28').getTime(), []);

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'revenue',
      description: 'Vendas diárias',
      amount: 250000,
      category: 'vendas',
      date: new Date(initialDate - 86400000).toISOString(),
      paymentMethod: 'multipagamento',
      status: 'completed'
    },
    {
      id: '2',
      type: 'expense',
      description: 'Compra de matéria-prima',
      amount: 120000,
      category: 'custos',
      date: new Date(initialDate - 86400000).toISOString(),
      paymentMethod: 'transferência',
      status: 'completed'
    },
    {
      id: '3',
      type: 'revenue',
      description: 'Eventos especiais',
      amount: 85000,
      category: 'eventos',
      date: new Date(initialDate - 172800000).toISOString(),
      paymentMethod: 'dinheiro',
      status: 'completed'
    }
  ]);

  const [goals, setGoals] = useState<FinancialGoal[]>([
    {
      id: '1',
      title: 'Meta Mensal de Vendas',
      targetAmount: 15000000,
      currentAmount: 13500000,
      deadline: new Date(initialDate + 2592000000).toISOString(),
      category: 'monthly'
    },
    {
      id: '2',
      title: 'Meta Trimestral',
      targetAmount: 45000000,
      currentAmount: 38000000,
      deadline: new Date(initialDate + 7776000000).toISOString(),
      category: 'quarterly'
    }
  ]);

  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showHistoricalRevenue, setShowHistoricalRevenue] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    type: 'revenue' as 'revenue' | 'expense',
    description: '',
    amount: 0,
    category: '',
    paymentMethod: ''
  });
  const [historicalRevenue, setHistoricalRevenue] = useState({
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleManualRevenueUpdate = () => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: manualEntry.type,
      description: manualEntry.description || 'Atualização manual',
      amount: manualEntry.amount,
      category: manualEntry.category || 'manual',
      date: new Date().toISOString(),
      paymentMethod: manualEntry.paymentMethod || 'manual',
      status: 'completed'
    };

    setTransactions([newTransaction, ...transactions]);

    // Atualizar dados financeiros
    if (manualEntry.type === 'revenue') {
      setFinancialData(prev => ({
        ...prev,
        totalRevenue: prev.totalRevenue + manualEntry.amount,
        dailyRevenue: prev.dailyRevenue + manualEntry.amount,
        monthlyRevenue: prev.monthlyRevenue + manualEntry.amount,
        profit: prev.profit + manualEntry.amount
      }));
    } else {
      setFinancialData(prev => ({
        ...prev,
        costs: prev.costs + manualEntry.amount,
        profit: prev.profit - manualEntry.amount
      }));
    }

    setManualEntry({
      type: 'revenue',
      description: '',
      amount: 0,
      category: '',
      paymentMethod: ''
    });
    setShowManualEntry(false);
    addNotification('success', 'Receita atualizada com sucesso!');
  };

  const handleHistoricalRevenueUpdate = () => {
    if (historicalRevenue.amount <= 0) {
      addNotification('error', 'Valor histórico deve ser maior que zero!');
      return;
    }

    setFinancialData(prev => ({
      ...prev,
      historicalRevenue: historicalRevenue.amount,
      totalRevenue: prev.totalRevenue + historicalRevenue.amount,
      profit: prev.profit + historicalRevenue.amount
    }));

    // Criar transação histórica
    const historicalTransaction: Transaction = {
      id: 'historical-' + Date.now(),
      type: 'revenue',
      description: `Valor histórico arrecadado: ${historicalRevenue.description || 'Anterior ao sistema atual'}`,
      amount: historicalRevenue.amount,
      category: 'historico',
      date: historicalRevenue.date,
      paymentMethod: 'sistema_anterior',
      status: 'completed'
    };

    setTransactions([historicalTransaction, ...transactions]);
    setShowHistoricalRevenue(false);
    setHistoricalRevenue({ amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
    addNotification('success', `Valor histórico de €${(historicalRevenue.amount / 100).toFixed(2)} adicionado com sucesso!`);
  };

  const handleResetFinancialData = () => {
    if (confirm('Tem certeza que deseja resetar todos os dados financeiros? Esta ação não pode ser desfeita e irá zerar todas as métricas para produção do zero.')) {
      const resetData: FinancialData = {
        totalRevenue: 0,
        dailyRevenue: 0,
        monthlyRevenue: 0,
        yearlyRevenue: 0,
        totalOrders: 0,
        averageTicket: 0,
        costs: 0,
        profit: 0,
        profitMargin: 0,
        historicalRevenue: 0
      };

      setFinancialData(resetData);
      setTransactions([]);
      setGoals([]);
      updateSettings({ ...settings, financialData: resetData });
      addNotification('success', 'Dados financeiros resetados com sucesso! Sistema pronto para produção do zero.');
    }
  };

  const handleExportData = () => {
    const exportData = {
      financialData,
      transactions,
      goals,
      historicalRevenue: financialData.historicalRevenue,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification('success', 'Dados financeiros exportados com sucesso!');
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          if (importedData.financialData) {
            setFinancialData({
              ...importedData.financialData,
              historicalRevenue: importedData.historicalRevenue || importedData.financialData.historicalRevenue || 0
            });
          }
          if (importedData.transactions) {
            setTransactions(importedData.transactions);
          }
          if (importedData.goals) {
            setGoals(importedData.goals);
          }
          addNotification('success', 'Dados financeiros importados com sucesso!');
        } catch (error) {
          addNotification('error', 'Erro ao importar dados financeiros!');
        }
      };
      reader.readAsText(file);
    }
  };

  const getGoalProgress = (goal: FinancialGoal) => {
    return (goal.currentAmount / goal.targetAmount) * 100;
  };

  const getGoalColor = (progress: number) => {
    if (progress >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (progress >= 70) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (progress >= 50) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  // Analytics data processing
  const analyticsData = useMemo(() => {
    const closedOrders = orders.filter(o => o.status === 'FECHADO');
    
    // Revenue over time (last 30 days)
    const revenueData = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('pt-AO', { month: 'short', day: 'numeric' });
      
      const dayRevenue = closedOrders
        .filter(order => {
          const orderDate = new Date(order.createdAt || order.created_at || new Date());
          return orderDate.toDateString() === date.toDateString();
        })
        .reduce((sum, order) => sum + (order.total || 0), 0);
      
      revenueData.push({
        date: dateStr,
        revenue: dayRevenue,
        orders: closedOrders.filter(order => {
          const orderDate = new Date(order.createdAt || order.created_at || new Date());
          return orderDate.toDateString() === date.toDateString();
        }).length
      });
    }

    // Payment methods distribution
    const paymentMethodsData: Record<string, number> = {};
    closedOrders.forEach(order => {
      if (order.paymentMethod) {
        paymentMethodsData[order.paymentMethod] = (paymentMethodsData[order.paymentMethod] || 0) + (order.total || 0);
      }
    });

    const paymentData = Object.entries(paymentMethodsData).map(([method, amount]) => ({
      name: method,
      value: amount,
      percentage: ((amount / closedOrders.reduce((sum, o) => sum + (o.total || 0), 0)) * 100).toFixed(1)
    }));

    // Monthly comparison
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthRevenue = closedOrders
      .filter(order => {
        const orderDate = new Date(order.createdAt || order.created_at || new Date());
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      })
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const lastMonthRevenue = closedOrders
      .filter(order => {
        const orderDate = new Date(order.createdAt || order.created_at || new Date());
        return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastYear;
      })
      .reduce((sum, order) => sum + (order.total || 0), 0);

    return {
      revenueData,
      paymentData,
      monthlyComparison: {
        current: currentMonthRevenue,
        last: lastMonthRevenue,
        growth: lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) : '0'
      }
    };
  }, [orders]);

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Configurações Financeiras</h1>
        <p className="text-slate-400">Gestão completa de receitas, despesas e métricas financeiras</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-primary text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 size={18} />
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'transactions'
              ? 'bg-primary text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText size={18} />
          Transações
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'goals'
              ? 'bg-primary text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Target size={18} />
          Metas
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'analytics'
              ? 'bg-primary text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PieChart size={18} />
          Análises
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setShowManualEntry(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Calculator size={20} />
          Inserir Receita Manual
        </button>
        <button
          onClick={() => setShowHistoricalRevenue(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors"
        >
          <PiggyBank size={20} />
          Adicionar Valor Histórico
        </button>
        <button
          onClick={handleExportData}
          className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
        >
          <Download size={20} />
          Exportar Dados
        </button>
        <label className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors cursor-pointer">
          <Upload size={20} />
          Importar Dados
          <input
            type="file"
            accept=".json"
            onChange={handleImportData}
            className="hidden"
          />
        </label>
        <button
          onClick={handleResetFinancialData}
          className="flex items-center gap-2 px-6 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
        >
          <RefreshCw size={20} />
          Resetar para Produção
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                  <DollarSign size={20} />
                </div>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`w-1 h-3 rounded-full ${i < 4 ? 'bg-emerald-500' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Receita Total</p>
              <p className="text-2xl font-black text-white tracking-tighter">
                {financialData.totalRevenue.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
              </p>
              {financialData.historicalRevenue && financialData.historicalRevenue > 0 && (
                <p className="text-xs text-blue-400 mt-2">
                  Incluindo €{(financialData.historicalRevenue / 100).toFixed(2)} histórico
                </p>
              )}
            </div>

            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                  <TrendingUp size={20} />
                </div>
                <div className="text-xs font-black text-blue-400 uppercase tracking-widest">HOJE</div>
              </div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Receita Diária</p>
              <p className="text-2xl font-black text-white tracking-tighter">
                {financialData.dailyRevenue.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
              </p>
            </div>

            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                  <Calendar size={20} />
                </div>
                <div className="text-xs font-black text-purple-400 uppercase tracking-widest">MÊS</div>
              </div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Receita Mensal</p>
              <p className="text-2xl font-black text-white tracking-tighter">
                {financialData.monthlyRevenue.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
              </p>
            </div>

            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-400">
                  <Activity size={20} />
                </div>
                <div className="text-xs font-black text-yellow-400 uppercase tracking-widest">LUCRO</div>
              </div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Lucro</p>
              <p className="text-2xl font-black text-white tracking-tighter">
                {financialData.profit.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
              </p>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <Receipt size={14} />
                <span>Total de Pedidos</span>
              </div>
              <p className="text-xl font-bold text-white">{financialData.totalOrders}</p>
            </div>

            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <Wallet size={14} />
                <span>Ticket Médio</span>
              </div>
              <p className="text-xl font-bold text-white">
                {financialData.averageTicket.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
              </p>
            </div>

            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <PiggyBank size={14} />
                <span>Margem de Lucro</span>
              </div>
              <p className="text-xl font-bold text-white">{financialData.profitMargin}%</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Buscar transações..."
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">Todas as Categorias</option>
              <option value="vendas">Vendas</option>
              <option value="custos">Custos</option>
              <option value="eventos">Eventos</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          {/* Transactions List */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-white">{transaction.description}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{transaction.category}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.type === 'revenue' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {transaction.type === 'revenue' ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-white">
                        {transaction.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.status === 'completed' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                          {transaction.status === 'completed' ? 'Concluído' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map((goal) => {
              const progress = getGoalProgress(goal);
              return (
                <div key={goal.id} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">{goal.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getGoalColor(progress)}`}>
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm text-slate-400 mb-1">
                        <span>Progresso</span>
                        <span>{goal.currentAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} / {goal.targetAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-primary to-blue-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="text-sm text-slate-400">
                      <span>Prazo: {new Date(goal.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="text-primary" size={20} />
                Tendência de Receita (30 dias)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={12}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12}
                    tick={{ fill: '#94a3b8' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#334155', 
                      borderRadius: '12px',
                      border: '1px solid #ffffff10'
                    }}
                    formatter={(value: number) => [
                      `${(value / 1000).toFixed(1)}k AOA`,
                      'Receita'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    fill="#10b98120"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Payment Methods Distribution */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <CreditCard className="text-primary" size={20} />
                Distribuição de Pagamentos
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={analyticsData.paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analyticsData.paymentData.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#334155', 
                      borderRadius: '12px',
                      border: '1px solid #ffffff10'
                    }}
                    formatter={(value: number) => [
                      `${(value / 1000).toFixed(1)}k AOA`,
                      'Valor'
                    ]}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {analyticsData.paymentData.map((method: any, index: number) => (
                  <div key={method.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ 
                          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6] 
                        }}
                      />
                      <span className="text-slate-300">{method.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">
                        {(method.value / 1000).toFixed(1)}k AOA
                      </div>
                      <div className="text-slate-500 text-xs">{method.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Comparison */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="text-primary" size={20} />
              Comparação Mensal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {(analyticsData.monthlyComparison.current / 1000).toFixed(1)}k
                </div>
                <div className="text-sm text-slate-400">Mês Atual</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-400 mb-2">
                  {(analyticsData.monthlyComparison.last / 1000).toFixed(1)}k
                </div>
                <div className="text-sm text-slate-400">Mês Anterior</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${
                  parseFloat(analyticsData.monthlyComparison.growth) >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {parseFloat(analyticsData.monthlyComparison.growth) >= 0 ? '+' : ''}{analyticsData.monthlyComparison.growth}%
                </div>
                <div className="text-sm text-slate-400">Crescimento</div>
              </div>
            </div>
          </div>

          {/* Daily Orders Chart */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Activity className="text-primary" size={20} />
              Pedidos Diários (30 dias)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analyticsData.revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={12}
                  tick={{ fill: '#94a3b8' }}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12}
                  tick={{ fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    borderRadius: '12px',
                    border: '1px solid #ffffff10'
                  }}
                  formatter={(value: number) => [value, 'Pedidos']}
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Manual Revenue Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-6">Inserir Receita Manual</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Tipo</label>
                <select
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={manualEntry.type}
                  onChange={(e) => setManualEntry({ ...manualEntry, type: e.target.value as 'revenue' | 'expense' })}
                >
                  <option value="revenue">Receita</option>
                  <option value="expense">Despesa</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Descrição</label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={manualEntry.description}
                  onChange={(e) => setManualEntry({ ...manualEntry, description: e.target.value })}
                  placeholder="Descrição da transação"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Valor (AOA)</label>
                <input
                  type="number"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={manualEntry.amount}
                  onChange={(e) => setManualEntry({ ...manualEntry, amount: Number(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Categoria</label>
                <select
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={manualEntry.category}
                  onChange={(e) => setManualEntry({ ...manualEntry, category: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  <option value="vendas">Vendas</option>
                  <option value="eventos">Eventos</option>
                  <option value="serviços">Serviços</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Método de Pagamento</label>
                <select
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={manualEntry.paymentMethod}
                  onChange={(e) => setManualEntry({ ...manualEntry, paymentMethod: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="multipagamento">Multicaixa</option>
                  <option value="transferência">Transferência</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowManualEntry(false);
                  setManualEntry({
                    type: 'revenue',
                    description: '',
                    amount: 0,
                    category: '',
                    paymentMethod: ''
                  });
                }}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleManualRevenueUpdate}
                className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Inserir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Adicionar Valor Histórico */}
      {showHistoricalRevenue && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <PiggyBank className="text-blue-500" size={24} />
              Adicionar Valor Histórico
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Valor Arrecadado (AOA)</label>
                <input
                  type="number"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  placeholder="Ex: 5000000"
                  value={historicalRevenue.amount}
                  onChange={(e) => setHistoricalRevenue({ ...historicalRevenue, amount: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Descrição (Opcional)</label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  placeholder="Ex: Vendas do sistema anterior"
                  value={historicalRevenue.description}
                  onChange={(e) => setHistoricalRevenue({ ...historicalRevenue, description: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Data de Referência</label>
                <input
                  type="date"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={historicalRevenue.date}
                  onChange={(e) => setHistoricalRevenue({ ...historicalRevenue, date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowHistoricalRevenue(false);
                  setHistoricalRevenue({ amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
                }}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleHistoricalRevenueUpdate}
                className="px-6 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
              >
                Adicionar Valor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
