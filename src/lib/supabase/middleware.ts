import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check for our custom auth cookie set by the mock login
  const tascaAuthToken = request.cookies.get('tasca_auth_token')
  const pinSession = request.cookies.get('pin_session')
  const ownerAuthenticated = request.cookies.get('owner_authenticated')?.value === 'true'
  const isAuthenticated = !!user || !!tascaAuthToken || !!pinSession || ownerAuthenticated

  const url = request.nextUrl.clone()
  const path = url.pathname

  // Public routes that do not require authentication
  const publicRoutes = [
    '/login',
    '/owner/login',
    '/owner',
    '/owner/mobile',
    '/owner/mobile/login',
    '/publicmenu', 
    '/customer-display', 
    '/qrscanner', 
    '/mobiledashboard', 
    '/menu',
    '/auth/callback'
  ]

  // Special handling for owner routes - REMOVIDO para ser independente
  // if (path.startsWith('/owner')) {
  //   console.log('🔍 Owner Debug: Owner routes are now independent')
  //   return response
  // }

  // Check if the current path starts with any of the public routes
  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith(`${route}/`))

  // 1. If user is NOT authenticated and tries to access a protected route
  if (!isAuthenticated && !isPublicRoute && path !== '/') {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. If user IS authenticated and tries to access login
  if (isAuthenticated && path === '/login') {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  
  // 3. Root path handling
  if (path === '/') {
    if (isAuthenticated) {
      url.pathname = '/dashboard'
    } else {
      url.pathname = '/login'
    }
    return NextResponse.redirect(url)
  }

  return response
}
