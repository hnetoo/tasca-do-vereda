
import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { supabaseService } from '../services/supabaseService';
import { logger } from '../services/logger';
import { 
  ShoppingBasket, Plus, Minus, Search, ChevronRight, X, Menu, 
  AlertCircle, ChefHat, CheckCircle2
} from 'lucide-react';
import { Dish, MenuCategory, SystemSettings } from '../types';
import { orderService, OrderStatus } from '../services/orderService';
import { CategoryMenu, getCategoryIcon } from '../components/public-menu/CategoryMenu';
import { ProductMenu } from '../components/public-menu/ProductMenu';
import { isValidImageUrl } from '../services/qrMenuService';
import { fetchMenuFromFeed } from '../services/feedFetch';

const PublicMenu = () => {
  const { tableId } = useParams();
  const { menu: localMenu, categories: localCategories, tables, addNotification, settings, isInitialized } = useStore();
  
  const isPublicView = !tableId || tableId === 'public';
  const table = tables.find(t => t.id === Number(tableId));
  const isReadOnly = settings.qrMenuReadOnly === true || isPublicView;
  const shouldSubscribeRealtime = !isPublicView;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const configuredUrl = settings.supabaseConfig?.url || '';
  const configuredKey = settings.supabaseConfig?.key || '';
  const envUrl = !isLocalhost ? import.meta.env.VITE_SUPABASE_URL || '' : '';
  const envKey = !isLocalhost ? import.meta.env.VITE_SUPABASE_ANON_KEY || '' : '';
  const supabaseUrl = configuredUrl || envUrl;
  const supabaseKey = configuredKey || envKey;
  const supabaseEnabled = settings.supabaseConfig?.enabled === true
    ? !!supabaseUrl && !!supabaseKey
    : settings.supabaseConfig?.enabled === false
      ? false
      : !isLocalhost && !!supabaseUrl && !!supabaseKey;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data State (Local or Remote)
  const [remoteMenu, setRemoteMenu] = useState<Dish[] | null>(null);
  const [remoteCategories, setRemoteCategories] = useState<MenuCategory[] | null>(null);
  const [remoteSettings, setRemoteSettings] = useState<SystemSettings | null>(null);
  const [syncStatus, setSyncStatus] = useState(() => supabaseService.getSyncStatus());

  const applyRemoteData = (data: { categories?: MenuCategory[]; dishes?: Dish[]; settings?: SystemSettings | null }) => {
    if (data.categories) {
      setRemoteCategories(data.categories);
    }
    if (data.dishes) {
      setRemoteMenu(data.dishes);
    }
    if (data.settings) {
      setRemoteSettings(data.settings);
    }
  };

  const normalizeError = (raw: string) => {
    const msg = String(raw || '');
    if (/not initialized/i.test(msg)) {
      return 'Configuração do Supabase em falta ou inválida para este ambiente.';
    }
    if (/failed to fetch|networkerror|cors/i.test(msg)) {
      return 'Falha de rede ou CORS ao contactar o Supabase.';
    }
    if (/jwt|row-level security|permission|denied|rls/i.test(msg)) {
      return 'Acesso bloqueado por RLS ou permissões insuficientes no Supabase.';
    }
    if (/column .* does not exist|schema cache/i.test(msg)) {
      return 'Esquema do Supabase incompatível com o build atual.';
    }
    return msg || 'Falha ao carregar menu remoto';
  };

  const menu = useMemo(() => {
    const remote = remoteMenu && remoteMenu.length > 0 ? remoteMenu : [];
    const local = localMenu && localMenu.length > 0 ? localMenu : [];
    const byId = new Set(local.map(d => d.id));
    const merged = [...local, ...remote.filter(d => !byId.has(d.id))];
    return merged;
  }, [settings.supabaseConfig?.enabled, remoteMenu, localMenu]);

  const categories = useMemo(() => {
    const remote = remoteCategories && remoteCategories.length > 0 ? remoteCategories : [];
    const local = localCategories && localCategories.length > 0 ? localCategories : [];
    const byId = new Set(local.map(c => c.id));
    const merged = [...local, ...remote.filter(c => !byId.has(c.id))];
    return merged;
  }, [settings.supabaseConfig?.enabled, remoteCategories, localCategories]);

  const effectiveCategories = useMemo(() => {
    if (categories.length > 0 || menu.length === 0) return categories;
    const map = new Map<string, MenuCategory>();
    menu.forEach(dish => {
      const rawId = String(dish.categoryId || '').trim();
      const rawName = String(dish.categoryName || rawId || 'Sem Categoria').trim();
      const id = rawId || rawName.toLowerCase().replace(/\s+/g, '_');
      if (!id) return;
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: rawName || 'Sem Categoria',
          icon: '',
          sort_order: 0,
          is_active: true
        });
      }
    });
    const built = Array.from(map.values());
    if (built.length > 0) {
      logger.warn('Categorias ausentes; geradas a partir do menu', { count: built.length }, 'PublicMenu');
    }
    return built.length > 0 ? built : categories;
  }, [categories, menu]);

  // Fetch from Supabase if enabled
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    
    const fetchRemote = async () => {
      try {
        if (supabaseEnabled) {
          if (!supabaseService.isConnected()) {
            supabaseService.initialize(
              supabaseUrl,
              supabaseKey,
              shouldSubscribeRealtime ? (payload) => {
                if (payload.tableName === 'menu_items') {
                  const newDish: Dish = {
                    id: String(payload.new?.id),
                    name: String(payload.new?.name),
                    description: String(payload.new?.description || ''),
                    price: Number((payload.new as any)?.price || 0),
                    categoryId: String((payload.new as any)?.category_id || ''),
                    image: String((payload.new as any)?.image_url || ''),
                    disponivel: (payload.new as any)?.available !== false,
                    taxCode: 'NOR',
                    taxPercentage: Number((payload.new as any)?.tax_rate || 14)
                  };
                  setRemoteMenu(prev => {
                    const base = prev || [];
                    if (payload.eventType === 'INSERT') return [...base, newDish];
                    if (payload.eventType === 'UPDATE') return base.map(d => d.id === newDish.id ? newDish : d);
                    if (payload.eventType === 'DELETE') return base.filter(d => d.id !== String(payload.old?.id));
                    return base;
                  });
                } else if (payload.tableName === 'categories') {
                  const newCategory: MenuCategory = {
                    id: String(payload.new?.id),
                    name: String(payload.new?.name),
                    icon: String((payload.new as any)?.icon || ''),
                    sort_order: Number((payload.new as any)?.sort_order || 0),
                    parentId: (payload.new as any)?.parent_id,
                    is_active: !(payload.new as any)?.deleted_at
                  };
                  setRemoteCategories(prev => {
                    const base = prev || [];
                    if (payload.eventType === 'INSERT') return [...base, newCategory];
                    if (payload.eventType === 'UPDATE') return base.map(c => c.id === newCategory.id ? newCategory : c);
                    if (payload.eventType === 'DELETE') return base.filter(c => c.id !== String(payload.old?.id));
                    return base;
                  });
                }
              } : undefined
            );
          }
          
          const res = await supabaseService.fetchMenu();
          if (!isMounted) return;

          if (res.success && res.data) {
            const data = res.data as any;
            applyRemoteData(data);

            if ((!data.categories || data.categories.length === 0) && (!data.dishes || data.dishes.length === 0)) {
              logger.warn('API returned empty menu, trying feed fallback', null, 'PublicMenu');
              const feed = await fetchMenuFromFeed(settings);
              if (!isMounted) return;
              if ((feed.categories?.length || 0) > 0 || (feed.dishes?.length || 0) > 0) {
                applyRemoteData({
                  categories: feed.categories,
                  dishes: feed.dishes,
                  settings: feed.settings ? { ...settings, ...feed.settings } : null
                });
                logger.info('Menu carregado via feed fallback', { categories: feed.categories.length, dishes: feed.dishes.length }, 'PublicMenu');
              } else if (localMenu.length === 0 && localCategories.length === 0) {
                setError('O menu digital está vazio ou ainda não foi publicado no Supabase.');
              } else {
                logger.warn('Menu remoto vazio, mantendo dados locais', { localDishes: localMenu.length, localCategories: localCategories.length }, 'PublicMenu');
                setError(null);
              }
            }
          } else {
            const errorMsg = normalizeError((res as any).error || 'Falha ao carregar menu remoto');
            logger.error('Error fetching remote menu', { error: errorMsg }, 'PublicMenu');
            const feed = await fetchMenuFromFeed(settings);
            if (!isMounted) return;
            if ((feed.categories?.length || 0) > 0 || (feed.dishes?.length || 0) > 0) {
              applyRemoteData({
                categories: feed.categories,
                dishes: feed.dishes,
                settings: feed.settings ? { ...settings, ...feed.settings } : null
              });
              setError(null);
              logger.info('Menu carregado via feed fallback após erro Supabase', { categories: feed.categories.length, dishes: feed.dishes.length }, 'PublicMenu');
            } else if (localMenu.length > 0 || localCategories.length > 0) {
              logger.warn('Falha no Supabase, mantendo dados locais', { localDishes: localMenu.length, localCategories: localCategories.length }, 'PublicMenu');
              setError(null);
            } else {
              setError(errorMsg);
              addNotification('error', `Falha de sincronização: ${errorMsg}`);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          const errorMsg = normalizeError(String(err));
          logger.error('Exception in PublicMenu fetch', { error: errorMsg }, 'PublicMenu');
          setError(errorMsg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchRemote();
    
    return () => { isMounted = false; };
  }, [settings.supabaseConfig, supabaseEnabled, supabaseUrl, supabaseKey, localMenu.length, localCategories.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(supabaseService.getSyncStatus());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      const doFetch = async () => {
        try {
          if (supabaseEnabled) {
            if (!supabaseService.isConnected()) {
              supabaseService.initialize(supabaseUrl, supabaseKey);
            }
            const res = await supabaseService.fetchMenu();
            if (res.success && res.data) {
              const data = res.data as any;
              applyRemoteData(data);
              if ((!data.categories || data.categories.length === 0) && (!data.dishes || data.dishes.length === 0)) {
                const feed = await fetchMenuFromFeed(settings);
                if ((feed.categories?.length || 0) > 0 || (feed.dishes?.length || 0) > 0) {
                  applyRemoteData({
                    categories: feed.categories,
                    dishes: feed.dishes,
                    settings: feed.settings ? { ...settings, ...feed.settings } : null
                  });
                }
              }
              setError(null);
            } else {
              const errorMsg = normalizeError((res as any).error || 'Falha ao carregar menu remoto');
              const feed = await fetchMenuFromFeed(settings);
              if ((feed.categories?.length || 0) > 0 || (feed.dishes?.length || 0) > 0) {
                applyRemoteData({
                  categories: feed.categories,
                  dishes: feed.dishes,
                  settings: feed.settings ? { ...settings, ...feed.settings } : null
                });
                setError(null);
              } else {
                setError(errorMsg);
                addNotification('error', `Falha de sincronização: ${errorMsg}`);
              }
            }
          }
        } finally {
          setIsLoading(false);
        }
      };
      doFetch();
    }, 0);
  };
  
  const displaySettings = (remoteSettings || settings || {}) as SystemSettings;
  
  const logoUrl = displaySettings.qrMenuLogo || displaySettings.appLogoUrl || settings.appLogoUrl;
  const restaurantName = (
    displaySettings.qrMenuTitle?.trim() || 
    displaySettings.restaurantName?.trim() || 
    settings.qrMenuTitle?.trim() ||
    settings.restaurantName?.trim() || 
    "TASCA DO VEREDA"
  ).toUpperCase();
  
  // Use a stable fallback and ensure the name is visible
  const displayTitle = restaurantName || "TASCA DO VEREDA";
  const restaurantSubtitle = displaySettings.qrMenuSubtitle || settings.qrMenuSubtitle || (isPublicView ? 'Menu Digital' : `Mesa ${table?.name}`);

  useEffect(() => {
     if (effectiveCategories.some(c => !c.id || c.id === 'undefined')) {
        logger.warn('Corrupted categories detected in PublicMenu', { count: effectiveCategories.length }, 'PublicMenu');
     }
  }, [effectiveCategories]);

  const [selectedCatId, setSelectedCatId] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  type CartEntry = { quantity: number; notes: string };
  const [cart, setCart] = useState<Record<string, CartEntry>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (!trackedOrderId) return;
    const checkStatus = () => {
        const status = orderService.getOrderStatus(trackedOrderId);
        if (status) {
            setOrderStatus(status);
            if (status.kitchenStatus === 'PRONTO' && orderStatus?.kitchenStatus !== 'PRONTO') {
                addNotification('success', 'O seu pedido está pronto!');
            }
        }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [trackedOrderId, orderStatus?.kitchenStatus, addNotification]);

  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const safeCategories = useMemo(() => {
    const seenIds = new Set<string>();
    const availableCategories = effectiveCategories
      .map((cat, index) => {
        let id = cat.id;
        let isModified = false;
        if (!id || id === 'undefined' || id === 'null') {
            id = `fixed_${index}_${(cat.name || 'sem_nome').replace(/\s+/g, '_').toLowerCase()}`;
            isModified = true;
        } else if (seenIds.has(id)) {
             id = `${id}_dup_${index}`;
             isModified = true;
        }
        seenIds.add(id);
        return { ...cat, id, originalId: cat.id, isModified };
      });
    
    return availableCategories;
  }, [effectiveCategories]);

  const sortedCategories = useMemo(() => {
    return [...safeCategories].sort((a, b) => a.name.localeCompare(b.name));
  }, [safeCategories]);

  const areIdsEqual = (a: string | number | undefined | null, b: string | number | undefined | null) => {
      if (a === b) return true;
      if (a === undefined || a === null || b === undefined || b === null) return false;
      const strA = String(a).trim().toLowerCase();
      const strB = String(b).trim().toLowerCase();
      return strA === strB;
  };

  const matchesCategoryLogic = (dish: Dish, cat: MenuCategory & { originalId?: string; isModified?: boolean }) => {
      if (!cat) return false;
      
      const dishCatId = String(dish.categoryId || '').trim();
      const catId = String(cat.id || '').trim();
      const catOriginalId = String(cat.originalId || '').trim();
      const catName = String(cat.name || '').trim().toLowerCase();
      const dishCatName = dish.categoryName ? String(dish.categoryName).trim().toLowerCase() : '';

      if (dishCatId && catId && dishCatId === catId) return true;
      if (dishCatId && catOriginalId && dishCatId === catOriginalId) return true;
      
      if (catName) {
          if (dishCatId.toLowerCase() === catName) return true;
          if (dishCatName === catName) return true;
          const catSlug = catName.replace(/\s+/g, '_');
          const catHyphenSlug = catName.replace(/\s+/g, '-');
          if (dishCatId.toLowerCase() === catSlug) return true;
          if (dishCatId.toLowerCase() === catHyphenSlug) return true;
      }

      if (!dishCatId || dishCatId === 'undefined' || dishCatId === 'null') {
          if (!catId || catId === 'undefined' || catId === 'null' || (cat.isModified && !catOriginalId)) {
              return true;
          }
      }

      return false;
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    counts['TODOS'] = menu.length;
    safeCategories.forEach(c => counts[c.id] = 0);
    menu.forEach(dish => {
        let found = false;
        for (const cat of safeCategories) {
            if (matchesCategoryLogic(dish, cat)) {
                counts[cat.id] = (counts[cat.id] || 0) + 1;
                found = true;
                break; 
            }
        }
        if (!found) {
            logger.warn('[PublicMenu] Dish not matched to any safe category', { 
                dishName: dish.name, 
                categoryId: dish.categoryId,
                categoryName: dish.categoryName
            }, 'PublicMenu');
        }
    });
    return counts;
  }, [menu, safeCategories]);

  const categoryHierarchy = useMemo(() => {
    const mapped = new Map<string, MenuCategory & { children: Array<MenuCategory & { children?: MenuCategory[] }> }>();
    safeCategories.forEach(cat => {
      mapped.set(cat.id, { ...cat, children: [] });
    });
    const roots: Array<MenuCategory & { children: MenuCategory[] }> = [];
    safeCategories.forEach(cat => {
      const parentId = (cat.parent_id ?? cat.parentId ?? null);
      const parentKey = parentId ? String(parentId) : null;
      const current = mapped.get(cat.id);
      if (!current) return;
      if (parentKey && mapped.has(parentKey)) {
        mapped.get(parentKey)!.children.push(current);
      } else {
        roots.push(current);
      }
    });
    const byName = (a: MenuCategory, b: MenuCategory) => (a.name || '').localeCompare(b.name || '');
    roots.sort(byName);
    roots.forEach(root => root.children.sort(byName));
    return roots;
  }, [safeCategories]);

  const getCategoryTotal = (cat: MenuCategory & { children?: MenuCategory[] }) => {
    const direct = categoryCounts[cat.id] || 0;
    const childrenTotal = (cat.children || []).reduce((sum, child) => sum + (categoryCounts[child.id] || 0), 0);
    return direct + childrenTotal;
  };

  const handleCategorySelect = (id: string) => {
    setSelectedCatId(id);
    setIsMobileMenuOpen(false);
  };

  const filteredMenu = useMemo(() => {
    // Get all categories that are "valid" and have dishes
    const visibleCategories = safeCategories.filter(cat => (categoryCounts[cat.id] || 0) > 0);
    const visibleCategoryIds = new Set(visibleCategories.map(c => String(c.originalId || c.id).trim()));

    const filtered = menu.filter(dish => {
      let matchesCategory = false;

      if (selectedCatId === 'TODOS') {
        if (visibleCategories.length === 0) {
          matchesCategory = true;
        } else {
          const dishCatId = String(dish.categoryId || '').trim();
          matchesCategory = visibleCategoryIds.has(dishCatId);
          
          if (!matchesCategory) {
              matchesCategory = visibleCategories.some(cat => matchesCategoryLogic(dish, cat));
          }
        }
      } else {
        const activeCat = safeCategories.find(c => c.id === selectedCatId);
        if (activeCat) {
            matchesCategory = matchesCategoryLogic(dish, activeCat);
        } else {
            // Fallback for safety
            matchesCategory = areIdsEqual(dish.categoryId, selectedCatId);
        }
      }

      if (!matchesCategory) return false;

      const matchesSearch = (dish.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (dish.description && dish.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    }).sort((a, b) => a.name.localeCompare(b.name));

    return filtered;
  }, [menu, selectedCatId, searchTerm, safeCategories, categoryCounts]);

  useEffect(() => {
    if (menu.length > 0 && effectiveCategories.length > 0) {
        logger.info('PublicMenu carregado', { categories: effectiveCategories.length, dishes: menu.length }, 'PublicMenu');
    }
  }, [menu, effectiveCategories]);

  const updateCart = (dishId: string, delta: number) => {
    setCart(prev => {
      const current = prev[dishId] || { quantity: 0, notes: '' };
      const newQty = Math.max(0, current.quantity + delta);
      if (newQty === 0) {
        const rest = { ...prev };
        delete rest[dishId];
        return rest;
      }
      return { ...prev, [dishId]: { ...current, quantity: newQty } };
    });
  };

  const updateNotes = (dishId: string, notes: string) => {
    setCart(prev => {
      if (!prev[dishId]) return prev;
      return { ...prev, [dishId]: { ...prev[dishId], notes } };
    });
  };
  
  const addToCartFromModal = (dishId: string, quantity: number = 1, notes: string = '') => {
      setCart(prev => {
        const current = prev[dishId] || { quantity: 0, notes: '' };
        return { ...prev, [dishId]: { quantity: current.quantity + quantity, notes: notes || current.notes } };
      });
      setIsOrderSuccess(true);
      setTimeout(() => setIsOrderSuccess(false), 2000);
      setSelectedDish(null);
  };

  const cartItemsCount = (Object.values(cart) as CartEntry[]).reduce((acc, curr) => acc + curr.quantity, 0);
  const cartTotal = (Object.entries(cart) as [string, CartEntry][]).reduce((acc, [id, data]) => {
    const dish = menu.find(d => d.id === id);
    return acc + (dish?.price || 0) * data.quantity;
  }, 0);

  const formatKz = (val: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(val);

  const handleSendOrder = async () => {
    if (isReadOnly) {
      addNotification('info', 'Este menu é apenas para visualização. Por favor, peça a um funcionário.');
      return;
    }
    if (!tableId || Object.keys(cart).length === 0) return;

    const items = (Object.entries(cart) as [string, CartEntry][]).map(([dishId, data]) => ({
      dishId,
      quantity: data.quantity,
      notes: data.notes
    }));

    const result = await orderService.createOrder({
        tableId: Number(tableId),
        items
    });

    if (result.success) {
        setCart({});
        setIsCartOpen(false);
        setIsOrderSuccess(true);
        if (result.orderId) setTrackedOrderId(result.orderId);
        addNotification('success', 'Pedido enviado para a cozinha!');
        setTimeout(() => setIsOrderSuccess(false), 5000);
    } else {
        addNotification('error', result.message || 'Erro ao enviar pedido');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
           <ChefHat size={40} className="text-primary" />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2 italic">A carregar o Menu...</h2>
        <p className="text-slate-500 text-sm max-w-xs">Preparando os melhores pratos para si. Por favor, aguarde um momento.</p>
        <div className="mt-8 flex gap-1">
           <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
           <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
           <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
        </div>
      </div>
    );
  }



  if (error && menu.length === 0 && categories.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6">
           <AlertCircle size={40} className="text-red-500" />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2 italic">Erro ao Carregar Menu</h2>
        <p className="text-slate-500 text-sm max-w-xs">{error}</p>
        <p className="text-[10px] font-black text-slate-600 mt-2">
          {syncStatus.status === 'retrying' ? `A tentar novamente (${syncStatus.retries})...` : ''}
        </p>
        <button 
            onClick={handleRetry}
            className="mt-8 px-6 py-2 border border-primary/30 bg-primary/5 text-primary rounded-lg font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary hover:text-black transition-all"
        >
            Tentar Novamente
        </button>
      </div>
    );
  }

  if (!table && !isPublicView) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-6 text-center font-sans">
        <div className="max-w-xs">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-white text-xl font-bold">Mesa não encontrada</h1>
          <p className="text-slate-400 mt-2 text-sm">Por favor, peça ajuda a um funcionário ou escaneie o QR Code novamente.</p>
        </div>
      </div>
    );
  }

  const activeCategoryName = selectedCatId === 'TODOS' ? 'Todos os Pratos' : sortedCategories.find(c => c.id === selectedCatId)?.name || 'Categoria';

  return (
    <div className="min-h-[100dvh] w-full bg-slate-950 flex flex-col lg:flex-row font-sans overflow-hidden text-white selection:bg-primary/30">
      {/* Success Overlay */}
      {isOrderSuccess && (
        <div className="fixed inset-0 z-[100] bg-primary flex flex-col items-center justify-center animate-in fade-in duration-500 backdrop-blur-md">
           <div className="w-24 h-24 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
             <CheckCircle2 size={48} className="text-white" />
           </div>
           <h2 className="text-3xl font-black text-white italic tracking-[0.2em] uppercase">Módulo Processado</h2>
           <p className="text-white/60 font-mono text-xs mt-2 uppercase tracking-widest">Pedido enviado para a estação de cozinha</p>
        </div>
      )}

      {/* Mobile Header (always visible) */}
      <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"
          >
            <Menu size={18} />
          </button>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white/5" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <ChefHat size={18} />
            </div>
          )}
          <h1 className="font-black text-lg uppercase tracking-[0.15em] text-white break-words text-wrap truncate">
            {displayTitle}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-black transition-all"
          >
            <ShoppingBasket size={20} />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className={`fixed inset-0 z-[60] lg:hidden ${isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div className={`absolute inset-y-0 left-0 w-[85%] max-w-sm bg-slate-900 border-r border-slate-800 shadow-2xl transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                <Menu size={16} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-white truncate">Menu Digital</span>
                <span className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.2em] truncate">{restaurantSubtitle}</span>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 transition-all"
            >
              <X size={14} />
            </button>
          </div>
          <div className="p-4 overflow-y-auto h-full pb-24 custom-scrollbar">
            <button
              onClick={() => handleCategorySelect('TODOS')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${selectedCatId === 'TODOS' ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedCatId === 'TODOS' ? 'bg-primary text-black' : 'bg-white/5 text-slate-300'}`}>
                {getCategoryIcon('geral')}
              </div>
              <div className="flex-1 text-left min-w-0">
                <span className="block font-black uppercase text-[11px] tracking-[0.2em] truncate">Geral</span>
                <span className="text-[9px] font-mono text-slate-500 uppercase">{categoryCounts['TODOS'] || 0} Unidades</span>
              </div>
            </button>

            <div className="mt-4 space-y-4">
              {categoryHierarchy.map(category => {
                const isActive = selectedCatId === category.id;
                const total = getCategoryTotal(category);
                return (
                  <div key={category.id} className="space-y-2">
                    <button
                      onClick={() => handleCategorySelect(category.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${isActive ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary text-black' : 'bg-white/5 text-slate-300'}`}>
                        {React.cloneElement(getCategoryIcon(category.name || '') as React.ReactElement<{ size?: number }>, { size: 20 })}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block font-black uppercase text-[11px] tracking-[0.18em] truncate">{category.name || 'Setor'}</span>
                        <span className="text-[9px] font-mono text-slate-500 uppercase">{total} Unidades</span>
                      </div>
                      {category.children.length > 0 && (
                        <ChevronRight size={14} className="text-slate-500" />
                      )}
                    </button>
                    {category.children.length > 0 && (
                      <div className="pl-3 border-l border-white/10 space-y-2">
                        {category.children.map(child => {
                          const isChildActive = selectedCatId === child.id;
                          return (
                            <button
                              key={child.id}
                              onClick={() => handleCategorySelect(child.id)}
                              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${isChildActive ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
                            >
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isChildActive ? 'bg-primary text-black' : 'bg-white/5 text-slate-300'}`}>
                                {React.cloneElement(getCategoryIcon(child.name || '') as React.ReactElement<{ size?: number }>, { size: 18 })}
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <span className="block font-black uppercase text-[10px] tracking-[0.16em] truncate">{child.name || 'Subsetor'}</span>
                                <span className="text-[8px] font-mono text-slate-500 uppercase">{categoryCounts[child.id] || 0} Unidades</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar (Category Menu) */}
      <aside className="hidden lg:flex flex-col w-80 xl:w-96 bg-slate-900 border-r border-slate-800 z-20 h-full relative overflow-hidden">
         
         <div className="p-8 shrink-0 border-b border-white/5 relative z-10 flex flex-col items-center">
             {logoUrl ? (
                <div className="relative group mb-4">
                  <div className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-24 h-24 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center p-2 overflow-hidden relative transition-transform duration-500 group-hover:scale-105">
                    <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                  </div>
                </div>
             ) : (
                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-4">
                  <ChefHat size={40} className="text-primary" />
                </div>
             )}
             
             <div className="text-center space-y-2 w-full">
                 <h1 className="font-black text-xl uppercase tracking-[0.15em] text-white text-glow break-words text-wrap">
                   {displayTitle}
                 </h1>
                 <div className="flex items-center justify-center gap-2">
                   <div className="h-[1px] flex-1 bg-primary/20" />
                   <p className="text-[9px] text-primary font-mono uppercase tracking-[0.2em] whitespace-nowrap">{restaurantSubtitle}</p>
                   <div className="h-[1px] flex-1 bg-primary/20" />
                 </div>
             </div>
             {/* Language Selector Placeholder */}
             <div className="mt-4">
                <button className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full">PT</button>
             </div>
         </div>

         <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar py-4">
           <CategoryMenu 
              categories={sortedCategories}
              selectedCatId={selectedCatId}
             onSelectCategory={handleCategorySelect}
              categoryCounts={categoryCounts}
              isSidebarOpen={true}
           />
         </div>

         {/* NASA Style Footer Info */}
         <div className="p-4 border-t border-white/5 bg-black/20 relative z-10">
            <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 uppercase tracking-widest">
              <span>System: 1.01.AO</span>
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-green-500" /> ONLINE
              </span>
            </div>
         </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-950 min-h-0">
         {/* Header */}
         <header className="shrink-0 p-4 lg:p-6 flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl z-20">
             {/* Mobile & Tablet Header (Logo & Name) */}
             <div className="lg:hidden flex items-center justify-between w-full">
                 <div className="flex items-center gap-3 min-w-0">
                     <div className="relative shrink-0">
                       {logoUrl ? (
                          <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center p-1 overflow-hidden">
                            <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                          </div>
                       ) : (
                          <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                            <ChefHat className="text-primary" size={20} />
                          </div>
                       )}
                       <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-[#0D1117] rounded-full" />
                     </div>
                     <div className="flex flex-col min-w-0">
                        <h1 className="font-black text-sm uppercase tracking-[0.1em] text-white text-glow truncate">
                          {displayTitle}
                        </h1>
                        <span className="text-[7px] text-primary/70 font-mono uppercase tracking-widest flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                          {restaurantSubtitle}
                        </span>
                     </div>
                 </div>

                 <div className="flex items-center gap-2">
                    <button className="px-2.5 py-1 bg-white/5 text-[9px] text-slate-400 font-mono rounded-lg border border-white/10">PT</button>
                    {!isReadOnly && cartItemsCount > 0 && (
                      <button 
                        onClick={() => setIsCartOpen(true)}
                        className="relative w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,209,255,0.4)] animate-in zoom-in-95"
                      >
                        <ShoppingBasket size={18} />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-[10px] font-black rounded-full flex items-center justify-center border-2 border-primary">
                          {cartItemsCount}
                        </span>
                      </button>
                    )}
                 </div>
             </div>
             
             {/* Desktop Title Header */}
             <div className="hidden lg:block">
                 <div className="flex items-center gap-4">
                    <div className="w-1 h-12 bg-primary rounded-full" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-primary uppercase tracking-[0.3em]">{restaurantName}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{restaurantSubtitle}</span>
                      </div>
                      <h1 className="font-black text-3xl uppercase tracking-[0.05em] leading-none text-white">{activeCategoryName}</h1>
                    </div>
                 </div>
             </div>

             {/* Search Component - Desktop only in header */}
             <div className="hidden lg:flex items-center gap-4">
                 <div className="relative group z-20">
                    <input 
                        type="text" 
                        placeholder="BUSCAR MÓDULO..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-[10px] font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 w-64 transition-all uppercase tracking-widest placeholder:text-slate-600"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50 group-focus-within:text-primary transition-colors" size={14} />
                 </div>
             </div>
         </header>

         {/* Mobile Category Strip & Search */}
         <div className="lg:hidden shrink-0 border-b border-slate-800 bg-slate-900 backdrop-blur-md">
            <div className="px-4 pt-4">
              <div className="relative group">
                  <input 
                      type="text" 
                      placeholder="BUSCAR NO MENU..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs font-mono focus:outline-none focus:border-primary/50 transition-all uppercase tracking-widest placeholder:text-slate-600"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/40" size={16} />
              </div>
            </div>
            <CategoryMenu 
                categories={sortedCategories}
                selectedCatId={selectedCatId}
                onSelectCategory={setSelectedCatId}
                categoryCounts={categoryCounts}
                isSidebarOpen={false}
            />
         </div>

         {/* Product Area - High Contrast Precision Grid */}
         <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar relative">
             {/* Background Decoration */}
             <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] pointer-events-none rounded-full" />
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none rounded-full" />

             {filteredMenu.length > 0 ? (
                 <div className="relative z-10">
                   <ProductMenu 
                      products={filteredMenu}
                      selectedCatId={selectedCatId}
                      viewMode="grid"
                      searchTerm={searchTerm}
                      cart={cart}
                      onProductClick={setSelectedDish}
                      onAddToCart={addToCartFromModal}
                      onUpdateCart={updateCart}
                      formatPrice={formatKz}
                      imageErrorMap={imageErrorMap}
                      setImageErrorMap={setImageErrorMap}
                   />
                 </div>
             ) : (
                 <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 relative z-10 bg-slate-900/30">
                    <div className="w-24 h-24 bg-[#0D1117] border border-white/10 rounded-2xl flex items-center justify-center mb-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 border border-primary/20 rounded-2xl animate-pulse" />
                        <Search size={32} className="text-primary/50 relative z-10" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-[0.2em] text-white mb-2 text-glow">Módulo não Localizado</h3>
                    <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest max-w-xs leading-relaxed">
                      {searchTerm 
                          ? `A varredura por "${searchTerm}" não retornou registros no banco de dados local.`
                          : "A categoria selecionada não possui unidades ativas no momento."
                      }
                    </p>
                    {(searchTerm || selectedCatId !== 'TODOS') && (
                        <button 
                            onClick={() => {setSearchTerm(''); setSelectedCatId('TODOS');}}
                            className="mt-8 px-6 py-2 border border-primary/30 bg-primary/5 text-primary rounded-lg font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary hover:text-black transition-all"
                        >
                            Resetar Filtros
                        </button>
                    )}
                 </div>
             )}
         </div>

      {/* Minimal Floating Cart - Swiss/NASA Fusion */}
      {cartItemsCount > 0 && !isReadOnly && (
         <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-in slide-in-from-bottom-8 duration-500">
             <button 
               onClick={() => setIsCartOpen(true)}
               className="w-full bg-primary text-black p-4 rounded-2xl flex items-center justify-between shadow-[0_20px_50px_rgba(0,209,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden relative"
             >
                 <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                 
                 <div className="flex items-center gap-4 relative z-10">
                     <div className="w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center font-black">
                       {cartItemsCount}
                     </div>
                     <div className="text-left">
                         <span className="block font-black text-xs uppercase tracking-widest leading-none">Ver Pedido</span>
                         <span className="text-[10px] font-mono opacity-70 uppercase tracking-tighter">Confirmar Seleção</span>
                     </div>
                 </div>
                 
                 <div className="flex items-center gap-3 relative z-10">
                     <span className="font-black text-lg">{formatKz(cartTotal)}</span>
                     <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center group-hover:bg-black/20 transition-colors">
                       <ChevronRight size={20} />
                     </div>
                 </div>
             </button>
         </div>
      )}
      </main>

      {/* Product Detail Modal - High Precision Module View */}
      {selectedDish && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-[#05070A]/95 backdrop-blur-xl animate-in fade-in duration-300 p-0 sm:p-6">
           <div 
             className="w-full max-w-lg bg-[#0D1117] sm:rounded-3xl rounded-t-[2.5rem] border border-white/10 flex flex-col max-h-[95vh] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative animate-in slide-in-from-bottom-8"
             onClick={(e) => e.stopPropagation()}
           >
              {/* Tactical Close Button */}
              <button 
                onClick={() => setSelectedDish(null)} 
                className="absolute top-6 right-6 z-20 w-10 h-10 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all group"
              >
                <X size={20} className="group-hover:rotate-90 transition-transform" />
              </button>

              {/* Header Image Area */}
              <div className="h-72 sm:h-80 w-full shrink-0 relative overflow-hidden group">
                 {isValidImageUrl(selectedDish.image) && !imageErrorMap[selectedDish.id] ? (
                    <img 
                      src={selectedDish.image} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                      alt={selectedDish.name}
                      onError={() => setImageErrorMap(prev => ({ ...prev, [selectedDish.id]: true }))}
                    />
                 ) : (
                    <div className="w-full h-full bg-[#0D1117] flex flex-col items-center justify-center relative">
                        <div className="absolute inset-0 opacity-[0.05]" 
                             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                        <ShoppingBasket size={48} className="text-primary/20 mb-4" />
                        <span className="text-[10px] uppercase tracking-[0.4em] text-primary/30 font-black">Module Preview Unavailable</span>
                    </div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117] via-transparent to-transparent opacity-80" />
                 
                 {/* Sector ID Badge */}
                 <div className="absolute bottom-6 left-6 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                    <span className="px-3 py-1 bg-primary/10 border border-primary/30 text-primary text-[10px] font-mono font-black uppercase tracking-[0.2em] rounded-md backdrop-blur-sm">
                        SEC-{selectedDish.categoryId?.toString().substring(0,6) || 'CORE'}
                    </span>
                 </div>
              </div>

              {/* Information Section */}
              <div className="p-8 flex flex-col flex-1 overflow-y-auto custom-scrollbar">
                 <div className="flex flex-col mb-8">
                     <span className="text-[10px] font-mono text-primary/60 uppercase tracking-[0.3em] mb-2">Identificação de Módulo</span>
                     <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-4">{selectedDish.name}</h2>
                     <div className="h-[2px] w-12 bg-primary rounded-full" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                       <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Status</span>
                       <span className="text-[10px] font-black text-green-500 uppercase flex items-center gap-1.5">
                         <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Disponível
                       </span>
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                       <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Custo Unidade</span>
                       <span className="text-lg font-mono font-black text-primary leading-none">
                         {formatKz(selectedDish.price)}
                       </span>
                    </div>
                 </div>

                 <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/5 mb-8 relative">
                   <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                   <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <div className="w-3 h-[1px] bg-primary/40" />
                      Especificações Técnicas
                   </h3>
                   <p className="text-slate-400 text-sm leading-relaxed font-light">
                     {selectedDish.description || "Este módulo não possui documentação adicional disponível no sistema central."}
                   </p>
                 </div>

                 {!isReadOnly && (
                   <div className="mt-auto">
                      {cart[selectedDish.id] ? (
                        <div className="bg-primary p-1 rounded-2xl flex items-center shadow-[0_10px_40px_rgba(0,209,255,0.3)] animate-in zoom-in-95 duration-300">
                           <button 
                             onClick={() => updateCart(selectedDish.id, -1)} 
                             className="w-16 h-16 rounded-xl flex items-center justify-center text-black hover:bg-black/10 transition-colors"
                           >
                             <Minus size={24} strokeWidth={3} />
                           </button>
                           
                           <div className="flex-1 text-center py-2">
                             <span className="block text-[10px] font-black uppercase text-black/50 tracking-[0.2em] mb-1">QTD Módulo</span>
                             <span className="block text-2xl font-black text-black leading-none">{cart[selectedDish.id].quantity}</span>
                           </div>
                           
                           <button 
                             onClick={() => updateCart(selectedDish.id, 1)} 
                             className="w-16 h-16 rounded-xl flex items-center justify-center text-black hover:bg-black/10 transition-colors"
                           >
                             <Plus size={24} strokeWidth={3} />
                           </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => addToCartFromModal(selectedDish.id)} 
                          className="w-full py-6 bg-primary text-black font-black uppercase tracking-[0.3em] text-xs rounded-2xl shadow-[0_15px_40px_rgba(0,209,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                        >
                           <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                           <ShoppingBasket size={20} className="relative z-10" />
                           <span className="relative z-10">Instalar Módulo</span>
                        </button>
                      )}
                   </div>
                 )}
              </div>
           </div>
           {/* Backdrop Close Area */}
           <div className="absolute inset-0 -z-10" onClick={() => setSelectedDish(null)}></div>
        </div>
      )}

      {/* Cart Modal - Tactical Order Confirmation */}
      {isCartOpen && !isReadOnly && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#05070A]/95 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-lg bg-[#0D1117] rounded-t-[3rem] p-8 border-t border-white/10 flex flex-col max-h-[90vh] shadow-[0_-20px_100px_rgba(0,0,0,0.5)] relative animate-in slide-in-from-bottom-12">
              {/* Tactical Close Button */}
              <button 
                onClick={() => setIsCartOpen(false)} 
                className="absolute top-8 right-8 w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90"
              >
                  <X size={24} />
              </button>
              
              <div className="mb-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono text-primary uppercase tracking-[0.4em]">Review de Protocolo</span>
                  </div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                     Configuração do Pedido
                  </h2>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-6 mb-10 custom-scrollbar">
                 {Object.keys(cart).length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-nasa-grid rounded-3xl border border-white/5">
                        <div className="w-20 h-20 bg-[#05070A] border border-white/10 rounded-2xl flex items-center justify-center mb-6 relative">
                            <div className="absolute inset-0 border border-primary/20 rounded-2xl animate-pulse" />
                            <ShoppingBasket size={32} className="text-primary/20" />
                        </div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-600">Nenhum Módulo em Fila de Processamento</p>
                    </div>
                 ) : (
                    Object.entries(cart).map(([id, data]) => {
                        const dish = menu.find(d => d.id === id);
                        if (!dish) return null;
                        return (
                            <div key={id} className="group bg-white/[0.02] rounded-3xl p-5 border border-white/5 flex gap-5 hover:border-white/10 transition-all relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                                
                                {isValidImageUrl(dish.image) ? (
                                    <img src={dish.image} className="w-24 h-24 rounded-2xl object-cover bg-black/40 border border-white/5" alt="" />
                                ) : (
                                    <div className="w-24 h-24 rounded-2xl bg-black/40 flex items-center justify-center border border-white/5">
                                      <ShoppingBasket size={32} className="opacity-10" />
                                    </div>
                                )}
                                
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                          <h3 className="font-black text-white uppercase text-sm tracking-wide leading-tight mb-1">{dish.name}</h3>
                                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">ID: {id.substring(0,8)}</span>
                                        </div>
                                        <span className="font-mono font-black text-primary text-base">{formatKz(dish.price * data.quantity)}</span>
                                    </div>

                                    <div className="relative mt-4">
                                      <input 
                                         type="text" 
                                         placeholder="NOTAS TÉCNICAS (OPCIONAL)" 
                                         className="bg-black/40 text-[10px] font-mono p-3 rounded-xl text-slate-300 w-full focus:outline-none focus:ring-1 focus:ring-primary/30 border border-white/5 placeholder:text-slate-700 uppercase tracking-widest"
                                         value={data.notes}
                                         onChange={(e) => updateNotes(id, e.target.value)}
                                      />
                                    </div>

                                    <div className="flex items-center gap-4 mt-4">
                                        <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/5">
                                          <button 
                                            onClick={() => updateCart(id, -1)} 
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                                          >
                                            <Minus size={14} />
                                          </button>
                                          <span className="font-mono font-black text-sm text-primary w-8 text-center">{data.quantity}</span>
                                          <button 
                                            onClick={() => updateCart(id, 1)} 
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-primary hover:text-white hover:bg-white/5 transition-all"
                                          >
                                            <Plus size={14} />
                                          </button>
                                        </div>
                                        <button 
                                          onClick={() => updateCart(id, -data.quantity)}
                                          className="text-[9px] font-mono text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors"
                                        >
                                          Remover
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                 )}
              </div>

              <div className="mt-auto border-t border-white/10 pt-8">
                 <div className="flex justify-between items-end mb-8">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] mb-1">Total Consolidado</span>
                      <span className="text-sm font-mono text-primary/60 uppercase tracking-widest">Sujeito a verificação</span>
                    </div>
                    <span className="text-4xl font-mono font-black text-primary tracking-tighter drop-shadow-[0_0_15px_rgba(0,209,255,0.3)]">
                      {formatKz(cartTotal)}
                    </span>
                 </div>
                 
                 <button 
                    onClick={handleSendOrder} 
                    disabled={cartItemsCount === 0}
                    className="w-full py-6 bg-primary text-black font-black uppercase tracking-[0.4em] text-xs rounded-3xl shadow-[0_20px_50px_rgba(0,209,255,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
                 >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                    <CheckCircle2 size={20} className="relative z-10" />
                    <span className="relative z-10">Transmitir Protocolo</span>
                 </button>
                 
                 <p className="text-center text-[8px] font-mono text-slate-600 uppercase tracking-[0.2em] mt-6">
                   Ao confirmar, o pedido será enviado para processamento imediato na cozinha.
                 </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PublicMenu;
