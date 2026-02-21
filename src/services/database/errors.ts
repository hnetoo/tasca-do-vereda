/**
 * Translates database error codes and messages into user-friendly Portuguese messages.
 * @param error The error object returned from Supabase or thrown by the client.
 * @returns A user-friendly error message string.
 */
export const translateDatabaseError = (error: any): string => {
  if (!error) return 'Ocorreu um erro desconhecido.';

  const message = (error.message || '').toLowerCase();
  const code = error.code || '';
  const details = (error.details || '').toLowerCase();

  // Unique constraint violation (23505)
  if (code === '23505') {
    if (message.includes('email') || details.includes('email')) return 'Este email já está registado no sistema.';
    if (message.includes('nif') || details.includes('nif')) return 'Este NIF já está registado no sistema.';
    if (message.includes('name') || details.includes('name')) return 'Já existe um registo com este nome.';
    return 'Este registo já existe no sistema.';
  }

  // Foreign key violation (23503)
  if (code === '23503') {
    if (message.includes('update') || message.includes('delete')) {
      return 'Não é possível eliminar ou alterar este registo pois está a ser utilizado noutras partes do sistema (ex: encomendas, produtos).';
    }
    return 'A referência selecionada (ex: categoria, fornecedor) não existe ou é inválida.';
  }

  // Not null violation (23502)
  if (code === '23502') {
    return 'Por favor, preencha todos os campos obrigatórios.';
  }

  // Check constraint violation (23514)
  if (code === '23514') {
    return 'Os dados fornecidos não cumprem os requisitos de validação.';
  }

  // Invalid input syntax (22P02)
  if (code === '22P02') {
    return 'O formato dos dados fornecidos é inválido (ex: número inválido, ID incorreto).';
  }

  // Permission denied (42501)
  if (code === '42501') {
    return 'Não tem permissão para realizar esta operação.';
  }

  // Common network/connection errors
  if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
    return 'Erro de conexão com o servidor. Verifique a sua internet e tente novamente.';
  }

  if (message.includes('timeout')) {
    return 'A operação demorou demasiado tempo. Por favor, tente novamente.';
  }

  // Specific application errors based on message content
  if (message.includes('insufficient_stock')) {
    return 'Stock insuficiente para realizar esta operação.';
  }

  if (message.includes('jwt')) {
    return 'A sua sessão expirou. Por favor, faça login novamente.';
  }

  // Fallback: Return the original message if it's readable, otherwise a generic error
  if (message && message.length < 100 && !message.includes('{')) {
    return `Erro do sistema: ${message}`;
  }

  return 'Ocorreu um erro inesperado ao processar o seu pedido. Por favor, contacte o suporte se o problema persistir.';
};
