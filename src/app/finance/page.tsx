// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { 
  DollarSign, TrendingUp, Calendar, CreditCard, 
  Download, Filter, ChevronDown, ChevronUp, PieChart,
  ArrowUpRight, ArrowDownRight, Printer
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  BarElement
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { formatDateInLuanda } from '@/utils/date';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

export default function FinancePage() {
  const { 
    orders, 
    dishes, 
    generateFinancialReport,
    activeShift,
    shifts,
    settings
  } = useStore();

  const [dateRange, setDateRange] = useState('today'); // today, week, month, year
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Calculate financial metrics
  const calculateMetrics = () => {
    // Mock data for now based on orders
    const completedOrders = orders.filter(o => o.status === 'FECHADO');
    const currentRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const totalRevenue = currentRevenue + (settings.legacyTotalRevenue || 0);
    const avgTicket = completedOrders.length > 0 ? currentRevenue / completedOrders.length : 0;
    
    return {
      totalRevenue,
      orderCount: completedOrders.length,
      avgTicket,
      topProducts: dishes.slice(0, 5) // Mock top products
    };
  };

  const metrics = calculateMetrics();

  // Chart data configuration
  const revenueData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Receita (KZ)',
        data: [12000, 19000, 15000, 22000, 28000, 35000, 31000],
        borderColor: 'rgb(234, 179, 8)',
        backgroundColor: 'rgba(234, 179, 8, 0.5)',
        tension: 0.4
      }
    ]
  };

  const paymentMethodsData = {
    labels: ['Dinheiro', 'Multicaixa', 'Transferência'],
    datasets: [
      {
        data: [45, 35, 20],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(234, 179, 8, 0.8)'
        ],
        borderWidth: 0
      }
    ]
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Finanças</h1>
          <p className="text-slate-400">Gestão financeira e relatórios de vendas</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:bg-slate-800"
          >
            <Filter size={20} />
            Filtros
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90">
            <Download size={20} />
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-900/20 rounded-lg">
              <DollarSign className="text-green-500" size={24} />
            </div>
            <span className="flex items-center text-green-500 text-sm font-medium bg-green-900/10 px-2 py-1 rounded">
              <ArrowUpRight size={16} className="mr-1" />
              +12.5%
            </span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Receita Total</h3>
          <p className="text-2xl font-bold text-white">{metrics.totalRevenue.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-900/20 rounded-lg">
              <TrendingUp className="text-blue-500" size={24} />
            </div>
            <span className="flex items-center text-green-500 text-sm font-medium bg-green-900/10 px-2 py-1 rounded">
              <ArrowUpRight size={16} className="mr-1" />
              +5.2%
            </span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Ticket Médio</h3>
          <p className="text-2xl font-bold text-white">{metrics.avgTicket.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-900/20 rounded-lg">
              <CreditCard className="text-purple-500" size={24} />
            </div>
            <span className="flex items-center text-red-500 text-sm font-medium bg-red-900/10 px-2 py-1 rounded">
              <ArrowDownRight size={16} className="mr-1" />
              -2.1%
            </span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Total Pedidos</h3>
          <p className="text-2xl font-bold text-white">{metrics.orderCount}</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-900/20 rounded-lg">
              <PieChart className="text-orange-500" size={24} />
            </div>
            <span className="text-slate-400 text-xs">Hoje</span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Turno Atual</h3>
          <p className="text-lg font-bold text-white">{activeShift ? 'Aberto' : 'Fechado'}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
          <h3 className="text-lg font-bold text-white mb-6">Evolução de Vendas</h3>
          <div className="h-[300px]">
            <Line options={{ maintainAspectRatio: false }} data={revenueData} />
          </div>
        </div>
        
        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
          <h3 className="text-lg font-bold text-white mb-6">Métodos de Pagamento</h3>
          <div className="h-[300px] flex justify-center">
            <Doughnut options={{ maintainAspectRatio: false }} data={paymentMethodsData} />
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Transações Recentes</h3>
          <button className="text-primary text-sm font-medium hover:underline">Ver todas</button>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">ID Pedido</th>
              <th className="px-6 py-3 font-medium">Data/Hora</th>
              <th className="px-6 py-3 font-medium">Mesa</th>
              <th className="px-6 py-3 font-medium">Total</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.slice(0, 5).map(order => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">#{order.id.slice(0, 8)}</td>
                <td className="px-6 py-4 text-slate-500">
                  {formatDateInLuanda(order.createdAt, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-6 py-4 text-slate-500">Mesa {order.tableId}</td>
                <td className="px-6 py-4 font-medium text-slate-800">
                  {formatKz(order.total)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'FECHADO' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
