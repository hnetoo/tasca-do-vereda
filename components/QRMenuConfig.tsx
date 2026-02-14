import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { QrCode, RefreshCw, ExternalLink, Globe, Wifi, Search, Eye, EyeOff, Edit2, Trash2, Plus, Image as ImageIcon, Cloud, Monitor, X, Save, Book, AlertCircle, UtensilsCrossed, Coffee, Wine, IceCream, Sandwich, Fish, Beef, Pizza, Soup, Beer, Cake, Wheat } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Dish } from '../types';
import { downloadManual } from '../services/manualService';

interface QRMenuConfigProps {
  isOpen: boolean;
  onClose: () => void;
}

const getCategoryIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('cerveja') || n.includes('beer') || n.includes('chope')) return <Beer size={16} />;
  if (n.includes('vinho') || n.includes('wine') || n.includes('espumante')) return <Wine size={16} />;
  if (n.includes('bebida') || n.includes('drink') || n.includes('suco') || n.includes('refrigerante') || n.includes('bar')) return <Wine size={16} />;
  if (n.includes('pizza')) return <Pizza size={16} />;
  if (n.includes('hamburguer') || n.includes('burger') || n.includes('sandes') || n.includes('tosta') || n.includes('wrap')) return <Sandwich size={16} />;
  if (n.includes('sopa') || n.includes('caldo') || n.includes('creme')) return <Soup size={16} />;
  if (n.includes('massa') || n.includes('pasta') || n.includes('esparguete') || n.includes('arroz') || n.includes('risotto')) return <Wheat size={16} />;
  if (n.includes('carne') || n.includes('bife') || n.includes('churrasco') || n.includes('picanha') || n.includes('steak')) return <Beef size={16} />;
  if (n.includes('peixe') || n.includes('marisco') || n.includes('sushi') || n.includes('bacalhau') || n.includes('camarão') || n.includes('polvo')) return <Fish size={16} />;
  if (n.includes('sobremesa') || n.includes('doce') || n.includes('gelado') || n.includes('sorvete')) return <IceCream size={16} />;
  if (n.includes('bolo') || n.includes('torta') || n.includes('fatia')) return <Cake size={16} />;
  if (n.includes('café') || n.includes('pequeno-almoço') || n.includes('chá') || n.includes('tea') || n.includes('latte')) return <Coffee size={16} />;
  if (n.includes('entrada') || n.includes('petisco')) return <UtensilsCrossed size={16} />;
  return <UtensilsCrossed size={16} />;
};

const ensureMenuPath = (url: string) => {
  if (!url) return '';
  const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const [base] = withProtocol.split('#');
  const cleanBase = base.replace(/\/$/, '');
  return `${cleanBase}/#/menu/public`;
};

const QRMenuConfig: React.FC<QRMenuConfigProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, addNotification, menu, categories, updateDish, removeDish, addDish } = useStore();
  const [activeTab, setActiveTab] = useState<'qrcode' | 'manager'>('manager');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // QR Code States
  const [urlMode, setUrlMode] = useState<'local' | 'cloud'>('cloud');
  const [localUrl, setLocalUrl] = useState(settings.qrMenuUrl || '');
  const [cloudUrl, setCloudUrl] = useState('');
  
  const [shortCode, setShortCode] = useState(settings.qrMenuShortCode || generateShortCode());
  const [title, setTitle] = useState(settings.qrMenuTitle || '');
  const [subtitle, setSubtitle] = useState(settings.qrMenuSubtitle || '');
  const [logoUrl, setLogoUrl] = useState(settings.qrMenuLogo || '');
  
  // Menu Manager States
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dishForm, setDishForm] = useState<Partial<Dish>>({
    name: '', price: 0, categoryId: '', description: '', image: ''
  });
  
  // Ref for QR Code Download
  const qrRef = useRef<HTMLDivElement>(null);

  // Deduplicate categories to prevent selection glitches
  const safeCategories = React.useMemo(() => {
    const seenIds = new Set<string>();
    return categories.map((cat, index) => {
      let id = cat.id;
      // Handle missing IDs
      if (!id || id === 'undefined' || id === 'null') {
          id = `fixed_${index}_${(cat.name || 'sem_nome').replace(/\s+/g, '_').toLowerCase()}`;
      } else if (seenIds.has(id)) {
           // Handle duplicate IDs
           id = `${id}_dup_${index}`;
      }
      seenIds.add(id);
      return { ...cat, id, originalId: cat.id };
    });
  }, [categories]);

  useEffect(() => {
    if (isOpen) {
      setLocalUrl(settings.qrMenuUrl || `${getBaseUrl()}/#/menu/public`);
      
      // Initialize Cloud URL
      if (settings.qrMenuCloudUrl) {
        setCloudUrl(settings.qrMenuCloudUrl);
        setUrlMode('cloud');
      } else {
        setUrlMode('local');
      }

      setShortCode(settings.qrMenuShortCode || (settings.qrMenuShortCode ? settings.qrMenuShortCode : generateShortCode()));
      setTitle(settings.qrMenuTitle || '');
      setSubtitle(settings.qrMenuSubtitle || '');
      setLogoUrl(settings.qrMenuLogo || '');
    }
  }, [isOpen, settings]);

  function generateShortCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  const getBaseUrl = () => {
    return window.location.href.split('#')[0].replace(/\/$/, '');
  };

  const currentQrUrl = urlMode === 'cloud' 
    ? ensureMenuPath(cloudUrl) 
    : ensureMenuPath(localUrl);

  const validateUrl = (url: string) => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSaveConfig = async () => {
    if (currentQrUrl && !validateUrl(currentQrUrl)) {
      addNotification('error', 'URL inválida. Deve começar com http:// ou https://');
      return;
    }

    setIsSyncing(true);
    try {
      const updatedSettings = {
        ...settings,
        qrMenuUrl: ensureMenuPath(localUrl),
        qrMenuCloudUrl: ensureMenuPath(cloudUrl),
        qrMenuShortCode: shortCode,
        qrMenuTitle: title,
        qrMenuSubtitle: subtitle,
        qrMenuLogo: logoUrl
      };

      await updateSettings(updatedSettings);

      // Force a manual sync if supabase is enabled
      if (settings.supabaseConfig?.enabled) {
        const { supabaseService } = await import('../services/supabaseService');
        if (supabaseService.isConnected()) {
          addNotification('info', 'Sincronizando com a nuvem...');
          const result = await supabaseService.syncSettings(updatedSettings);
          if (!result.success) {
            console.error('Cloud sync failed:', (result as { error?: string }).error || 'Unknown error');
            addNotification('warning', 'Salvo localmente, mas falhou ao sincronizar com a nuvem.');
          } else {
            addNotification('success', 'Configuração salva e sincronizada!');
          }
        } else {
          addNotification('success', 'Configuração salva localmente.');
        }
      } else {
        addNotification('success', 'Configuração salva com sucesso.');
      }
    } catch (error) {
      console.error('Save failed:', error);
      addNotification('error', 'Erro ao salvar configurações.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentQrUrl);
      addNotification('success', 'URL copiada para a área de transferência');
    } catch {
      addNotification('error', 'Erro ao copiar URL');
    }
  };

  const handleDownloadGuide = async () => {
    try {
      await downloadManual('ADMIN');
      addNotification('success', 'Guia salvo com sucesso na pasta Downloads');
    } catch (error) {
      console.error('Erro ao baixar guia:', error);
      addNotification('error', 'Erro ao gerar o guia');
    }
  };

  const handleDownloadQR = () => {
    try {
      const canvas = qrRef.current?.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `qr-menu-${settings.restaurantName || 'tasca'}-${urlMode}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addNotification('success', 'QR Code baixado');
      } else {
        addNotification('error', 'Erro ao gerar imagem do QR Code');
      }
    } catch (e) {
      console.error('Download failed:', e);
      addNotification('error', 'Erro ao baixar QR Code');
    }
  };

  const handleOpenMenu = async () => {
    try {
      // Try Tauri Shell first
      const { open } = await import('@tauri-apps/plugin-shell');
      await open(currentQrUrl);
    } catch (e) {
      console.warn('Tauri shell plugin not found, falling back to window.open', e);
      window.open(currentQrUrl, '_blank');
    }
  };

  const handleResetUrl = () => {
    if (confirm('Tem certeza? Isso irá resetar a URL para o padrão.')) {
        const newShortCode = generateShortCode();
        
        // Reset to default local URL
        const defaultUrl = 'https://seu-dominio.com';
        setLocalUrl(defaultUrl);
        
        updateSettings({
            qrMenuUrl: defaultUrl,
            qrMenuShortCode: newShortCode,
            lastQRCodeUpdate: new Date()
        });
        
        addNotification('success', 'URL resetada para o padrão!');
    }
  };
  
  // Menu Manager Logic
  const filteredDishes = menu.filter(dish => {
    let matchesCategory = false;
    
    if (selectedCategory === 'TODOS') {
      matchesCategory = true;
    } else {
      const activeCat = safeCategories.find(c => c.id === selectedCategory);
      if (activeCat) {
        // If we found the category object, use its ID logic
        if (activeCat.id.startsWith('fixed_') || activeCat.id.includes('_dup_')) {
           // For modified categories (fixed or dup), we must check originalId
           if (!activeCat.originalId || activeCat.originalId === 'undefined' || activeCat.originalId === 'null') {
               // Matches dishes with no category or undefined/null category
               matchesCategory = !dish.categoryId || dish.categoryId === 'undefined' || dish.categoryId === 'null';
           } else {
               // Matches dishes with specific originalId
               matchesCategory = String(dish.categoryId) === String(activeCat.originalId);
           }
        } else {
           // Standard category, match by ID
           matchesCategory = (dish.categoryId !== undefined && dish.categoryId !== null && String(dish.categoryId) === String(activeCat.id));
        }
      } else {
        // Fallback: direct string match if category object not found
        matchesCategory = String(dish.categoryId) === String(selectedCategory);
      }
    }

    const matchesSearch = (dish.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const handleToggleVisibility = (dishId: string, currentStatus?: boolean) => {
    const dish = menu.find(d => d.id === dishId);
    if (dish) {
      updateDish({ ...dish, isAvailableOnDigitalMenu: !currentStatus });
      addNotification('success', 'Visibilidade atualizada');
    }
  };

  // Dish Modal Handlers
  const handleOpenDishModal = (dish?: Dish) => {
    if (dish) {
      setEditingId(dish.id);
      setDishForm({ ...dish });
    } else {
      setEditingId(null);
      setDishForm({
        name: '', price: 0, categoryId: categories[0]?.id || '',
        description: '', image: '', taxCode: 'NOR', isAvailableOnDigitalMenu: true
      });
    }
    setIsDishModalOpen(true);
  };

  const handleSubmitDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishForm.name || !dishForm.price || !dishForm.categoryId) {
      addNotification('error', 'Preencha os campos obrigatórios');
      return;
    }

    const defaultImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';
    const finalImage = dishForm.image || defaultImage;

    if (editingId) {
      const existingDish = menu.find(d => d.id === editingId);
      if (existingDish) {
        updateDish({ ...existingDish, ...dishForm, image: finalImage } as Dish);
        addNotification('success', 'Prato atualizado com sucesso');
      }
    } else {
      addDish({
        id: `dish-${Date.now()}`,
        name: dishForm.name,
        price: Number(dishForm.price),
        categoryId: dishForm.categoryId,
        description: dishForm.description || '',
        image: finalImage,
        taxCode: dishForm.taxCode || 'NOR',
        isAvailableOnDigitalMenu: true,
        available: true
      } as unknown as Dish);
      addNotification('success', 'Prato criado com sucesso');
    }
    setIsDishModalOpen(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if Supabase is enabled and connected
    if (settings.supabaseConfig?.enabled) {
      const { supabaseService } = await import('../services/supabaseService');
      if (supabaseService.isConnected()) {
        addNotification('info', 'Fazendo upload da imagem para a nuvem...');
        const fileName = `dish-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const result = await supabaseService.uploadFile('menu-images', fileName, file);
        
        if (result.success) {
          setDishForm(prev => ({ ...prev, image: (result as { publicUrl?: string }).publicUrl }));
          addNotification('success', 'Imagem enviada para a nuvem com sucesso!');
          return;
        } else {
          console.error('Upload failed:', (result as { error?: string }).error || 'Unknown error');
          addNotification('warning', 'Falha no upload para a nuvem. Usando versão local.');
        }
      }
    }

    // Fallback to Base64 for local-only or failed upload
    const reader = new FileReader();
    reader.onloadend = () => {
      setDishForm(prev => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-6 backdrop-blur-md">
      <div className="glass-panel rounded-[3rem] w-full max-w-6xl p-8 border border-white/10 shadow-2xl h-[90vh] flex flex-col relative">
        
        {/* Header with Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 shrink-0">
          <div className="flex items-center gap-3">
            <QrCode size={32} className="text-primary" />
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase">Gestão da Ementa Digital</h2>
              <p className="text-xs text-slate-400">Organize, edite e escolha o que aparece no QR Code</p>
            </div>
          </div>
          
          <div className="flex bg-slate-900/50 p-1.5 rounded-xl border border-white/5">
            <button 
              onClick={() => setActiveTab('manager')}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'manager' 
                  ? 'bg-primary text-black shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Gestão de Itens
            </button>
            <button 
              onClick={() => setActiveTab('qrcode')}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'qrcode' 
                  ? 'bg-primary text-black shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Configuração & QR Code
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          
          {/* TAB: MANAGER */}
          {activeTab === 'manager' && (
            <div className="h-full flex animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden rounded-2xl border border-white/5">
              
              {/* LEFT SIDEBAR - CATEGORIES */}
              <div className="w-64 border-r border-white/5 bg-slate-900/30 flex flex-col shrink-0">
                  <div className="p-4 border-b border-white/5">
                      <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Categorias</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    <button 
                      onClick={() => setSelectedCategory('TODOS')}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-3 group ${
                        selectedCategory === 'TODOS' ? 'bg-primary text-black shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <UtensilsCrossed size={16} />
                      <span className="flex-1">Todos</span>
                      {selectedCategory === 'TODOS' && <div className="w-1.5 h-1.5 rounded-full bg-black/50" />}
                    </button>
                    {safeCategories.map(cat => (
                      <button 
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-3 group ${
                          selectedCategory === cat.id ? 'bg-primary text-black shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {getCategoryIcon(cat.name)}
                        <span className="truncate flex-1">{cat.name}</span>
                        {selectedCategory === cat.id && <div className="w-1.5 h-1.5 rounded-full bg-black/50" />}
                      </button>
                    ))}
                  </div>
              </div>

              {/* RIGHT CONTENT - DISHES */}
              <div className="flex-1 flex flex-col min-w-0 bg-black/20">
                  {/* Header Actions */}
                  <div className="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/20">
                      <div className="relative flex-1 w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input 
                          type="text" 
                          placeholder="Buscar pratos..." 
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-all placeholder:text-slate-600"
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                        />
                      </div>
                      
                      <div className="flex gap-2 shrink-0 w-full md:w-auto justify-end">
                         <button 
                            onClick={handleResetUrl}
                            className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all border border-red-500/50 text-red-400 bg-red-500/10 hover:bg-red-500/20"
                            title="Resetar URL e Código"
                         >
                            <RefreshCw size={14} /> Reset
                         </button>

                        <button 
                          onClick={() => handleOpenDishModal()}
                          className="px-4 py-2 bg-primary text-black rounded-xl font-bold text-xs flex items-center gap-2 hover:brightness-110 transition-all shadow-glow"
                        >
                          <Plus size={14} /> Novo
                        </button>
                      </div>
                  </div>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
                    {filteredDishes.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                        <Search size={48} className="mb-4 opacity-50" />
                        <p className="font-medium">Nenhum item encontrado.</p>
                      </div>
                    ) : (
                      filteredDishes.map(dish => (
                        <div key={dish.id} className="group flex flex-col md:flex-row items-start md:items-center justify-between p-3 bg-slate-900/40 border border-white/5 rounded-xl hover:bg-slate-900/80 hover:border-primary/20 transition-all gap-4 md:gap-0">
                          <div className="flex items-center gap-4 overflow-hidden w-full md:w-auto">
                            <div className="w-12 h-12 rounded-lg bg-slate-800 shrink-0 overflow-hidden relative border border-white/5">
                               {dish.image ? (
                                 <img src={dish.image} crossOrigin="anonymous" alt={dish.name} className="w-full h-full object-cover" />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center text-slate-600">
                                   <ImageIcon size={20} />
                                 </div>
                               )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-white text-sm truncate group-hover:text-primary transition-colors">{dish.name}</h4>
                              <p className="text-[10px] text-slate-500 truncate">{dish.description || 'Sem descrição'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between w-full md:w-auto gap-6 shrink-0 md:pl-4 border-t border-white/5 md:border-0 pt-3 md:pt-0">
                            <span className="font-mono font-bold text-primary text-sm">
                              {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(dish.price)}
                            </span>
                            
                            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                              <button 
                                onClick={() => handleToggleVisibility(dish.id, dish.isAvailableOnDigitalMenu)}
                                className={`p-2 rounded-md transition-all ${
                                  dish.isAvailableOnDigitalMenu !== false 
                                    ? 'text-green-400 bg-green-400/10 hover:bg-green-400/20' 
                                    : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'
                                }`}
                                title={dish.isAvailableOnDigitalMenu !== false ? "Visível no Menu Digital" : "Oculto no Menu Digital"}
                              >
                                {dish.isAvailableOnDigitalMenu !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                              </button>
                              <div className="w-px h-4 bg-white/10 mx-1"></div>
                              <button 
                                onClick={() => handleOpenDishModal(dish)}
                                className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-md transition-all"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => removeDish(dish.id)}
                                className="p-2 text-red-400 hover:bg-red-400/10 rounded-md transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
              </div>
            </div>
          )}

          {/* TAB: QR CODE CONFIG */}
          {activeTab === 'qrcode' && (
            <div className="h-full overflow-y-auto pr-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Configuration Form */}
                 <div className="space-y-6">
                    <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3 text-primary">
                          <Wifi size={20} />
                          <h3 className="font-bold uppercase text-xs tracking-widest">Configuração do Link</h3>
                        </div>
                        
                        <div className="flex bg-slate-900 p-1 rounded-lg border border-white/10">
                          <button 
                             onClick={handleResetUrl}
                             className="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all text-red-400 hover:text-red-300 hover:bg-red-400/10 mr-2"
                             title="Resetar URL para padrão"
                          >
                             <RefreshCw size={12} /> Resetar
                          </button>
                          <button
                            onClick={() => setUrlMode('cloud')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                              urlMode === 'cloud' 
                                ? 'bg-primary text-black shadow-lg' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Cloud size={12} /> Cloud (Internet)
                          </button>
                          <button
                            onClick={() => setUrlMode('local')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                              urlMode === 'local' 
                                ? 'bg-primary text-black shadow-lg' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Monitor size={12} /> Local (Rede)
                          </button>
                        </div>
                      </div>

                      {urlMode === 'cloud' ? (
                        <>
                          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                            Utilize um endereço web externo para que os clientes possam acessar o menu via internet.
                          </p>
                          <div className="relative">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <Globe size={12} /> URL do Menu (Cloud)
                            </label>
                            <input
                              type="text"
                              className="w-full p-4 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-primary font-mono text-sm shadow-inner"
                              value={cloudUrl}
                              onChange={e => setCloudUrl(e.target.value)}
                              placeholder="https://seu-projeto.web.app/#/menu/public"
                              onBlur={() => cloudUrl && validateUrl(cloudUrl)}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                            Para uso interno na mesma rede Wi-Fi. Requer que os dispositivos estejam conectados à mesma rede.
                          </p>
                          <div className="relative">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <Wifi size={12} /> URL do Menu (IP Local)
                            </label>
                            <input
                              type="text"
                              className="w-full p-4 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-primary font-mono text-sm shadow-inner"
                              value={localUrl}
                              onChange={e => setLocalUrl(e.target.value)}
                              placeholder={`${getBaseUrl()}/#/menu/public`}
                              onBlur={() => localUrl && validateUrl(localUrl)}
                            />
                          </div>
                        </>
                      )}
                      
                      <p className="text-[10px] text-slate-500 mt-4 pt-4 border-t border-white/5">
                        Preview Atual: <span className="text-primary font-mono select-all">{currentQrUrl}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                          Título
                        </label>
                        <input
                          type="text"
                          className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary text-sm"
                          value={title}
                          onChange={e => setTitle(e.target.value)}
                          placeholder={settings.restaurantName}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                          Subtítulo
                        </label>
                        <input
                          type="text"
                          className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary text-sm"
                          value={subtitle}
                          onChange={e => setSubtitle(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                        Logo URL
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary text-sm font-mono"
                        value={logoUrl}
                        onChange={e => setLogoUrl(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={handleSaveConfig}
                      className="w-full py-4 bg-primary text-black rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                      <RefreshCw size={16} /> Atualizar Configurações
                    </button>
                 </div>

                 {/* Preview */}
                 <div className="flex flex-col items-center justify-center bg-slate-900/50 rounded-3xl border border-white/5 p-8">
                    <div className="bg-white p-4 rounded-2xl shadow-2xl mb-6" ref={qrRef}>
                      <QRCodeCanvas 
                        value={currentQrUrl}
                        size={250}
                        level={"H"}
                        includeMargin={true}
                        imageSettings={logoUrl ? {
                          src: logoUrl,
                          x: undefined,
                          y: undefined,
                          height: 40,
                          width: 40,
                          excavate: true,
                        } : undefined}
                      />
                    </div>
                    
                    <div className="w-full grid grid-cols-2 gap-3">
                      <button
                        onClick={handleDownloadQR}
                        className="py-3 bg-white text-black rounded-xl font-bold uppercase text-[10px] tracking-wider hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                      >
                         Baixar PNG
                      </button>
                      <button
                        onClick={handleCopyUrl}
                        className="py-3 bg-slate-800 text-white rounded-xl font-bold uppercase text-[10px] tracking-wider hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                      >
                         Copiar Link
                      </button>
                      <button
                        onClick={handleOpenMenu}
                        className="col-span-2 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl font-bold uppercase text-[10px] tracking-wider hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
                      >
                         <ExternalLink size={14} /> Abrir no Navegador
                      </button>
                      <button
                        onClick={handleDownloadGuide}
                        className="col-span-2 py-3 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-xl font-bold uppercase text-[10px] tracking-wider hover:bg-orange-500/20 transition-all flex items-center justify-center gap-2"
                      >
                         <Book size={14} /> Baixar Guia de Conexão
                      </button>
                      
                      <button
                        onClick={handleResetUrl}
                        className="col-span-2 py-3 bg-red-600/10 text-red-500 border border-red-500/20 rounded-xl font-bold uppercase text-[10px] tracking-wider hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                      >
                         <AlertCircle size={14} /> Resetar URL (Correção)
                      </button>
                    </div>
                 </div>
               </div>
            </div>
          )}
          
          {/* Save Button Bar (Fixed at bottom) */}
          <div className="mt-8 pt-6 border-t border-white/5 flex justify-end shrink-0">
            <button
              onClick={handleSaveConfig}
              disabled={isSyncing}
              className={`px-8 py-3 rounded-2xl font-bold text-sm uppercase tracking-wider flex items-center gap-3 transition-all shadow-glow ${
                isSyncing 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-primary text-black hover:brightness-110 active:scale-95'
              }`}
            >
              {isSyncing ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  A guardar...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Guardar Alterações
                </>
              )}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:bg-white hover:text-black transition-all"
        >
          <X size={24} />
        </button>
      </div>

      {/* DISH MODAL OVERLAY */}
      {isDishModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[250] flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                 {editingId ? <Edit2 size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />}
                 {editingId ? 'Editar Prato' : 'Novo Prato'}
              </h3>
              
              <form onSubmit={handleSubmitDish} className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nome do Prato</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-primary outline-none"
                      value={dishForm.name}
                      onChange={e => setDishForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Preço (Kz)</label>
                        <input 
                          required
                          type="number" 
                          min="0"
                          className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-primary outline-none"
                          value={dishForm.price}
                          onChange={e => setDishForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Categoria</label>
                        <select 
                          required
                          className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-primary outline-none appearance-none"
                          value={dishForm.categoryId}
                          onChange={e => setDishForm(prev => ({ ...prev, categoryId: e.target.value }))}
                        >
                           <option value="" disabled>Selecione...</option>
                           {categories.map(cat => (
                             <option key={cat.id} value={cat.id}>{cat.name}</option>
                           ))}
                        </select>
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Descrição</label>
                    <textarea 
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-primary outline-none h-24 resize-none"
                      value={dishForm.description}
                      onChange={e => setDishForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                 </div>

                 <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Imagem URL (ou upload)</label>
                    <div className="flex gap-2">
                       <input 
                          type="text" 
                          className="flex-1 bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-primary outline-none"
                          placeholder="https://..."
                          value={dishForm.image}
                          onChange={e => setDishForm(prev => ({ ...prev, image: e.target.value }))}
                       />
                       <label className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 cursor-pointer transition-colors">
                          <ImageIcon size={20} className="text-slate-400" />
                          <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleImageUpload} />
                       </label>
                    </div>
                 </div>

                 <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsDishModalOpen(false)}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                    >
                       Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 bg-primary text-black hover:brightness-110 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                       <Save size={16} /> Salvar
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default QRMenuConfig;
