export const calculateHash = async (data: string): Promise<string> => {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
  } else {
      // Fallback for non-browser environments (like older Node.js tests)
      try {
          // Dynamic import to avoid bundling issues in browser
          const { createHash } = await import('node:crypto');
          return createHash('sha256').update(data).digest('hex');
      } catch (e) {
          console.error("Crypto API not available", e);
          return "";
      }
  }
};
