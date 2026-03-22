import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'
import type { CookieOptions } from '@supabase/ssr'

interface SessionUpdateResult {
  response: NextResponse
  user: User | null
}

/**
 * Updates session cookies from middleware context.
 * @param request Next.js middleware request.
 * @returns Middleware response with refreshed auth session.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set(name, value)
          response = NextResponse.next({ request })
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set(name, '')
          response = NextResponse.next({ request })
          response.cookies.set(name, '', options)
        }
      }
    }
  )

  const {
    data: { user }
  } = await supabase.auth.getUser()

  const result: SessionUpdateResult = { response, user }
  return result
}

