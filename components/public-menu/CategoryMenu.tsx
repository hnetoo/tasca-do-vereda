
import React from 'react';
import { 
  Coffee, UtensilsCrossed, Apple, Utensils, Egg, Grape, Croissant, 
  Pizza, Soup, Beer, Cake, Wheat, GlassWater, Martini, Flame, 
  Cookie, Drumstick, Candy, Popcorn, Fish, Beef, Sandwich, IceCream, Wine, ChefHat, LayoutGrid
} from 'lucide-react';
import { MenuCategory } from '../../types';

interface CategoryMenuProps {
  categories: MenuCategory[];
  selectedCatId: string;
  onSelectCategory: (id: string) => void;
  categoryCounts: Record<string, number>;
  isSidebarOpen: boolean;
  className?: string;
}

export const getCategoryIcon = (name: string): React.ReactElement<{ size?: number; className?: string }> => {
  const n = name.toLowerCase();
  const commonProps = { size: 18, className: "text-primary" };

  if (n.includes('entrada') || n.includes('starter') || n.includes('couvert')) return <UtensilsCrossed {...commonProps} />;
  if (n.includes('sopa') || n.includes('soup') || n.includes('caldo')) return <Soup {...commonProps} />;
  if (n.includes('salada') || n.includes('salad')) return <Grape {...commonProps} />;
  if (n.includes('peixe') || n.includes('fish') || n.includes('marisco') || n.includes('seafood')) return <Fish {...commonProps} />;
  if (n.includes('carne') || n.includes('meat') || n.includes('steak') || n.includes('bife') || n.includes('grelhad')) return <Beef {...commonProps} />;
  if (n.includes('hamburguer') || n.includes('burger')) return <Sandwich {...commonProps} />;
  if (n.includes('pizza') || n.includes('piza')) return <Pizza {...commonProps} />;
  if (n.includes('massa') || n.includes('pasta') || n.includes('spaghetti') || n.includes('lasanha')) return <Wheat {...commonProps} />;
  if (n.includes('sobremesa') || n.includes('dessert') || n.includes('doce') || n.includes('cake') || n.includes('bolo')) return <Cake {...commonProps} />;
  if (n.includes('gelado') || n.includes('ice cream')) return <IceCream {...commonProps} />;
  
  // Bebidas
  if (n.includes('vinho') || n.includes('wine')) return <Wine {...commonProps} />;
  if (n.includes('cerveja') || n.includes('beer')) return <Beer {...commonProps} />;
  if (n.includes('cocktail') || n.includes('gin') || n.includes('vodka') || n.includes('licor')) return <Martini {...commonProps} />;
  if (n.includes('agua') || n.includes('water') || n.includes('sumo') || n.includes('refrigerante') || n.includes('soda')) return <GlassWater {...commonProps} />;
  
  // Cafetaria
  if (n.includes('cafe') || n.includes('pequeno-almoco') || n.includes('cha') || n.includes('tea') || n.includes('latte') || n.includes('coffee') || n.includes('expresso')) return <Coffee {...commonProps} />;
  if (n.includes('croissant') || n.includes('padaria') || n.includes('pao')) return <Croissant {...commonProps} />;
  if (n.includes('fruta') || n.includes('fruit')) return <Apple {...commonProps} />;
  
  // Pratos Principais / Outros
  if (n.includes('prato principal') || n.includes('principais') || n.includes('main dish')) return <Utensils {...commonProps} />;
  if (n.includes('ovo') || n.includes('egg') || n.includes('omelete')) return <Egg {...commonProps} />;
  if (n.includes('salada') || n.includes('saudavel') || n.includes('vegano') || n.includes('vegetariano')) return <Grape {...commonProps} />;
  
  return <ChefHat {...commonProps} />;
};

export const CategoryMenu: React.FC<CategoryMenuProps> = React.memo(({
  categories,
  selectedCatId,
  onSelectCategory,
  categoryCounts,
  isSidebarOpen,
  className
}) => {
  const containerClassName = isSidebarOpen
    ? 'flex flex-col gap-4 overflow-y-auto p-4 md:p-6 custom-scrollbar'
    : 'flex gap-4 overflow-x-auto px-6 py-4 custom-scrollbar snap-x snap-mandatory scroll-smooth';

  return (
    <div className={`
      ${containerClassName}
      ${className}
    `}>
      {isSidebarOpen && (
        <div className="flex items-center gap-2 px-1 mb-2">
          <div className="w-1.5 h-6 bg-primary rounded-full" />
          <h2 className="text-sm font-black text-white uppercase tracking-widest">
            Categorias
          </h2>
        </div>
      )}
      
      <button
        onClick={() => onSelectCategory('TODOS')}
        className={`
          flex items-center gap-4 rounded-2xl transition-all duration-500 group shrink-0 border relative overflow-hidden
          ${selectedCatId === 'TODOS' 
            ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]' 
            : 'bg-white/[0.03] border-white/5 text-slate-400 hover:bg-white/[0.08] hover:border-white/20 hover:text-white'
          }
          ${isSidebarOpen ? 'w-full px-5 py-4' : 'min-w-[160px] px-5 py-4 snap-start'}
        `}
      >
        {selectedCatId === 'TODOS' && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
        )}
        <div className={`
          w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 relative z-10
          ${selectedCatId === 'TODOS' ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-white/5 text-slate-500 group-hover:scale-110'}
        `}>
          <LayoutGrid size={22} strokeWidth={2.5} />
        </div>
        <div className="flex-1 text-left min-w-0 relative z-10">
          <span className={`block font-black text-sm uppercase tracking-wider ${selectedCatId === 'TODOS' ? 'text-white' : ''}`}>
            Todos
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-tighter opacity-60 ${selectedCatId === 'TODOS' ? 'text-primary-foreground' : ''}`}>
            {categoryCounts['TODOS'] || 0} Itens
          </span>
        </div>
      </button>

      {categories.map((cat, idx) => {
        if (!cat || !cat.id) return null;
        const isActive = selectedCatId === cat.id;
        const count = categoryCounts[cat.id] || 0;
        
        return (
          <button
            key={cat.id || `fallback-${idx}`}
            onClick={() => onSelectCategory(cat.id)}
            className={`
              flex items-center gap-4 rounded-2xl transition-all duration-500 group shrink-0 border relative overflow-hidden
              ${isActive 
                ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]' 
                : 'bg-white/[0.03] border-white/5 text-slate-400 hover:bg-white/[0.08] hover:border-white/20 hover:text-white'
              }
              ${isSidebarOpen ? 'w-full px-5 py-4' : 'min-w-[160px] px-5 py-4 snap-start'}
            `}
          >
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
            )}
            <div className={`
              w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 relative z-10
              ${isActive ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-white/5 text-slate-500 group-hover:scale-110'}
            `}>
              {React.cloneElement(getCategoryIcon(cat.name || '') as React.ReactElement<{ size?: number; strokeWidth?: number }>, { 
                size: 22,
                strokeWidth: 2.5
              })}
            </div>
            <div className="flex-1 text-left min-w-0 relative z-10">
              <span className={`block font-black text-sm uppercase tracking-wider truncate ${isActive ? 'text-white' : ''}`}>
                {cat.name || 'Setor-X'}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-tighter opacity-60 ${isActive ? 'text-primary-foreground' : ''}`}>
                {count} Itens
              </span>
            </div>
          </button>
        );
      })}
      
      {!isSidebarOpen && <div className="min-w-[24px] shrink-0" />}
    </div>
  );
});
