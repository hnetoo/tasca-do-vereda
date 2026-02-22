'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/reduxStore';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);


  useEffect(() => {
    console.log('PAGE: useEffect triggered');
    console.log('PAGE: Current user state:', user);

    if (user) {
      console.log('PAGE: User found in Redux, redirecting to /dashboard');
      router.replace('/dashboard');
      return;
    }

    const pinSessionCookie = document.cookie.split('; ').find(row => row.startsWith('pin_session='));
    console.log('PAGE: pinSessionCookie found:', !!pinSessionCookie);

    if (pinSessionCookie) {
      console.log('PAGE: pinSessionCookie found, redirecting to /dashboard');
      router.replace('/dashboard');
    } else {
      console.log('PAGE: No user or pinSessionCookie, redirecting to /login');
      router.replace('/login');
    }
  }, [user, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">A verificar sessão...</p>
      </div>
    </div>
  );
}