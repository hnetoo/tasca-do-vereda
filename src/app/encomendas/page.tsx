'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Move, AlertCircle } from 'lucide-react';
import { Dish } from '@/types';

const Encomendas = () => {
    const { dishes: menu, isInitialized } = useStore();
    const theme = 'dark'; // Defaulting to dark as AppShell sets bg-slate-950

    useEffect(() => {
        console.log('Encomendas page mounted. Dishes:', menu?.length);
    }, [menu]);

    if (!isInitialized) {
         return <div className="p-6 text-white">Carregando menu...</div>;
    }

    if (!menu || menu.length === 0) {
        return (
            <div className="p-6 text-white flex flex-col items-center justify-center h-64">
                <AlertCircle size={48} className="mb-4 text-slate-500" />
                <h2 className="text-xl font-bold">Nenhum prato encontrado</h2>
                <p className="text-slate-400">Verifique se existem pratos cadastrados no banco de dados ou se o carregamento falhou.</p>
            </div>
        );
    }

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
