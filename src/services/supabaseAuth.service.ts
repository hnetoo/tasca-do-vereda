import { AuthResponse, AuthError, User, UserRole, AuthErrorType } from '../types/auth.types';
import { supabaseService } from './supabaseService';

export const supabaseAuthService = {
  async loginWithPin(pin: string, role: UserRole): Promise<AuthResponse> {
    try {
      const client = supabaseService.getClient();
      if (!client) {
        throw {
          type: AuthErrorType.CredenciaisInvalidas,
          message: 'Serviço indisponível. Tente novamente.',
        } as AuthError;
      }

      // Buscar usuário na tabela users do Supabase
      const { data: userData, error: userError } = await client
        .from('users')
        .select('*')
        .eq('pin', pin)
        .eq('role', role)
        .eq('status', 'active')
        .single();

      if (userError || !userData) {
        throw {
          type: AuthErrorType.CredenciaisInvalidas,
          message: 'PIN ou perfil inválido. Por favor, tente novamente.',
        } as AuthError;
      }

      // Atualizar último login
      await client
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);

      // Criar objeto User compatível com a interface
      const user: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        pin: userData.pin,
        role: userData.role as UserRole,
        metadata: userData.permissions || {},
      };

      // Set cookie para middleware
      const cookieValue = encodeURIComponent(JSON.stringify({ 
        role: user.role, 
        id: user.id 
      }));
      document.cookie = `tasca_auth_token=${cookieValue}; path=/; max-age=86400; SameSite=Lax`;
      
      return { user, role: user.role, authenticatedAt: Date.now() };
      
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
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
      const client = supabaseService.getClient();
      if (!client) throw new Error('Serviço indisponível');

      const { data, error } = await client
        .from('users')
        .insert({
          name: userData.name,
          email: userData.email,
          pin: userData.pin,
          role: userData.role,
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
