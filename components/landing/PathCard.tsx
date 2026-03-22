'use client'

import { useRouter } from 'next/navigation'

interface PathCardProps {
  title: string
  subtitle: string
  href: string
  iconClassName: string
}

/**
 * Tappable onboarding path card used on the landing page.
 * @param props Card content, destination, and icon surface styling.
 * @returns Interactive button card that routes users to the selected path.
 */
export function PathCard({ title, subtitle, href, iconClassName }: PathCardProps) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className="w-full rounded-2xl border border-paper-3 bg-white p-4 text-left ring-1 ring-paper-3 transition active:opacity-80"
    >
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-full ${iconClassName}`} />
        <div className="min-w-0">
          <h2 className="font-syne text-lg font-medium text-ink">{title}</h2>
          <p className="mt-1 text-sm text-ink-3">{subtitle}</p>
        </div>
      </div>
    </button>
  )
}
