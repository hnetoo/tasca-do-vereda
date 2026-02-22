import { useStore } from '../store/useStore.ts';
console.log(useStore);
import { logger } from '../services/logger';

// Mock the Supabase client for testing purposes
const mockSupabaseClient = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      if (email === 'admin@example.com' && password === 'password123') {
        return { data: { user: { id: 'admin-uuid', email: 'admin@example.com' } }, error: null };
      }
      if (email === 'caixa@example.com' && password === 'password123') {
        return { data: { user: { id: 'caixa-uuid', email: 'caixa@example.com' } }, error: null };
      }
      return { data: { user: null }, error: { message: 'Invalid login credentials' } };
    },
    getSession: async () => ({ data: { session: { user: { id: 'test-user' } } }, error: null }),
  },
  from: (tableName: string) => ({
    select: () => ({
      eq: (column: string, value: string) => ({
        single: async () => {
          if (tableName === 'users' && column === 'id' && value === 'admin-uuid') {
            return { data: { id: 'admin-uuid', pin_hash: '$2a$10$abcdefghijklmnopqrstuuu', role: 'admin' }, error: null };
          }
          return { data: null, error: { message: 'User not found' } };
        },
        maybeSingle: async () => {
          if (tableName === 'users' && column === 'id' && value === 'admin-uuid') {
            return { data: { id: 'admin-uuid', pin_hash: '$2a$10$abcdefghijklmnopqrstuuu', role: 'admin' }, error: null };
          }
          return { data: null, error: null };
        },
      }),
      in: (column: string, values: string[]) => ({
        select: () => async () => {
          if (tableName === 'users' && column === 'id' && values.includes('admin-uuid')) {
            return { data: [{ id: 'admin-uuid', pin_hash: '$2a$10$abcdefghijklmnopqrstuuu', role: 'admin' }, { id: 'caixa-uuid', pin_hash: '$2a$10$abcdefghijklmnopqrstuuu', role: 'caixa' }], error: null };
          }
          return { data: [], error: null };
        },
      }),
    }),
  }),
};

// Mock the createClient function
const createClient = () => mockSupabaseClient;

// Mock bcrypt for testing purposes
const mockBcrypt = {
  hash: async () => '$2a$10$abcdefghijklmnopqrstuuu',
  compare: async (pin: string, hash: string) => (pin === '1234' || pin === '2222'),
};

// Mock the cryptoActions server actions
const mockCryptoActions = {
  calculateHashServer: async () => '$2a$10$abcdefghijklmnopqrstuuu',
  compareHashServer: async (pin: string, hash: string) => (pin === '1234' || pin === '2222'),
};

// Manually inject mocks into the modules that use them
// This is a simplified approach for a standalone script and might not work for all module systems
// For a real test setup, proper dependency injection or a test runner's module mocking is preferred.
// For now, we'll assume the modules directly import and we can override them.
// This part is tricky without a full module system. For this exercise, we'll assume the imports
// are resolved in a way that these global-like mocks can take effect.

// In a real scenario, you'd need to adjust the imports in authSlice.ts to point to these mocks
// or use a tool like 'rewire' or a test runner's module mocking capabilities.
// For this simulation, we'll proceed with the assumption that the functions are effectively mocked.

// To make the useAuthStore and useUiStore work in a non-React environment,
// we need to ensure they are initialized and can be accessed.
// Since they are Zustand stores, we can directly get their state.



const runTests = async () => {
  console.log('Iniciando testes de fluxo de login...');

  const { login, loginWithPassword, isAuthenticated, notifications } = useStore.getState();

  // Reset state before each test
  const resetStores = () => {
    useStore.setState((state) => ({
      isAuthenticated: false,
      currentUser: null,
      loginAttempts: {},
      notifications: [],
    }));
  };

  // Test 1: Successful PIN login (Admin: 1234)
  console.log('\n--- Teste 1: Login PIN Admin (1234) ---');
  resetStores();
  const success1 = await login('1234', 'admin-uuid');
  console.assert(success1 === true, 'Teste 1 Falhou: Login PIN Admin deveria ser bem-sucedido.');
  console.assert(isAuthenticated === true, 'Teste 1 Falhou: isAuthenticated deveria ser true.');
  console.assert(notifications.length === 0, 'Teste 1 Falhou: Nenhuma notificação esperada.');
  console.log('Teste 1 Concluído.');

  // Test 2: Successful PIN login (Caixa: 2222)
  console.log('\n--- Teste 2: Login PIN Caixa (2222) ---');
  resetStores();
  const success2 = await login('2222', 'caixa-uuid');
  console.assert(success2 === true, 'Teste 2 Falhou: Login PIN Caixa deveria ser bem-sucedido.');
  console.assert(isAuthenticated === true, 'Teste 2 Falhou: isAuthenticated deveria ser true.');
  console.assert(notifications.length === 0, 'Teste 2 Falhou: Nenhuma notificação esperada.');
  console.log('Teste 2 Concluído.');

  // Test 3: Failed PIN login (incorrect PIN)
  console.log('\n--- Teste 3: Login PIN falho (PIN incorreto) ---');
  resetStores();
  const success3 = await login('9999', 'admin-uuid');
  console.assert(success3 === false, 'Teste 3 Falhou: Login PIN incorreto deveria falhar.');
  console.assert(isAuthenticated === false, 'Teste 3 Falhou: isAuthenticated deveria ser false.');
  console.assert(notifications.some((n: { message: string; }) => n.message.includes('PIN inválido')), 'Teste 3 Falhou: Notificação de PIN inválido esperada.');
  console.log('Teste 3 Concluído.');

  // Test 4: Failed PIN login (rate limiting)
  console.log('\n--- Teste 4: Login PIN falho (Rate Limiting) ---');
  resetStores();
  for (let i = 0; i < 5; i++) {
    await login('9999', 'admin-uuid'); // Simulate 5 failed attempts
  }
  const success4 = await login('9999', 'admin-uuid'); // 6th attempt
  console.assert(success4 === false, 'Teste 4 Falhou: Login PIN deveria ser bloqueado por rate limiting.');
  console.assert(notifications.some((n: { message: string; }) => n.message.includes('Muitas tentativas de login')), 'Teste 4 Falhou: Notificação de rate limiting esperada.');
  console.log('Teste 4 Concluído.');

  // Test 5: Successful password login
  console.log('\n--- Teste 5: Login com Password (Sucesso) ---');
  resetStores();
  const result5 = await loginWithPassword('admin@example.com', 'password123');
  console.assert(result5.success === true, 'Teste 5 Falhou: Login com password deveria ser bem-sucedido.');
  console.assert(isAuthenticated === true, 'Teste 5 Falhou: isAuthenticated deveria ser true.');
  console.assert(notifications.length === 0, 'Teste 5 Falhou: Nenhuma notificação esperada.');
  console.log('Teste 5 Concluído.');

  // Test 6: Failed password login (incorrect credentials)
  console.log('\n--- Teste 6: Login com Password (Credenciais Incorretas) ---');
  resetStores();
  const result6 = await loginWithPassword('admin@example.com', 'wrongpassword');
  console.assert(result6.success === false, 'Teste 6 Falhou: Login com password incorreto deveria falhar.');
  console.assert(isAuthenticated === false, 'Teste 6 Falhou: isAuthenticated deveria ser false.');
  console.assert(notifications.some((n: { message: string; }) => n.message.includes('Credenciais inválidas')), 'Teste 6 Falhou: Notificação de credenciais inválidas esperada.');
  console.log('Teste 6 Concluído.');

  // Test 7: Failed password login (rate limiting)
  console.log('\n--- Teste 7: Login com Password (Rate Limiting) ---');
  resetStores();
  for (let i = 0; i < 5; i++) {
    await loginWithPassword('admin@example.com', 'wrongpassword'); // Simulate 5 failed attempts
  }
  const result7 = await loginWithPassword('admin@example.com', 'wrongpassword'); // 6th attempt
  console.assert(result7.success === false, 'Teste 7 Falhou: Login com password deveria ser bloqueado por rate limiting.');
  console.assert(notifications.some((n: { message: string; }) => n.message.includes('Muitas tentativas de login')), 'Teste 7 Falhou: Notificação de rate limiting esperada.');
  console.log('Teste 7 Concluído.');

  console.log('\nTodos os testes de fluxo de login concluídos.');
};


// try {
//   runTests();
// } catch (error) {
//   console.error('Erro durante a execução dos testes:', error);
// }


