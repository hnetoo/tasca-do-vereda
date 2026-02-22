'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/reduxStore';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);


  useEffect(() => {
    console.log('PAGE: useEffect triggered');
    console.log('PAGE: Current user state:', { user, isAuthenticated });

    if (isAuthenticated) {
      console.log('PAGE: User authenticated in Redux, redirecting to /dashboard');
      router.replace('/dashboard');
    } else {
      console.log('PAGE: No authenticated user, redirecting to /login');
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">A verificar sessão...</p>
      </div>
    </div>
  );
}