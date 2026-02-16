
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
      grid pb-28 px-4 py-5 sm:px-5 md:px-6 lg:px-8 gap-6 sm:gap-8
      ${viewMode === 'grid' 
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
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
              group bg-white/[0.03] border border-white/5 rounded-[2rem] overflow-hidden 
              hover:bg-white/[0.06] hover:border-primary/40 transition-all duration-500
              flex flex-col relative active:scale-[0.98] shadow-xl hover:shadow-primary/10
            "
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Price Badge */}
            <div className="absolute top-4 right-4 z-20">
              <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg">
                <span className="text-primary font-black text-sm tracking-tight">
                  {formatPrice(dish.price)}
                </span>
              </div>
            </div>

            {/* Image Container */}
            <div className={`
              relative overflow-hidden bg-white/[0.02]
              ${viewMode === 'grid' ? 'h-56 sm:h-64' : 'h-32 w-full'}
            `}>
              {hasImage ? (
                <>
                  <img 
                    src={dish.image} 
                    srcSet={srcSet}
                    sizes={srcSet ? sizes : undefined}
                    alt={dish.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={() => setImageErrorMap(prev => ({ ...prev, [dish.id]: true }))}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-white/[0.01]">
                  <ShoppingBasket size={40} strokeWidth={1.5} className="mb-2 opacity-20" />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Sem imagem</span>
                </div>
              )}

              {quantity > 0 && (
                <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
                  <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center font-black shadow-xl border-2 border-black/20 animate-in zoom-in duration-300">
                    {quantity}
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-1 relative">
              <div className="flex flex-col gap-1 mb-3">
                <h3 className="font-black text-lg sm:text-xl text-white group-hover:text-primary transition-colors leading-tight uppercase tracking-wide">
                  {dish.name}
                </h3>
                {dish.categoryName && (
                  <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">
                    {dish.categoryName}
                  </span>
                )}
              </div>
              
              {dish.description && (
                <p className="text-sm text-slate-400 line-clamp-2 font-medium leading-relaxed mb-4 group-hover:text-slate-300 transition-colors">
                  {dish.description}
                </p>
              )}

              <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
                <button 
                  className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                >
                  Ver Detalhes
                  <Plus size={14} strokeWidth={3} />
                </button>
                
                {quantity > 0 ? (
                  <div className="flex items-center gap-3 bg-white/5 rounded-full p-1 border border-white/10" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => onUpdateCart(dish.id, -1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                    >
                      <Minus size={16} strokeWidth={3} />
                    </button>
                    <span className="text-sm font-black text-white w-4 text-center">{quantity}</span>
                    <button 
                      onClick={() => onUpdateCart(dish.id, 1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-green-500/20 text-slate-400 hover:text-green-400 transition-all"
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onAddToCart(dish.id, 1, ''); }}
                    className="bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 text-white p-2 rounded-full transition-all duration-300"
                  >
                    <Plus size={18} strokeWidth={3} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
