'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { User } from '@/types';

export async function verifyPinAction(pin: string): Promise<{ success: boolean; user?: User; error?: string }> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  try {
    // Attempt to find user with this PIN in 'employees' table
    // We check both 'pin_code' and 'pin' columns just in case, or prioritize one if we know schema
    // Based on search results, it seems to be 'pin_code' or 'pin'
    
    // First try pin_code
    let { data: user, error } = await supabase
      .from('employees')
      .select('*')
      .eq('pin_code', pin)
      .single();

    if (!user && !error) {
       // Try 'pin' column if 'pin_code' didn't match (or if column name is different)
       // But if error was 'PGRST116' (row not found), user is null.
       const { data: user2, error: error2 } = await supabase
         .from('employees')
         .select('*')
         .eq('pin', pin)
         .single();
       
       if (user2) user = user2;
    }

    if (user) {
      if (!user.active) {
          return { success: false, error: 'Utilizador inativo.' };
      }

      const appUser: User = {
        id: user.id,
        name: user.name,
        email: user.email || '',
        role: user.role,
        permissions: user.permissions || [],
        pin: '', // Don't return the PIN to client
        isActive: user.active
      };

      // Set cookie for middleware
      const sessionData = JSON.stringify({
        valid: true,
        userId: appUser.id,
        userRole: appUser.role
      });
      
      cookieStore.set('pin_session', encodeURIComponent(sessionData), {
        path: '/',
        maxAge: 86400, // 24 hours
        sameSite: 'lax',
        httpOnly: false // Allow client to read if needed, but usually HttpOnly is better. 
                        // However middleware reads it. Middleware can read HttpOnly? Yes.
                        // But client JS (authSlice) might need to read it? 
                        // authSlice uses document.cookie. 
                        // Let's keep it accessible to JS for now to match current behavior, 
                        // or better, make it HttpOnly for security and let Server Action handle it.
                        // But if I make it HttpOnly, client side 'isAuthenticated' check in store might fail on reload 
                        // if it relies on localStorage or reading cookie.
                        // actually authSlice checks `document.cookie` in `login`.
                        // But `isAuthenticated` state is persisted in localStorage via zustand/persist.
      });

      return { success: true, user: appUser };
    }

    return { success: false, error: 'PIN inválido.' };
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return { success: false, error: 'Erro ao verificar PIN.' };
  }
}
