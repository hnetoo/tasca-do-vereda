import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname;

  // Define public routes that don't require authentication
  const publicPrefixes = ['/login', '/publicmenu', '/customer-display', '/qrscanner', '/mobiledashboard', '/menu', '/auth'];
  const isPublicRoute = publicPrefixes.some(prefix => path.startsWith(prefix));

  // If the route is not public and the user is not authenticated, redirect to login
  // We check for either a Supabase session OR a valid PIN session cookie
  const hasPinSession = request.cookies.has('pin_session');
  
  if (!isPublicRoute && !user && !hasPinSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect_to', path)
    return NextResponse.redirect(url)
  }

  // Allow authenticated users to access inventory and other system pages
  if ((user || hasPinSession) && (path.startsWith('/inventory') || path.startsWith('/sistema') || path.startsWith('/dashboard'))) {
     return supabaseResponse;
  }

  // Rota de Admin/Owner protegida
  if (path.startsWith('/admin/owner')) {
    let userRole: string | undefined;

    if (user) {
      userRole = (user.user_metadata?.role || '').toUpperCase();
    } else if (hasPinSession) {
      const pinSessionCookie = request.cookies.get('pin_session');
      if (pinSessionCookie) {
        const roleMatch = /userRole=([^;]+)/.exec(pinSessionCookie.value);
        if (roleMatch && roleMatch[1]) {
          userRole = roleMatch[1].toUpperCase();
        }
      }
    }

    if (!userRole || (userRole !== 'ADMIN' && userRole !== 'OWNER')) {
       // Se não for admin/owner (via Supabase ou PIN), redireciona para login
       const url = request.nextUrl.clone()
       url.pathname = '/login'
       url.searchParams.set('error', 'unauthorized')
       return NextResponse.redirect(url)
    }
  }

  // Redireciona usuário logado fora da página de login se tentar acessar login
  if (request.nextUrl.pathname === '/login' && user) {
      // Opcional: Redirecionar para dashboard se já estiver logado
      // return NextResponse.redirect(new URL('/dashboard', request.url))
      // Manter comportamento atual (deixar acessar, o client-side redireciona se necessário)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
