'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { listen } from '@tauri-apps/api/event';
import { useStore } from '@/store/useStore';
import { ChefHat, ShoppingBasket, Sparkles, CheckCircle2 } from 'lucide-react';
import { CustomerDisplayEvent, Order, Dish, Table, OrderItem } from '@/types';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

const CustomerDisplayContent = () => {
  const searchParams = useSearchParams();
  const tableId = searchParams.get('tableId');
  const { activeOrders, dishes: menu, settings, tables, addNotification, currentUser } = useStore();
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});
  const [logoError, setLogoError] = useState(false);
  const [promoIndex, setPromoIndex] = useState(0);

  // Derived state for promos (assuming menu items can be promos, or just showing all items)
  // Filtering for items with images as "promos" to display
  const promoItems = menu.filter((item: Dish) => item.image_url && item.is_active);
  const currentPromo = promoItems[promoIndex] || {};

  // Rotate promos
  useEffect(() => {
    if (promoItems.length <= 1) return;
    const interval = setInterval(() => {
      setPromoIndex(prev => (prev + 1) % promoItems.length);
    }, 10000); // 10 seconds per slide
    return () => clearInterval(interval);
  }, [promoItems.length]);

  const handleOrderRealtimeUpdate = useCallback((payload: any) => {
    if (payload.eventType === 'UPDATE' && payload.new && payload.new.tableId === Number(tableId)) {
      const updatedOrder = payload.new as Order;
      addNotification('info', `O estado do seu pedido foi atualizado para: ${updatedOrder.status}`);
    }
  }, [tableId, addNotification]);

  // Realtime sync for orders
  useRealtimeSync(
    'orders',
    handleOrderRealtimeUpdate,
    (tableId && currentUser?.id) ? { column: 'userId', value: currentUser.id } : undefined
  );

  const renderLogo = (className: string, size: number) => (
    <div className={`${className} bg-gradient-to-br from-primary to-blue-600 rounded-3xl flex items-center justify-center shadow-glow border border-white/10 shrink-0`}>
        {settings.logo && !logoError ? (
            <img 
                src={settings.logo} 
                alt="Logo" 
                className="w-full h-full object-contain p-2"
                onError={() => setLogoError(true)}
            />
        ) : (
            <ChefHat size={size} className="text-white" />
        )}
    </div>
  );

  const table = tables.find((t: Table) => t.id === tableId);
  const tableOrders = activeOrders.filter((o: Order) => o.tableId === tableId && o.status === 'ABERTO');
  
  const formatKz = (val: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(val);

  const allItems = tableOrders.flatMap((o: Order) => o.items);
  const total = tableOrders.reduce((acc: number, o: Order) => acc + (o.total ?? 0), 0);

  if (allItems.length === 0) {
    return (
      <div className="h-screen w-full bg-background overflow-hidden flex flex-col items-center justify-center font-sans p-10 text-slate-200 relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center animate-in fade-in zoom-in duration-1000">
          {renderLogo("w-48 h-48 mb-12", 100)}
          <h1 className="text-8xl font-black text-white italic uppercase tracking-tighter mb-8 text-glow">
            {settings.restaurantName}
          </h1>
          <p className="text-3xl font-bold text-primary uppercase tracking-[0.5em] mb-16 opacity-80">
            Bem-vindo
          </p>
          
          <div className="flex gap-6 opacity-60">
             <div className="px-8 py-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <span className="text-xs font-black uppercase tracking-widest text-slate-300">Pratos Tradicionais</span>
             </div>
             <div className="px-8 py-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <span className="text-xs font-black uppercase tracking-widest text-slate-300">Ingredientes Frescos</span>
             </div>
             <div className="px-8 py-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <span className="text-xs font-black uppercase tracking-widest text-slate-300">Ambiente Único</span>
             </div>
          </div>
        </div>

        <div className="absolute bottom-12 text-slate-600 text-xs font-bold uppercase tracking-[0.2em] animate-pulse">
           Aguarde pelo seu pedido...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background overflow-hidden flex flex-col font-sans p-10 text-slate-200">
      <div className="flex justify-between items-center mb-10 shrink-0 gap-8">
        <div className="flex items-center gap-6 min-w-0 flex-1">
          {renderLogo("w-20 h-20", 40)}
          <div className="min-w-0">
            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none break-words">
              {settings.restaurantName}
            </h1>
            <p className="text-slate-500 text-lg font-bold uppercase tracking-[0.4em] mt-2 opacity-60">Bem-vindo • {table?.name || 'Mesa'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-4 bg-primary/10 border border-primary/20 rounded-3xl text-primary animate-pulse shrink-0">
           <Sparkles size={24} />
           <span className="text-sm font-black uppercase tracking-widest">Aprecie o Sabor Angolano</span>
        </div>
      </div>

      <div className="flex-1 flex gap-10 overflow-hidden">
        {/* Left Side: Order List */}
        <div className="flex-1 glass-panel rounded-[4rem] border border-white/5 flex flex-col overflow-hidden shadow-2xl">
          <div className="p-10 border-b border-white/5 flex items-center justify-between shrink-0">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
              <ShoppingBasket className="text-primary" /> Seu Pedido
            </h2>
            <span className="bg-white/5 px-4 py-1 rounded-full text-xs font-bold text-slate-500">{allItems.length} Itens</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {allItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                <ChefHat size={120} className="mb-8" />
                <p className="text-4xl font-black uppercase tracking-widest italic">Prepare-se para o melhor!</p>
              </div>
            ) : (
              (allItems.filter(Boolean) as OrderItem[]).map((item: OrderItem, idx: number) => {
                const dish = menu.find((d: Dish) => d.id === (item.dishId || item.dish_id));
                const quantity = item.quantity || 0;
                const unitPrice = item.unitPrice || 0;
                return (
                  <div key={idx} className="flex items-center justify-between group animate-in slide-in-from-right duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/5 group-hover:border-primary/30 transition-all shrink-0">
                          <img src={dish?.image_url || undefined} className="w-full h-full object-cover" alt="" />
                       </div>
                       <div className="min-w-0">
                          <p className="text-lg font-black text-white uppercase tracking-tighter italic truncate pr-4">{dish?.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="px-2 py-0.5 bg-primary text-black text-[10px] font-black rounded-md">{quantity}x</span>
                             <span className="text-slate-500 font-mono text-xs">{formatKz(unitPrice)}</span>
                          </div>
                       </div>
                    </div>
                    <p className="text-2xl font-mono font-bold text-white group-hover:text-primary transition-colors whitespace-nowrap">{formatKz(unitPrice * quantity)}</p>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="p-12 bg-black/40 border-t border-white/5 shrink-0 flex justify-between items-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30 animate-pulse"></div>
             <div>
                <p className="text-slate-500 font-black uppercase tracking-[0.4em] mb-2 text-sm">Total à Liquidar</p>
                <p className="text-7xl font-mono font-bold text-primary text-glow leading-none">{formatKz(total)}</p>
             </div>
             <div className="flex flex-col items-end gap-2 text-right">
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle2 size={24} />
                  <span className="text-sm font-black uppercase tracking-widest">Pedido Seguro</span>
                </div>
                <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed">Faturas processadas de acordo com as normas da AGT.</p>
             </div>
          </div>
        </div>

        {/* Right Side: Visuals/Ads */}
        <div className="w-1/3 flex flex-col gap-10">
           <div className="flex-1 glass-panel rounded-[4rem] overflow-hidden relative group bg-slate-900 flex items-center justify-center">
              {currentPromo.image_url && !imageErrorMap[currentPromo.id as string] ? (
                <img 
                  key={currentPromo.image_url}
                  src={currentPromo.image_url} 
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-[10s] animate-in fade-in duration-1000 absolute inset-0" 
                  alt="Ad"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    if (currentPromo.id) {
                      setImageErrorMap(prev => ({ ...prev, [currentPromo.id as string]: true }));
                    }
                  }} 
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                   <ChefHat size={200} className="text-white" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
              <div className="absolute bottom-10 left-10 right-10">
                 <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">
                   Experimente {promoItems.length > 0 ? 'o nosso' : 'a nossa famosa'} <span className="text-primary">{currentPromo.name}</span>
                 </h3>
                 <p className="text-slate-300 text-sm leading-relaxed">
                   {currentPromo.description || `Sabores autênticos e ingredientes selecionados especialmente para si.`}
                 </p>
                 {promoItems.length > 0 && (
                    <p className="mt-4 text-xl font-mono font-bold text-primary">{formatKz(currentPromo.price || 0)}</p>
                 )}
              </div>
           </div>
           <div className="p-10 bg-primary rounded-[3rem] text-black shadow-glow flex flex-col justify-center items-center text-center animate-bounce">
              <Sparkles size={48} className="mb-4" />
              <p className="text-xl font-black uppercase tracking-tighter leading-none">MOMENTOS ESPECIAIS<br/>SABORES ÚNICOS</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default function CustomerDisplay() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-background flex items-center justify-center text-white">Carregando...</div>}>
      <CustomerDisplayContent />
    </Suspense>
  );
}
