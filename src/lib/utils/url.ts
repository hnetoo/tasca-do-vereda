export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Client-side: use window.location
    return window.location.origin;
  }
  
  // Server-side
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    // Vercel deployment
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  
  if (process.env.VERCEL_URL) {
    // Vercel deployment (server env)
    return `https://${process.env.VERCEL_URL}`;
  }

  // Localhost fallback
  return 'http://localhost:3000';
}
