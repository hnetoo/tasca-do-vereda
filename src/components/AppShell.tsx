'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import SmartAlertsPanel from '@/components/SmartAlertsPanel';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useAuth } from '@/hooks/useAuth';
import { Menu, X } from 'lucide-react';

const publicRoutes = ['/login', '/publicmenu', '/customer-display', '/qrscanner', '/mobiledashboard', '/menu', '/owner/login', '/owner/mobile', '/owner/mobile/login'];
const noSidebarRoutes = ['/login', '/publicmenu', '/customer-display', '/qrscanner', '/mobiledashboard', '/menu', '/owner', '/owner/login', '/owner/mobile', '/owner/mobile/login'];

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [sidebarHidden, setSidebarHidden] = useState(false);

  // Considerar a aplicação inicializada quando o estado de autenticação não está mais a carregar
  const isInitialized = !loading;

  const isPublicRoute = useMemo(
    () => publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)),
    [pathname]
  );

  const showSidebar = useMemo(
    () => !noSidebarRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)) && !sidebarHidden,
    [pathname, sidebarHidden]
  );
  
  const showCta = useMemo(
    () => pathname === '/menu' || pathname.startsWith('/menu/'),
    [pathname]
  );

  useEffect(() => {
    // Strict Guard: If initialized and not authenticated on a protected route, force redirect immediately
    console.log('AppShell Debug:', {
      pathname,
      isAuthenticated,
      isInitialized,
      isPublicRoute,
    });

    if (isInitialized && !isAuthenticated && !isPublicRoute) {
      console.log('AppShell: Redirecting to /login');
      router.replace('/login');
    }
  }, [isPublicRoute, isInitialized, isAuthenticated, router, pathname]);

  // If it's a public route, just render the children directly
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Block rendering entirely until initialized
  if (!isInitialized) {
     return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
          <p className="text-lg font-semibold animate-pulse">A verificar segurança do sistema...</p>
        </div>
     );
  }

  // If initialized but not authenticated (and not public), return null (or loader) while redirect happens
  if (!isAuthenticated && !isPublicRoute) {
      return null; 
  }

  return (
    <>
      {/* Botão de toggle da sidebar - aparece quando a sidebar está escondida */}
      {!showSidebar && !pathname.startsWith('/owner') && (
        <button
          onClick={() => setSidebarHidden(false)}
          className="fixed top-4 left-4 z-50 w-10 h-10 rounded-lg flex items-center justify-center bg-primary text-black shadow-lg shadow-primary/30 hover:scale-110 transition-all"
          title="Mostrar Menu"
        >
          <Menu size={20} />
        </button>
      )}
      
      <div className="min-h-[100dvh] bg-slate-950 text-white flex transition-opacity duration-300">
          <AppSidebar showSidebar={showSidebar && !pathname.startsWith('/owner')} />
          <main className={`flex-1 min-w-0 ${showSidebar && !pathname.startsWith('/owner') ? '' : 'ml-0'}`}>
            {/* Botão para esconder sidebar - REMOVIDO - layout limpo */}
            {/* {showSidebar && !pathname.startsWith('/owner') && (
              <button
                onClick={() => setSidebarHidden(true)}
                className="fixed top-4 right-4 z-50 w-12 h-12 rounded-lg flex items-center justify-center bg-red-600 text-white hover:bg-red-700 transition-all border-2 border-red-400 shadow-lg"
                title="Esconder Menu"
              >
                <X size={20} />
              </button>
            )} */}
            
            {!pathname.startsWith('/owner') && <Breadcrumbs />} 
            
            {/* Elemento de Marketing */}
            {showCta && (
              <div className="fixed bottom-4 right-4 md:absolute md:top-4 md:right-4 z-50">
                <a 
                  href="https://wa.me/244976825520" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-primary text-black px-3 py-1.5 md:px-4 md:py-2 rounded-full font-black uppercase tracking-widest text-[10px] md:text-xs shadow-[0_0_20px_rgba(250,204,21,0.5)] hover:scale-105 transition-transform animate-pulse"
                >
                  <span>FAÇA A SUA ENCOMENDA</span>
                </a>
              </div>
            )}

            {children}
          </main>
      </div>
      <SmartAlertsPanel />
    </>
  );
};

export default AppShell;
