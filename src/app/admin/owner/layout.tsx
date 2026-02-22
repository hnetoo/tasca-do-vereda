'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectUser } from '@/store/slices/authSlice';
import { Loader2 } from 'lucide-react';

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const zustandStore = useStore(); // Keep useStore for other state if needed
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        // Check for PIN session cookie as fallback
        const pinSessionCookie = typeof document !== 'undefined' ? 
          document.cookie.split(';').map(c => c.trim()).find((item) => item.startsWith('pin_session=')) : null;
        
        const hasPinSession = !!pinSessionCookie;

        if (!session && !hasPinSession && !user) {
          await dispatch(logout());
          router.push('/admin/owner/login');
          return;
        }

        // Verify Role Access (OWNER or ADMIN only)
        let role = '';
        if (user?.role) {
          role = user.role.toUpperCase();
        } else if (session?.user) {
          // If Supabase session, check metadata (default to ADMIN if missing, assuming secure backend)
          role = (session.user.user_metadata.role || 'ADMIN').toUpperCase();
        } else if (hasPinSession && pinSessionCookie) {
          try {
             const value = decodeURIComponent(pinSessionCookie.split('=')[1]);
             const data = JSON.parse(value);
             role = (data.userRole || '').toUpperCase();
          } catch (e) {
             console.error('Error parsing PIN session:', e);
          }
        }

        if (role !== 'OWNER' && role !== 'ADMIN') {
           // Redirect unauthorized users to standard dashboard
           router.push('/dashboard');
           return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error checking session:', error);
        await dispatch(logout());
        router.push('/admin/owner/login');
      }
    };

    checkSession();
  }, [router, dispatch, user]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      <div className="p-8 pb-0">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Área do Proprietário</h1>
        <p className="text-slate-400 mb-8">Gestão completa e análise do restaurante</p>
      </div>
      <div className="flex-1 p-8 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </div>
    </div>
  );
}
