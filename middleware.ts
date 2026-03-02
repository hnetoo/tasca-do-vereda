import { type NextRequest, NextResponse } from 'next/server'

// Middleware de segurança - PROTEGE ROTAS PRIVADAS
export async function middleware(request: NextRequest) {
  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login', '/publicmenu', '/customer-display', '/qrscanner', '/mobiledashboard', '/menu', '/owner/login', '/owner/mobile', '/owner/mobile/login', '/owner', '/owner/mobile']
  
  // Rotas owner têm login próprio - sempre permitir
  const isOwnerRoute = request.nextUrl.pathname.startsWith('/owner/')
  
  // Verificar se é rota pública
  const isPublicRoute = publicRoutes.some(route => {
    const path = request.nextUrl.pathname;
    return path === route || path.startsWith(`${route}/`)
  })
  
  // Se for rota pública ou owner, permitir acesso
  if (isPublicRoute || isOwnerRoute) {
    return NextResponse.next()
  }
  
  // Para rotas privadas, verificar autenticação mock
  const authCookie = request.cookies.get('tasca_auth_token')
  
  // Se não tiver cookie de autenticação, redirecionar para login
  if (!authCookie) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect_to', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Se tiver cookie, permitir acesso
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes - têm sua própria proteção)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
