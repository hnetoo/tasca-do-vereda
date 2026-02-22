'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/reduxStore';
import { loginWithPin, resetAuthStatus } from '@/store/slices/authSlice';
import { ChefHat, Shield, Lock, Eye, EyeOff, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';
import { UserRole } from '@/types/auth.types';

export default function AdminOwnerLoginPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false); // Para alternar visibilidade do PIN

  const { isAuthenticated, loading, error, user } = useSelector(
    (state: RootState) => state.auth
  );



  useEffect(() => {
    dispatch(resetAuthStatus()); // Resetar o estado de autenticação ao montar o componente
  }, [dispatch]);

  // Redirecionamento e validação de role
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === UserRole.Admin || user.role === UserRole.Owner) {
        router.push('/admin/owner');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginWithPin({ pin, role: UserRole.Owner }));
  };

  const renderLogo = () => {
    // Simplificado para um logo estático ou placeholder, pois 'settings' não está mais disponível via useStore
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
             Tasca do Vereda
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

              {((isAuthenticated && user && user.role !== UserRole.Admin && user.role !== UserRole.Owner) || error) && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200 text-sm animate-in fade-in zoom-in duration-300">
                  <AlertTriangle size={18} />
                  {isAuthenticated && user && user.role !== UserRole.Admin && user.role !== UserRole.Owner
                    ? 'Acesso negado: PIN não autorizado para área administrativa.'
                    : error?.message}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="PIN Administrativo"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors"
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Entrar
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </form>
         </div>
       </div>
       <div className="absolute inset-0 z-0">
         <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950 opacity-80"></div>
         <div className="absolute inset-0 bg-[url('/images/admin-bg.webp')] bg-cover bg-center opacity-20"></div>
       </div>
    </div>
  );
}

