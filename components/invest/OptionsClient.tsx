'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { InlineNudge } from '@/components/ui/InlineNudge'
import { Button } from '@/components/ui/Button'
import { getFreshnessStatus } from '@/lib/utils/freshness'
import { formatUGXShort } from '@/lib/utils/formatCurrency'
import type { InvestmentProduct, UserGoal } from '@/types'

interface OptionsClientProps {
  products: InvestmentProduct[]
  goal: UserGoal | null
}

interface InvestmentOptionCardProps {
  product: InvestmentProduct
  isExpanded: boolean
  onToggle: () => void
}

/**
 * Interactive wrapper for investment options list and proceed gating.
 * @param props Product catalog and optional user goal.
 * @returns Expandable options list with progression controls.
 */
export function OptionsClient({ products, goal }: OptionsClientProps) {
  const router = useRouter()
  const [expandedProductIds, setExpandedProductIds] = useState<string[]>([])
  const [hasEngaged, setHasEngaged] = useState(false)
  const [showNudge, setShowNudge] = useState(false)

  const productsWithFreshness = useMemo(
    () =>
      products.map((product) => ({
        ...product,
        freshness: getFreshnessStatus(product.last_updated, product.stale_after_days)
      })),
    [products]
  )

  const hasVeryStale = productsWithFreshness.some((product) => product.freshness === 'very_stale')
  const passiveTargetUgx =
    goal !== null ? Math.round(goal.total_target_ugx * (goal.passive_income_pct / 100)) : null

  useEffect(() => {
    if (!showNudge) {
      return
    }

    const timeoutId = window.setTimeout(() => setShowNudge(false), 4000)
    return () => window.clearTimeout(timeoutId)
  }, [showNudge])

  /**
   * Toggles the expanded state for a product card.
   * @param productId Product identifier.
   */
  function toggleCard(productId: string) {
    setExpandedProductIds((previous) =>
      previous.includes(productId) ? previous.filter((id) => id !== productId) : [...previous, productId]
    )
    setHasEngaged(true)
    setShowNudge(false)
  }

  /**
   * Handles progression to projection page with engagement guard.
   */
  function handleProceed() {
    if (!hasEngaged) {
      if (showNudge) {
        setShowNudge(false)
        return
      }
      setShowNudge(true)
      return
    }

    router.push('/invest/projection')
  }

  return (
    <div>
      <Link href="/invest" className="text-sm text-ink-2 underline underline-offset-4">
        &larr; Edit my goal
      </Link>
      <p className="mt-4 text-sm text-ink-3">Step 2 of 3</p>
      <h1 className="mt-1 font-syne text-3xl font-bold text-ink">Your options</h1>

      <p className="mt-2 text-sm text-ink-2">
        {goal
          ? `To reach ${formatUGXShort(passiveTargetUgx ?? 0)} in passive income over ${goal.timeframe_years} years, here are your options. Tap to expand.`
          : 'Here are the passive income vehicles available in Uganda right now.'}
      </p>

      {hasVeryStale ? (
        <div className="mt-4 rounded-xl bg-brand-amber-light px-3 py-2 text-sm text-brand-amber-dark">
          Some data may be out of date. We&apos;re showing ranges to keep things honest.
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        {productsWithFreshness.map((product) => (
          <InvestmentOptionCard
            key={product.id}
            product={product}
            isExpanded={expandedProductIds.includes(product.id)}
            onToggle={() => toggleCard(product.id)}
          />
        ))}
      </div>

      <div className="mt-6">
        {showNudge ? (
          <div className="mb-3">
            <InlineNudge
              type="amber"
              message="Take a look at the options above first - your projection will mean more once you understand what's available."
            />
          </div>
        ) : null}
        <Button onClick={handleProceed}>See my projection &rarr;</Button>
      </div>
    </div>
  )
}

/**
 * Expandable investment option card with freshness-aware display details.
 * @param props Product content and expansion controls.
 * @returns Interactive option card for the options list.
 */
export function InvestmentOptionCard({ product, isExpanded, onToggle }: InvestmentOptionCardProps) {
  const riskLabel =
    product.risk_level === 'low_medium'
      ? 'Low-medium'
      : product.risk_level.charAt(0).toUpperCase() + product.risk_level.slice(1)

  const dateText = Number.isNaN(new Date(product.last_updated).getTime())
    ? 'unknown date'
    : new Date(product.last_updated).toLocaleDateString('en-UG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })

  const staleRange = `${Math.max(0, (product.return_min - 0.02) * 100).toFixed(0)}-${Math.round(
    (product.return_max + 0.02) * 100
  )}%`

  const returnText =
    product.freshness === 'very_stale'
      ? staleRange
      : product.freshness === 'stale'
        ? `${product.return_display} (estimated)`
        : product.return_display

  return (
    <div className="relative">
      {product.is_featured ? (
        <div className="mb-1 inline-flex rounded-full bg-brand-green-light px-3 py-1 text-xs text-brand-green-dark">
          Analyst pick
        </div>
      ) : null}

      <button
        type="button"
        onClick={onToggle}
        className={`w-full rounded-2xl bg-white p-4 text-left ${
          product.is_featured ? 'border-2 border-brand-green' : 'border border-paper-3'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-syne text-lg font-medium text-ink">{product.name}</h2>
            <p className="mt-1 text-xs text-ink-3">{product.category.replace('_', ' ')}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-green-light px-2 py-1 text-xs font-medium text-brand-green-dark">
              {returnText}
            </span>
            <span className={`text-sm text-ink-3 transition ${isExpanded ? 'rotate-180' : ''}`}>v</span>
          </div>
        </div>

        {isExpanded ? (
          <div className="mt-3 border-t border-paper-3 pt-3">
            <p className="text-sm text-ink-2">{product.description}</p>

            {product.projection_note ? (
              <p className="mt-3 rounded-xl bg-brand-green-light px-3 py-2 text-sm text-brand-green-dark">
                {product.projection_note}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-paper-3 bg-paper px-3 py-1 text-xs text-ink-2">
                Return {product.return_display}
              </span>
              <span className="rounded-full border border-paper-3 bg-paper px-3 py-1 text-xs text-ink-2">
                Min. entry {formatUGXShort(product.min_investment_ugx)}
              </span>
              <span className="rounded-full border border-paper-3 bg-paper px-3 py-1 text-xs text-ink-2">
                Risk {riskLabel}
              </span>
            </div>

            {product.expert_note ? (
              <div className="mt-3 rounded-xl border border-brand-amber-light bg-brand-amber-light p-3">
                <p className="text-xs font-medium text-brand-amber-dark">Expert read</p>
                <p className="mt-1 text-sm text-ink-2">{product.expert_note}</p>
              </div>
            ) : null}

            <p className="mt-3 text-xs text-ink-3">Data from {dateText}</p>
            {product.source_url ? (
              <a
                href={product.source_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs text-brand-green"
              >
                Source ↗
              </a>
            ) : null}

            <div>
              <Link href={`/intelligence/${product.id}`} className="mt-2 inline-block text-xs text-ink-2 underline underline-offset-4">
                View intelligence brief &rarr;
              </Link>
            </div>
          </div>
        ) : null}
      </button>
    </div>
  )
}
