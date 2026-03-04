'use server';

import { createClient } from '@/lib/supabase/server';

export interface User {
  id: string;
  name: string;
  email?: string;
  pin: string;
  role: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export async function getUsers(): Promise<{ success: boolean; users: User[]; error?: string }> {
  const supabase = await createClient();
  
  try {
    console.log('🔍 [USERS] Fetching users from Supabase...');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ [USERS] Error fetching users:', error);
      return { success: false, users: [], error: error.message };
    }
    
    console.log('✅ [USERS] Users fetched successfully:', users?.length || 0);
    
    return { 
      success: true, 
      users: users || [],
    };
    
  } catch (error: any) {
    console.error('❌ [USERS] General error:', error);
    return { 
      success: false, 
      users: [], 
      error: error.message 
    };
  }
}
