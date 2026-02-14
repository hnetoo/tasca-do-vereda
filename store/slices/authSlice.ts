import { StateCreator } from 'zustand';
import { User, StoreState, Permission } from '../../types';
import { MOCK_USERS } from '../../constants';
import { logger } from '../../services/logger';
import { supabaseService } from '../../services/supabaseService';

export interface AuthSlice {
  users: User[];
  currentUser: User | null;
  isAuthenticated: boolean;
  setUsers: (users: User[]) => void;
  registerUser: (user: User) => void;
  updateUser: (user: User) => void;
  removeUser: (id: string) => void;
  login: (pin: string, userId?: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
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
            const hashedInput = await supabaseService.calculateHash(pin);
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
          const hashedInput = await supabaseService.calculateHash(pin);
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
            const { CryptoService } = await import('../../services/cryptoService');
            // Ensure initialized if not already
            if (!CryptoService.isReady()) {
                const settings = get().settings;
                const secret = settings.adminPin || settings.apiToken || settings.restaurantName || 'TASCA-SECURE-KEY-V1';
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
  logout: () => {
    const user = get().currentUser;
    if (user) {
      logger.auth(`Utilizador terminou sessão: ${user.name}`, { 
        userId: user.id, 
        role: user.role
      });
      get().addAuditLog({
        action: 'USER_LOGOUT',
        details: `Utilizador ${user.name} terminou sessão com sucesso.`,
        metadata: { 
          userId: user.id, 
          role: user.role,
          timestamp: new Date().toISOString()
        }
      });
      
      logger.audit('SECURITY_EVENT', { 
        event: 'LOGOUT', 
        userId: user.id,
        timestamp: new Date().toISOString() 
      });
    }

    set({ currentUser: null, isAuthenticated: false });
    localStorage.removeItem('saved_credentials');
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
