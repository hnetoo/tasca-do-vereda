'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { Move } from 'lucide-react';
import { Dish } from '@/types';

const Encomendas = () => {
    const { dishes: menu } = useStore();
    const theme = 'dark'; // Defaulting to dark as AppShell sets bg-slate-950

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-white">Gestão de Encomendas</h1>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {(menu as Dish[]).map((dish) => (
                    <div key={dish.id} className="bg-slate-900 rounded-lg shadow-lg overflow-hidden relative group border border-slate-800 hover:border-primary transition-colors">
                        <div className="aspect-square relative bg-slate-800">
                            {dish.imageUrl ? (
                                <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500 text-xs">Sem Imagem</div>
                            )}
                            
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-black/50 backdrop-blur text-white p-1 rounded-md cursor-move">
                                    <Move size={12} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-3">
                            <div className={`font-bold text-sm truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                {dish.name}
                            </div>
                            <div className="text-primary text-xs font-mono mt-1">
                                {dish.price} Kz
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Encomendas;
