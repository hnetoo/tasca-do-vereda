'use client';


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Clock, CheckCircle, AlertCircle, Filter, Flame, ChefHat, Bell, CheckSquare, Volume2, VolumeX, Timer, Zap } from 'lucide-react';
import { OrderItem, Order } from '@/types';
import { formatDateInLuanda } from '@/utils/date';

type KitchenFilter = 'TODOS' | 'PENDENTE' | 'PREPARANDO' | 'PRONTO' | 'ENTREGUE';

interface FilterButtonProps {
  label: string;
  status: KitchenFilter;
  icon: React.ElementType;
  count: number;
  colorClass: string;
  activeFilter: KitchenFilter;
  setActiveFilter: (status: KitchenFilter) => void;
}

const FilterButton = ({ label, status, icon: Icon, count, colorClass, activeFilter, setActiveFilter }: FilterButtonProps) => (
  <button 
    onClick={() => setActiveFilter(status)}
    className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all relative
      ${activeFilter === status 
        ? `bg-gray-800 text-white border-${colorClass}-500 ring-1 ring-${colorClass}-500` 
        : 'bg-gray-800/40 text-gray-400 border-gray-700 hover:bg-gray-700'}
    `}
  >
    <Icon size={18} className={activeFilter === status ? `text-${colorClass}-500` : ''} />
    <span className="font-bold text-sm">{label}</span>
    {count > 0 && (
      <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${activeFilter === status ? 'bg-white/20' : 'bg-gray-700 text-gray-300'}`}>
        {count}
      </span>
    )}
  </button>
);

const Kitchen = () => {
  const { activeOrders, dishes: menu, settings, updateSettings } = useStore();
  const [activeFilter, setActiveFilter] = useState<KitchenFilter>('TODOS');
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isKDSOffline, setIsKDSOffline] = useState(false);

  // Refs to track previous state for sound triggers
  const prevOrdersRef = useRef(activeOrders);

  // Check KDS status from settings
  useEffect(() => {
    const kdsStatus = settings?.kdsEnabled ?? true;
    setTimeout(() => setIsKDSOffline(!kdsStatus), 0);
  }, [settings?.kdsEnabled]);

  // Toggle KDS status
  const toggleKDSStatus = async () => {
    const newStatus = !isKDSOffline;
    setIsKDSOffline(newStatus);
    
    // Save to settings/store
    if (updateSettings) {
      updateSettings({ kdsEnabled: !newStatus });
    }
  };

  // Update current time every second to drive the order timers
  useEffect(() => {
    const interval = setInterval(() => {
        setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper to get counts for badges
  const getStatusCount = (status: OrderItem['status']) => {
    return activeOrders
      .filter((o: Order) => o.status === 'ABERTO')
      .flatMap((o: Order) => o.items || [])
      .filter((i: OrderItem) => i.status === status).length;
  };

  const counts = {
    PENDENTE: getStatusCount('PENDENTE'),
    PREPARANDO: getStatusCount('PREPARANDO'),
    PRONTO: getStatusCount('PRONTO'),
    ENTREGUE: getStatusCount('ENTREGUE'),
  };

  // --- SOUND SYSTEM (Web Audio API) ---
  const playNotificationSound = useCallback((type: 'NEW_ORDER' | 'ORDER_READY') => {
    if (typeof window === 'undefined') return;
    if (isMuted) return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'NEW_ORDER') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(698.46, now + 0.4); // F5
        gain2.gain.setValueAtTime(0, now); 
        gain2.gain.linearRampToValueAtTime(0.1, now + 0.4);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        
        osc.start(now);
        osc.stop(now + 0.5);
        osc2.start(now + 0.4);
        osc2.stop(now + 1.5);

      } else if (type === 'ORDER_READY') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);       // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        
        osc.start(now);
        osc.stop(now + 0.8);
      }
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  }, [isMuted]);

  // --- EFFECT FOR DETECTING CHANGES ---
  useEffect(() => {
    const currentOpenOrders = activeOrders.filter((o: Order) => o.status === 'ABERTO');
    const prevOpenOrders = prevOrdersRef.current.filter((o: Order) => o.status === 'ABERTO');

    // 1. Check for NEW Orders
    const currentIds = currentOpenOrders.map((o: Order) => o.id).filter((id: string): id is string => !!id);
    const prevIds = prevOpenOrders.map((o: Order) => o.id).filter((id: string): id is string => !!id);
    const hasNewOrder = currentIds.some((id: string) => !prevIds.includes(id));

    if (hasNewOrder) {
      playNotificationSound('NEW_ORDER');
    } else {
      // 2. Check for items turning PRONTO
      const currentProntoCount = currentOpenOrders.flatMap((o: Order) => o.items || []).filter((i: OrderItem) => i.status === 'PRONTO').length;
      const prevProntoCount = prevOpenOrders.flatMap((o: Order) => o.items || []).filter((i: OrderItem) => i.status === 'PRONTO').length;

      if (currentProntoCount > prevProntoCount) {
        playNotificationSound('ORDER_READY');
      }
    }

    prevOrdersRef.current = activeOrders;
  }, [activeOrders, playNotificationSound]);


  // --- CORRECTED FILTER LOGIC ---
  const kitchenOrders = activeOrders.filter((o: Order) => {
    if (o.status !== 'ABERTO') return false;

    // If specific filter is selected, show orders that have AT LEAST one item in that status
    if (activeFilter !== 'TODOS') {
        return (o.items || []).some((i: OrderItem) => i.status === activeFilter);
    }

    // If 'TODOS' (Default View): Show orders that are NOT fully delivered yet (active work)
    // We hide orders where ALL items are 'ENTREGUE' to keep screen clean
    const allItemsDelivered = (o.items || []).every((i: OrderItem) => i.status === 'ENTREGUE');
    return !allItemsDelivered;
  });

  const getDishName = (id: string) => menu.find((d: any) => d.id === id)?.name || 'Desconhecido';

  const handleToggleItem = (orderId: string, itemIndex: number, currentStatus: string) => {
      let newStatus: OrderItem['status'] = 'PENDENTE';
      if (currentStatus === 'PENDENTE') newStatus = 'PREPARANDO';
      else if (currentStatus === 'PREPARANDO') newStatus = 'PRONTO';
      else if (currentStatus === 'PRONTO') newStatus = 'ENTREGUE';
      else if (currentStatus === 'ENTREGUE') newStatus = 'PENDENTE'; 

      console.log('Status update requested:', { orderId, itemIndex, newStatus });
  };

  const handleFinishOrder = (orderId: string) => {
    if(window.confirm('Confirmar saída de todos os pratos desta mesa?')) {
      console.log('Mark as served requested:', orderId);
    }
  };

  // --- TIMER HELPER ---
  const getOrderDuration = (timestamp: Date | string) => {
      const start = new Date(timestamp).getTime();
      const now = currentTime.getTime();
      const diff = Math.floor((now - start) / 1000); // seconds
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      return { minutes, seconds, totalSeconds: diff };
  };

  const getUrgencyColor = (minutes: number) => {
      if (minutes < 10) return 'border-green-500 shadow-green-900/20';
      if (minutes < 20) return 'border-yellow-500 shadow-yellow-900/20';
      return 'border-red-600 shadow-red-900/20';
  };

  const getTimerColor = (minutes: number) => {
    if (minutes < 10) return 'text-green-400';
    if (minutes < 20) return 'text-yellow-400';
    return 'text-red-500 animate-pulse';
  };

  return (
    <div className="p-6 bg-gray-900 h-full overflow-y-auto flex flex-col">
      {/* KDS Status Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleKDSStatus}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
            isKDSOffline 
              ? 'bg-red-600 border-red-500 text-white hover:bg-red-700' 
              : 'bg-green-600 border-green-500 text-white hover:bg-green-700'
          }`}
          title={isKDSOffline ? 'Ativar KDS' : 'Desativar KDS'}
        >
          <Zap size={16} />
          <span className="text-sm font-medium">
            KDS {isKDSOffline ? 'Offline' : 'Online'}
          </span>
        </button>
      </div>

      
      <header className="mb-6 flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className={`p-2 rounded-lg ${
              isKDSOffline 
                ? 'bg-red-600 text-white' 
                : 'bg-white/10 text-orange-500 animate-pulse'
            }`}>
              <Zap size={24} />
            </span>
            Monitor de Cozinha (KDS)
            </h2>
            <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                <Timer size={14} />
                Tempo Médio de Preparo: <span className="text-green-400 font-bold">12 min</span>
            </p>
        </div>
        
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-lg border transition-colors ${isMuted ? 'bg-red-900/30 border-red-800 text-red-400' : 'bg-gray-800 border-gray-700 text-green-400 hover:bg-gray-700'}`}
                title={isMuted ? "Ativar Som" : "Silenciar Notificações"}
            >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className="text-gray-400 font-mono text-xl bg-gray-800 px-4 py-2 rounded-lg border border-gray-700 shadow-inner">
                {formatDateInLuanda(currentTime, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
         <FilterButton label="Todos" status="TODOS" icon={Filter} count={kitchenOrders.length} colorClass="gray" activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
         <FilterButton label="Pendentes" status="PENDENTE" icon={Bell} count={counts.PENDENTE} colorClass="yellow" activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
         <FilterButton label="Preparando" status="PREPARANDO" icon={ChefHat} count={counts.PREPARANDO} colorClass="blue" activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
         <FilterButton label="Prontos" status="PRONTO" icon={Flame} count={counts.PRONTO} colorClass="green" activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
         <FilterButton label="Entregues" status="ENTREGUE" icon={CheckSquare} count={counts.ENTREGUE} colorClass="purple" activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-1 content-start">
        {kitchenOrders.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center h-[50vh] text-gray-600">
            <CheckCircle size={80} className="mb-6 opacity-20" />
            <p className="text-2xl font-light">
              {activeFilter === 'TODOS' ? 'Tudo limpo, Chefe!' : `Sem pedidos em "${activeFilter.toLowerCase()}"`}
            </p>
            <p className="text-sm mt-2 opacity-50">Aguardando novas comandas...</p>
          </div>
        ) : (
          kitchenOrders.map((order: Order) => {
            const { minutes, seconds } = getOrderDuration(order.createdAt ? new Date(order.createdAt) : new Date());
            const urgencyClass = getUrgencyColor(minutes);
            const timerColor = getTimerColor(minutes);

            return (
              <div key={order.id} className={`bg-gray-800 rounded-xl border-t-4 overflow-hidden shadow-lg flex flex-col animate-in fade-in duration-300 h-fit ${urgencyClass}`}>
                <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-white">Mesa {order.tableId}</h3>
                    <p className="text-xs text-gray-400 mt-1 font-mono opacity-70">#{(order.id || '').slice(-4)}</p>
                  </div>
                  <div className={`flex items-center gap-2 text-sm bg-gray-900 px-3 py-1.5 rounded-md border border-gray-700 ${timerColor}`}>
                    <Clock size={16} />
                    <span className="font-mono font-bold text-lg">
                      {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[400px]">
                  {(order.items || []).map((item: OrderItem, idx: number) => {
                    const isDone = item.status === 'ENTREGUE';
                    const dishId = item.dishId || (item as any).productId || (item as any).dish_id;
                    let statusColor = 'bg-gray-700 border-gray-600';
                    if (item.status === 'PENDENTE') statusColor = 'bg-yellow-900/20 border-yellow-700/50';
                    if (item.status === 'PREPARANDO') statusColor = 'bg-blue-900/20 border-blue-700/50';
                    if (item.status === 'PRONTO') statusColor = 'bg-green-900/20 border-green-700/50';
                    if (isDone) statusColor = 'bg-gray-800/50 border-gray-700 opacity-40';

                    return (
                      <div
                        key={`${dishId}-${idx}`} 
                        onClick={() => order.id && handleToggleItem(order.id, idx, item.status || 'PENDENTE')}
                        className={`flex items-center justify-between group cursor-pointer p-3 rounded-lg transition-all border select-none relative overflow-hidden
                          ${statusColor}
                          hover:brightness-110
                        `}
                      >
                        {activeFilter !== 'TODOS' && item.status === activeFilter && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white"></div>
                        )}

                        <div className="flex items-center gap-3 z-10">
                          <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-lg border
                            ${isDone ? 'bg-gray-800 text-gray-500 border-gray-700' : 'bg-orange-500 text-white border-orange-400'}
                          `}>
                            {item.quantity}
                          </div>
                          <div>
                            <p className={`font-medium transition-colors ${isDone ? 'text-gray-500 line-through' : 'text-gray-100'}`}>
                              {getDishName(dishId as string)}
                            </p>
                            {item.notes && (
                              <div className="flex items-center gap-1 text-xs text-red-300 mt-1 bg-red-900/30 px-1.5 py-0.5 rounded w-fit border border-red-900/50 animate-pulse">
                                <AlertCircle size={10} />
                                <span className="italic font-bold">{item.notes}</span>
                              </div>
                            )}
                            <p className="text-[10px] uppercase tracking-wider font-bold mt-1 opacity-70">
                              {item.status}
                            </p>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors z-10
                          ${isDone ? 'bg-green-500 border-green-500' : 'border-gray-500 bg-transparent'}
                          ${item.status === 'PRONTO' ? 'animate-pulse border-green-400' : ''}
                        `}>
                          {isDone && <CheckCircle size={16} className="text-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {activeFilter !== 'ENTREGUE' && (
                  <button 
                    onClick={() => order.id && handleFinishOrder(order.id)}
                    className="w-full py-4 bg-gray-700 hover:bg-green-600 text-white font-bold uppercase tracking-wider transition-colors text-sm flex items-center justify-center gap-2 border-t border-gray-600"
                  >
                    <CheckCircle size={18} />
                    Entregar Tudo
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Kitchen;

