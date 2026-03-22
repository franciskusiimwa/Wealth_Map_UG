import { createBrowserClient } from '@supabase/ssr'

/**
 * Builds a browser-safe Supabase client.
 * @returns Supabase browser client instance.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )
}
