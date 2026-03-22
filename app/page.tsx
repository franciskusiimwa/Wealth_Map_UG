import Link from 'next/link'
import { PathCard } from '@/components/landing/PathCard'

/**
 * Landing page for persona selection and onboarding route split.
 * @returns Persona-first landing experience.
 */
export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-paper px-4 pb-6 pt-8">
      <section>
        <p className="font-syne text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="text-brand-green">Wealth</span>
          <span className="text-ink">map</span>
        </p>

        <div className="mt-4 inline-flex rounded-full border border-paper-3 bg-white px-3 py-1 text-xs text-ink-3">
          Uganda &amp; East Africa
        </div>

        <h1 className="mt-6 font-syne text-4xl font-bold leading-tight text-ink sm:text-5xl">
          Your money, working harder.
        </h1>
        <p className="mt-3 text-base text-ink-2">
          Set your wealth goals, explore real investment options, and build your business - all in one
          place.
        </p>
      </section>

      <section className="mt-8 grid gap-3">
        <PathCard
          title="Grow my money passively"
          subtitle="Start with investment options and projections tailored to your goal."
          href="/invest"
          iconClassName="bg-brand-green-light"
        />
        <PathCard
          title="Start or grow a business"
          subtitle="Build a Uganda-focused business model canvas in guided steps."
          href="/business"
          iconClassName="bg-brand-amber-light"
        />
        <PathCard
          title="Both - show me everything"
          subtitle="Take the full Wealthmap journey across investing and business."
          href="/invest"
          iconClassName="bg-paper-3"
        />
      </section>

      <div className="mt-6 flex items-center gap-4 text-sm text-ink-2">
        <Link href="/auth/login" className="underline underline-offset-4">
          Sign in
        </Link>
        <Link href="/auth/signup" className="underline underline-offset-4">
          Create account
        </Link>
      </div>

      <p className="mt-auto pt-8 text-xs text-ink-3">
        Educational tool only. Not financial advice. Always consult a regulated advisor.
      </p>
    </main>
  )
}

