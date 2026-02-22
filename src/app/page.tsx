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
        // getUser valida o token no servidor, getSession pode usar cache inseguro
        const { data: { user }, error } = await supabase.auth.getUser();

        // Check for PIN session cookie as fallback
        const hasPinSession = typeof document !== 'undefined' && 
          document.cookie.split(';').some((item) => item.trim().startsWith('pin_session='));

        if (user) {
          // Sync with store if needed
          setUserSession(user);
          router.replace('/dashboard');
        } else if (hasPinSession) {
          // Valid PIN session found
          router.replace('/dashboard');
        } else {
          // No session found or error
          if (error) console.error('Session check failed:', error);
          router.replace('/login');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        router.replace('/login');
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
