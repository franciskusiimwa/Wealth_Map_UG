import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Exchanges Supabase auth code for a server session cookie and redirects home.
 * @param request Incoming callback request containing code and optional next.
 * @returns Redirect response to the app after session exchange.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/invest'

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
