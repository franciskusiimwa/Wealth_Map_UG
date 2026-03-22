import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Protects app routes behind authentication.
 * @param request Incoming middleware request.
 * @returns Middleware response or redirect.
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (path.startsWith('/api/cron/') || path === '/api/data/refresh') {
    return NextResponse.next()
  }

  const { response, user } = await updateSession(request)
  const isProtectedPath =
    path.startsWith('/invest') || path.startsWith('/business') || path.startsWith('/intelligence')

  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}

