import { StateCreator } from 'zustand';
import { User, StoreState, Permission, UUID } from '@/types';
import { MOCK_USERS } from '@/constants';
import { logger } from '@/services/logger';
import { calculateHash } from '@/utils/crypto';
import { CryptoService } from '@/services/cryptoService';

import { createClient } from '@/lib/supabase/client';

export interface AuthSlice {
  users: User[];
  currentUser: User | null;
  isAuthenticated: boolean;
  setUsers: (users: User[]) => void;
  registerUser: (user: User) => void;
  updateUser: (user: User) => void;
  removeUser: (id: UUID) => void;
  login: (pin: string, userId?: UUID, rememberMe?: boolean) => Promise<boolean>;
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

export const createAuthSlice: StateCreator<
  StoreState,
  [['zustand/persist', unknown]],
  [],
  AuthSlice
> = (set, get) => ({
  users: MOCK_USERS,
  currentUser: null,
  isAuthenticated: false,
  setUsers: (users) => set({ users }),
  registerUser: (user) => set((state) => ({ users: [...state.users, user] })),
  updateUser: (user) => set((state) => ({
    users: state.users.map((u) => u.id === user.id ? user : u)
  })),
  removeUser: (id) => set((state) => ({
    users: state.users.filter((u) => u.id !== id)
  })),
  login: async (pin, userId, rememberMe) => {
    try {
      logger.auth('Iniciando tentativa de login', { userId, hasPin: !!pin });
      const users = get().users;
      
      let user: User | undefined;
      
      if (userId) {
        user = users.find((u) => u.id === userId);
      } else {
        // Find by plain PIN or by Hashed PIN
        for (const u of users) {
          if (u.pin === pin) {
            user = u;
            break;
          }
          if (u.pin.length === 64) {
            const hashedInput = await calculateHash(pin);
            if (u.pin === hashedInput) {
              user = u;
              break;
            }
          }
        }
      }
      
      // If a user is found by ID, and a PIN was provided, verify the PIN.
      if (user && pin) {
        let isCorrectPin = false;
        if (user.pin.length === 64) {
          const hashedInput = await calculateHash(pin);
          isCorrectPin = user.pin === hashedInput;
        } else {
          isCorrectPin = user.pin === pin;
        }

        if (!isCorrectPin) {
          logger.security('Falha na autenticação: PIN incorreto para utilizador selecionado', { 
            userId, 
            attemptTimestamp: new Date().toISOString() 
          });
          get().addNotification('error', 'PIN Incorreto');
          return false;
        }
      }
      
      if (user) {
        // Set a cookie for middleware validation (valid for 24 hours)
        if (typeof document !== 'undefined') {
          document.cookie = `pin_session=true; userId=${user.id}; userRole=${user.role}; path=/; max-age=86400; SameSite=Lax`;
        }

        set({ currentUser: user, isAuthenticated: true });
        get().addNotification('success', `Bem-vindo, ${user.name}`);

        logger.auth(`Login bem-sucedido: ${user.name}`, { 
          userId: user.id, 
          role: user.role
        });

        get().addAuditLog({
          action: 'USER_LOGIN',
          details: `Utilizador ${user.name} iniciou sessão com sucesso.`,
          metadata: { 
            userId: user.id, 
            role: user.role,
            timestamp: new Date().toISOString()
          }
        });

        // Handle persistence
        if (rememberMe) {
          try {
            // Ensure initialized if not already
            if (!CryptoService.isReady()) {
                const settings = get().settings;
                const secret = (settings.adminPin as string) || (settings.apiToken as string) || settings.restaurantName || 'TASCA-SECURE-KEY-V1';
                await CryptoService.initialize(secret);
            }
            
            const credentials = { pin, userId: user.id };
            const encrypted = await CryptoService.encrypt(JSON.stringify(credentials));
            if (encrypted) {
              localStorage.setItem('saved_credentials', encrypted);
            }
          } catch (e) {
            logger.error('Failed to save credentials', { error: e instanceof Error ? e.message : String(e) }, 'SECURITY');
            get().addNotification('error', 'Falha ao salvar credenciais. Por favor, tente novamente.');
          }
        }

        // Sync to cloud if enabled
        if (get().settings.supabaseConfig?.enabled) {
          logger.audit('LOGIN_SUCCESS', { userId: user.id, role: user.role });
        }

        return true;
      }

      logger.security('Falha na autenticação: PIN incorreto ou utilizador não encontrado', { 
        userId, 
        attemptTimestamp: new Date().toISOString() 
      });
      
      get().addNotification('error', 'PIN Incorreto');
      
      get().addAuditLog({
        action: 'LOGIN_FAILED',
        details: `Tentativa de login falhada para utilizador ${userId || 'desconhecido'}.`,
        metadata: { userId, timestamp: new Date().toISOString() }
      });

      return false;
    } catch (error) {
      logger.error('Erro crítico durante o processo de login', { error: error instanceof Error ? error.message : String(error) }, 'AUTH');
      get().addNotification('error', 'Erro interno no login. Tente novamente.');
      return false;
    }
  },
  loginWithPassword: async (email, password) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.security('Falha no login com password', { email, error: error.message });
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Map Supabase user to App User
        // Try to find in existing users list by email
        let appUser = get().users.find(u => u.email === email);
        
        if (!appUser) {
           // Create a transient user object for the session
           // In a real app, we should fetch from 'employees' table
           // For now, we assume the user exists or we create a basic profile
           appUser = {
             id: data.user.id,
             name: data.user.user_metadata.name || email.split('@')[0],
             email: email,
             role: (data.user.user_metadata.role || 'ADMIN').toUpperCase(), // Default to ADMIN if logging in via password (assumption for owner route)
             permissions: [],
             pin: '', // No PIN needed for password login
             isActive: true
           };
        }

        set({ currentUser: appUser, isAuthenticated: true });
        
        logger.auth(`Login via Password bem-sucedido: ${appUser.name}`, { 
          userId: appUser.id, 
          role: appUser.role 
        });

        get().addNotification('success', `Bem-vindo, ${appUser.name}`);
        return { success: true };
      }

      return { success: false, error: 'Usuário não encontrado' };
    } catch (e) {
      logger.error('Erro no login com password', { error: String(e) });
      return { success: false, error: 'Erro interno' };
    }
  },
  logout: async () => {
      try {
        // Clear pin session cookie
        if (typeof document !== 'undefined') {
          document.cookie = 'pin_session=; Max-Age=0; path=/;';
        }

        // Sign out from Supabase
        const supabase = createClient();
        await supabase.auth.signOut();

        set({ currentUser: null, isAuthenticated: false });
        localStorage.removeItem('saved_credentials');
        localStorage.removeItem('last_selected_user_id');
        
        logger.auth('Logout bem-sucedido', { userId: get().currentUser?.id });
        get().addAuditLog({
          action: 'USER_LOGOUT',
          details: `Utilizador ${get().currentUser?.name || 'desconhecido'} terminou sessão.`,
          metadata: { timestamp: new Date().toISOString() }
        });
        get().addNotification('info', 'Sessão terminada.');

        // Force reload to clear any other state
        window.location.href = '/login';

      } catch (error) {
        logger.error('Erro ao fazer logout', { error: error instanceof Error ? error.message : String(error) }, 'AUTH');
        get().addNotification('error', 'Erro ao terminar sessão.');
        // Even if Supabase logout fails, ensure local state is cleared and redirect happens for a consistent user experience.
        set({ currentUser: null, isAuthenticated: false });
        localStorage.removeItem('saved_credentials');
        localStorage.removeItem('last_selected_user_id');
        window.location.href = '/login';
      }
    },
  hasPermission: (permission) => {
    const state = get();
    if (!state.currentUser) return false;
    
    // Admin e Gerente têm todas as permissões
    const role = state.currentUser.role.toUpperCase();
    if (role === 'ADMIN' || role === 'GERENTE') return true;
    
    // Verificar permissões explícitas no usuário
    if (state.currentUser.permissions?.includes(permission as any)) return true;
    
    return false;
  }
});
