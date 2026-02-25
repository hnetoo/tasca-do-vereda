'use client';

import React from 'react';
import { X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

type DishRow = Database['public']['Tables']['dishes']['Row'];

interface DishModalProps {
  isOpen: boolean;
  onClose: () => void;
  dish: DishRow | null;
}

const fmt = (n: number) => {
  const val = Number.isFinite(n) ? n : 0;
  return val.toLocaleString('pt-AO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' AKZ';
};

export default function DishModal({ isOpen, onClose, dish }: DishModalProps) {
  if (!isOpen || !dish) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">{dish.name}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Image */}
            <div className="aspect-square bg-slate-800 rounded-xl overflow-hidden">
              <img
                src={dish.image_url || '/logo.png'}
                alt={dish.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>

            {/* Details */}
            <div className="space-y-4">
              {/* Price */}
              <div className="text-3xl font-bold text-emerald-400">
                {fmt(Number(dish.price))}
              </div>

              {/* Description */}
              {dish.description && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">Descrição</h3>
                  <p className="text-slate-300 leading-relaxed">{dish.description}</p>
                </div>
              )}

              {/* Additional Info */}
              <div className="space-y-3">
                {dish.preparation_time && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="font-semibold">Tempo de preparo:</span>
                    <span>{dish.preparation_time} min</span>
                  </div>
                )}

                {dish.tax_code && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="font-semibold">Taxa IVA:</span>
                    <span>{dish.tax_percentage || 14}%</span>
                  </div>
                )}

                {dish.track_stock && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="font-semibold">Stock:</span>
                    <span className={(dish.stock_quantity || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {(dish.stock_quantity || 0) > 0 ? `${dish.stock_quantity} unidades` : 'Esgotado'}
                    </span>
                  </div>
                )}
              </div>

              {/* Availability Status */}
              {dish.available === false && (
                <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/30">
                  <p className="text-red-400 font-semibold text-sm">Indisponível no momento</p>
                </div>
              )}

              {dish.available !== false && (
                <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/30">
                  <p className="text-emerald-400 font-semibold text-sm">Disponível para encomenda</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
