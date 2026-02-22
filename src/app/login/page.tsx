'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/reduxStore';
import { loginWithPin, resetAuthStatus } from '@/store/slices/authSlice';
import { UserRole } from '@/types/auth.types';


import { Loader2, Shield, ShoppingBag, Utensils, ChefHat, User, QrCode } from 'lucide-react';
import Image from 'next/image';



interface ProfileCardProps {
  role: UserRole;
  name: string;
  description: string;
  icon: React.ElementType;
  onClick: (role: UserRole) => void;
  isSelected: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ role, name, description, icon: Icon, onClick, isSelected }) => (
  <button
    className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all duration-200
      ${isSelected ? 'border-primary bg-primary/10 shadow-lg' : 'border-white/5 bg-slate-800 hover:border-primary/20 hover:bg-slate-700/50'}
      focus:outline-none focus:ring-2 focus:ring-primary`}
    onClick={() => onClick(role)}
  >
    <Icon size={48} className={`${isSelected ? 'text-primary' : 'text-slate-400'} mb-3`} />
    <span className={`font-bold text-lg ${isSelected ? 'text-primary' : 'text-white'}`}>{name}</span>
    <span className="text-xs text-slate-500 uppercase tracking-wider">{description}</span>
  </button>
);

const LoginPage: React.FC = () => {
  const [pin, setPin] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { isAuthenticated, loading, error } = useSelector(
    (state: RootState) => state.auth
  );
  
  // Track if we are in the process of logging in
  const isLoggingIn = React.useRef(false);

  useEffect(() => {
    // If we mount and are authenticated, it's likely stale state or manual navigation.
    // We should clear it to allow login.
    if (isAuthenticated && !isLoggingIn.current) {
        console.warn('LoginPage: Found authenticated state on mount. Clearing.');
        dispatch(resetAuthStatus());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    // Only redirect if we are authenticated AND it was a result of a login action (or we decide to trust it)
    // But since we clear on mount, this will only trigger if isAuthenticated becomes true LATER (i.e. after login)
    // UNLESS the race condition still happens.
    
    // Better logic: Only redirect if isLoggingIn.current is true?
    // But isLoggingIn is a ref, doesn't trigger effect.
    
    if (isAuthenticated && isLoggingIn.current) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole) {
      isLoggingIn.current = true;
      dispatch(loginWithPin({ pin, role: selectedRole }));
    }
  };

  const roles = [
    { id: UserRole.Admin, name: 'Gerente', description: 'ADMIN', icon: Shield },
    { id: UserRole.Caixa, name: 'Operador de Caixa', description: 'CAIXA', icon: ShoppingBag },
    { id: UserRole.Cozinha, name: 'Chefe de Cozinha', description: 'COZINHA', icon: ChefHat },
    { id: UserRole.Garcom, name: 'Garçom', description: 'GARCOM', icon: Utensils },
    { id: UserRole.Owner, name: 'Proprietário', description: 'OWNER', icon: User },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <div className="text-center mb-8">
        <Image
          src="/logo.png"
          alt="Tasca Do VEREDA Logo"
          width={150}
          height={150}
          className="mx-auto mb-4"
        />
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Tasca Do VEREDA</h1>
        <p className="text-slate-400 text-sm mt-2">SISTEMA DE GESTÃO INTELIGENTE</p>
      </div>
      <div className="px-8 py-6 mt-4 text-left bg-slate-800 shadow-lg rounded-lg border border-white/5 w-full max-w-md">
        <h3 className="text-2xl font-bold text-center text-white mb-6">Quem está a entrar?</h3>
        <p className="text-slate-400 text-center mb-8">Selecione o seu perfil de operador</p>

        {!selectedRole ? (
          <div className="grid grid-cols-2 gap-4">
            {roles.map((role) => (
              <ProfileCard
                key={role.id}
                role={role.id as UserRole}
                name={role.name}
                description={role.description}
                icon={role.icon}
                onClick={setSelectedRole}
                isSelected={selectedRole === role.id}
              />
            ))}
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="mt-4">
              <div>
                <label className="block text-white mb-2" htmlFor="pin">PIN para {selectedRole}</label>
                <input
                  type="password"
                  placeholder="Digite seu PIN"
                  className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-slate-700 border-slate-600 text-white"
                  id="pin"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              {error && (
                <div className="mt-4 text-red-500 text-sm">
                  {error.message}
                </div>
              )}
              <div className="flex items-baseline justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setSelectedRole(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 mt-4 text-slate-950 bg-primary rounded-lg hover:bg-white flex items-center justify-center transition-colors"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Entrar'
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
