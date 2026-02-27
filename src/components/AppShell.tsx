'use client';

import React, { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import SmartAlertsPanel from '@/components/SmartAlertsPanel';
import Breadcrumbs from '@/components/Breadcrumbs';
import SidebarToggle from '@/components/SidebarToggle';
import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'; // Importar o hook useAuth do Redux

const publicRoutes = ['/login', '/publicmenu', '/customer-display', '/qrscanner', '/mobiledashboard', '/menu', '/owner/login'];
const noSidebarRoutes = ['/login', '/publicmenu', '/customer-display', '/qrscanner', '/mobiledashboard', '/menu', '/owner', '/owner/login'];

const AppShellContent = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const { isMainSidebarHidden } = useSidebar(); // Usar contexto

  // Considerar a aplicação inicializada quando o estado de autenticação não está mais a carregar
  const isInitialized = !loading;

  const isPublicRoute = useMemo(
    () => publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)),
    [pathname]
  );

  // Modificar showSidebar para considerar o estado do contexto
  const showSidebar = useMemo(
    () => !noSidebarRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)) && !isMainSidebarHidden,
    [pathname, isMainSidebarHidden]
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
      {!showSidebar && !noSidebarRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)) && <SidebarToggle />}
      
      <div className="min-h-[100dvh] bg-slate-950 text-white flex transition-opacity duration-300">
          <Sidebar showSidebar={showSidebar} />
          <main className={`flex-1 min-w-0 ${showSidebar ? '' : 'ml-0'}`}>
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

// Wrapper component that provides the sidebar context
const AppShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <AppShellContent>{children}</AppShellContent>
    </SidebarProvider>
  );
};

export default AppShell;
