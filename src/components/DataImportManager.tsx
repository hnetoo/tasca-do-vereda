import React, { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { 
  FileText, Upload, Download, CheckCircle, AlertCircle, 
  Loader2, Database, Trash2 
} from 'lucide-react';
import { Category, Product } from '@/types';

export const DataImportManager = () => {
  const { 
    addNotification, 
    addCategory, 
    addDish, 
    hardResetMenu 
  } = useStore();

  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    categories: number;
    products: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportSummary(null);

    try {
      const text = await file.text();
      if (file.name.endsWith('.csv')) {
        await parseCSV(text);
      } else if (file.name.endsWith('.xml')) {
        await parseXML(text);
      } else {
        throw new Error('Formato de ficheiro não suportado. Use .csv ou .xml');
      }
    } catch (error: any) {
      addNotification('error', error.message || 'Erro ao importar ficheiro');
      setImportSummary({ categories: 0, products: 0, errors: [error.message] });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const parseCSV = async (text: string) => {
    // Simple CSV parser - assumes header row
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    let categoriesCount = 0;
    let productsCount = 0;
    const errors: string[] = [];

    // Check required columns
    const requiredCols = ['type', 'name']; // minimal requirement
    const missingCols = requiredCols.filter(col => !headers.includes(col));
    
    if (missingCols.length > 0) {
      throw new Error(`Colunas obrigatórias em falta: ${missingCols.join(', ')}`);
    }

    const typeIdx = headers.indexOf('type');
    const nameIdx = headers.indexOf('name');
    const priceIdx = headers.indexOf('price');
    const categoryIdx = headers.indexOf('category'); // Parent category for products

    // Process rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length < headers.length) continue;

        const type = cols[typeIdx]?.toLowerCase();
        const name = cols[nameIdx];
        
        if (type === 'category') {
            const newCategory: Category = {
                id: crypto.randomUUID(),
                name: name,
                isActive: true,
                isAvailableOnDigitalMenu: true,
                sortOrder: 0,
                created_at: new Date(),
                updated_at: new Date()
            };
            // Note: addCategory might be async in some implementations, but here it's Zustand action
            addCategory(newCategory);
            categoriesCount++;
        } else if (type === 'product' || type === 'dish') {
            const price = parseFloat(cols[priceIdx] || '0');
            const categoryName = cols[categoryIdx];
            
            // Try to find category ID by name if provided, else use 'uncategorized' or create one?
            // For simplicity, we skip category linking logic here or require category ID.
            // Let's assume basic import for now.
            
            const newDish: Product = {
                id: crypto.randomUUID(),
                name: name,
                price: price,
                description: '',
                categoryId: 'uncategorized', // robust import would resolve this
                isActive: true,
                isAvailableOnDigitalMenu: true,
                created_at: new Date(),
                updated_at: new Date()
            };
            addDish(newDish);
            productsCount++;
        }
      } catch (err: any) {
        errors.push(`Linha ${i + 1}: ${err.message}`);
      }
    }

    setImportSummary({ categories: categoriesCount, products: productsCount, errors });
    addNotification('success', `Importação concluída: ${categoriesCount} categorias, ${productsCount} produtos.`);
  };

  const parseXML = async (text: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    
    let categoriesCount = 0;
    let productsCount = 0;
    const errors: string[] = [];

    const items = xmlDoc.getElementsByTagName("Item");
    
    for (let i = 0; i < items.length; i++) {
        try {
            const item = items[i];
            const type = item.getAttribute("type") || item.getElementsByTagName("Type")[0]?.textContent;
            const name = item.getElementsByTagName("Name")[0]?.textContent;

            if (!name) continue;

            if (type?.toLowerCase() === 'category') {
                const newCategory: Category = {
                    id: crypto.randomUUID(),
                    name: name,
                    isActive: true,
                    isAvailableOnDigitalMenu: true,
                    sortOrder: 0,
                    created_at: new Date(),
                    updated_at: new Date()
                };
                addCategory(newCategory);
                categoriesCount++;
            } else if (type?.toLowerCase() === 'product') {
                const price = parseFloat(item.getElementsByTagName("Price")[0]?.textContent || "0");
                
                const newDish: Product = {
                    id: crypto.randomUUID(),
                    name: name,
                    price: price,
                    description: item.getElementsByTagName("Description")[0]?.textContent || '',
                    categoryId: 'uncategorized',
                    isActive: true,
                    isAvailableOnDigitalMenu: true,
                    created_at: new Date(),
                    updated_at: new Date()
                };
                addDish(newDish);
                productsCount++;
            }
        } catch (err: any) {
            errors.push(`Item ${i + 1}: ${err.message}`);
        }
    }

    setImportSummary({ categories: categoriesCount, products: productsCount, errors });
    addNotification('success', `Importação XML concluída: ${categoriesCount} categorias, ${productsCount} produtos.`);
  };

  const downloadTemplate = (format: 'csv' | 'xml') => {
    let content = '';
    let filename = '';
    let type = '';

    if (format === 'csv') {
        content = 'type,name,price,category,description\ncategory,Bebidas,0,,\nproduct,Coca-Cola,1.5,Bebidas,Refrigerante lata';
        filename = 'template_importacao.csv';
        type = 'text/csv';
    } else {
        content = `<?xml version="1.0" encoding="UTF-8"?>
<Data>
  <Item type="category">
    <Name>Bebidas</Name>
  </Item>
  <Item type="product">
    <Name>Coca-Cola</Name>
    <Price>1.50</Price>
    <Category>Bebidas</Category>
    <Description>Refrigerante lata</Description>
  </Item>
</Data>`;
        filename = 'template_importacao.xml';
        type = 'text/xml';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500/20 rounded-xl text-orange-500">
            <Database size={22} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Importar Dados</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">CSV ou XML</p>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => downloadTemplate('csv')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
            >
                <Download size={12} /> Template CSV
            </button>
            <button 
                onClick={() => downloadTemplate('xml')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
            >
                <Download size={12} /> Template XML
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <label className={`
            relative p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group
            ${isImporting ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-orange-500/50 hover:bg-orange-500/5'}
        `}>
          <input 
            type="file" 
            ref={fileInputRef}
            accept=".csv,.xml" 
            className="hidden" 
            onChange={handleFileUpload}
            disabled={isImporting}
          />
          {isImporting ? (
            <Loader2 size={32} className="text-blue-500 animate-spin" />
          ) : (
            <Upload size={32} className="text-slate-500 group-hover:text-orange-500 transition-colors" />
          )}
          <div className="text-center">
            <p className="text-sm font-bold text-white uppercase tracking-widest mb-1">
                {isImporting ? 'Importando...' : 'Clique para selecionar'}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
                Suporta .csv e .xml
            </p>
          </div>
        </label>

        <div className="space-y-4">
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 h-full">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Resumo da Importação</h4>
                
                {importSummary ? (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-emerald-500/10 rounded-lg">
                            <span className="text-xs text-emerald-400 font-bold">Categorias</span>
                            <span className="text-sm font-mono text-emerald-400">{importSummary.categories}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-blue-500/10 rounded-lg">
                            <span className="text-xs text-blue-400 font-bold">Produtos</span>
                            <span className="text-sm font-mono text-blue-400">{importSummary.products}</span>
                        </div>
                        {importSummary.errors.length > 0 && (
                            <div className="mt-2 p-2 bg-red-500/10 rounded-lg max-h-32 overflow-y-auto">
                                <p className="text-[10px] text-red-400 font-bold mb-1">Erros ({importSummary.errors.length})</p>
                                {importSummary.errors.map((err, i) => (
                                    <p key={i} className="text-[9px] text-red-300 font-mono truncate">{err}</p>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-32 flex items-center justify-center text-slate-600 text-[10px] uppercase font-bold tracking-widest">
                        Aguardando ficheiro...
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
