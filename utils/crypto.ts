
/**
 * Calculates SHA-256 hash of a string
 * @param data The string to hash
 * @returns The hex string of the hash
 */
export async function calculateHash(data: string): Promise<string> {
  if (!data) return '';
  
  // Use crypto.subtle if available (browser/modern env)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback for environments without crypto.subtle (should be rare in modern browsers)
  // Simple non-secure hash for fallback (djb2) - ONLY for non-critical matching if crypto is missing
  let hash = 5381;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) + hash) + data.charCodeAt(i); /* hash * 33 + c */
  }
  return (hash >>> 0).toString(16);
}
