import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { logger } from '../services/logger';
import { MenuCategory } from '../types';
import { Search, Plus, Trash2, Edit2, X, Save, RefreshCw, Grid3X3, Coffee, Pizza, Beer, IceCream, Utensils } from 'lucide-react';

// Icons available for categories
const AVAILABLE_ICONS = [
  { name: 'Grid3X3', label: 'Geral', icon: Grid3X3 },
  { name: 'Coffee', label: 'Pequeno Almoço/Bebidas Quentes', icon: Coffee },
  { name: 'Pizza', label: 'Pratos Principais', icon: Pizza },
  { name: 'Beer', label: 'Bebidas Alcoólicas', icon: Beer },
  { name: 'IceCream', label: 'Sobremesas', icon: IceCream },
  { name: 'Utensils', label: 'Talheres', icon: Utensils },
];

const Categories = () => {
  const { categories, addCategory, updateCategory, removeCategory, scanAndRecoverCategories } = useStore();
  
  // Modal states
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [catForm, setCatForm] = useState<Partial<MenuCategory>>({
    name: '',
    icon: 'Grid3X3'
  });

  useEffect(() => {
    logger.info('Categories page mounted', null, 'Categories');
    return () => {
      logger.info('Categories page unmounted', null, 'Categories');
    };
  }, []);

  const handleOpenCatModal = (cat?: MenuCategory) => {
    if (cat) {
      setEditingId(cat.id);
      setCatForm(cat);
    } else {
      setEditingId(null);
      setCatForm({ name: '', icon: 'Grid3X3' });
    }
    setIsCatModalOpen(true);
  };

  const handleSubmitCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name) return;

    if (editingId) {
      updateCategory({ ...catForm, id: editingId } as MenuCategory);
    } else {
      // Ensure ID generation for new categories
      const newCategory = {
        ...catForm,
        id: Math.random().toString(36).substr(2, 9)
      } as MenuCategory;
      addCategory(newCategory);
    }
    setIsCatModalOpen(false);
  };

  const handleRestoreCategories = async () => {
    if (confirm('Esta ação tentará localizar categorias removidas em logs e backups e restaurá-las automaticamente. Deseja continuar?')) {
      await scanAndRecoverCategories();
    }
  };

  return (
    <div className="p-6 bg-background h-full overflow-y-auto font-sans flex flex-col">
      <header className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Categorias</h2>
          <p className="text-slate-400 text-sm mt-1">Organize seu menu em categorias.</p>
        </div>
        <div className="flex gap-3">
          <button 
             onClick={handleRestoreCategories}
             className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold uppercase text-[10px] tracking-widest border border-yellow-500/20"
             title="Tentar recuperar categorias perdidas"
           >
             <RefreshCw size={16} />
             Restaurar
           </button>
          <button 
            onClick={() => handleOpenCatModal()}
            className="bg-primary text-black px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-glow hover:scale-105 transition-all font-black uppercase text-xs tracking-widest"
          >
            <Plus size={18} />
            Nova Categoria
          </button>
        </div>
      </header>

      <div className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name)).map(cat => {
            const iconObj = AVAILABLE_ICONS.find(i => i.name === cat.icon);
            const IconComp = iconObj ? iconObj.icon : Grid3X3;
            
            return (
              <div key={cat.id} className="glass-panel p-6 rounded-[2rem] border border-white/5 flex items-center justify-between hover:border-primary/40 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-black/40 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform text-primary shadow-lg shadow-primary/5">
                    <IconComp size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{cat.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-wider">{cat.id.substring(0, 8)}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenCatModal(cat)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all border border-white/5">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => removeCategory(cat.id)} className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-500 transition-all border border-red-500/10">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Categoria */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                {editingId ? <Edit2 size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />}
                {editingId ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button onClick={() => setIsCatModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8">
              <form onSubmit={handleSubmitCat} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome da Categoria</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:bg-white/10 outline-none transition-all font-bold"
                    placeholder="Ex: Bebidas"
                    value={catForm.name}
                    onChange={e => setCatForm({...catForm, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ícone</label>
                  <div className="grid grid-cols-4 gap-2">
                    {AVAILABLE_ICONS.map(icon => (
                      <button
                        key={icon.name}
                        type="button"
                        onClick={() => setCatForm({...catForm, icon: icon.name})}
                        className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${catForm.icon === icon.name ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                      >
                        <icon.icon size={20} />
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-4 bg-primary text-black rounded-xl font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-glow flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Salvar Categoria
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
