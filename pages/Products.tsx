import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { logger } from '../services/logger';
import { Dish } from '../types';
import { Search, Plus, Trash2, Edit2, X, Save, Upload, Image as ImageIcon, Utensils, Copy } from 'lucide-react';

const Products = () => {
  const { menu, categories, addDish, updateDish, removeDish, setMenu } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  
  // Modal states
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const [dishForm, setDishForm] = useState<Partial<Dish>>({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    image: '',
    isAvailableOnDigitalMenu: true,
    taxCode: 'NOR',
    stockItemId: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    logger.info('Products page mounted', null, 'Products');
    return () => {
      logger.info('Products page unmounted', null, 'Products');
    };
  }, []);

  const filteredMenu = menu.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'TODOS' || String(dish.categoryId) === String(selectedCategory);
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const handleOpenDishModal = (dish?: Dish) => {
    if (dish) {
      setEditingId(dish.id);
      setDishForm({
        ...dish,
        isAvailableOnDigitalMenu: dish.isAvailableOnDigitalMenu !== false,
        stockItemId: dish.stockItemId || ''
      });
    } else {
      setEditingId(null);
      setDishForm({
        name: '',
        description: '',
        price: 0,
        categoryId: categories[0]?.id || '',
        image: '',
        isAvailableOnDigitalMenu: true,
        taxCode: 'NOR',
        stockItemId: ''
      });
    }
    setIsDishModalOpen(true);
  };

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 800;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          reject(new Error('Canvas context not available'));
        }
      };
      img.onerror = (err) => reject(err);
      img.src = base64;
    });
  };

  const handleSubmitDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishForm.name || !dishForm.price || !dishForm.categoryId) return;

    let finalImage = dishForm.image;

    // Auto-compress image if it's a new large base64 string
    if (finalImage && finalImage.startsWith('data:image') && finalImage.length > 200000) {
       try {
         const compressed = await compressImage(finalImage);
         if (compressed.length < finalImage.length) {
            finalImage = compressed;
         }
       } catch (error) {
         console.error("Auto-compression failed during save", error);
       }
    }

    const selectedCat = categories.find(c => c.id === dishForm.categoryId);
    const dishData = {
      ...dishForm,
      image: finalImage,
      price: Number(dishForm.price),
      isAvailableOnDigitalMenu: dishForm.isAvailableOnDigitalMenu ?? true,
      categoryName: selectedCat?.name || ''
    } as Dish;

    if (editingId) {
      const existing = menu.find(d => d.id === editingId);
      const changedCategory = existing && existing.categoryId !== dishData.categoryId;
      if (changedCategory) {
        const ok = confirm(`Confirma mover "${existing?.name}" para a categoria "${selectedCat?.name}"?`);
        if (!ok) return;
      }
      updateDish(dishData);
      setIsDishModalOpen(false);
    } else {
      const newDish = {
        ...dishData,
        id: dishData.id || Math.random().toString(36).substr(2, 9)
      };
      addDish(newDish);
      setIsDishModalOpen(false);
      setDishForm({
        name: '',
        description: '',
        price: 0,
        categoryId: dishForm.categoryId, 
        image: '',
        isAvailableOnDigitalMenu: true,
        taxCode: 'NOR'
      });
    }
  };

  const handleDuplicateDish = (dish: Dish) => {
    const newDish = {
      ...dish,
      name: `${dish.name} (Cópia)`,
      id: Math.random().toString(36).substr(2, 9)
    };
    addDish(newDish as Dish);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDishForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOptimizeImages = async () => {
    if (!confirm('Esta ação irá otimizar todas as imagens dos produtos para melhorar a sincronização com o Menu Digital. O processo pode levar alguns segundos. Deseja continuar?')) return;
    
    setIsOptimizing(true);
    let count = 0;
    
    try {
      const updatedMenu = await Promise.all(menu.map(async (dish) => {
        if (dish.image && dish.image.startsWith('data:image') && dish.image.length > 200000) {
           try {
             const compressed = await compressImage(dish.image);
             if (compressed.length < dish.image.length) {
               count++;
               return { ...dish, image: compressed };
             }
           } catch (e) {
             console.error(`Error compressing image for ${dish.name}`, e);
           }
        }
        return dish;
      }));
      
      if (count > 0) {
        setMenu(updatedMenu);
        alert(`${count} imagens foram otimizadas com sucesso! O menu digital deve sincronizar mais rápido agora.`);
      } else {
        alert('As imagens já estão otimizadas.');
      }
    } catch (error) {
      console.error("Optimization failed", error);
      alert('Erro ao otimizar imagens.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const formatKz = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
  };

  return (
    <div className="p-6 bg-background h-full overflow-y-auto font-sans flex flex-col">
      <header className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Produtos</h2>
          <p className="text-slate-400 text-sm mt-1">Gerencie os produtos do seu cardápio.</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={handleOptimizeImages}
             disabled={isOptimizing}
             className="bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold uppercase text-[10px] tracking-widest border border-white/5"
             title="Otimizar imagens para Menu Digital"
           >
             {isOptimizing ? (
               <span className="animate-spin">⌛</span>
             ) : (
               <ImageIcon size={16} />
             )}
             {isOptimizing ? 'Otimizando...' : 'Otimizar Fotos'}
           </button>
          <button 
            onClick={() => handleOpenDishModal()}
            className="bg-primary text-black px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-glow hover:scale-105 transition-all font-black uppercase text-xs tracking-widest"
          >
            <Plus size={18} />
            Novo Produto
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar na ementa..." 
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:border-primary transition-all text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:border-primary text-xs font-bold uppercase tracking-wide cursor-pointer"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="TODOS" className="bg-slate-900 text-slate-300">Todas as Categorias</option>
            {categories.map((cat, index) => (
              <option key={`${cat.id}-${index}`} value={cat.id} className="bg-slate-900">{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
          {filteredMenu.map((dish, index) => (
            <div key={`${dish.id}-${index}`} className="glass-panel p-4 rounded-3xl border border-white/5 flex flex-col gap-4 group hover:border-primary/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-2xl bg-black/30 overflow-hidden shrink-0 border border-white/5 relative">
                  {dish.image ? (
                    <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Utensils size={24} />
                    </div>
                  )}
                  {!dish.isAvailableOnDigitalMenu && (
                     <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="text-[8px] font-black text-white uppercase bg-red-500/80 px-2 py-1 rounded">Oculto</span>
                     </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-white text-sm truncate pr-2" title={dish.name}>{dish.name}</h3>
                    <span className="text-primary font-mono font-bold text-xs whitespace-nowrap">{formatKz(dish.price)}</span>
                  </div>
                  <p className="text-slate-400 text-[10px] line-clamp-2 italic mb-4 min-h-[30px]">{dish.description}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenDishModal(dish)} className="flex-1 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest transition-all">Editar</button>
                    <button onClick={() => handleDuplicateDish(dish)} className="w-10 py-2 rounded-lg border border-blue-500/10 text-blue-500/50 hover:bg-blue-500 hover:text-white transition-all" title="Duplicar"><Copy size={14} className="mx-auto" /></button>
                    <button onClick={() => removeDish(dish.id)} className="w-10 py-2 rounded-lg border border-red-500/10 text-red-500/50 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14} className="mx-auto" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredMenu.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                <Search size={32} />
              </div>
              <p className="text-slate-400">Nenhum item na ementa encontrado.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Produto */}
      {isDishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                {editingId ? <Edit2 size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />}
                {editingId ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={() => setIsDishModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSubmitDish} className="space-y-6">
                <div className="flex gap-6">
                  <div className="w-1/3 space-y-4">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-white/20 hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center gap-2 bg-black/20 group transition-all overflow-hidden relative"
                    >
                      {dishForm.image ? (
                        <img src={dishForm.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="text-slate-400 group-hover:text-primary" size={24} />
                          </div>
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Carregar Foto</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome do Produto</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:bg-white/10 outline-none transition-all font-bold"
                        placeholder="Ex: Bitoque à Casa"
                        value={dishForm.name}
                        onChange={e => setDishForm({...dishForm, name: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preço (Kz)</label>
                        <input 
                          required
                          type="number" 
                          min="0"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:bg-white/10 outline-none transition-all font-mono"
                          placeholder="0.00"
                          value={dishForm.price}
                          onChange={e => setDishForm({...dishForm, price: parseFloat(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoria</label>
                        <select 
                          required
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:bg-white/10 outline-none transition-all appearance-none cursor-pointer"
                          value={dishForm.categoryId}
                          onChange={e => setDishForm({...dishForm, categoryId: e.target.value})}
                        >
                          <option value="" disabled>Selecione...</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id} className="bg-slate-900">{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:bg-white/10 outline-none transition-all resize-none h-24"
                    placeholder="Descreva o prato..."
                    value={dishForm.description}
                    onChange={e => setDishForm({...dishForm, description: e.target.value})}
                  />
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-sm">Disponibilidade</h4>
                    <p className="text-xs text-slate-400">Visível no Menu Digital e QR Code</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={dishForm.isAvailableOnDigitalMenu}
                      onChange={e => setDishForm({...dishForm, isAvailableOnDigitalMenu: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-4 bg-primary text-black rounded-xl font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-glow flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Salvar Produto
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
