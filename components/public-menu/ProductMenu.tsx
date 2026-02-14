
import React from 'react';
import { Plus, Minus, Search, AlertCircle, ShoppingBasket } from 'lucide-react';
import { Dish, CartEntry } from '../../types';

interface ProductMenuProps {
  products: Dish[];
  selectedCatId: string;
  viewMode: 'grid' | 'list' | 'columns';
  searchTerm: string;
  cart: Record<string, CartEntry>;
  onProductClick: (dish: Dish) => void;
  onAddToCart: (dishId: string, quantity: number, notes: string) => void;
  onUpdateCart: (dishId: string, delta: number) => void;
  formatPrice: (val: number) => string;
  imageErrorMap: Record<string, boolean>;
  setImageErrorMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const ProductMenu: React.FC<ProductMenuProps> = React.memo(({
  products,
  selectedCatId,
  viewMode,
  searchTerm,
  cart,
  onProductClick,
  onAddToCart,
  onUpdateCart,
  formatPrice,
  imageErrorMap,
  setImageErrorMap
}) => {

  const isValidImageUrl = (src?: string) => {
    if (!src || typeof src !== 'string') return false;
    const s = src.trim();
    if (!s || s === '/' || s === 'null' || s === 'undefined' || s === 'none') return false;
    
    // Base64 images are valid
    if (s.startsWith('data:image/')) return true;
    
    // Cloudinary, ImgBB, etc.
    if (
      s.includes('cloudinary.com') || 
      s.includes('imgbb.com') ||
      s.includes('images.unsplash.com') ||
      s.includes('img.clerk.com')
    ) return true;

    // Generic URL check
    if (s.match(/^https?:\/\//i)) {
      // Check if it looks like an image URL (common extensions)
      const urlWithoutQuery = s.split('?')[0].toLowerCase();
      const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp)$/.test(urlWithoutQuery);
      
      // If it has an extension, it's definitely an image
      if (hasImageExtension) return true;
      
      // If it's a URL but no extension, it might be a dynamic image route. 
      return true; 
    }

    // Local paths
    if (s.startsWith('/') || s.startsWith('./') || s.startsWith('../')) {
      const pathWithoutQuery = s.split('?')[0].toLowerCase();
      return /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp)$/.test(pathWithoutQuery);
    }
    
    return false;
  };

  const buildSrcSet = (src?: string) => {
    if (!src || typeof src !== 'string') return undefined;
    const s = src.trim();
    if (!s || s.startsWith('data:image/')) return undefined;
    const widths = [320, 480, 640, 960, 1280];
    const joiner = s.includes('?') ? '&' : '?';
    return widths.map(width => `${s}${joiner}w=${width} ${width}w`).join(', ');
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500 animate-in fade-in duration-500 rounded-2xl m-6 border border-slate-800 bg-slate-900/40">
        <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mb-5">
          <Search size={32} className="text-slate-500" />
        </div>
        <p className="text-lg font-semibold text-white">Sem resultados</p>
        <p className="text-sm text-slate-500 mt-2 max-w-xs text-center">
          Não encontramos itens para a categoria ou busca atual.
        </p>
      </div>
    );
  }

  return (
    <div className={`
      grid pb-28 px-4 py-5 sm:px-5 md:px-6 lg:px-8 gap-4 sm:gap-5
      ${viewMode === 'grid' 
        ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' 
        : 'grid-cols-1'
      }
    `}>
      {products.map((dish, index) => {
        if (!dish || !dish.id) return null;
        
        const cartItem = cart[dish.id];
        const quantity = cartItem?.quantity || 0;
        const hasImage = isValidImageUrl(dish.image) && !imageErrorMap[dish.id];
        const srcSet = hasImage ? buildSrcSet(dish.image) : undefined;
        const sizes = viewMode === 'grid'
          ? '(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
          : '100vw';

        return (
          <div 
            key={dish.id}
            onClick={() => onProductClick(dish)}
            className="
              group bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden 
              hover:border-primary/50 hover:shadow-lg transition-all duration-300
              flex flex-col relative active:scale-[0.98]
            "
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div className={`
              relative overflow-hidden bg-slate-950/40 border-b border-slate-800
              ${viewMode === 'grid' ? 'h-44 sm:h-48 lg:h-52' : 'h-28 w-full'}
            `}>
              {hasImage ? (
                <img 
                  src={dish.image} 
                  srcSet={srcSet}
                  sizes={srcSet ? sizes : undefined}
                  alt={dish.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={() => setImageErrorMap(prev => ({ ...prev, [dish.id]: true }))}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900/30">
                  <ShoppingBasket size={28} className="mb-2 opacity-40" />
                  <span className="text-[11px]">Sem imagem</span>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 flex flex-col flex-1">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-base sm:text-lg text-white group-hover:text-primary transition-colors">
                  {dish.name}
                </h3>
              </div>
              {dish.description && (
                <p className="text-sm sm:text-base text-slate-400 mt-2 line-clamp-2">
                  {dish.description}
                </p>
              )}
              <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-800">
                <span className="text-sm sm:text-base text-slate-500">Preço</span>
                <span className="font-semibold text-primary text-base sm:text-lg">
                  {formatPrice(dish.price)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
