'use client'

import Link from 'next/link'
import { useLogin } from '@/hooks/useLogin'
import { Button } from '@/components/ui/Button'

/**
 * Login page for email/password authentication.
 * @returns Login form.
 */
export default function LoginPage() {
  const { email, password, setEmail, setPassword, handleSubmit, status, errorMessage } = useLogin()

  return (
    <main className="mx-auto w-full max-w-md bg-paper px-4 py-8">
      <p className="font-syne text-3xl font-bold tracking-tight">
        <span className="text-brand-green">Wealth</span>
        <span className="text-ink">map</span>
      </p>
      <h1 className="mt-6 font-syne text-3xl font-bold text-ink">Welcome back</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          className="h-11 w-full rounded-xl border-2 border-paper-3 bg-paper-2 px-4 py-3 text-base outline-none focus:border-brand-green"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className="h-11 w-full rounded-xl border-2 border-paper-3 bg-paper-2 px-4 py-3 text-base outline-none focus:border-brand-green"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {status === 'loading' ? <div className="h-12 animate-pulse rounded-xl bg-paper-2" /> : null}
        {status === 'error' && errorMessage ? (
          <p className="text-sm text-brand-amber-dark">{errorMessage}</p>
        ) : null}

        <Button type="submit">Sign in</Button>
      </form>

      <p className="mt-4 text-sm text-ink-2">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="underline underline-offset-4">
          Create one
        </Link>
      </p>
    </main>
  )
}

