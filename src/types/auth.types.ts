export enum UserRole {
  Admin = 'ADMIN',
  Owner = 'OWNER',
  Cliente = 'CLIENTE', // Keeping this for potential future use, though not in current UI
  Caixa = 'CAIXA',
  Cozinha = 'COZINHA',
  Garcom = 'GARCOM',
}

export interface User {
  id: string;
  email: string;
  name: string;
  pin: string; // This will be the hashed PIN, not the raw PIN
  role: UserRole;
  metadata?: Record<string, any>;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  loading: boolean;
  error: { type: AuthErrorType; message: string } | null;
}

export interface AuthResponse {
  user: User;
  role: UserRole;
  authenticatedAt: number; // Timestamp
}

export enum AuthErrorType {
  PinInexistente = 'PIN_INEXISTENTE',
  PinBloqueado = 'PIN_BLOQUEADO',
  ServidorIndisponivel = 'SERVIDOR_INDISPONIVEL',
  CredenciaisInvalidas = 'CREDENCIAS_INVALIDAS',
  AcessoNaoAutorizado = 'ACESSO_NAO_AUTORIZADO',
  MuitasTentativas = 'MUITAS_TENTATIVAS',
  UnknownError = 'UNKNOWN_ERROR',
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
}
