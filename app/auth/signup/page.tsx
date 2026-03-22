'use client'

import Link from 'next/link'
import { useSignup } from '@/hooks/useSignup'
import { Button } from '@/components/ui/Button'

/**
 * Signup page for account creation.
 * @returns Signup form.
 */
export default function SignupPage() {
  const {
    email,
    password,
    setEmail,
    setPassword,
    handleSubmit,
    status,
    errorMessage,
    confirmPassword,
    setConfirmPassword,
    submitted
  } = useSignup()

  const showPasswordHint = !submitted || password.length < 8

  return (
    <main className="mx-auto w-full max-w-md bg-paper px-4 py-8">
      <p className="font-syne text-3xl font-bold tracking-tight">
        <span className="text-brand-green">Wealth</span>
        <span className="text-ink">map</span>
      </p>
      <h1 className="mt-6 font-syne text-3xl font-bold text-ink">Create your account</h1>

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
        <p className="text-xs text-ink-3">Use at least 8 characters.</p>

        <input
          className="h-11 w-full rounded-xl border-2 border-paper-3 bg-paper-2 px-4 py-3 text-base outline-none focus:border-brand-green"
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />

        {showPasswordHint ? <p className="text-xs text-ink-3">Password must be at least 8 characters.</p> : null}

        {status === 'loading' ? <div className="h-12 animate-pulse rounded-xl bg-paper-2" /> : null}
        {status === 'error' && errorMessage ? (
          <p className="text-sm text-brand-amber-dark">{errorMessage}</p>
        ) : null}
        {status === 'success' ? (
          <p className="text-sm text-brand-green-dark">Check your email to confirm your account</p>
        ) : null}

        <Button type="submit">Create Account</Button>
      </form>

      <p className="mt-4 text-sm text-ink-2">
        Already have an account?{' '}
        <Link href="/auth/login" className="underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </main>
  )
}

