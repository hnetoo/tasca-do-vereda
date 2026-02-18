'use client';

import React from 'react';
import { Plus, Minus, Search, CircleAlert, ShoppingBasket } from 'lucide-react';
import { CartEntry } from '../../types';

export const ProductMenu = () => {
  return (
    <div className="p-4 bg-background text-foreground">
      <h2 className="text-xl font-bold mb-4">Menu</h2>
      <div className="flex items-center justify-center p-8 border border-dashed border-white/10 rounded-lg">
        <p className="text-slate-500">Produtos indisponíveis no momento.</p>
      </div>
    </div>
  );
};

export default ProductMenu;
