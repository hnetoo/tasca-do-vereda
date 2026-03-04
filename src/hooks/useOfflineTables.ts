'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface TableData {
  id: string;
  number: number;
  label: string | null;
  x: number | null;
  y: number | null;
  status: string | null;
  zone: string | null;
  color: string | null;
  created_at: string | null;
  group_id: string | null;
  height: number | null;
  is_active: boolean | null;
  name: string | null;
  rotation: number | null;
  seats: number | null;
  shape: string | null;
  updated_at: string | null;
  user_id: string | null;
  width: number | null;
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
          .select('id, number, label, x, y, status, zone, color, created_at, group_id, height, is_active, name, rotation, seats, shape, updated_at, user_id, width')
          .order('number', { ascending: true });

        console.log('🔍 Query executada:', {
          table: 'restaurant_tables',
          select: 'id, number, label, x, y, status, zone, color, created_at, group_id, height, is_active, name, rotation, seats, shape, updated_at, user_id, width',
          order: 'number ASC'
        });

        console.log('🔍 Supabase client:', {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT_SET',
          key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET'
        });

        if (error) {
          console.error('❌ Erro ao buscar mesas do Supabase:', error);
          console.error('🔍 Detalhes do erro:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          
          // TENTAR VERIFICAR SE TABELA EXISTE
          console.log('🔍 Verificando se tabela existe...');
          const { data: tableData, error: tableError } = await supabase
            .from('restaurant_tables')
            .select('count', { count: 'exact', head: true });
          
          console.log('🔍 Resultado verificação tabela:', {
            count: tableData,
            error: tableError
          });
          
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
