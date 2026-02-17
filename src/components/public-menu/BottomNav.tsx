import React from 'react';
import { Menu, ShoppingBasket, User, Receipt } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'menu' | 'cart' | 'account';
  onTabChange: (tab: 'menu' | 'cart' | 'account') => void;
  cartItemsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, cartItemsCount }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-lg border-t border-white/10 pb-safe md:hidden">
      <div className="flex items-center justify-around h-16">
        <button
          onClick={() => onTabChange('menu')}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
            activeTab === 'menu' ? 'text-primary' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu size={24} strokeWidth={activeTab === 'menu' ? 2.5 : 2} />
          <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Menu</span>
        </button>

        <button
          onClick={() => onTabChange('cart')}
          className={`relative flex flex-col items-center justify-center w-full h-full transition-colors ${
            activeTab === 'cart' ? 'text-primary' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <ShoppingBasket size={24} strokeWidth={activeTab === 'cart' ? 2.5 : 2} />
            {cartItemsCount > 0 && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-slate-900">
                {cartItemsCount}
              </div>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Carrinho</span>
        </button>

        <button
          onClick={() => onTabChange('account')}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
            activeTab === 'account' ? 'text-primary' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User size={24} strokeWidth={activeTab === 'account' ? 2.5 : 2} />
          <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Conta</span>
        </button>
      </div>
    </div>
  );
};
