'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, Lock, User } from 'lucide-react';

export default function OwnerLoginPage() {
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
    // Verificar se já está autenticado
    const isAuth = localStorage.getItem('owner_authenticated');
    if (isAuth === 'true') {
      router.push('/owner');
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
      // Salvar autenticação
      localStorage.setItem('owner_authenticated', 'true');
      localStorage.setItem('owner_user', credentials.username);
      localStorage.setItem('owner_login_time', new Date().toISOString());
      
      // Redirecionar para página owner
      router.push('/owner');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%239C92AC&quot; fill-opacity=&quot;0.05&quot;%3E%3Cpath d=&quot;M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      <div className="relative w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-4 shadow-glow">
            <Shield className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Tasca Do VEREDA</h1>
          <p className="text-slate-400">Painel do Proprietário</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Utilizador
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="owner ou admin"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Palavra-passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Digite sua palavra-passe"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Autenticando...</span>
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Credenciais Info */}
          <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <p className="text-xs text-slate-400 mb-2">Credenciais de acesso:</p>
            <div className="space-y-1">
              <p className="text-xs text-slate-300">
                <span className="font-medium">Owner:</span> owner / tasca2024owner
              </p>
              <p className="text-xs text-slate-300">
                <span className="font-medium">Admin:</span> admin / tasca2024admin
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-500 text-sm">
            Área restrita ao proprietário e administradores
          </p>
        </div>
      </div>
    </div>
  );
}
