'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface TableData {
  id: string;
  number: number;
  seats: number;
  shape: string;
  status: string;
  is_active: boolean;
  color: string;
  x: number;
  y: number;
  zone: string;
  label: string;
}

const CACHE_KEY = 'tasca_tables_cache';
const CACHE_VERSION = '1.0';

export function useOfflineTables() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true); // FORÇADO ONLINE

  useEffect(() => {
    // FORÇAR ONLINE - Remover monitoramento offline
    setIsOnline(true);
    
    // Monitorar status da conexão (mas manter online)
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(true); // FORÇAR ONLINE mesmo offline

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
      
      // SINCRONIZAÇÃO DIRETA - Sempre buscar do Supabase
      console.log('🌐 Sincronização Direta: Buscando mesas do Supabase...');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('id, number, seats, shape, status, is_active, color, x, y, zone, label')
        .order('number', { ascending: true });

      console.log('🔍 Query executada:', {
        table: 'restaurant_tables',
        select: 'id, number, seats, shape, status, is_active, color, x, y, zone, label',
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
      console.log('� Cache carregado:', cacheData.tables?.length || 0, 'mesas');
      return cacheData.tables || [];
    } catch (error) {
      console.error('❌ Erro ao carregar cache:', error);
      return [];
    }
  };

  const clearCache = () => {
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem('tasca-vereda-storage-v2');
      localStorage.removeItem('tasca-vereda-storage-v2_schema_version');
      console.log('🧹 Cache local limpo com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
    }
  };

  return { 
    tables, 
    loading, 
    isOnline, 
    loadTables, 
    refreshTables: loadTables,
    clearCache
  };
}
