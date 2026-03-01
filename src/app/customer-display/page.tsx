'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { listen } from '@tauri-apps/api/event';
import { useStore } from '@/store/useStore';
import { ChefHat, ShoppingBasket, Sparkles, CheckCircle2, CreditCard, Receipt, Clock, ArrowRight } from 'lucide-react';
import { CustomerDisplayEvent, Order, Dish, Table, OrderItem } from '@/types';

const CustomerDisplayContent = () => {
  const searchParams = useSearchParams();
  const tableId = searchParams.get('tableId');
  const { activeOrders, dishes: menu, settings, tables, addNotification } = useStore();
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});
  const [logoError, setLogoError] = useState(false);
  const [promoIndex, setPromoIndex] = useState(0);
  const [isPaymentMode, setIsPaymentMode] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Derived state for promos (assuming menu items can be promos, or just showing all items)
  // Filtering for items with images as "promos" to display
  const promoItems = menu.filter((item: Dish) => item.imageUrl && item.isActive);
  const currentPromo = promoItems[promoIndex] || {};

  // Rotate promos
  useEffect(() => {
    if (promoItems.length <= 1) return;
    const interval = setInterval(() => {
      setPromoIndex(prev => (prev + 1) % promoItems.length);
    }, 10000); // 10 seconds per slide
    return () => clearInterval(interval);
  }, [promoItems.length]);

  // Listen for payment events
  useEffect(() => {
    const unlisten = listen<CustomerDisplayEvent>('customer-display-event', (event) => {
      const { type, data } = event.payload;
      
      if (type === 'PAYMENT_STARTED') {
        setIsPaymentMode(true);
        setPaymentOrderId(data.orderId);
        // Request fullscreen on second monitor
        requestFullscreen();
      } else if (type === 'PAYMENT_COMPLETED') {
        setIsPaymentMode(false);
        setPaymentOrderId(null);
        // Exit fullscreen
        exitFullscreen();
      } else if (type === 'SHOW_ORDER') {
        setIsPaymentMode(false);
        setPaymentOrderId(null);
      }
    });

    return () => {
      unlisten.then(fn => fn()).catch(console.error);
    };
  }, []);

  // Fullscreen functions
  const requestFullscreen = useCallback(() => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  }, []);

  const renderLogo = (className: string, size: number) => (
    <div className={`${className} bg-gradient-to-br from-primary to-blue-600 rounded-3xl flex items-center justify-center shadow-glow border border-white/10 shrink-0`}>
        {settings.logo && !logoError ? (
            <Image 
                src={settings.logo} 
                alt="Logo" 
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'contain', padding: '0.5rem' }}
                onError={() => setLogoError(true)}
            />
        ) : (
            <ChefHat size={size} className="text-white" />
        )}
    </div>
  );

  const table = tables.find((t: Table) => t.id === tableId);
  const tableOrders = activeOrders.filter((o: Order) => o.tableId === tableId && o.status === 'ABERTO');
  
  const formatKz = (val: number) => val.toLocaleString('pt-AO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' AKZ';

  // Get payment order items
  const paymentOrder = paymentOrderId ? activeOrders.find(o => o.id === paymentOrderId) : null;
  const paymentItems = paymentOrder?.items || [];
  const paymentTotal = paymentOrder?.total || 0;

  const allItems = tableOrders.flatMap((o: Order) => o.items);
  const total = tableOrders.reduce((acc: number, o: Order) => acc + (o.total ?? 0), 0);

  // Payment Mode - Show items being paid
  if (isPaymentMode && paymentOrder) {
    return (
      <div className="h-screen w-full bg-background overflow-hidden flex flex-col font-sans p-8 text-slate-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 shrink-0">
          <div className="flex items-center gap-4">
            {renderLogo("w-16 h-16", 32)}
            <div>
              <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                {settings.restaurantName}
              </h1>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.4em] mt-1">Processando Pagamento</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-2xl text-green-400 animate-pulse">
            <CreditCard size={20} />
            <span className="text-xs font-black uppercase tracking-widest">Pagamento</span>
          </div>
        </div>

        {/* Payment Content */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Order Items */}
          <div className="flex-1 glass-panel rounded-[2rem] border border-white/5 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                <Receipt className="text-green-400" /> Fatura #{paymentOrder.invoiceNumber || paymentOrder.id?.slice(-8)}
              </h2>
              <span className="bg-white/5 px-3 py-1 rounded-full text-xs font-bold text-slate-500">{paymentItems.length} Itens</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {paymentItems.filter(Boolean).map((item: OrderItem, idx: number) => {
                const dish = menu.find((d: Dish) => d.id === (item.dishId || item.dish_id));
                const quantity = item.quantity || 0;
                const unitPrice = item.unitPrice || 0;
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 relative">
                        <Image src={dish?.imageUrl || '/placeholder-image.jpg'} alt={dish?.name || 'Dish image'} fill style={{ objectFit: 'cover' }} sizes="48px" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-white uppercase tracking-tighter truncate">{dish?.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-primary text-black text-[10px] font-black rounded">{quantity}x</span>
                          <span className="text-slate-500 font-mono text-xs">{formatKz(unitPrice)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-lg font-mono font-bold text-white whitespace-nowrap">{formatKz(unitPrice * quantity)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="glass-panel rounded-[2rem] border border-white/5 p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-sm mb-1">Total a Pagar</p>
                <p className="text-4xl font-mono font-bold text-green-400 leading-none">{formatKz(paymentTotal)}</p>
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <Clock size={20} className="animate-pulse" />
                <span className="text-sm font-black uppercase tracking-widest">Processando...</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
              <ArrowRight size={16} className="animate-pulse" />
              <span>Aguardando confirmação do pagamento</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal Mode - Dynamic display
  if (allItems.length === 0) {
    return (
      <div className="h-screen w-full bg-background overflow-hidden flex flex-col items-center justify-center font-sans p-10 text-slate-200 relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center animate-in fade-in zoom-in duration-1000">
          {renderLogo("w-32 h-32 mb-8", 80)}
          <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-6 text-glow">
            {settings.restaurantName}
          </h1>
          <p className="text-2xl font-bold text-primary uppercase tracking-[0.5em] mb-12 opacity-80">
            Bem-vindo
          </p>
          
          <div className="flex gap-4 opacity-60">
             <div className="px-6 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <span className="text-xs font-black uppercase tracking-widest text-slate-300">Pratos Tradicionais</span>
             </div>
             <div className="px-6 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <span className="text-xs font-black uppercase tracking-widest text-slate-300">Ingredientes Frescos</span>
             </div>
             <div className="px-6 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
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
    <div className="h-screen w-full bg-background overflow-hidden flex flex-col font-sans p-8 text-slate-200">
      <div className="flex justify-between items-center mb-8 shrink-0 gap-6">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {renderLogo("w-16 h-16", 32)}
          <div className="min-w-0">
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none break-words">
              {settings.restaurantName}
            </h1>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.4em] mt-1 opacity-60">Bem-vindo • {table?.name || 'Mesa'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-2xl text-primary animate-pulse shrink-0">
           <Sparkles size={20} />
           <span className="text-xs font-black uppercase tracking-widest">Aprecie o Sabor Angolano</span>
        </div>
      </div>

      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* Left Side: Order List */}
        <div className="flex-1 glass-panel rounded-[2rem] border border-white/5 flex flex-col overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
              <ShoppingBasket className="text-primary" /> Seu Pedido
            </h2>
            <span className="bg-white/5 px-3 py-1 rounded-full text-xs font-bold text-slate-500">{allItems.length} Itens</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {allItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                <ChefHat size={80} className="mb-6" />
                <p className="text-2xl font-black uppercase tracking-widest italic">Prepare-se para o melhor!</p>
              </div>
            ) : (
              (allItems.filter(Boolean) as OrderItem[]).map((item: OrderItem, idx: number) => {
                const dish = menu.find((d: Dish) => d.id === (item.dishId || item.dish_id));
                const quantity = item.quantity || 0;
                const unitPrice = item.unitPrice || 0;
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all animate-in slide-in-from-right duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                       <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 group-hover:border-primary/30 transition-all shrink-0 relative">
                          <Image src={dish?.imageUrl || '/placeholder-image.jpg'} alt={dish?.name || 'Dish image'} fill style={{ objectFit: 'cover' }} sizes="48px" />
                       </div>
                       <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-white uppercase tracking-tighter truncate pr-2">{dish?.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="px-2 py-0.5 bg-primary text-black text-[10px] font-black rounded">{quantity}x</span>
                             <span className="text-slate-500 font-mono text-xs">{formatKz(unitPrice)}</span>
                          </div>
                       </div>
                    </div>
                    <p className="text-lg font-mono font-bold text-white group-hover:text-primary transition-colors whitespace-nowrap">{formatKz(unitPrice * quantity)}</p>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="p-6 bg-black/40 border-t border-white/5 shrink-0 flex justify-between items-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30 animate-pulse"></div>
             <div>
                <p className="text-slate-500 font-black uppercase tracking-[0.4em] mb-1 text-xs">Total à Liquidar</p>
                <p className="text-3xl font-mono font-bold text-primary leading-none">{formatKz(total)}</p>
             </div>
             <div className="flex flex-col items-end gap-2 text-right">
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle2 size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">Pedido Seguro</span>
                </div>
                <p className="text-[10px] text-slate-500 max-w-[180px] leading-relaxed">Faturas processadas de acordo com as normas da AGT.</p>
             </div>
          </div>
        </div>

        {/* Right Side: Visuals/Ads */}
        <div className="w-1/3 flex flex-col gap-6">
           <div className="flex-1 glass-panel rounded-[2rem] overflow-hidden relative group bg-slate-900 flex items-center justify-center">
              {currentPromo.imageUrl && !imageErrorMap[currentPromo.id as string] ? (
                <Image 
                  key={currentPromo.imageUrl}
                  src={currentPromo.imageUrl} 
                  alt="Ad"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                  className="opacity-50 group-hover:scale-110 transition-transform duration-[10s] animate-in fade-in duration-1000 absolute inset-0" 
                  onError={() => {
                    if (currentPromo.id) {
                      setImageErrorMap(prev => ({ ...prev, [currentPromo.id as string]: true }));
                    }
                  }} 
                  priority
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                   <ChefHat size={120} className="text-white" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8">
                 <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-3 leading-none">
                   Experimente {promoItems.length > 0 ? 'o nosso' : 'a nossa famosa'} <span className="text-primary">{currentPromo.name}</span>
                 </h3>
                 <p className="text-slate-300 text-xs leading-relaxed">
                   {currentPromo.description || `Sabores autênticos e ingredientes selecionados especialmente para si.`}
                 </p>
                 {promoItems.length > 0 && (
                    <p className="mt-3 text-lg font-mono font-bold text-primary">{formatKz(currentPromo.price || 0)}</p>
                 )}
              </div>
           </div>
           <div className="p-6 bg-primary rounded-[2rem] text-black shadow-glow flex flex-col justify-center items-center text-center">
              <Sparkles size={32} className="mb-3" />
              <p className="text-lg font-black uppercase tracking-tighter leading-none">MOMENTOS ESPECIAIS<br/>SABORES ÚNICOS</p>
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
