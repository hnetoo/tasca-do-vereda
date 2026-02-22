'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { setUserSession, logout } = useStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        // Check for PIN session cookie as fallback
        const hasPinSession = typeof document !== 'undefined' && 
          document.cookie.split(';').some((item) => item.trim().startsWith('pin_session='));

        if (session?.user) {
          // Sync with store if needed
          setUserSession(session.user);
          router.push('/dashboard');
        } else if (hasPinSession) {
          // Valid PIN session found
          router.push('/dashboard');
        } else {
          // No session found
          await logout(); // Clear any stale state
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        await logout();
        router.push('/login');
      } finally {
        // We keep isChecking true until redirect happens to prevent flash of content
        // But if we want to show loading, we need to render something
      }
    };

    checkSession();
  }, [router, setUserSession]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">A verificar sessão...</p>
      </div>
    </div>
  );
}
