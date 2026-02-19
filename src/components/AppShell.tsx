'use client';

import React, { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import SmartAlertsPanel from '@/components/SmartAlertsPanel';
import { useStore } from '@/store/useStore';

const publicRoutes = ['/login', '/publicmenu', '/customer-display', '/qrscanner', '/mobiledashboard', '/menu'];
const noSidebarRoutes = ['/login', '/publicmenu', '/customer-display', '/qrscanner', '/mobiledashboard', '/pos', '/menu', '/admin/owner'];

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isInitialized, initializeStore } = useStore();

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  const isPublicRoute = useMemo(
    () => publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)),
    [pathname]
  );

  const showSidebar = useMemo(
    () => !noSidebarRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)),
    [pathname]
  );

  useEffect(() => {
    if (!isPublicRoute && isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isPublicRoute, isInitialized, isAuthenticated, router]);

  return (
    <>
      <>
        {/* This structure is now always rendered, preventing hook order changes */}
        <div
          className={`min-h-[100dvh] bg-slate-950 text-white flex ${
            (!isInitialized || (!isAuthenticated && !isPublicRoute)) ? 'opacity-0' : 'opacity-100'
          } transition-opacity duration-300`}
        >
          <Sidebar showSidebar={showSidebar} />
          <main className={`flex-1 min-w-0 ${showSidebar ? 'ml-64' : 'ml-0'}`}>{children}</main>
        </div>
        <SmartAlertsPanel />

        {/* Loading overlay */}
        {!isInitialized && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
          </div>
        )}
      </>
    </>
  );
};

export default AppShell;
