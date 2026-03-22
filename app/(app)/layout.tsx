import Link from 'next/link'
import { redirect } from 'next/navigation'
import { UserMenu } from '@/components/auth/UserMenu'
import { createClient } from '@/lib/supabase/server'

/**
 * Authenticated app shell layout with primary navigation.
 * @param props Next.js layout props.
 * @returns Layout wrapper for core app pages.
 */
export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const displayName = user.email?.split('@')[0] ?? 'User'

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-paper-3 bg-paper/95 backdrop-blur">
        <nav className="relative mx-auto flex w-full max-w-lg items-center justify-between px-4 py-3">
          <p className="font-syne text-xl font-bold tracking-tight">
            <span className="text-brand-green">Wealth</span>
            <span className="text-ink">map</span>
          </p>

          <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-4 text-sm text-ink-2">
            <Link href="/invest" className="font-medium text-ink">
              Invest
            </Link>
            <Link href="/business" className="font-medium text-ink">
              Business
            </Link>
          </div>

          <UserMenu displayName={displayName} />
        </nav>
      </header>

      <main className="mx-auto w-full max-w-lg px-4 pb-12">{children}</main>
    </div>
  )
}

