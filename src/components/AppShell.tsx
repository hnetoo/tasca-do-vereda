'use client';

import React, { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import SmartAlertsPanel from '@/components/SmartAlertsPanel';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useAuth } from '@/hooks/useAuth'; // Importar o hook useAuth do Redux

const publicRoutes = ['/login', '/publicmenu', '/customer-display', '/qrscanner', '/mobiledashboard', '/menu'];
const noSidebarRoutes = ['/login', '/publicmenu', '/customer-display', '/qrscanner', '/mobiledashboard', '/pos', '/menu', '/owner'];

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth(); // Usar o hook useAuth do Redux

  // Considerar a aplicação inicializada quando o estado de autenticação não está mais a carregar
  const isInitialized = !loading;

  const isPublicRoute = useMemo(
    () => publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)),
    [pathname]
  );

  const showSidebar = useMemo(
    () => !noSidebarRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)),
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
  }, [isPublicRoute, isInitialized, isAuthenticated, router]);

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
      <div className="min-h-[100dvh] bg-slate-950 text-white flex transition-opacity duration-300">
          <Sidebar showSidebar={showSidebar} />
          <main className={`flex-1 min-w-0 ${showSidebar ? '' : 'ml-0'}`}>
            {!pathname.startsWith('/owner') && <Breadcrumbs />} 
            {children}
          </main>
      </div>
      <SmartAlertsPanel />
    </>
  );
};

export default AppShell;
