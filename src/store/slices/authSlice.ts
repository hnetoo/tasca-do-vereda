import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, AuthError, UserRole, AuthErrorType } from '../../types/auth.types';
import { supabaseAuthService } from '../../services/supabaseAuth.service';

// Estado inicial
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLocked: false,
  loading: false,
  error: null,
};

// Async Thunk para login com PIN
export const loginWithPin = createAsyncThunk<
  User, // Tipo de retorno em caso de sucesso
  { pin: string; role: UserRole }, // Tipo do argumento de entrada (PIN e Role)
  { rejectValue: AuthError } // Tipo do erro em caso de falha
>(
  'auth/loginWithPin',
  async ({ pin, role }: { pin: string; role: UserRole }, { rejectWithValue }) => {
    try {
      const response = await supabaseAuthService.loginWithPin(pin, role);
      return response.user;
    } catch (error) {
      return rejectWithValue(error as AuthError);
    }
  }
);

// Criação do slice de autenticação
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Reducer para resetar o estado de erro, se necessário
    clearAuthError: (state) => {
      state.error = null;
    },
    // Reducer para logout (opcional, mas útil para resetar o estado)
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLocked = false;
      state.error = null;
      state.loading = false;
    },
    resetAuthStatus: (state) => {
      state.loading = false;
      state.error = null;
      state.isAuthenticated = false; // Adicionado para garantir que o estado de autenticação é resetado
    },
    setUserSession: (state, action: PayloadAction<any>) => {
      // Tenta mapear o usuário do Supabase para o nosso tipo User
      // Se não for possível, cria um usuário básico
      const supabaseUser = action.payload;
      if (supabaseUser) {
        state.user = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.name || supabaseUser.email || 'User',
          role: supabaseUser.user_metadata?.role || UserRole.Admin, // Default role se não houver
          pin: '', // PIN não é retornado pelo Supabase session
          metadata: supabaseUser.user_metadata
        };
        state.isAuthenticated = true;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithPin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithPin.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginWithPin.rejected, (state, action: PayloadAction<AuthError | undefined>) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload || { type: AuthErrorType.UnknownError, message: 'Ocorreu um erro desconhecido.' };
        // Se o erro for de PIN inválido, podemos considerar um bloqueio após N tentativas, mas por enquanto apenas registramos o erro.
        // state.isLocked = true; // Exemplo de lógica de bloqueio
      });
  },
});

export const { clearAuthError, logout, resetAuthStatus, setUserSession } = authSlice.actions;

// Async Thunk para logout que limpa o cookie
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { dispatch }) => {
    // Clear cookie
    document.cookie = 'tasca_auth_token=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'pin_session=; path=/; max-age=0; SameSite=Lax';
    dispatch(logout());
  }
);

export const selectUser = (state: { auth: AuthState }) => state.auth.user;

export default authSlice.reducer;
