import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { logger } from '../services/logger';
import { buildFeed, downloadFeed } from '../services/qrFeedService';
import { publishFeedHybrid } from '../services/feedPublisher';
import { Dish, MenuCategory, StockItem } from '../types';
import { Search, Plus, Trash2, Edit2, X, Save, Upload, Image as ImageIcon, Link as LinkIcon, AlertCircle, Check, Tag, Box, Utensils, Grid3X3, Coffee, Pizza, Beer, IceCream, Copy, RefreshCw } from 'lucide-react';

// Icons available for categories
const AVAILABLE_ICONS = [
  { name: 'Grid3X3', label: 'Geral', icon: Grid3X3 },
  { name: 'Coffee', label: 'Pequeno Almoço/Bebidas Quentes', icon: Coffee },
  { name: 'Pizza', label: 'Pratos Principais', icon: Pizza },
  { name: 'Beer', label: 'Bebidas Alcoólicas', icon: Beer },
  { name: 'IceCream', label: 'Sobremesas', icon: IceCream },
  { name: 'Utensils', label: 'Talheres', icon: Utensils },
];

const Inventory = () => {
  const { 
    menu, 
    categories, 
    stock, 
    suppliers,
    addDish, 
    updateDish, 
    removeDish, 
    addCategory, 
    removeCategory, 
    updateCategory, 
    addStockItem,
    updateStockItem,
    removeStockItem,
    updateStockQuantity,
    setMenu, 
    addNotification, 
    scanAndRecoverCategories, 
    triggerSync,
    integrityIssues,
    isDiagnosing,
    runIntegrityDiagnostics,
    performSafeCleanup
  } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  
  // Determine default tab based on URL path if no tab param is present
  const getDefaultTab = () => {
    const tabParam = searchParams.get('tab');
    if (tabParam) return tabParam as 'menu' | 'categories' | 'integrity' | 'stock' | 'orders';
    
    if (location.pathname.includes('categories')) return 'categories';
    if (location.pathname.includes('stock')) return 'stock';
    return 'menu';
  };

  const activeTab = getDefaultTab() as 'menu' | 'categories' | 'integrity' | 'stock' | 'orders';

  const setActiveTab = (tab: 'menu' | 'categories' | 'integrity' | 'stock' | 'orders') => {
    setSearchParams({ tab });
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  
  // Modal states
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Optimization state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);

  // Form states
  const [dishForm, setDishForm] = useState<Partial<Dish>>({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    image: '',
    isAvailableOnDigitalMenu: true,
    taxCode: 'NOR',
    stockItemId: '',
    fornecedorPadraoId: ''
  });

  const [catForm, setCatForm] = useState<Partial<MenuCategory>>({
    name: '',
    icon: 'Grid3X3',
    parentId: '',
    isAvailableOnDigitalMenu: true
  });

  const [stockForm, setStockForm] = useState<Partial<StockItem>>({
    name: '',
    quantity: 0,
    unit: 'un',
    minThreshold: 5
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation for activeTab to prevent disappearance
  useEffect(() => {
    const validTabs = ['menu', 'categories', 'integrity', 'stock', 'orders'];
    if (!validTabs.includes(activeTab)) {
      logger.warn('Invalid activeTab detected in Inventory', { activeTab }, 'Inventory');
      setSearchParams({ tab: 'menu' });
    }
  }, [activeTab, setSearchParams]);

  // Lifecycle logging
  useEffect(() => {
    logger.info('Inventory component mounted', { activeTab }, 'Inventory');
    return () => {
      logger.info('Inventory component unmounted', null, 'Inventory');
    };
  }, [activeTab]);

  // Filtered lists
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
        stockItemId: dish.stockItemId || '',
        fornecedorPadraoId: dish.fornecedorPadraoId || ''
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
        stockItemId: '',
        fornecedorPadraoId: ''
      });
    }
    setIsDishModalOpen(true);
  };

  const handleOpenCatModal = (cat?: MenuCategory) => {
    if (cat) {
      setEditingId(cat.id);
      setCatForm({
        ...cat,
        parentId: cat.parentId || '',
        isAvailableOnDigitalMenu: cat.isAvailableOnDigitalMenu !== false
      });
    } else {
      setEditingId(null);
      setCatForm({ name: '', icon: 'Grid3X3', parentId: '', isAvailableOnDigitalMenu: true });
    }
    setIsCatModalOpen(true);
  };

  const handleOpenStockModal = (item?: StockItem) => {
    if (item) {
      setEditingId(item.id);
      setStockForm({
        ...item
      });
    } else {
      setEditingId(null);
      setStockForm({
        name: '',
        quantity: 0,
        unit: 'un',
        minThreshold: 5
      });
    }
    setIsStockModalOpen(true);
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
      categoryName: selectedCat?.name || '',
      fornecedorPadraoId: dishForm.fornecedorPadraoId || ''
    } as Dish;

    if (editingId) {
      const existing = menu.find(d => d.id === editingId);
      const changedCategory = existing && existing.categoryId !== dishData.categoryId;
      if (changedCategory) {
        const ok = confirm(`Confirma mover "${existing?.name}" para a categoria "${selectedCat?.name}"?`);
        if (!ok) return;
      }
      logger.info('Atualizando produto', { dishId: editingId, name: dishData.name }, 'Inventory');
      updateDish(dishData);
      setIsDishModalOpen(false);
    } else {
      // Ensure ID generation for new dishes
      const newDish = {
        ...dishData,
        id: dishData.id || `dish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      };
      logger.info('Adicionando novo produto', { name: newDish.name }, 'Inventory');
      addDish(newDish);
      setIsDishModalOpen(false);
      setDishForm({
        name: '',
        description: '',
        price: 0,
        categoryId: dishForm.categoryId, 
        image: '',
        isAvailableOnDigitalMenu: true,
        taxCode: 'NOR',
        stockItemId: '',
        fornecedorPadraoId: ''
      });
    }
  };

  const handleSubmitCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name) return;

    const catData = {
      ...catForm,
      parentId: catForm.parentId === '' ? undefined : catForm.parentId
    } as Record<string, any>;

    if (editingId) {
      updateCategory({ ...catData, id: editingId } as MenuCategory);
      logger.info('Categoria atualizada', { id: editingId, name: catData.name, parentId: catData.parentId }, 'Inventory');
    } else {
      // Ensure ID generation for new categories
      const newCategory = {
        ...catData,
        id: Math.random().toString(36).substring(2, 11)
      } as MenuCategory;
      addCategory(newCategory);
      logger.info('Nova categoria adicionada', { name: newCategory.name, parentId: newCategory.parentId }, 'Inventory');
    }
    setIsCatModalOpen(false);
  };

  const handleSubmitStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockForm.name) return;

    const stockData = {
      ...stockForm,
      quantity: Number(stockForm.quantity || 0),
      minThreshold: Number(stockForm.minThreshold || 0)
    } as StockItem;

    if (editingId) {
      updateStockItem({ ...stockData, id: editingId });
      logger.info('Item de stock atualizado', { id: editingId, name: stockData.name }, 'Inventory');
    } else {
      addStockItem(stockData);
      logger.info('Novo item de stock adicionado', { name: stockData.name }, 'Inventory');
    }
    setIsStockModalOpen(false);
  };

  const handleDeleteStock = (id: string) => {
    if (confirm('Tem a certeza que deseja remover este item de stock? Esta ação não pode ser desfeita.')) {
      removeStockItem(id);
    }
  };

  const handleDuplicateDish = (dish: Dish) => {
    const newDish = {
      ...dish,
      name: `${dish.name} (Cópia)`,
      id: Math.random().toString(36).substring(2, 11)
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

  const formatKz = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
  };

  const getAutomaticIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('bebida') || n.includes('vinho') || n.includes('cerveja') || n.includes('sumo') || n.includes('água')) return 'Beer';
    if (n.includes('sobremesa') || n.includes('doce') || n.includes('gelado') || n.includes('bolo')) return 'IceCream';
    if (n.includes('café') || n.includes('chá') || n.includes('pequeno almoço')) return 'Coffee';
    if (n.includes('prato') || n.includes('carne') || n.includes('peixe') || n.includes('bitoque') || n.includes('hambúrguer')) return 'Pizza';
    return 'Grid3X3';
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

  const handleOptimizeImages = async () => {
    if (!confirm('Esta ação irá otimizar todas as imagens dos produtos para melhorar a sincronização com o Menu Digital. O processo pode levar alguns segundos. Deseja continuar?')) return;
    
    setIsOptimizing(true);
    let count = 0;
    
    try {
      const updatedMenu = await Promise.all(menu.map(async (dish) => {
        if (dish.image && dish.image.startsWith('data:image') && dish.image.length > 200000) {
           try {
             const compressed = await compressImage(dish.image);
             // Only update if compression actually reduced size
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

  const handleRestoreCategories = async () => {
    if (confirm('Esta ação tentará localizar categorias removidas em logs e backups e restaurá-las automaticamente. Deseja continuar?')) {
      await scanAndRecoverCategories();
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await triggerSync();
      addNotification('success', 'Sincronização forçada concluída com sucesso!');
    } catch {
      addNotification('error', 'Falha na sincronização forçada.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportFeed = () => {
    const feed = buildFeed(categories, menu, useStore.getState().settings);
    downloadFeed(feed, 'menu_feed.json');
    addNotification('success', 'Feed JSON do menu exportado.');
  };

  const handlePublishFeed = async () => {
    const res = await publishFeedHybrid(categories, menu, useStore.getState().settings);
    if (res.success) {
      addNotification('success', res.path ? `Feed JSON salvo em: ${res.path}` : 'Feed JSON salvo localmente');
    } else {
      addNotification('error', res.message || 'Falha ao publicar feed JSON');
    }
  };

  return (
    <div className="p-6 bg-background h-full overflow-y-auto font-sans flex flex-col">
      <header className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Produtos & Stock</h2>
          <p className="text-slate-400 text-sm mt-1">Gerencie o cardápio, categorias e inventário.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleForceSync}
            disabled={isSyncing}
            className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold uppercase text-[10px] tracking-widest border border-primary/20"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Cloud'}
          </button>
          <button 
            onClick={handleExportFeed}
            className="bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold uppercase text-[10px] tracking-widest border border-white/5"
          >
            <Upload size={14} />
            Exportar Menu JSON
          </button>
          <button 
            onClick={handlePublishFeed}
            className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold uppercase text-[10px] tracking-widest border border-primary/20"
          >
            <Upload size={14} />
            Publicar Menu (Hybrid)
          </button>
          {activeTab === 'menu' && (
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
          )}
          <button 
            onClick={() => {
              if (activeTab === 'menu') handleOpenDishModal();
              else if (activeTab === 'categories') handleOpenCatModal();
              else if (activeTab === 'stock') handleOpenStockModal();
            }}
            className={`bg-primary text-black px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-glow hover:scale-105 transition-all font-black uppercase text-xs tracking-widest ${activeTab === 'orders' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Plus size={18} />
            {activeTab === 'menu' ? 'Novo Prato' : activeTab === 'categories' ? 'Nova Categoria' : 'Novo Item'}
          </button>
          
          {activeTab === 'categories' && (
             <button 
               onClick={handleRestoreCategories}
               className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold uppercase text-[10px] tracking-widest border border-yellow-500/20"
               title="Tentar recuperar categorias perdidas"
             >
               <RefreshCw size={16} />
               Restaurar
             </button>
          )}
        </div>
      </header>

      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-2 pt-2 mb-6 border-b border-white/10">
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'menu', label: 'Produtos', icon: Utensils },
            { id: 'categories', label: 'Categorias', icon: Tag },
            { id: 'integrity', label: 'Integridade', icon: Check },
            { id: 'stock', label: 'Estoque', icon: Box }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'menu' | 'categories' | 'integrity' | 'stock' | 'orders')}
              className={`pb-2 px-4 flex items-center gap-2 transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-primary' : 'text-slate-400 hover:text-white'}`}
            >
              {(() => {
              const Icon = tab.icon;
              return <Icon size={18} />;
            })()}
              <span className="font-bold uppercase text-xs tracking-widest">{tab.label}</span>
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-glow"></div>}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'menu' && (
        <div className="flex-1 flex flex-col">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar produtos..." 
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
              {categories.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-slate-900">{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
            {filteredMenu.map(dish => (
              <div key={dish.id} className="glass-panel p-4 rounded-3xl border border-white/5 flex flex-col gap-4 group hover:border-primary/30 transition-all">
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
                <p className="text-slate-400">Nenhum item de stock encontrado.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name)).map(cat => {
            const iconObj = AVAILABLE_ICONS.find(i => i.name === cat.icon);
            const IconComp = iconObj ? iconObj.icon : Grid3X3;
            return (
            <div key={cat.id} className="glass-panel p-6 rounded-[2rem] border border-white/5 flex items-center justify-between hover:border-primary/40 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                   <IconComp size={20} />
                </div>
                <div>
                   <h3 className="font-bold text-white text-lg tracking-tight leading-none">{cat.name}</h3>
                   <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                      {menu.filter(d => d.categoryId === cat.id).length} Produtos
                   </p>
                </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => handleOpenCatModal(cat)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"><Edit2 size={14}/></button>
                 <button onClick={() => removeCategory(cat.id)} className="p-2 rounded-lg text-red-500/50 hover:text-red-500 hover:bg-red-500/10"><Trash2 size={14}/></button>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {activeTab === 'integrity' && (
        <div className="flex-1 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2">
                <Check size={28} />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Saúde do Inventário</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Execute diagnósticos para encontrar produtos sem categoria, imagens ausentes ou erros de stock.
              </p>
              <button 
                onClick={runIntegrityDiagnostics}
                disabled={isDiagnosing}
                className="mt-4 bg-primary text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-glow hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                {isDiagnosing ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                {isDiagnosing ? 'Analisando...' : 'Iniciar Diagnóstico'}
              </button>
            </div>

            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-2">
                <RefreshCw size={28} />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Limpeza Segura</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Remove referências órfãs e dados temporários inconsistentes sem afetar suas vendas.
              </p>
              <button 
                onClick={async () => {
                  if (confirm('Esta ação removerá referências órfãs e dados inconsistentes com segurança. Deseja continuar?')) {
                    setIsRepairing(true);
                    try {
                      await performSafeCleanup();
                    } catch (error) {
                      console.error('Limpeza rápida falhou:', error);
                    } finally {
                      setIsRepairing(false);
                    }
                  }
                }}
                disabled={isRepairing}
                className={`mt-4 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border transition-all flex items-center justify-center gap-2 ${
                  isRepairing 
                    ? 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
                    : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border-white/10'
                }`}
              >
                {isRepairing && activeTab === 'integrity' ? <RefreshCw size={14} className="animate-spin" /> : null}
                Limpeza Rápida
              </button>
            </div>

            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-4">
              <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 mb-2">
                <Box size={28} />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Correções Inteligentes</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Tenta corrigir automaticamente problemas comuns detectados no diagnóstico anterior.
              </p>
              <button 
                onClick={async () => {
                  if (confirm('Esta ação tentará corrigir automaticamente todos os problemas detectados. Deseja continuar?')) {
                    setIsRepairing(true);
                    try {
                      await performSafeCleanup();
                    } catch (error) {
                      console.error('Auto-reparar falhou:', error);
                    } finally {
                      setIsRepairing(false);
                    }
                  }
                }}
                disabled={integrityIssues.length === 0 || isRepairing}
                className={`mt-4 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border transition-all flex items-center justify-center gap-2 ${
                  integrityIssues.length > 0 && !isRepairing
                    ? 'bg-yellow-500 text-black border-yellow-500 hover:scale-105 shadow-glow-yellow active:scale-95' 
                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 opacity-50 cursor-not-allowed'
                }`}
              >
                {isRepairing ? <RefreshCw size={14} className="animate-spin" /> : null}
                {isRepairing ? 'Reparando...' : 'Auto-Reparar'}
              </button>
            </div>
          </div>

          <div className="glass-panel flex-1 rounded-[2.5rem] border border-white/5 p-8 overflow-hidden flex flex-col">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <AlertCircle size={14} /> Resultados do Diagnóstico
            </h4>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 no-scrollbar">
              {integrityIssues.length > 0 ? (
                integrityIssues.map((issue, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-5 rounded-2xl border ${issue.severity === 'high' ? 'bg-red-500/5 border-red-500/20' : issue.severity === 'medium' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-white/5 border-white/5'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${issue.severity === 'high' ? 'text-red-500' : issue.severity === 'medium' ? 'text-yellow-500' : 'text-slate-400'}`}>
                        <AlertCircle size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{issue.message}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-black mt-1">Acção recomendada: {issue.action}</p>
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        if (issue.action === 'FixCategory') {
                          setActiveTab('categories');
                        } else if (issue.action === 'AddImages') {
                          setActiveTab('menu');
                        } else if (issue.action === 'RepairStockRefs') {
                          setIsRepairing(true);
                          try {
                            await performSafeCleanup();
                          } finally {
                            setIsRepairing(false);
                          }
                        }
                      }}
                      disabled={isRepairing}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black text-white uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      {isRepairing && issue.action === 'RepairStockRefs' ? <RefreshCw size={10} className="animate-spin inline mr-1" /> : null}
                      {issue.action === 'FixCategory' ? 'Ver Categorias' : issue.action === 'AddImages' ? 'Ver Menu' : 'Corrigir Agora'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4 opacity-50">
                  <Check size={48} />
                  <p className="text-sm font-bold uppercase tracking-widest">Nenhum problema pendente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="flex-1 flex flex-col">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar no estoque..." 
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:border-primary transition-all text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
            {stock.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name)).map(item => (
              <div key={item.id} className="glass-panel p-6 rounded-[2rem] border border-white/5 flex flex-col gap-4 hover:border-primary/40 transition-all group">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                    <Box size={24} />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenStockModal(item)} className="p-2 text-slate-400 hover:text-white transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => handleDeleteStock(item.id)} className="p-2 text-red-500/50 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-white text-lg truncate mb-1">{item.name}</h3>
                  <div className="flex items-end gap-2">
                    <span className={`text-2xl font-black ${item.quantity <= item.minThreshold ? 'text-red-500' : 'text-primary'}`}>
                      {item.quantity}
                    </span>
                    <span className="text-slate-500 font-bold uppercase text-[10px] mb-1.5">{item.unit}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">Mínimo Crítico</span>
                    <span className="text-white">{item.minThreshold} {item.unit}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateStockQuantity(item.id, -1)}
                      className="flex-1 py-2 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-xl transition-all font-black text-lg"
                    >
                      -
                    </button>
                    <button 
                      onClick={() => updateStockQuantity(item.id, 1)}
                      className="flex-1 py-2 bg-white/5 hover:bg-green-500/20 text-slate-400 hover:text-green-500 rounded-xl transition-all font-black text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {stock.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                  <Box size={32} />
                </div>
                <p className="text-slate-400">Nenhum item cadastrado no estoque.</p>
                <button onClick={() => handleOpenStockModal()} className="mt-4 text-primary font-bold uppercase text-xs tracking-widest hover:underline">Adicionar Primeiro Item</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dish Modal */}
      {isDishModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel rounded-[3rem] w-full max-w-2xl p-10 border border-white/10 shadow-2xl relative overflow-y-auto max-h-[90vh] no-scrollbar">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
               <button onClick={() => setIsDishModalOpen(false)} className="text-slate-500 hover:text-white"><X /></button>
            </div>
            <form onSubmit={handleSubmitDish} className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do Prato</label>
                    <input required type="text" placeholder="Ex: Bitoque da Casa" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary" value={dishForm.name} onChange={e => setDishForm({...dishForm, name: e.target.value})} />
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição</label>
                    <textarea placeholder="Ingredientes e detalhes..." rows={3} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary resize-none" value={dishForm.description} onChange={e => setDishForm({...dishForm, description: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Preço (Kz)</label>
                      <input required type="number" min="0" placeholder="0" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary font-mono" value={dishForm.price} onChange={e => setDishForm({...dishForm, price: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoria</label>
                    <select required className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary appearance-none cursor-pointer" value={dishForm.categoryId} onChange={e => setDishForm({...dishForm, categoryId: e.target.value})}>
                      {categories.slice().sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-slate-900">{cat.name}</option>
                      ))}
                    </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Item de Stock Associado (Controlo de Inventário)</label>
                    <select 
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary appearance-none cursor-pointer" 
                      value={dishForm.stockItemId || ''} 
                      onChange={e => setDishForm({...dishForm, stockItemId: e.target.value})}
                    >
                      <option value="" className="bg-slate-900 text-slate-400">-- Sem controlo de stock --</option>
                      {stock.slice().sort((a, b) => a.name.localeCompare(b.name)).map(item => (
                        <option key={item.id} value={item.id} className="bg-slate-900">
                          {item.name} ({item.quantity} {item.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Fornecedor Padrão</label>
                    <select 
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary appearance-none cursor-pointer" 
                      value={dishForm.fornecedorPadraoId || ''} 
                      onChange={e => setDishForm({...dishForm, fornecedorPadraoId: e.target.value})}
                    >
                      <option value="" className="bg-slate-900 text-slate-400">-- Selecione um fornecedor --</option>
                      {suppliers.filter(s => s.ativo).sort((a, b) => a.nome.localeCompare(b.nome)).map(s => (
                        <option key={s.id} value={s.id} className="bg-slate-900">
                          {s.nome} {s.categoria ? `(${s.categoria})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                     <div 
                        className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all select-none"
                        onClick={() => setDishForm(prev => ({...prev, isAvailableOnDigitalMenu: !prev.isAvailableOnDigitalMenu}))}
                     >
                        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${dishForm.isAvailableOnDigitalMenu ? 'bg-primary border-primary text-black' : 'border-slate-600'}`}>
                           {dishForm.isAvailableOnDigitalMenu && <Check size={14} />}
                        </div>
                        <span className="text-xs font-bold text-white uppercase tracking-wide">Visível no Menu Digital</span>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col h-full">
                 <div className="space-y-4 mb-6">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Imagem do Prato</label>
                    <div className="aspect-video rounded-3xl bg-black/40 border-2 border-dashed border-white/10 relative overflow-hidden group hover:border-primary/50 transition-all">
                        {dishForm.image ? (
                          <>
                            <img src={dishForm.image} alt="Preview" className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={(e) => { e.preventDefault(); setDishForm({...dishForm, image: ''}); }}
                              className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                            <ImageIcon size={32} className="mb-2 opacity-50" />
                            <p className="text-[10px] text-slate-500 uppercase font-black">Nenhuma Imagem</p>
                          </div>
                        )}
                        <button 
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2"
                        >
                          <Upload size={24} className="text-primary" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Carregar Ficheiro Local</span>
                        </button>
                    </div>
                    <input 
                      type="file" 
                      hidden 
                      ref={fileInputRef} 
                      accept="image/png, image/jpeg, image/webp" 
                      onChange={handleFileChange} 
                    />
                 </div>

                 <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Ou Link Externo (URL)</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                      <input 
                        type="text" 
                        placeholder="https://exemplo.com/imagem.jpg"
                        className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary text-xs" 
                        value={dishForm.image?.startsWith('data:') ? '' : dishForm.image} 
                        onChange={e => setDishForm({...dishForm, image: e.target.value})} 
                      />
                    </div>
                 </div>

                 <button type="submit" className="w-full py-5 bg-primary text-black rounded-[1.5rem] font-black uppercase tracking-widest shadow-glow flex items-center justify-center gap-3 mt-auto">
                    <Save size={18} /> Guardar Produto
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel rounded-[3rem] w-full max-w-md p-10 border border-white/10 shadow-2xl relative text-center">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{editingId ? 'Editar Categoria' : 'Nova Categoria'}</h3>
               <button onClick={() => setIsCatModalOpen(false)} className="text-slate-500 hover:text-white"><X /></button>
            </div>
            <form onSubmit={handleSubmitCat} className="space-y-6">
               <div className="space-y-4 text-left">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome da Categoria</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Ex: Grelhados no Carvão" 
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary" 
                    value={catForm.name} 
                    onChange={e => {
                       const newName = e.target.value;
                       setCatForm(prev => ({
                         ...prev,
                         name: newName,
                         icon: (prev.icon === 'Grid3X3' || !prev.icon) ? getAutomaticIcon(newName) : prev.icon
                       }));
                    }} 
                  />
               </div>

               <div className="space-y-4 text-left">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoria Superior (Opcional)</label>
                  <select 
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary appearance-none cursor-pointer" 
                    value={catForm.parentId || ''} 
                    onChange={e => setCatForm({...catForm, parentId: e.target.value})}
                  >
                    <option value="" className="bg-slate-900 text-slate-400">-- Sem categoria superior --</option>
                    {categories.filter(c => c.id !== editingId).sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-slate-900">{cat.name}</option>
                    ))}
                  </select>
               </div>

               <div className="space-y-4 text-left">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Ícone</label>
                  <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto no-scrollbar p-1">
                    {AVAILABLE_ICONS.map(item => (
                       <button
                         key={item.name}
                         type="button"
                         onClick={() => setCatForm({...catForm, icon: item.name})}
                         className={`aspect-square rounded-xl flex items-center justify-center border transition-all ${catForm.icon === item.name ? 'bg-primary text-black border-primary' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
                         title={item.label}
                       >
                         <item.icon size={20} />
                       </button>
                    ))}
                  </div>
               </div>

               <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Menu Digital</span>
                    <span className="text-[9px] text-slate-400">Mostrar esta categoria no QR Menu</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCatForm({...catForm, isAvailableOnDigitalMenu: !catForm.isAvailableOnDigitalMenu})}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${catForm.isAvailableOnDigitalMenu ? 'bg-primary shadow-glow' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${catForm.isAvailableOnDigitalMenu ? 'right-1' : 'left-1'}`} />
                  </button>
               </div>

               <button type="submit" className="w-full py-5 bg-primary text-black rounded-[1.5rem] font-black uppercase tracking-widest shadow-glow flex items-center justify-center gap-3">
                  <Save size={18} /> Confirmar Categoria
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Stock Modal */}
      {isStockModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel rounded-[3rem] w-full max-w-md p-10 border border-white/10 shadow-2xl relative text-center">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{editingId ? 'Editar Item' : 'Novo Item de Stock'}</h3>
               <button onClick={() => setIsStockModalOpen(false)} className="text-slate-500 hover:text-white"><X /></button>
            </div>
            <form onSubmit={handleSubmitStock} className="space-y-6">
               <div className="space-y-4 text-left">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do Item</label>
                  <input required type="text" placeholder="Ex: Batata Congelada" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary" value={stockForm.name} onChange={e => setStockForm({...stockForm, name: e.target.value})} />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4 text-left">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantidade</label>
                    <input required type="number" step="0.01" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary font-mono" value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-4 text-left">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Unidade</label>
                    <select className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary appearance-none cursor-pointer" value={stockForm.unit} onChange={e => setStockForm({...stockForm, unit: e.target.value})}>
                      <option value="un">Unidades (un)</option>
                      <option value="kg">Quilos (kg)</option>
                      <option value="lt">Litros (lt)</option>
                      <option value="cx">Caixas (cx)</option>
                      <option value="pct">Pacotes (pct)</option>
                    </select>
                  </div>
               </div>

               <div className="space-y-4 text-left">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Stock Mínimo (Alerta)</label>
                  <input required type="number" step="0.01" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary font-mono" value={stockForm.minThreshold} onChange={e => setStockForm({...stockForm, minThreshold: Number(e.target.value)})} />
               </div>

               <button type="submit" className="w-full py-5 bg-primary text-black rounded-[1.5rem] font-black uppercase tracking-widest shadow-glow flex items-center justify-center gap-3">
                  <Save size={18} /> Guardar Item
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
