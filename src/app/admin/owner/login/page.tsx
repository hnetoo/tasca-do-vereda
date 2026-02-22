'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useStore } from '@/store/useStore';
import { ChefHat, Shield, Lock, Mail, Eye, EyeOff, ChevronRight, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/services/logger';

export default function AdminOwnerLoginPage() {
  const router = useRouter();
  const { settings, setUserSession } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  
  // Use a ref to track mount status
  const isMounted = useRef(false);

  // Prevent state updates on unmounted component
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && isMounted.current) {
        // Check role in profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        const role = (profile?.role || session.user.user_metadata?.role || '').toUpperCase();
        
        if (role === 'ADMIN' || role === 'OWNER') {
           router.push('/admin/owner');
        } else {
           // If logged in as regular user, logout to allow admin login
           await supabase.auth.signOut();
           if (isMounted.current) {
             setError('Acesso restrito apenas para administradores');
           }
        }
      }
    };
    
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (isMounted.current) {
        setIsLoading(true);
        setError(null);
    }

    try {
      const supabase = createClient();
      
      // 1. Authenticate with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (data.user) {
        // 2. Check Role (Profiles table as requested)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, name')
            .eq('id', data.user.id)
            .single();
        
        // Fallback to metadata if profile fetch fails or is missing (resilience)
        const role = (profile?.role || data.user.user_metadata?.role || '').toUpperCase();
        const name = profile?.name || data.user.user_metadata?.name || email.split('@')[0];

        // 3. Validate Role
        if (role === 'ADMIN' || role === 'OWNER') {
          logger.info(`Admin/Owner login successful: ${email}`, { role });
          
          // Update Store State
          const appUser = {
             id: data.user.id,
             name: name,
             email: email,
             role: role,
             permissions: [],
             pin: '', 
             active: true
          };
          
          if (isMounted.current) {
              setUserSession(appUser);
              // Redirect
              router.push('/admin/owner');
          }
        } else {
          // Access Denied
          logger.warn(`Access denied for user ${email} with role ${role}`, undefined, 'AUTH');
          await supabase.auth.signOut();
          if (isMounted.current) {
              setError('Acesso restrito apenas para administradores');
          }
        }
      }
    } catch (err: any) {
      logger.error('Admin login error', { error: err.message }, 'AUTH');
      if (isMounted.current) {
          setError(err.message === 'Invalid login credentials' ? 'Credenciais inválidas' : err.message);
      }
    } finally {
      if (isMounted.current) {
          setIsLoading(false);
      }
    }
  };

  const renderLogo = () => {
    if (settings.appLogoUrl && !logoError) {
      return (
        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl mx-auto mb-4 shadow-2xl overflow-hidden">
          <Image
            src={settings.appLogoUrl}
            alt="App Logo"
            fill
            sizes="(max-width: 768px) 96px, 128px"
            className="object-cover"
            onError={() => setLogoError(true)}
          />
        </div>
      );
    }
    return (
      <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-primary to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-2xl">
         <ChefHat size={48} className="text-white" />
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center relative overflow-y-auto font-sans px-6 py-10">
       <div className="w-full max-w-md z-10">
         <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
           {renderLogo()}
           <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
             {settings.restaurantName || 'Tasca do Vereda'}
           </h1>
           <p className="text-slate-400 mt-2 font-medium tracking-widest text-xs uppercase">Área do Proprietário</p>
         </div>

         <div className="glass-panel rounded-3xl p-8 border border-white/5 shadow-2xl bg-black/40 backdrop-blur-xl">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                  <Shield size={20} className="text-primary" />
                  Login Seguro
                </h2>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200 text-sm animate-in fade-in zoom-in duration-300">
                  <AlertTriangle size={18} />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email administrativo"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
                
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-primary text-black rounded-xl font-bold text-sm uppercase tracking-wider shadow-glow hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    Acessar Painel
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </form>
         </div>
         
         <div className="text-center mt-8">
            <button 
                onClick={() => router.push('/login')}
                className="text-slate-500 text-xs hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto"
            >
                <ChevronRight size={12} className="rotate-180" />
                Voltar para App
            </button>
         </div>
       </div>
    </div>
  );
}
