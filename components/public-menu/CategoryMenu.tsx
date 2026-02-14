
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
    ? 'flex flex-col gap-3 overflow-y-auto p-4 md:p-6 custom-scrollbar'
    : 'flex gap-3 overflow-x-auto p-4 custom-scrollbar snap-x snap-mandatory';

  return (
    <div className={`
      ${containerClassName}
      ${className}
    `}>
      {isSidebarOpen && (
        <div className="flex items-center gap-2 px-1">
          <div className="w-2 h-2 bg-primary rounded-full" />
          <h2 className="text-xs font-semibold text-slate-300">
            Categorias
          </h2>
        </div>
      )}
      
      <button
        onClick={() => onSelectCategory('TODOS')}
        className={`
          flex items-center gap-3 rounded-xl transition-all duration-300 group shrink-0 border
          ${selectedCatId === 'TODOS' 
            ? 'bg-primary/15 border-primary/40 text-primary' 
            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white'
          }
          ${isSidebarOpen ? 'w-full px-4 py-3' : 'min-w-[170px] px-4 py-3 snap-start'}
        `}
      >
        <div className={`
          w-9 h-9 rounded-md flex items-center justify-center transition-all duration-300
          ${selectedCatId === 'TODOS' ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-400'}
        `}>
          <LayoutGrid size={18} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <span className="block font-semibold text-sm sm:text-base truncate">Todos</span>
          <span className="text-[11px] text-slate-500">{categoryCounts['TODOS'] || 0} itens</span>
        </div>
      </button>

      {categories.map((cat, idx) => {
        if (!cat || !cat.id) return null;
        const isActive = selectedCatId === cat.id;
        return (
          <button
            key={cat.id || `fallback-${idx}`}
            onClick={() => onSelectCategory(cat.id)}
          className={`
              flex items-center gap-3 rounded-xl transition-all duration-300 group shrink-0 border
              ${isActive 
                ? 'bg-primary/15 border-primary/40 text-primary' 
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white'
              }
              ${isSidebarOpen ? 'w-full px-4 py-3' : 'min-w-[170px] px-4 py-3 snap-start'}
            `}
          >
            <div className={`
              w-9 h-9 rounded-md flex items-center justify-center transition-all duration-300
              ${isActive ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-400'}
            `}>
              {React.cloneElement(getCategoryIcon(cat.name || '') as React.ReactElement<{ size?: number }>, { 
                size: 18
              })}
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className="block font-semibold text-sm sm:text-base truncate">
                {cat.name || 'Setor-X'}
              </span>
              <span className="text-[11px] text-slate-500">
                {categoryCounts[cat.id] || 0} itens
              </span>
            </div>
          </button>
        );
      })}
      
      <div className="h-12 md:h-0 shrink-0" />
    </div>
  );
});
