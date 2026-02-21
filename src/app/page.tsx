'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { verifyPinAction } from '@/app/actions/auth';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, currentUser, isInitialized, setUserSession } = useStore();
  
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [blockUntil, setBlockUntil] = useState<Date | null>(null);

  // Load lockout state from localStorage
  useEffect(() => {
    const savedBlockUntil = localStorage.getItem('pin_block_until');
    const savedAttempts = localStorage.getItem('pin_login_attempts');

    if (savedBlockUntil) {
      const blockDate = new Date(savedBlockUntil);
      if (blockDate > new Date()) {
        setBlockUntil(blockDate);
        setIsBlocked(true);
      } else {
        localStorage.removeItem('pin_block_until');
        localStorage.removeItem('pin_login_attempts');
      }
    }
    if (savedAttempts) {
      setAttempts(parseInt(savedAttempts, 10));
    }
  }, []);

  // Check if already authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, currentUser, router]);

  // Handle block timer
  useEffect(() => {
    if (blockUntil) {
      const interval = setInterval(() => {
        const now = new Date();
        if (now > blockUntil) {
          setIsBlocked(false);
          setBlockUntil(null);
          setAttempts(0);
          setError('');
          localStorage.removeItem('pin_block_until');
          localStorage.removeItem('pin_login_attempts');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [blockUntil]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) return;
    if (!pin) return;

    setIsLoading(true);
    setError('');

    try {
      // Attempt login with PIN using Server Action
      const result = await verifyPinAction(pin);

      if (result.success && result.user) {
        // Clear lockout state on success
        localStorage.removeItem('pin_block_until');
        localStorage.removeItem('pin_login_attempts');
        
        // Update client store
        setUserSession(result.user);
        router.push('/dashboard');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem('pin_login_attempts', newAttempts.toString());
        
        if (newAttempts >= 3) {
          const blockTime = new Date(Date.now() + 60 * 1000); // 1 minute block
          setIsBlocked(true);
          setBlockUntil(blockTime);
          localStorage.setItem('pin_block_until', blockTime.toISOString());
          setError('Muitas tentativas falhadas. Acesso bloqueado temporariamente.');
        } else {
          setError(result.error || `PIN incorreto. Tentativa ${newAttempts} de 3.`);
        }
        setPin('');
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar entrar.');
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent hydration mismatch by showing nothing until mounted/initialized
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <Lock size={40} />
          </div>
          <h1 className="text-2xl font-bold text-white">Tasca do Vereda</h1>
          <p className="text-slate-400 text-sm mt-1">Insira seu PIN para aceder</p>
        </div>

        {isBlocked ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center animate-pulse">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-red-500 font-bold text-lg mb-1">Acesso Bloqueado</h3>
            <p className="text-red-400 text-sm">
              Muitas tentativas incorretas.
              <br />
              Tente novamente em {blockUntil ? Math.ceil((blockUntil.getTime() - Date.now()) / 1000) : 60}s
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  // Only allow numbers
                  const val = e.target.value.replace(/\D/g, '');
                  setPin(val);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:tracking-normal placeholder:text-lg"
                placeholder="• • • •"
                maxLength={8} // Assuming PINs are usually 4-8 digits
                autoFocus
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                <AlertCircle size={18} className="text-red-500 shrink-0" />
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !pin}
              className="w-full bg-primary text-black font-bold py-4 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        )}
        
        <div className="mt-8 text-center">
          <p className="text-slate-600 text-xs">
            &copy; {new Date().getFullYear()} Tasca do Vereda. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
