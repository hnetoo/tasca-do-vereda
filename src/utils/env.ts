// Environment variables utility for Tauri compatibility
// Replaces process.env with client-side safe alternatives

declare global {
  interface Window {
    __ENV__?: {
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      NEXT_PUBLIC_APP_URL?: string;
      NEXT_PUBLIC_TAURI_BUILD?: string;
      NODE_ENV?: string;
    };
  }
}

export const env = {
  // Safe environment variable access for Tauri
  get(key: string): string | undefined {
    // Try window.__ENV__ first (injected during Tauri build)
    if (typeof window !== 'undefined' && window.__ENV__) {
      return window.__ENV__[key as keyof typeof window.__ENV__];
    }
    
    // Fallback to process.env for development
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
    
    return undefined;
  },
  
  // Specific getters for common variables
  get SUPABASE_URL(): string | undefined {
    return this.get('NEXT_PUBLIC_SUPABASE_URL');
  },
  
  get SUPABASE_ANON_KEY(): string | undefined {
    return this.get('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  },
  
  get APP_URL(): string | undefined {
    return this.get('NEXT_PUBLIC_APP_URL');
  },
  
  get IS_TAURI_BUILD(): boolean {
    return this.get('NEXT_PUBLIC_TAURI_BUILD') === 'true';
  },
  
  get NODE_ENV(): string | undefined {
    return this.get('NODE_ENV');
  },
  
  get IS_DEVELOPMENT(): boolean {
    return this.NODE_ENV === 'development';
  },
  
  get IS_PRODUCTION(): boolean {
    return this.NODE_ENV === 'production';
  }
};

// Export individual variables for convenience
export const {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  APP_URL,
  IS_TAURI_BUILD,
  NODE_ENV,
  IS_DEVELOPMENT,
  IS_PRODUCTION
} = env;
