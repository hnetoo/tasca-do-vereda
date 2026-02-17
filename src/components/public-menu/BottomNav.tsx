'use client';

import React from 'react';
import { Menu, ShoppingBasket, User, Receipt } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'menu' | 'cart' | 'account';
  onTabChange: (tab: 'menu' | 'cart' | 'account') => void;
  cartCount?: number;
}

export default function BottomNav({ activeTab, onTabChange, cartCount = 0 }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50">
      <button 
        onClick={() => onTabChange('menu')}
        className={`flex flex-col items-center gap-1 ${activeTab === 'menu' ? 'text-primary' : 'text-gray-400'}`}
      >
        <Menu size={24} />
        <span className="text-[10px] font-bold uppercase">Menu</span>
      </button>

      <button 
        onClick={() => onTabChange('cart')}
        className={`flex flex-col items-center gap-1 relative ${activeTab === 'cart' ? 'text-primary' : 'text-gray-400'}`}
      >
        <span className="relative">
            <ShoppingBasket size={24} />
            {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                </span>
            )}
        </span>
        <span className="text-[10px] font-bold uppercase">Carrinho</span>
      </button>

      <button 
        onClick={() => onTabChange('account')}
        className={`flex flex-col items-center gap-1 ${activeTab === 'account' ? 'text-primary' : 'text-gray-400'}`}
      >
        <User size={24} />
        <span className="text-[10px] font-bold uppercase">Conta</span>
      </button>
    </div>
  );
}
