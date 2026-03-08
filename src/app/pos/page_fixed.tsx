// VERSÃO CORRIGIDA - SÓ FOCADA NO CARRINHO DO POS
// Substitua o conteúdo problemático com este código

// 1. SUBSTITUA O CARRINHO LATERAL (linhas ~1599-1652) POR:
<div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-3">
  {cartItems && cartItems.length > 0 ? (
    cartItems.map((item: OrderItem, idx: number) => { 
      const dish = menu.find((p: Product) => p.id === item.dishId); 
      if (!dish) return null; 
      return (
        <div key={idx} className="flex gap-4 items-center p-3 bg-white/5 rounded-2xl border border-white/5 group animate-in slide-in-from-right-4">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden">
            <Image 
              src={normalizeDishImage(dish.imageUrl)} 
              alt={dish.name || 'Prato'} 
              fill 
              sizes="48px"
              className="object-cover" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white text-[10px] truncate uppercase tracking-tighter">{dish.name || 'Sem nome'}</h4>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] font-mono font-bold text-primary/80">{formatKz((dish.price || 0) * (item.quantity || 0))}</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-3 bg-black/40 p-1 rounded-lg">
                  <button onClick={() => addToCart(dish, -1)} className="w-6 h-6 rounded-md bg-white/5 text-slate-400 flex items-center justify-center hover:bg-white/10"><Minus size={12}/></button>
                  <span className="text-[10px] font-black text-white w-4 text-center">{item.quantity || 0}</span>
                  <button onClick={() => addToCart(dish, 1)} className="w-6 h-6 rounded-md bg-primary text-black flex items-center justify-center"><Plus size={12}/></button>
                </div>
                <button 
                  onClick={() => {
                    const updatedCartItems = cartItems.filter((_, index) => index !== idx);
                    const state = useStore.getState();
                    (state as any).setCartItems(updatedCartItems);
                  }} 
                  className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                  title="Remover Item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    })
  ) : (
    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-20">
      <ShoppingBasket size={48} className="mb-4" />
      <p className="text-xs font-black uppercase tracking-widest leading-relaxed">Carrinho vazio.<br/>Adicione produtos.</p>
    </div>
  )}
</div>

// 2. SUBSTITUA O CÁLCULO DO TOTAL (linhas ~1658) POR:
<div className="flex justify-between items-end mb-6">
  <div>
    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Parcial</span>
    <h3 className="text-xl font-mono font-bold text-primary leading-none mt-1">
      {formatKz(cartItems?.reduce((sum: number, item: OrderItem) => {
        const dish = menu.find((p: Product) => p.id === item.dishId);
        return sum + ((dish?.price || 0) * (item.quantity || 0));
      }, 0) || 0)}
    </h3>
  </div>
</div>

// 3. SUBSTITUA O BOTÃO DE PAGAMENTO (linha ~1662) POR:
<button 
  onClick={() => {
    setIsPaymentModalOpen(true);
    emitPaymentEvent('PAYMENT_STARTED', { cartItems });
  }} 
  disabled={!cartItems || cartItems.length === 0}
  className="col-span-3 py-4 rounded-2xl bg-primary text-black font-black uppercase text-xs tracking-widest shadow-glow hover:brightness-110 transition-all disabled:opacity-20 flex items-center justify-center gap-3"
>
  <CreditCard size={18} /> PAGAMENTO
</button>

// 4. ADICIONE ESTA FUNÇÃO NO operationalSlice.ts (depois da linha 85):
setCartItems: (items: OrderItem[]) => set({ cartItems: items }),
