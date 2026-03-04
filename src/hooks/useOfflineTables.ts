'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface TableData {
  id: string;
  status: string;
}

const CACHE_KEY = 'tasca_tables_cache';
const CACHE_VERSION = '1.0';

export function useOfflineTables() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Monitorar status da conexão
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    loadTables();
  }, [isOnline]); // Recarregar quando o status da conexão mudar

  const loadTables = async () => {
    try {
      setLoading(true);
      
      // Se estiver online, buscar do Supabase
      if (isOnline) {
        console.log('🌐 Online: Buscando mesas do Supabase...');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data, error } = await supabase
          .from('restaurant_tables')
          .select('id, status')
          .eq('is_active', true)
          .order('id', { ascending: true });

        if (error) {
          console.error('❌ Erro ao buscar mesas do Supabase:', error);
          setTables([]);
        } else {
          console.log('✅ Mesas carregadas do Supabase:', data?.length || 0);
          setTables(data || []);
          
          // Salvar no cache
          saveToCache(data || []);
        }
      } else {
        // Se estiver offline, carregar do cache
        console.log('📱 Offline: Carregando mesas do cache...');
        const cachedTables = loadFromCache();
        
        if (cachedTables.length > 0) {
          console.log('✅ Mesas carregadas do cache:', cachedTables.length);
          setTables(cachedTables);
        } else {
          console.log('⚠️ Cache vazio, sem mesas disponíveis offline');
          setTables([]);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mesas:', error);
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  const saveToCache = (tables: TableData[]) => {
    try {
      const cacheData = {
        version: CACHE_VERSION,
        tables,
        timestamp: new Date().toISOString(),
        lastSync: new Date().toISOString()
      };
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log('💾 Mesas salvas no cache:', tables.length);
    } catch (error) {
      console.error('❌ Erro ao salvar cache:', error);
    }
  };

  const loadFromCache = (): TableData[] => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return [];
      
      const cacheData = JSON.parse(cached);
      
      // Verificar versão do cache
      if (cacheData.version !== CACHE_VERSION) {
        console.log('🔄 Versão do cache incompatível, limpando...');
        localStorage.removeItem(CACHE_KEY);
        return [];
      }
      
      console.log('📂 Cache carregado:', new Date(cacheData.timestamp));
      return cacheData.tables || [];
    } catch (error) {
      console.error('❌ Erro ao carregar cache:', error);
      return [];
    }
  };

  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    setTables([]);
    console.log('🗑️ Cache limpo');
  };

  return {
    tables,
    loading,
    isOnline,
    refreshTables: loadTables,
    clearCache
  };
}
