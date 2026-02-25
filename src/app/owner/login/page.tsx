'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OwnerLogin from '@/components/OwnerLogin';

export default function OwnerLoginPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar se já está autenticado
    const checkAuth = () => {
      try {
        const auth = localStorage.getItem('owner_auth');
        const timestamp = localStorage.getItem('owner_timestamp');
        
        if (auth === 'true' && timestamp) {
          const authTime = parseInt(timestamp);
          const now = Date.now();
          const hoursPassed = (now - authTime) / (1000 * 60 * 60);
          
          // Sessão válida por 24 horas
          if (hoursPassed < 24) {
            setIsAuthenticated(true);
            router.push('/owner');
            return;
          }
        }
        
        // Limpar autenticação expirada
        localStorage.removeItem('owner_auth');
        localStorage.removeItem('owner_timestamp');
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return <OwnerLogin onLogin={(success) => {
    if (success) {
      setIsAuthenticated(true);
      router.push('/owner');
    }
  }} />;
}
