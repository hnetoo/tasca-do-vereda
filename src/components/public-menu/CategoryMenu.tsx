'use client';

import React from 'react';
import { 
  Coffee, UtensilsCrossed, Apple, Utensils, Egg, Grape, Croissant, 
  Pizza, Soup, Beer, Cake, Wheat, GlassWater, Martini, Flame, 
  IceCream, Fish, Beef, Carrot, Cherry, Sandwich, Donut, Wine
} from 'lucide-react';
import { MenuCategory } from '@/types';

// Map of category names to Lucide icons
export const CATEGORY_ICONS: Record<string, any> = {
  'Café': Coffee,
  'Pequeno Almoço': UtensilsCrossed,
  'Saudável': Apple,
  'Geral': Utensils,
  'Ovos': Egg,
  'Fruta': Grape,
  'Padaria': Croissant,
  'Pizza': Pizza,
  'Sopa': Soup,
  'Cerveja': Beer,
  'Bolo': Cake,
  'Cereais': Wheat,
  'Água': GlassWater,
  'Bar': Martini,
  'Grelhados': Flame,
  'Gelado': IceCream,
  'Peixe': Fish,
  'Carne': Beef,
  'Legumes': Carrot,
  'Sobremesa': Cherry,
  'Lanche': Sandwich,
  'Doce': Donut,
  'Vinho': Wine,
};

interface CategoryMenuProps {
  menu_categories: MenuCategory[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

export default function CategoryMenu({ menu_categories, selectedCategory, onSelectCategory }: CategoryMenuProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-4 no-scrollbar">
      <button
        onClick={() => onSelectCategory('TODOS')}
        className={`flex flex-col items-center gap-2 min-w-[4.5rem] p-3 rounded-2xl transition-all border
          ${selectedCategory === 'TODOS' 
            ? 'bg-primary text-white border-primary shadow-lg scale-105' 
            : 'bg-white border-gray-100 text-gray-400 grayscale hover:grayscale-0'
          }`}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedCategory === 'TODOS' ? 'bg-white/20' : 'bg-gray-100'}`}>
          <Utensils size={20} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider">Tudo</span>
      </button>

      {menu_categories.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.name] || Utensils;
        const isSelected = selectedCategory === cat.id;
        
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex flex-col items-center gap-2 min-w-[4.5rem] p-3 rounded-2xl transition-all border
              ${isSelected 
                ? 'bg-primary text-white border-primary shadow-lg scale-105' 
                : 'bg-white border-gray-100 text-gray-400 grayscale hover:grayscale-0'
              }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-gray-100'}`}>
              <Icon size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider truncate w-full text-center">
              {cat.name.split(' ')[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

