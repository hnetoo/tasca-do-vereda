import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ChefHat, Delete, User, Shield, Wallet, Utensils, ArrowLeft, ChevronRight, Lock, Save, Key } from 'lucide-react';
import { User as UserType } from '../types';
import { CryptoService } from '../services/cryptoService';
import { logger } from '../services/logger';

const Login = () => {
  const { login, users, settings } = useStore();
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pin, setPin] = useState('');

  useEffect(() => {
    const initSecurity = async () => {
        // Initialize CryptoService with a derived secret from settings or a default
        // In a real app, this should be a stable unique ID for the installation
        const secret = settings.restaurantName || 'TASCA-SECURE-KEY-V1';
        await CryptoService.initialize(secret);

        const lastSelectedUserId = localStorage.getItem('last_selected_user_id');
        if (lastSelectedUserId) {
            const user = users.find(u => u.id === lastSelectedUserId);
            if (user) {
                setSelectedUser(user);
            } else {
                localStorage.removeItem('last_selected_user_id'); // Clear if user not found
            }
        }
    };
    initSecurity();
  }, [settings.restaurantName, users]);

  const handleClearCredentials = () => {
      localStorage.removeItem('last_selected_user_id');
      setSelectedUser(null);
      setPin('');
      logger.info('Credenciais salvas removidas pelo utilizador', undefined, 'AUTH');
  };

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setPin(''); // Clear PIN field when a new user is selected
      localStorage.setItem('last_selected_user_id', userId); // Save last selected user for convenience
    } else {
      localStorage.removeItem('last_selected_user_id');
      setSelectedUser(null);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validar explicitamente se a lista de utilizadores está vazia antes de prosseguir
    if (users.length === 0) {
      logger.warn('Tentativa de login com PIN, mas a lista de utilizadores está vazia. Impedindo login.', undefined, 'AUTH');
      setIsProcessing(false); // Garantir que o estado de processamento é resetado
      return;
    }
    if (!selectedUser || !pin) {
      logger.warn('Tentativa de login com PIN sem utilizador selecionado ou PIN vazio', { selectedUser: selectedUser?.id, pinProvided: !!pin }, 'AUTH');
      return;
    }

    setIsProcessing(true);
    logger.info('Tentativa de login com PIN', { userId: selectedUser.id }, 'AUTH');
    const success = await login(pin, selectedUser.id, true); // Pass PIN, userId, rememberMe true
    if (!success) {
      logger.warn('Falha no login com PIN', { userId: selectedUser.id }, 'AUTH');
      setPin(''); // Clear PIN on failure
    } else {
      logger.info('Login com PIN bem-sucedido', { userId: selectedUser.id, role: selectedUser.role }, 'AUTH');
    }
    setIsProcessing(false);
  };

  const getRoleIcon = (role: string, size: number = 24) => {
    switch (role) {
      case 'ADMIN': return <Shield size={size} />;
      case 'CAIXA': return <Wallet size={size} />;
      case 'COZINHA': return <ChefHat size={size} />;
      case 'GARCOM': return <Utensils size={size} />;
      default: return <User size={size} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'from-purple-500 to-indigo-600';
      case 'CAIXA': return 'from-blue-500 to-cyan-600';
      case 'COZINHA': return 'from-orange-500 to-red-600';
      case 'GARCOM': return 'from-green-500 to-emerald-600';
      default: return 'from-slate-500 to-slate-700';
    }
  };

  const renderLogo = () => {
    if (settings.appLogoUrl && !logoError) {
      return (
        <img 
          src={settings.appLogoUrl} 
          alt="App Logo" 
          className="w-24 h-24 md:w-32 md:h-32 rounded-2xl mx-auto mb-4 object-cover shadow-2xl"
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            setLogoError(true);
          }}
        />
      );
    }
    return (
      <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-primary to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-2xl">
         <ChefHat size={48} className="text-white" />
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background flex items-center justify-center relative overflow-y-auto font-sans px-6 py-10">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none fixed">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="w-full max-w-xl z-10">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          {renderLogo()}
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">
            {settings.restaurantName}
          </h1>
          <p className="text-slate-400 mt-2 font-medium tracking-widest text-xs uppercase">Sistema de Gestão Inteligente</p>
        </div>

        <div className="glass-panel rounded-[2rem] p-8 md:p-10 border border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-center bg-black/40 backdrop-blur-xl">
            {selectedUser ? (
                <form onSubmit={handlePinSubmit} className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="mb-6 text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo, {selectedUser.name}!</h2>
                        <p className="text-slate-400 text-sm">Introduza o seu PIN para aceder</p>
                    </div>

                    <div className="flex items-center justify-center mb-4">
                        <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getRoleColor(selectedUser.role)} flex items-center justify-center text-white shadow-lg`}>
                            {getRoleIcon(selectedUser.role, 32)}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="pin" className="sr-only">PIN</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                id="pin"
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="w-full pl-10 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-center text-xl font-mono tracking-widest"
                                placeholder="PIN de Acesso"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                maxLength={6}
                                disabled={isProcessing}
                                autoFocus
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isProcessing || pin.length < 4}
                        className="w-full py-4 bg-primary text-black rounded-xl font-bold text-base uppercase tracking-wider shadow-glow hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {isProcessing ? 'A verificar...' : 'Entrar'}
                        {!isProcessing && <ChevronRight size={20} />}
                    </button>

                    <button
                        type="button"
                        onClick={() => { setSelectedUser(null); setPin(''); }}
                        className="mt-4 w-full py-2 text-slate-400 text-xs uppercase font-bold hover:text-white transition-colors"
                        disabled={isProcessing}
                    >
                        <ArrowLeft size={14} className="inline-block mr-2" />
                        Mudar de Utilizador
                    </button>
                </form>
            ) : (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                    {localStorage.getItem('last_selected_user_id') && users.find(u => u.id === localStorage.getItem('last_selected_user_id')) && (
                        <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Lock size={16} className="text-primary" />
                                    <span className="text-white font-bold text-sm">Último Utilizador Selecionado</span>
                                </div>
                                <button
                                    onClick={handleClearCredentials}
                                    className="text-[10px] text-red-400 hover:text-red-300 uppercase font-bold"
                                >
                                    Esquecer
                                </button>
                            </div>
                            <button
                                onClick={() => handleUserSelect(localStorage.getItem('last_selected_user_id')!)}
                                disabled={isProcessing}
                                className="w-full py-3 bg-primary text-black rounded-lg font-bold text-xs uppercase tracking-wider shadow-glow hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                Continuar como {users.find(u => u.id === localStorage.getItem('last_selected_user_id'))?.name}
                                {!isProcessing && <ChevronRight size={14} />}
                            </button>
                        </div>
                    )}

                    <div className="mb-6 text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">Quem está a entrar?</h2>
                        <p className="text-slate-400 text-sm">Selecione o seu perfil de operador</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar">
                        {users.length > 0 ? (
                            users.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleUserSelect(user.id)}
                                    className="group relative p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-white/10 transition-all duration-300 text-left overflow-hidden flex flex-col gap-3"
                                >
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        {getRoleIcon(user.role, 22)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-base group-hover:text-primary transition-colors truncate">{user.name}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">{user.role}</p>
                                    </div>
                                    <ChevronRight className="absolute right-3 bottom-3 text-slate-700 group-hover:text-primary group-hover:translate-x-1 transition-all" size={18} />
                                </button>
                            ))
                        ) : (
                            <div className="col-span-2 py-8 text-center">
                                <p className="text-slate-500 text-xs italic">Nenhum usuário encontrado.</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-4 text-primary text-[10px] font-black uppercase hover:underline"
                                >
                                    Tentar recarregar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        <p className="text-center text-slate-600 text-[9px] mt-6 uppercase font-bold tracking-widest cursor-help hover:text-slate-400 transition-colors">
          Rest AI v1.0.4 • Angola 2026 By HELDER NETO
        </p>
      </div>
    </div>
  );
};

export default Login;
