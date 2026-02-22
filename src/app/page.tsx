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
    // Check Redux state first (primary source of truth with redux-persist)
    if (user) {
      router.replace('/dashboard');
      return;
    }

    // Fallback to cookie check if Redux state is empty (rare case if persist works)
    const pinSessionCookie = document.cookie.split('; ').find(row => row.startsWith('pin_session='));
    if (pinSessionCookie) {
      router.replace('/dashboard');
    } else {
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