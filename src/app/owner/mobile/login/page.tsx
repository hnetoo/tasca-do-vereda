'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, Lock, User, Smartphone } from 'lucide-react';
import Head from 'next/head';

export default function OwnerMobileLoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Credenciais hardcoded para owner e admin
  const OWNER_CREDENTIALS = {
    username: 'owner',
    password: 'tasca2024owner'
  };

  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'tasca2024admin'
  };

  useEffect(() => {
    // Verificar se já está autenticado (localStorage apenas)
    const isAuth = localStorage.getItem('owner_mobile_authenticated') === 'true';
    
    if (isAuth) {
      router.push('/owner/mobile');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simular delay de autenticação
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar credenciais
    if (
      (credentials.username === OWNER_CREDENTIALS.username && credentials.password === OWNER_CREDENTIALS.password) ||
      (credentials.username === ADMIN_CREDENTIALS.username && credentials.password === ADMIN_CREDENTIALS.password)
    ) {
      // Salvar autenticação owner mobile (localStorage apenas)
      localStorage.setItem('owner_mobile_authenticated', 'true');
      localStorage.setItem('owner_mobile_user', credentials.username);
      localStorage.setItem('owner_mobile_login_time', new Date().toISOString());
      
      console.log('🔐 Owner Mobile auth set:', { localStorage: 'owner_mobile_authenticated=true' });
      
      // Redirecionar para página owner mobile
      router.push('/owner/mobile');
    } else {
      setError('Credenciais inválidas. Tente novamente.');
    }

    setIsLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  return (
    <>
      <Head>
        <title>Owner Mobile Login</title>
        <meta name="cache-control" content="no-cache, no-store, must-revalidate" />
        <meta name="pragma" content="no-cache" />
        <meta name="expires" content="0" />
        <meta http-equiv="cache-control" content="no-cache, no-store, must-revalidate" />
        <meta http-equiv="pragma" content="no-cache" />
        <meta http-equiv="expires" content="0" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        
        {/* Debug Info */}
        <div className="absolute top-4 left-4 bg-red-600 text-white p-2 text-xs z-50">
          DEBUG: Mobile Login Page - No Redirects Allowed
        </div>
      
      {/* Mobile Frame */}
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-3xl mb-4 shadow-[0_0_40px_rgba(250,204,21,0.3)]">
            <Smartphone className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Owner Mobile</h1>
          <p className="text-slate-400 text-sm">Acesso administrativo mobile</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Utilizador
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Digite o utilizador"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-12 pr-14 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Digite a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-primary to-primary/80 text-black font-black text-sm rounded-2xl hover:from-primary/90 hover:to-primary/70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_4px_20px_rgba(250,204,21,0.3)]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                  <span>A verificar...</span>
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
              <Shield size={14} />
              <span>Acesso seguro e criptografado</span>
            </div>
          </div>
        </div>

        {/* Back to Desktop */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/owner')}
            className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
          >
            ← Voltar para versão desktop
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
