import React, { useMemo, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  ShoppingBag, Filter, Download, FileSpreadsheet, AlertCircle, CheckCircle, 
  Clock, User, Calendar, MessageCircle, Truck, Phone, MapPin, 
  Zap, Navigation, BarChart3, Plus, Search, Sparkles, X, ChevronRight,
  TrendingUp, Users, DollarSign, BrainCircuit, Rocket, LayoutGrid, List,
  Smartphone, Sun, Moon, Scan, Move, Trash2, Edit
} from 'lucide-react';
import { jsPDF } from 'jspdf';
// import * as XLSX from 'xlsx';
import { hasPermission } from '../services/permissionsService';
import { Delivery, OrderItem, Dish, Customer, Order } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// --- Mock AI Services ---
const AIService = {
  predictDeliveryTime: (distance: number) => Math.round(15 + distance * 3), // minutes
  optimizeRoute: (deliveries: Delivery[]) => {
    // Mock optimization: sort by "distance" (random)
    return [...deliveries].sort(() => Math.random() - 0.5);
  },
  suggestDishes: (history: unknown[], menu: Dish[]) => {
    // Mock suggestions: return 3 random dishes
    return [...menu].sort(() => Math.random() - 0.5).slice(0, 3);
  }
};

const Encomendas = () => {
  const { 
    currentUser, settings, activeOrders, deliveries, addNotification, 
    updateOrderItemStatus, assignDelivery, updateDelivery, addDelivery, 
    customers, menu, createNewOrder, addToOrder, fireOrderToKitchen,
    removeOrder, closeOrder, assignCustomerToOrder
  } = useStore();

  const [viewMode, setViewMode] = useState<'DASHBOARD' | 'LIST' | 'MAP' | 'ANALYTICS'>('DASHBOARD');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Dish[]>([]);
  
  // "Steve Jobs" Minimalist State & New Features
  const [isZenMode, setIsZenMode] = useState(false);
  const [isOneHandMode, setIsOneHandMode] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showAR, setShowAR] = useState(false);
  const [draggedDish, setDraggedDish] = useState<Dish | null>(null);
  const [newOrderItems, setNewOrderItems] = useState<{dish: Dish, qty: number}[]>([]);

  // Auto-Theme based on time
  useEffect(() => {
    const hour = new Date().getHours();
    setTheme(hour >= 18 || hour < 7 ? 'dark' : 'light');
  }, []);

  // --- Computed Data ---
  const activeDeliveries = useMemo(() => deliveries.filter(d => ['PENDENTE', 'EM_ROTA'].includes(d.status)), [deliveries]);
  
  const stats = useMemo(() => ({
    totalOrders: activeOrders.length,
    revenue: activeOrders.reduce((acc, o) => acc + o.total, 0),
    activeDrivers: new Set(activeDeliveries.map(d => d.driverName)).size,
    avgTime: 28 // Mock average time
  }), [activeOrders, activeDeliveries]);

// --- Sub-Components ---

interface DeliveryMap3DProps {
  theme: 'dark' | 'light';
  activeDeliveries: Delivery[];
}

const DeliveryMap3D = ({ theme, activeDeliveries }: DeliveryMap3DProps) => {
  const [showAR, setShowAR] = useState(false);
  return (
    <div className={`relative w-full h-[500px] rounded-3xl overflow-hidden border shadow-2xl group perspective-1000 transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
      {/* Map Background (Cyberpunk Grid or Clean Light) */}
      <div className={`absolute inset-0 bg-[size:40px_40px] transform rotate-x-60 scale-150 origin-bottom transition-transform duration-1000 group-hover:rotate-x-45 ${
        theme === 'dark' 
          ? 'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]' 
          : 'bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)]'
      }`} />
      
      {/* Central Hub (Restaurant) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <div className="w-4 h-4 bg-primary rounded-full animate-ping absolute inset-0 opacity-75" />
          <div className="w-4 h-4 bg-primary rounded-full relative z-10 shadow-[0_0_20px_rgba(var(--primary),0.8)]" />
          <div className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap border ${theme === 'dark' ? 'bg-slate-800/90 text-primary border-primary/20' : 'bg-white/90 text-primary border-primary/20 shadow-sm'}`}>
            HQ Central
          </div>
        </div>
      </div>

      {/* Active Deliveries (Animated Dots) */}
      {activeDeliveries.map((d, i) => {
        // Random positions for demo
        const top = 20 + (i * 15) % 60;
        const left = 20 + (i * 23) % 60;
        return (
          <div key={d.id} className="absolute transition-all duration-1000 ease-in-out" style={{ top: `${top}%`, left: `${left}%` }}>
            <div className="relative group/marker">
              <Truck size={20} className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-bounce" />
              <div className={`absolute -top-10 left-1/2 -translate-x-1/2 p-2 rounded-xl text-[10px] whitespace-nowrap border opacity-0 group-hover/marker:opacity-100 transition-opacity z-20 pointer-events-none ${
                theme === 'dark' ? 'bg-slate-800/90 text-white border-white/10' : 'bg-white/90 text-slate-800 border-slate-200 shadow-lg'
              }`}>
                <div className="font-bold text-blue-500">{d.driverName}</div>
                <div>{d.status} • {AIService.predictDeliveryTime(5)} min</div>
              </div>
            </div>
          </div>
        );
      })}

      {/* UI Overlays */}
      <div className="absolute bottom-6 right-6 flex gap-2">
        <button onClick={() => setShowAR(true)} className={`p-2 backdrop-blur rounded-lg border hover:scale-105 transition-all ${theme === 'dark' ? 'bg-slate-800/80 border-white/10 text-white hover:bg-white/10' : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-50'}`} title="AR View">
            <Scan size={16}/>
        </button>
        <button className={`p-2 backdrop-blur rounded-lg border hover:scale-105 transition-all ${theme === 'dark' ? 'bg-slate-800/80 border-white/10 text-white hover:bg-white/10' : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-50'}`}><Navigation size={16}/></button>
      </div>
      {showAR && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">
          AR Mode Active (Simulated)
          <button onClick={() => setShowAR(false)} className="absolute top-4 right-4"><X /></button>
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  color: string;
  theme: 'dark' | 'light';
}

const StatCard = ({ title, value, sub, icon: Icon, color, theme }: StatCardProps) => (
  <div className={`p-6 rounded-3xl border relative overflow-hidden group hover:scale-[1.02] transition-all ${
      theme === 'dark' ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-100 shadow-sm'
  }`}>
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
      <Icon size={64} />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-lg bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
          <Icon size={18} className={color} />
        </div>
        <span className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{title}</span>
      </div>
      <div className={`text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1 font-medium">{sub}</div>
    </div>
  </div>
);

  const handleEditOrder = (order: Order) => {
      addNotification('info', 'Funcionalidade de edição indisponível nesta versão.');
  };

  const NewOrderModal = () => {
    if (!showNewOrder) return null;

    const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cust = customers.find(c => c.id === e.target.value);
        setSelectedCustomer(cust || null);
        if (cust) {
            setAiSuggestions(AIService.suggestDishes([], menu));
        }
    };

    const handleDragStart = (e: React.DragEvent, dish: Dish) => {
        setDraggedDish(dish);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (draggedDish) {
            setNewOrderItems(prev => {
                const existing = prev.find(i => i.dish.id === draggedDish.id);
                if (existing) {
                    return prev.map(i => i.dish.id === draggedDish.id ? {...i, qty: i.qty + 1} : i);
                }
                return [...prev, { dish: draggedDish, qty: 1 }];
            });
            setDraggedDish(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleConfirm = () => {
        if (!selectedCustomer || newOrderItems.length === 0) {
            addNotification('error', 'Selecione um cliente e adicione itens.');
            return;
        }
        
        const orderId = createNewOrder(0, `Entrega - ${selectedCustomer.name}`);
        
        newOrderItems.forEach(item => {
            addToOrder(0, item.dish, item.qty, '', orderId);
        });

        assignCustomerToOrder(orderId, selectedCustomer.id);
        
        addDelivery({
            id: `del-${Date.now()}`,
            orderId,
            driverName: 'Pendente',
            status: 'PENDENTE',
            address: selectedCustomer.nif || 'Morada não definida',
            customerName: selectedCustomer.name,
            customerPhone: selectedCustomer.phone,
            startTime: new Date()
        });

        setShowNewOrder(false);
        setNewOrderItems([]);
        setSelectedCustomer(null);
        addNotification('success', 'Encomenda criada com sucesso!');
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className={`w-full max-w-6xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl transition-colors ${
            theme === 'dark' ? 'bg-slate-900 border border-white/10' : 'bg-white border border-slate-200'
        }`}>
          {/* Header */}
          <div className={`p-6 border-b flex justify-between items-center ${theme === 'dark' ? 'bg-slate-800/50 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl text-primary"><Sparkles size={20} /></div>
                <div>
                    <h2 className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Nova Encomenda Inteligente</h2>
                    <p className="text-xs text-slate-400">Powered by Neural Engine v2.0</p>
                </div>
            </div>
            <button onClick={() => setShowNewOrder(false)} className="p-2 hover:bg-black/5 rounded-full text-slate-400 hover:text-primary"><X size={20}/></button>
          </div>
          
          <div className="flex-1 overflow-hidden flex">
            {/* Left: Drop Zone & Context */}
            <div 
                className={`w-1/3 p-6 border-r overflow-y-auto space-y-6 transition-colors ${
                    theme === 'dark' ? 'border-white/5 bg-slate-900' : 'border-slate-100 bg-white'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                {/* Customer Select */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Cliente</label>
                    <select onChange={handleCustomerSelect} className={`w-full rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none border ${
                        theme === 'dark' ? 'bg-black/20 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}>
                        <option value="">Selecionar Cliente...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                {/* Drop Zone / Current Items */}
                <div className={`min-h-[200px] rounded-2xl border-2 border-dashed p-4 transition-all ${
                    newOrderItems.length > 0 
                        ? (theme === 'dark' ? 'border-primary/30 bg-primary/5' : 'border-primary/30 bg-primary/5')
                        : (theme === 'dark' ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300')
                }`}>
                    {newOrderItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-50">
                            <Move size={32} />
                            <p className="text-sm font-medium text-center">Arraste pratos para aqui</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
                                <span>Itens Selecionados</span>
                                <span>{newOrderItems.reduce((acc, i) => acc + i.qty, 0)} itens</span>
                            </div>
                            {newOrderItems.map((item, idx) => (
                                <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                                    <img src={item.dish.image} className="w-10 h-10 rounded-lg object-cover bg-slate-200" />
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-bold text-sm truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.dish.name}</div>
                                        <div className="text-primary text-xs font-mono">{item.dish.price} Kz</div>
                                    </div>
                                    <div className={`px-2 py-1 rounded-lg text-xs font-bold ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                                        x{item.qty}
                                    </div>
                                </div>
                            ))}
                            
                            <div className="pt-4 mt-4 border-t border-dashed border-slate-500/20 flex justify-between items-end">
                                <div>
                                    <div className="text-xs text-slate-400">Total Estimado</div>
                                    <div className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                        {newOrderItems.reduce((acc, i) => acc + (i.dish.price * i.qty), 0).toFixed(2)} Kz
                                    </div>
                                </div>
                                <button onClick={handleConfirm} className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all">
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* AI Suggestions */}
                {selectedCustomer && (
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 space-y-3 animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase">
                            <BrainCircuit size={14} /> Sugestões da IA
                        </div>
                        <div className="space-y-2">
                            {aiSuggestions.map(dish => (
                                <div 
                                    key={dish.id} 
                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer group transition-colors ${
                                        theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-slate-50 border border-transparent hover:border-slate-200'
                                    }`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, dish)}
                                    onClick={() => {
                                        setNewOrderItems(prev => [...prev, {dish, qty: 1}]);
                                    }}
                                >
                                    <span className={`text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{dish.name}</span>
                                    <Plus size={14} className="text-slate-500 group-hover:text-primary" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Product Grid (Source) */}
            <div className={`flex-1 p-6 overflow-y-auto ${theme === 'dark' ? 'bg-slate-950/30' : 'bg-slate-50/50'}`}>
                <div className="grid grid-cols-3 gap-4">
                    {menu.map(dish => (
                        <div 
                            key={dish.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, dish)}
                            className={`border rounded-xl p-3 transition-all cursor-move active:cursor-grabbing group hover:-translate-y-1 hover:shadow-lg ${
                                theme === 'dark' 
                                    ? 'bg-white/5 border-white/5 hover:border-primary/30' 
                                    : 'bg-white border-slate-200 hover:border-primary/50'
                            }`}
                        >
                            <div className="w-full aspect-video bg-black/5 rounded-lg mb-2 overflow-hidden relative">
                                {dish.image ? (
                                    <img src={dish.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400"><ShoppingBag size={20}/></div>
                                )}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-black/50 backdrop-blur text-white p-1 rounded-md">
                                        <Move size={12} />
                                    </div>
                                </div>
                            </div>
                            <div className={`font-bold text-sm truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{dish.name}</div>
                            <div className="text-primary text-xs font-mono">{dish.price} Kz</div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AROverlay = () => {
    if (!showAR) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg aspect-[9/16] bg-slate-800 rounded-3xl overflow-hidden border-4 border-slate-700 shadow-2xl">
                {/* Camera Feed Simulation */}
                <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                
                {/* AR Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-primary/50 rounded-full animate-ping" />
                <div className="absolute top-1/4 left-1/4 bg-white/10 backdrop-blur border border-white/20 p-2 rounded-lg text-white text-xs animate-bounce">
                    <div className="font-bold">Entrega #123</div>
                    <div>150m • A chegar</div>
                </div>
                
                {/* Close Button */}
                <button onClick={() => setShowAR(false)} className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded-full font-bold shadow-lg active:scale-95 transition-transform">
                    Fechar AR
                </button>
            </div>
        </div>
    );
  };

  // --- Main Render ---
  return (
    <div className={`h-full flex flex-col transition-all duration-500 relative overflow-hidden ${
        isZenMode ? 'p-0' : 'p-6'
    } ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
      
      <NewOrderModal />
      <AROverlay />

      {/* Header - Adaptive for One-Hand Mode */}
      {!isZenMode && (
        <header className={`flex items-center justify-between mb-8 animate-in slide-in-from-top-4 duration-500 ${
            isOneHandMode ? 'fixed bottom-0 left-0 right-0 z-40 p-6 bg-gradient-to-t from-black/80 to-transparent flex-row-reverse' : ''
        }`}>
            {!isOneHandMode && (
                <div>
                    <h1 className={`text-3xl font-black italic tracking-tighter flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        <Rocket className="text-primary" /> GESTÃO DE ENTREGAS
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Dashboard de controlo logístico em tempo real</p>
                </div>
            )}
            
            <div className={`flex items-center gap-3 ${isOneHandMode ? 'w-full justify-between' : ''}`}>
                <div className="flex gap-2 bg-slate-900/10 p-1 rounded-xl backdrop-blur-sm border border-white/5">
                    <button onClick={() => setViewMode('DASHBOARD')} className={`p-3 rounded-xl transition-all ${viewMode === 'DASHBOARD' ? 'bg-primary text-black' : 'hover:bg-black/5 text-slate-400'}`}><LayoutGrid size={20}/></button>
                    <button onClick={() => setViewMode('MAP')} className={`p-3 rounded-xl transition-all ${viewMode === 'MAP' ? 'bg-primary text-black' : 'hover:bg-black/5 text-slate-400'}`}><MapPin size={20}/></button>
                    <button onClick={() => setViewMode('ANALYTICS')} className={`p-3 rounded-xl transition-all ${viewMode === 'ANALYTICS' ? 'bg-primary text-black' : 'hover:bg-black/5 text-slate-400'}`}><BarChart3 size={20}/></button>
                </div>

                <div className="w-px h-8 bg-white/10 mx-2" />
                
                {/* Quick Toggles */}
                <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="p-3 rounded-xl hover:bg-white/10 transition-all text-slate-400">
                    {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
                </button>
                <button onClick={() => setIsOneHandMode(m => !m)} className={`p-3 rounded-xl transition-all ${isOneHandMode ? 'bg-primary text-black' : 'text-slate-400 hover:bg-white/10'}`} title="Modo Uma Mão">
                    <Smartphone size={20}/>
                </button>

                <button onClick={() => setShowNewOrder(true)} className="px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center gap-2 transform hover:-translate-y-1 active:translate-y-0">
                    <Plus size={18} strokeWidth={3} /> {isOneHandMode ? '' : 'Nova Encomenda'}
                </button>
            </div>
        </header>
      )}

      {/* Content Area */}
      <div className={`flex-1 min-h-0 overflow-hidden ${isOneHandMode ? 'pb-24' : ''}`}>
        {viewMode === 'DASHBOARD' && (
            <div className="h-full overflow-y-auto pr-2 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                    <StatCard title="Entregas Ativas" value={stats.activeDrivers} sub="+24% vs ontem" icon={Truck} color="text-blue-500" theme={theme} />
                    <StatCard title="Receita Hoje" value={`${stats.revenue.toLocaleString()} Kz`} sub="Meta: 85%" icon={DollarSign} color="text-green-500" theme={theme} />
                    <StatCard title="Tempo Médio" value={`${stats.avgTime} min`} sub="-2 min recorde" icon={Clock} color="text-purple-500" theme={theme} />
                    <StatCard title="Total Pedidos" value={stats.totalOrders} sub="4 Pendentes" icon={ShoppingBag} color="text-orange-500" theme={theme} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
                    {/* Map Section */}
                    <div className="lg:col-span-2 animate-in fade-in scale-95 duration-500 delay-200">
                        <DeliveryMap3D theme={theme} activeDeliveries={activeDeliveries} />
                    </div>

                    {/* Active Orders List */}
                    <div className={`rounded-3xl border p-6 flex flex-col animate-in slide-in-from-right-8 duration-500 delay-300 ${
                        theme === 'dark' ? 'bg-slate-900/50 border-white/5 backdrop-blur-sm' : 'bg-white border-slate-100 shadow-sm'
                    }`}>
                        <h3 className={`text-lg font-bold mb-4 flex items-center justify-between ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            <span>Em Progresso</span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => addNotification('info', 'Rotas otimizadas com sucesso!')}
                                    className="text-xs flex items-center gap-1 bg-purple-500/10 text-purple-500 px-2 py-1 rounded-lg hover:bg-purple-500/20 transition-colors"
                                    title="Otimizar Rotas com IA"
                                >
                                    <Sparkles size={12} /> Otimizar
                                </button>
                                <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-lg animate-pulse">Ao Vivo</span>
                            </div>
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {activeOrders.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                                    <ShoppingBag size={48} className="mb-4" />
                                    <p>Sem encomendas ativas</p>
                                </div>
                            ) : (
                                activeOrders.map(order => (
                                    <div key={order.id} className={`group relative border rounded-2xl p-4 hover:border-primary/50 transition-all ${
                                        theme === 'dark' ? 'bg-slate-800/50 border-white/5' : 'bg-slate-50 border-slate-200'
                                    }`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-white/5 font-bold text-white text-xs">
                                                    {order.id.slice(0, 2)}
                                                </div>
                                                <div>
                                                    <h3 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{customers.find(c => c.id === order.customerId)?.name || 'Cliente'}</h3>
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                        <Clock size={10} /> {new Date(order.timestamp).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-blue-500/10 text-blue-500">
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-dashed border-white/10">
                                            <div className="text-primary font-black text-sm">{order.total.toFixed(2)} Kz</div>
                                            <div className="flex gap-2">
                                                <button onClick={() => closeOrder(order.id)} title="Fechar Encomenda" className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20"><CheckCircle size={16} /></button>
                                                <button onClick={() => removeOrder(order.id)} title="Apagar" className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"><Trash2 size={16} /></button>
                                                <button onClick={() => handleEditOrder(order)} title="Alterar" className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"><Edit size={16} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {viewMode === 'MAP' && (
             <div className={`h-full flex items-center justify-center rounded-3xl border relative overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/13.23, -8.83, 12, 0, 0/1000x1000?access_token=pk.mock')] bg-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-1000" />
                <div className="text-center z-10 p-8 bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10">
                    <MapPin size={64} className="text-primary mx-auto mb-4 animate-bounce" />
                    <h2 className="text-2xl font-bold text-white">Visualização de Satélite</h2>
                    <p className="text-slate-400">Integração com API de Mapas necessária para visualização real.</p>
                </div>
             </div>
        )}

        {viewMode === 'ANALYTICS' && (
            <div className="h-full grid grid-cols-2 gap-6 overflow-y-auto">
                <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-200'}`}>
                    <h3 className={`font-bold mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}><TrendingUp size={18} className="text-primary"/> Performance de Vendas</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[{n:'Seg',v:4000},{n:'Ter',v:3000},{n:'Qua',v:2000},{n:'Qui',v:2780},{n:'Sex',v:1890},{n:'Sab',v:2390},{n:'Dom',v:3490}]}>
                                <defs>
                                    <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#ffffff10' : '#00000010'} />
                                <XAxis dataKey="n" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <RechartsTooltip contentStyle={{backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0', color: theme === 'dark' ? '#fff' : '#0f172a'}} />
                                <Area type="monotone" dataKey="v" stroke="#10b981" fillOpacity={1} fill="url(#colorV)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-200'}`}>
                     <h3 className={`font-bold mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}><Users size={18} className="text-blue-400"/> Retenção de Clientes</h3>
                     <div className="h-[300px] flex items-center justify-center text-slate-500">
                        (Gráfico de Retenção - Em Breve)
                     </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Encomendas;