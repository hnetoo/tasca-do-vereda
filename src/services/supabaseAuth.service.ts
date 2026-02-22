import { AuthResponse, AuthError, User, UserRole, AuthErrorType } from '../types/auth.types';

// Dados de utilizadores simulados para autenticação
const mockUsers: User[] = [
  {
    id: 'mock-admin-id',
    email: 'admin@example.com',
    name: 'Admin User',
    pin: '1234',
    role: UserRole.Admin,
    metadata: {},
  },
  {
    id: 'mock-owner-id',
    email: 'owner@example.com',
    name: 'Owner User',
    pin: '5678',
    role: UserRole.Owner,
    metadata: {},
  },
  {
    id: 'mock-client-id',
    email: 'client@example.com',
    name: 'Client User',
    pin: '9999',
    role: UserRole.Cliente,
    metadata: {},
  },
  {
    id: 'mock-caixa-id',
    email: 'caixa@example.com',
    name: 'Caixa User',
    pin: '1111',
    role: UserRole.Caixa,
    metadata: {},
  },
  {
    id: 'mock-cozinha-id',
    email: 'cozinha@example.com',
    name: 'Cozinha User',
    pin: '2222',
    role: UserRole.Cozinha,
    metadata: {},
  },
  {
    id: 'mock-garcom-id',
    email: 'garcom@example.com',
    name: 'Garcom User',
    pin: '3333',
    role: UserRole.Garcom,
    metadata: {},
  },
];

export const supabaseAuthService = {
  async loginWithPin(pin: string, role: UserRole): Promise<AuthResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const foundUser = mockUsers.find((user) => user.pin === pin && user.role === role);

        if (foundUser) {
          // Set a cookie for middleware to verify authentication
          // We encode the value to ensure it's a valid cookie value
          const cookieValue = encodeURIComponent(JSON.stringify({ role: foundUser.role, id: foundUser.id }));
          document.cookie = `tasca_auth_token=${cookieValue}; path=/; max-age=86400; SameSite=Lax`;
          
          resolve({ user: foundUser, role: foundUser.role, authenticatedAt: Date.now() });
        } else {
          throw {
            type: AuthErrorType.CredenciaisInvalidas,
            message: 'PIN ou perfil inválido. Por favor, tente novamente.',
          } as AuthError;
        }
      }, 500); // Simula um atraso de rede
    });
  },
};
