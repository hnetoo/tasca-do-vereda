// Web Crypto API compatible with Tauri (browser environment)
// Replaces Node.js crypto module

export async function calculateHash(input: string): Promise<string> {
  try {
    // Use Web Crypto API for SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error('Error calculating hash:', error);
    // Fallback for environments without Web Crypto API
    return simpleHash(input);
  }
}

// Simple fallback hash function
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

// Synchronous version for compatibility (less secure but works everywhere)
export function calculateHashSync(input: string): string {
  return simpleHash(input);
}
