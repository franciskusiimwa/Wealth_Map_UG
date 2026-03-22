'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UserMenuProps {
  displayName: string
}

/**
 * Avatar-triggered user dropdown with sign-out action.
 * @param props User display name used for initials.
 * @returns User menu trigger and dropdown content.
 */
export function UserMenu({ displayName }: UserMenuProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const initials = displayName
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  /**
   * Signs user out and routes to login page.
   * @returns Promise resolving after sign-out attempt.
   */
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-paper-3 bg-brand-green-light text-sm font-medium text-brand-green-dark"
        aria-expanded={open}
        aria-label="Open user menu"
      >
        {initials || 'U'}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 min-w-36 rounded-xl border border-paper-3 bg-white p-2 ring-1 ring-paper-3">
          <button
            type="button"
            onClick={signOut}
            className="h-11 w-full rounded-lg px-3 text-left text-sm text-ink hover:bg-paper-2"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
