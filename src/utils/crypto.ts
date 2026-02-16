// src/utils/crypto.ts

/**
 * Gera um hash SHA-256 de uma string para verificar a integridade dos dados
 * Útil para comparar se um produto ou venda mudou antes de sincronizar.
 */
export const calculateHash = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Usa a API Web Crypto (disponível no Tauri e Vercel)
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  
  // Converte o buffer para uma string hexadecimal
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  return hashHex;
};

/**
 * Gera um ID único para transações locais antes de subirem para a Cloud
 */
export const generateId = () => {
  return crypto.randomUUID();
};
