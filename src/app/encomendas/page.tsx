'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { 
  MapPin, Clock, Bike, DollarSign, Package, 
  Plus, Search, Filter, ChevronRight, Star,
  TrendingUp, Calendar, AlertCircle, CheckCircle2,
  Move, MoreVertical
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { Order, Dish } from '@/types';
import { formatKz } from '@/services/utils/currencyFormatter';

type ViewMode = 'DASHBOARD' | 'NEW_ORDER' | 'ANALYTICS';

const Encomendas = () => {
  const { orders, dishes, activeOrders } = useStore();
  const [viewMode, setViewMode] = useState<ViewMode>('DASHBOARD');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Mock data for delivery specific metrics since we might not have all in store
  const deliveryStats = {
    activeDeliveries: 12,
    avgTime: '24m',
    totalRevenue: 154000,
    satisfaction: 4.8
  };

  const deliveryOrders = useMemo(() => {
    // Filter orders that are deliveries (assuming tableId 'DELIVERY' or similar logic, 
    // but for now using a mock filter or just all active orders for demo)
    return activeOrders.filter(o => o.status !== 'FECHADO');
  }, [activeOrders]);

  return (
    <div className="h-full bg-slate-950 text-white overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Bike size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Delivery System v2.0</span>
          </div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">Gestão de Encomendas</h1>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode('DASHBOARD')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              viewMode === 'DASHBOARD' ? 'bg-emerald-500 text-black shadow-glow' : 'hover:bg-white/5 text-slate-400'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setViewMode('NEW_ORDER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              viewMode === 'NEW_ORDER' ? 'bg-emerald-500 text-black shadow-glow' : 'hover:bg-white/5 text-slate-400'
            }`}
          >
            Nova Encomenda
          </button>
          <button 
            onClick={() => setViewMode('ANALYTICS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              viewMode === 'ANALYTICS' ? 'bg-emerald-500 text-black shadow-glow' : 'hover:bg-white/5 text-slate-400'
            }`}
          >
            Analytics
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'DASHBOARD' && <DeliveryDashboard stats={deliveryStats} orders={deliveryOrders} />}
        {viewMode === 'NEW_ORDER' && <NewOrderInterface dishes={dishes} />}
        {viewMode === 'ANALYTICS' && <DeliveryAnalytics />}
      </div>
    </div>
  );
};

// Sub-components

const DeliveryDashboard = ({ stats, orders }: { stats: any, orders: any[] }) => {
  return (
    <div className="h-full p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* KPIs */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard 
          icon={<Bike size={24} />} 
          label="Entregas Ativas" 
          value={stats.activeDeliveries} 
          trend="+2" 
          color="emerald"
        />
        <KPICard 
          icon={<Clock size={24} />} 
          label="Tempo Médio" 
          value={stats.avgTime} 
          trend="-2m" 
          color="blue"
        />
        <KPICard 
          icon={<DollarSign size={24} />} 
          label="Receita Delivery" 
          value={formatKz(stats.totalRevenue)} 
          trend="+15%" 
          color="amber"
        />
        <KPICard 
          icon={<Star size={24} />} 
          label="Satisfação" 
          value={stats.satisfaction} 
          trend="+0.2" 
          color="purple"
        />
      </div>

      {/* Active Deliveries List */}
      <div className="lg:col-span-1 bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex flex-col h-[600px]">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Package size={20} className="text-emerald-500" />
          Pedidos em Rota
        </h3>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {orders.length === 0 ? (
            <div className="text-center text-slate-500 mt-10">
              <p>Nenhuma entrega ativa</p>
            </div>
          ) : (
            orders.map((order, idx) => (
              <div key={order.id || idx} className="bg-slate-800/50 p-4 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-xs text-slate-400">#{order.id?.slice(0, 6)}</span>
                  <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                    <MapPin size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Cliente #{order.tableId}</p>
                    <p className="text-xs text-slate-400">2.4 km • 15 min</p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 border-t border-white/5 pt-3">
                  <span>{order.items?.length || 0} itens</span>
                  <span className="font-mono font-bold text-white">{formatKz(order.total || 0)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Map Placeholder (Simulated 3D Map) */}
      <div className="lg:col-span-2 bg-slate-900/80 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-8.83833,13.23444,13,0,60/800x600?access_token=pk.eyJ1IjoidGFzY2Fkb3ZlcmVkYSIsImEiOiJjbHR4eHh4eHh4eHh4In0.xxxx')] bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="bg-black/50 backdrop-blur-md p-4 rounded-xl border border-white/10">
              <h3 className="font-bold text-emerald-400 mb-1">Mapa de Frota (Tempo Real)</h3>
              <p className="text-xs text-slate-400">Luanda, Angola</p>
            </div>
            <div className="bg-black/50 backdrop-blur-md p-2 rounded-lg border border-white/10 flex gap-2">
              <button className="p-2 hover:bg-white/10 rounded-lg"><Plus size={16} /></button>
              <button className="p-2 hover:bg-white/10 rounded-lg"><Search size={16} /></button>
            </div>
          </div>

          {/* Animated Markers Simulation */}
          <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-emerald-500 rounded-full animate-ping" />
          <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-[0_0_20px_#10b981]" />
          
          <div className="absolute top-1/3 left-2/3 w-3 h-3 bg-blue-500 rounded-full animate-ping delay-700" />
          <div className="absolute top-1/3 left-2/3 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_20px_#3b82f6]" />

          <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 max-w-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Entregador em Movimento</span>
            </div>
            <p className="text-sm font-bold">João M. - Rota #128</p>
            <p className="text-xs text-slate-400">Destino: Talatona • Chegada em 5 min</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const NewOrderInterface = ({ dishes }: { dishes: Dish[] }) => {
  const [cart, setCart] = useState<Dish[]>([]);
  const [draggedDish, setDraggedDish] = useState<Dish | null>(null);

  const addToCart = (dish: Dish) => {
    setCart([...cart, dish]);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const total = cart.reduce((acc, item) => acc + (item.price || 0), 0);

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Menu Selection */}
      <div className="flex-1 p-6 overflow-y-auto bg-slate-900/30">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar pratos..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-800 rounded-xl border border-white/5 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          <button className="p-3 bg-slate-800 rounded-xl border border-white/5 hover:bg-slate-700">
            <Filter size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {dishes.map(dish => (
            <div 
              key={dish.id}
              draggable
              onDragStart={() => setDraggedDish(dish)}
              onClick={() => addToCart(dish)}
              className="bg-slate-800 p-4 rounded-xl border border-white/5 cursor-move hover:border-emerald-500/50 hover:shadow-lg transition-all group relative overflow-hidden"
            >
              <div className="aspect-square mb-3 rounded-lg bg-slate-700 overflow-hidden relative">
                {dish.imageUrl ? (
                   <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">Sem foto</div>
                )}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur p-1 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity">
                   <Move size={12} />
                </div>
              </div>
              <h4 className="font-bold text-sm truncate">{dish.name}</h4>
              <p className="text-emerald-400 font-mono text-xs mt-1">{formatKz(dish.price || 0)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Cart (Drop Zone) */}
      <div 
        className="w-full lg:w-96 bg-slate-950 border-l border-white/5 flex flex-col"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (draggedDish) {
            addToCart(draggedDish);
            setDraggedDish(null);
          }
        }}
      >
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-black uppercase italic tracking-tight">Nova Encomenda</h3>
          <p className="text-xs text-slate-400 mt-1">Arraste os itens aqui</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
              <Package size={48} className="mb-4 opacity-50" />
              <p className="text-sm font-bold">Carrinho Vazio</p>
              <p className="text-xs">Selecione itens do menu</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-white/5 animate-in slide-in-from-right-10 fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-slate-800 overflow-hidden">
                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold truncate w-32">{item.name}</p>
                    <p className="text-xs text-slate-400">{formatKz(item.price || 0)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => removeFromCart(idx)}
                  className="text-slate-500 hover:text-red-400 p-2"
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-900 border-t border-white/5 space-y-4">
          <div className="flex justify-between items-center text-slate-400 text-sm">
            <span>Subtotal</span>
            <span>{formatKz(total)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400 text-sm">
            <span>Taxa de Entrega</span>
            <span>{formatKz(2000)}</span>
          </div>
          <div className="flex justify-between items-center text-xl font-bold text-white pt-4 border-t border-white/10">
            <span>Total</span>
            <span className="text-emerald-400">{formatKz(total + 2000)}</span>
          </div>
          <button className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest rounded-xl shadow-glow transition-all flex items-center justify-center gap-2">
            Confirmar Pedido <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const DeliveryAnalytics = () => {
  const data = [
    { name: 'Seg', entregas: 40, tempo: 24 },
    { name: 'Ter', entregas: 30, tempo: 22 },
    { name: 'Qua', entregas: 45, tempo: 25 },
    { name: 'Qui', entregas: 50, tempo: 28 },
    { name: 'Sex', entregas: 65, tempo: 30 },
    { name: 'Sáb', entregas: 80, tempo: 35 },
    { name: 'Dom', entregas: 70, tempo: 32 },
  ];

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 h-80">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <TrendingUp className="text-emerald-500" />
            Volume de Entregas (Semanal)
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorEntregas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="entregas" stroke="#10b981" fillOpacity={1} fill="url(#colorEntregas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 h-80">
           <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <Clock className="text-blue-500" />
            Tempo Médio de Entrega (min)
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="tempo" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ icon, label, value, trend, color }: any) => {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[color]} backdrop-blur-md`}>
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-lg bg-black/20`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold bg-black/20 px-2 py-1 rounded-full">
          {trend}
        </span>
      </div>
      <p className="text-xs opacity-70 uppercase tracking-wider font-bold mb-1">{label}</p>
      <p className="text-2xl font-black font-mono">{value}</p>
    </div>
  );
};

export default Encomendas;