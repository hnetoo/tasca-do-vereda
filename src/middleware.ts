import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()
    
    // Create Supabase client only if env vars are present
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase env vars missing in middleware')
      return res
    }

    const supabase = createMiddlewareClient({ req, res })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Protect Admin Routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (!session) {
        // Redirect to login if not authenticated
        const redirectUrl = new URL('/login', req.url)
        return NextResponse.redirect(redirectUrl)
      }
    }

    return res
  } catch (e) {
    // Fail safe: if middleware errors, allow request but log error
    // This prevents 500 errors from blocking the entire app
    console.error('Middleware error:', e)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}
