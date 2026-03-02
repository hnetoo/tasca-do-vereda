import { AuthResponse, AuthError, User, UserRole, AuthErrorType } from '../types/auth.types';
import { supabaseService } from './supabaseService';

export const supabaseAuthService = {
  async loginWithPin(pin: string, role: UserRole): Promise<AuthResponse> {
    try {
      console.log('🔐 [AUTH] Starting login with PIN', { pin: pin ? '***' : 'EMPTY', role });
      
      // Garantir que o SupabaseService está inicializado
      console.log('🔧 [AUTH] Initializing SupabaseService...');
      await supabaseService.initialize();
      
      const client = supabaseService.getClient();
      console.log('🔍 [AUTH] Supabase client status:', { 
        hasClient: !!client, 
        isConnected: supabaseService.isConnected() 
      });
      
      if (!client) {
        console.error('❌ [AUTH] No Supabase client available after initialization');
        throw {
          type: AuthErrorType.CredenciaisInvalidas,
          message: 'Serviço indisponível. Tente novamente.',
        } as AuthError;
      }

      console.log('🔍 [AUTH] Querying users table for PIN authentication');
      
      // TENTATIVA 1: Query Supabase normal
      let userData = null;
      let userError = null;
      
      try {
        const result = await client
          .from('users')
          .select('*')
          .eq('pin', pin)
          .eq('role', String(role).toLowerCase())
          .eq('status', 'active')
          .single();
        
        userData = result.data;
        userError = result.error;
      } catch (error: any) {
        console.log('⚠️ [AUTH] Supabase query failed, trying fallback:', error.message);
        userError = error;
      }

      // TENTATIVA 2: Fallback direto via REST API se Supabase falhar
      if (!userData && (userError?.message?.includes('406') || userError?.message?.includes('Not Acceptable'))) {
        console.log('🔄 [AUTH] Trying direct REST API fallback...');
        
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          
          if (supabaseUrl && supabaseKey) {
            const response = await fetch(`${supabaseUrl}/rest/v1/users?select=*&pin=eq.${pin}&role=eq.${String(role).toLowerCase()}&status=eq.active`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              userData = data.length > 0 ? data[0] : null;
              userError = null;
              console.log('✅ [AUTH] Direct API fallback successful');
            } else {
              console.log('❌ [AUTH] Direct API fallback failed:', response.status, response.statusText);
            }
          }
        } catch (fallbackError: any) {
          console.log('❌ [AUTH] Fallback error:', fallbackError.message);
        }
      }

      console.log('📊 [AUTH] User query result:', { 
        hasData: !!userData, 
        hasError: !!userError,
        errorMessage: userError?.message,
        errorCode: userError?.code
      });

      if (userError || !userData) {
        console.error('❌ [AUTH] User not found or inactive:', { userError, userData });
        throw {
          type: AuthErrorType.CredenciaisInvalidas,
          message: 'PIN ou perfil inválido. Por favor, tente novamente.',
        } as AuthError;
      }

      console.log('📝 [AUTH] User found, updating last login');
      // Atualizar último login
      await client
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);

      console.log('👤 [AUTH] Creating user object for response');
      // Criar objeto User compatível com a interface
      const user: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        pin: userData.pin,
        role: userData.role as UserRole,
        metadata: userData.permissions || {},
      };

      console.log('🍪 [AUTH] Setting authentication cookie');
      // Set cookie para middleware
      const cookieValue = encodeURIComponent(JSON.stringify({ 
        role: user.role, 
        id: user.id 
      }));
      
      if (typeof window !== 'undefined') {
        document.cookie = `tasca_auth_token=${cookieValue}; path=/; max-age=86400; SameSite=Lax`;
      }

      console.log('✅ [AUTH] Login successful', { userId: user.id, role: user.role });
      return { user, role: user.role, authenticatedAt: Date.now() };
      
    } catch (error: any) {
      console.error('❌ [AUTH] Login failed:', error);
      
      if (error.type) {
        throw error;
      }
      
      throw {
        type: AuthErrorType.UnknownError,
        message: error.message || 'Erro desconhecido ao fazer login',
      } as AuthError;
    }
  },

  async logout(): Promise<void> {
    // Limpar cookie
    document.cookie = 'tasca_auth_token=; path=/; max-age=0; SameSite=Lax';
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const cookieHeader = document.cookie;
      if (!cookieHeader) return null;

      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      const authCookie = cookies['tasca_auth_token'];
      if (!authCookie) return null;

      const decoded = JSON.parse(decodeURIComponent(authCookie));
      if (!decoded.id) return null;

      const client = supabaseService.getClient();
      if (!client) return null;

      // Buscar dados atualizados do usuário
      const { data: userData, error } = await client
        .from('users')
        .select('*')
        .eq('id', decoded.id)
        .single();

      if (error || !userData) return null;

      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        pin: userData.pin,
        role: userData.role as UserRole,
        metadata: userData.permissions || {},
      };
      
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      return null;
    }
  },

  async getUsers(): Promise<User[]> {
    try {
      const client = supabaseService.getClient();
      if (!client) return [];

      const { data, error } = await client
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(userData => ({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        pin: userData.pin,
        role: userData.role as UserRole,
        metadata: userData.permissions || {},
      }));
      
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return [];
    }
  },

  async createUser(userData: {
    name: string;
    email: string;
    pin: string;
    role: UserRole;
    permissions?: any;
  }): Promise<User> {
    try {
      await supabaseService.initialize();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Serviço indisponível');

      const { data, error } = await client
        .from('users')
        .insert({
          name: userData.name,
          email: userData.email,
          pin: userData.pin,
          role: String(userData.role).toLowerCase(),
          status: 'active',
          permissions: userData.permissions || {},
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        pin: data.pin,
        role: data.role as UserRole,
        metadata: data.permissions || {},
      };
      
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  },

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    try {
      const client = supabaseService.getClient();
      if (!client) throw new Error('Serviço indisponível');

      const { data, error } = await client
        .from('users')
        .update({
          name: userData.name,
          email: userData.email,
          pin: userData.pin,
          role: userData.role,
          permissions: userData.metadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        pin: data.pin,
        role: data.role as UserRole,
        metadata: data.permissions || {},
      };
      
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      const client = supabaseService.getClient();
      if (!client) throw new Error('Serviço indisponível');

      const { error } = await client
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      throw error;
    }
  }
};
