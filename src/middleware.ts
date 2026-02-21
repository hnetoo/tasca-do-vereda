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
  if (!isPublicRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect_to', path)
    return NextResponse.redirect(url)
  }

  // Rota de Admin/Owner protegida
  if (path.startsWith('/admin/owner')) {
    // 2. Verifica permissões (Role)
    const role = (user!.user_metadata?.role || '').toUpperCase()
    if (role !== 'ADMIN' && role !== 'OWNER') {
       // Se não for admin/owner, redireciona para dashboard ou login
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
