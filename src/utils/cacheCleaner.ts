'use client';

import { useEffect, useState } from 'react';

export function clearTableCache() {
  try {
    // Limpar cache localStorage
    localStorage.removeItem('tasca_tables_cache');
    
    // Limpar sessionStorage
    sessionStorage.removeItem('tasca_tables_cache');
    
    // Limpar IndexedDB (se existir)
    if ('indexedDB' in window) {
      const request = indexedDB.deleteDatabase('tasca_offline_db');
      request.onsuccess = () => {
        console.log('✅ IndexedDB limpo com sucesso');
      };
      request.onerror = () => {
        console.error('❌ Erro ao limpar IndexedDB');
      };
    }
    
    console.log('🗑️ Cache de mesas limpo completamente');
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
    return false;
  }
}

export function useCacheCleaner() {
  const [isCleaning, setIsCleaning] = useState(false);
  
  const cleanCache = async () => {
    setIsCleaning(true);
    try {
      const success = clearTableCache();
      if (success) {
        // Forçar reload da página para limpar dados antigos
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
    } finally {
      setIsCleaning(false);
    }
  };
  
  return { cleanCache, isCleaning };
}
