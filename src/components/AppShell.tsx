'use client';

import React, { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useStore } from '@/store/useStore';

const publicRoutes = ['/login', '/publicmenu', '/customer-display', '/qrscanner', '/mobiledashboard'];
const noSidebarRoutes = ['/login', '/publicmenu', '/customer-display', '/qrscanner', '/mobiledashboard', '/pos'];

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

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!isInitialized) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-white flex">
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
};

export default AppShell;
