// DEBUG ENVIRONMENT VARIABLES
console.log('🔍 DEBUG ENVIRONMENT VARIABLES');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('All env vars:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')));
