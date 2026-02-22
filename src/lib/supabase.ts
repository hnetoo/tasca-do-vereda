import { createClient as createSupabaseClient } from './supabase/client';
import { isTauri, supabaseUrl, supabaseAnonKey } from './supabase/config';

// Re-export configuration for backward compatibility
export { isTauri, supabaseUrl, supabaseAnonKey };

// Export singleton instance
export const supabase = createSupabaseClient();
