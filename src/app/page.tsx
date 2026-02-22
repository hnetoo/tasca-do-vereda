'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useDispatch, useSelector } from 'react-redux';
import { setUserSession, logout } from '@/store/slices/authSlice';
import { RootState } from '@/store/reduxStore';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);


  useEffect(() => {
    const supabase = createClient();

    const checkUser = async () => {
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();

      if (supabaseUser) {
        dispatch(setUserSession(supabaseUser));
        router.replace('/dashboard');
      } else if (error) {
        console.error('Error fetching user:', error);
        dispatch(logout());
        router.replace('/login');
      } else {
        // Check for PIN session cookie
        const pinSessionCookie = document.cookie.split('; ').find(row => row.startsWith('pin_session='));
        if (pinSessionCookie) {
          router.replace('/dashboard');
        } else {
          router.replace('/login');
        }
      }

    };

    checkUser();
  }, [dispatch, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">A verificar sessão...</p>
      </div>
    </div>
  );
}