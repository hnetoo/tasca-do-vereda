'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface OwnerLoginProps {
  onLogin: (success: boolean) => void;
}

export default function OwnerLogin({ onLogin }: OwnerLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Credenciais fixas para o owner (em produção, usar variáveis de ambiente)
  const OWNER_EMAIL = 'owner@tasca-do-vereda.ao';
  const OWNER_PASSWORD = 'TascaOwner2024!';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Verificação simples de credenciais
      if (email === OWNER_EMAIL && password === OWNER_PASSWORD) {
        // Salvar autenticação no localStorage
        localStorage.setItem('owner_auth', 'true');
        localStorage.setItem('owner_timestamp', Date.now().toString());
        
        // Notificar sucesso
        onLogin(true);
        
        // Redirecionar para dashboard
        router.push('/owner');
      } else {
        setError('Credenciais inválidas');
      }
    } catch (err) {
      setError('Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="Tasca do Vereda" 
            className="w-32 h-12 mx-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-black text-white mb-2">Painel do Dono</h1>
          <p className="text-slate-400 text-sm">Acesso exclusivo para gestão do negócio</p>
        </div>

        {/* Form */}
        <div className="bg-slate-900 rounded-2xl border border-white/10 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-primary outline-none"
                placeholder="owner@tasca-do-vereda.ao"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-primary outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/30">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Autenticando...' : 'Entrar'}
            </button>
          </form>

          {/* Security Info */}
          <div className="mt-6 p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/30">
            <p className="text-emerald-400 text-xs">
              🔒 Área restrita - Acesso apenas para o proprietário
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <a 
            href="/"
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            ← Voltar para o site
          </a>
        </div>
      </div>
    </div>
  );
}
