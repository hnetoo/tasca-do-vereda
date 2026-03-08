'use client';

import React from 'react';
import Image from 'next/image';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

const formatCurrency = (val: number) => 
  val.toLocaleString('pt-AO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' AKZ';

export default function OrderSidebar() {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearCart, 
    total, 
    itemCount, 
    isOpen, 
    setIsOpen 
  } = useCart();

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="flex-1 bg-black/50 backdrop-blur-sm" />
      
      {/* Sidebar */}
      <div className="w-full max-w-md bg-slate-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Carrinho</h2>
              <p className="text-sm text-slate-400">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Fechar carrinho"
            title="Fechar carrinho"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Carrinho vazio</h3>
              <p className="text-sm text-slate-400">Adicione itens do menu para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-slate-800 rounded-lg p-4">
                  <div className="flex gap-4">
                    {/* Image */}
                    {item.image_url && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-700">
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Details */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{item.name}</h4>
                      {item.description && (
                        <p className="text-xs text-slate-400 mb-2 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-semibold">{formatCurrency(item.price)}</span>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors flex items-center justify-center"
                            aria-label="Diminuir quantidade"
                            title="Diminuir quantidade"
                          >
                            <Minus className="w-4 h-4 text-slate-300" />
                          </button>
                          <span className="w-8 text-center text-white font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors flex items-center justify-center"
                            aria-label="Aumentar quantidade"
                            title="Aumentar quantidade"
                          >
                            <Plus className="w-4 h-4 text-slate-300" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-8 h-8 rounded-lg bg-red-900/50 hover:bg-red-900/70 transition-colors flex items-center justify-center ml-2"
                            aria-label="Remover item"
                            title="Remover item"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-slate-800 p-4 space-y-4">
            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">Total</span>
              <span className="text-2xl font-bold text-emerald-400">{formatCurrency(total)}</span>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  // TODO: Implement order submission
                  alert('Funcionalidade de encomenda em desenvolvimento!');
                }}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors"
              >
                Fazer Encomenda
              </button>
              <button
                onClick={clearCart}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors"
              >
                Limpar Carrinho
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
