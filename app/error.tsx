'use client'

import { Button } from '@/components/ui/Button'

/**
 * Global error boundary fallback UI.
 * @param props Error boundary props from Next.js.
 * @returns Recoverable error view.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-xl p-4">
      <h1 className="font-syne text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-ink-2">We hit a temporary issue. Please try again in a moment.</p>
      <div className="mt-4">
        <Button onClick={reset}>Try Again</Button>
      </div>
    </main>
  )
}
