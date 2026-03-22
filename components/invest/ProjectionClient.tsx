'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useMemo } from 'react'
import { calculateProjection } from '@/lib/utils/projections'
import { Button } from '@/components/ui/Button'
import { formatUGX, formatUGXShort } from '@/lib/utils/formatCurrency'
import type { ProjectionResult, UserGoal } from '@/types'

interface ProjectionClientProps {
  goal: UserGoal | null
}

/**
 * Client wrapper that computes projection values on mount.
 * @param props Optional saved goal from server.
 * @returns Projection view when computed, otherwise a skeleton placeholder.
 */
export function ProjectionClient({ goal }: ProjectionClientProps) {
  const [result, setResult] = useState<ProjectionResult | null>(null)

  const normalizedGoal: UserGoal = {
    id: goal?.id ?? 'fallback-goal',
    user_id: goal?.user_id ?? 'fallback-user',
    total_target_ugx: goal?.total_target_ugx ?? 1_000_000_000,
    timeframe_years: goal?.timeframe_years ?? 10,
    passive_income_pct: goal?.passive_income_pct ?? 30
  }

  useEffect(() => {
    const projection = calculateProjection(
      normalizedGoal.total_target_ugx,
      normalizedGoal.timeframe_years,
      normalizedGoal.passive_income_pct,
      3_000_000,
      0.13
    )

    setResult(projection)
  }, [normalizedGoal.passive_income_pct, normalizedGoal.timeframe_years, normalizedGoal.total_target_ugx])

  if (!result) {
    return (
      <div className="grid gap-3 pt-6">
        <div className="h-36 animate-pulse rounded-2xl bg-paper-2" />
        <div className="h-24 animate-pulse rounded-2xl bg-paper-2" />
        <div className="h-48 animate-pulse rounded-2xl bg-paper-2" />
      </div>
    )
  }

  return <ProjectionView result={result} goal={normalizedGoal} />
}

interface ProjectionViewProps {
  result: ProjectionResult
  goal: UserGoal
}

/**
 * Final projection screen showing progress, gap analysis, and suggested allocation.
 * @param props Projection result and normalized user goal.
 * @returns Full step-3 projection interface.
 */
export function ProjectionView({ result, goal }: ProjectionViewProps) {
  const [showAssumptionHelp, setShowAssumptionHelp] = useState(false)
  const [animatedPct, setAnimatedPct] = useState(0)

  const visualPct = Math.min(100, Math.max(0, result.pct_of_goal))

  const suggestedAllocation = useMemo(
    () => [
      {
        name: 'Treasury Bonds',
        description: 'Stable anchor',
        percentage: 40,
        color: 'rgba(15, 110, 86, 1)'
      },
      {
        name: 'Unit Trusts',
        description: 'Liquid growth',
        percentage: 35,
        color: 'rgba(15, 110, 86, 0.8)'
      },
      {
        name: 'USE Equities',
        description: 'Higher upside',
        percentage: 15,
        color: 'rgba(15, 110, 86, 0.6)'
      },
      {
        name: 'Insurance savings',
        description: 'Forced discipline',
        percentage: 10,
        color: 'rgba(15, 110, 86, 0.4)'
      }
    ],
    []
  )

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setAnimatedPct(visualPct), 40)
    return () => window.clearTimeout(timeoutId)
  }, [visualPct])

  /**
   * Opens Claude in a new tab with a prefilled Uganda-specific planning prompt.
   */
  function openClaudePlan() {
    const prompt = `Help me plan how to invest UGX 3 million per month in Uganda to reach a goal of ${formatUGX(goal.total_target_ugx)} in ${goal.timeframe_years} years. Walk me through Treasury Bonds, unit trusts, and the Uganda Securities Exchange specifically.`

    const url = `https://claude.ai/new?q=${encodeURIComponent(prompt)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="grid gap-4 pt-6">
      <section className="rounded-2xl border border-paper-3 bg-brand-green-light p-4">
        <p className="text-sm text-brand-green-dark">Projected value after {goal.timeframe_years} years</p>
        <p className="mt-1 font-syne text-4xl font-bold text-brand-green-dark">{formatUGX(result.projected_total)}</p>
        <div className="mt-2 flex items-start gap-2">
          <p className="text-sm text-brand-green-dark">Based on UGX 3M/month invested at 13% blended return</p>
          <button
            type="button"
            onClick={() => setShowAssumptionHelp((previous) => !previous)}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-brand-green-dark text-xs text-brand-green-dark"
            aria-label="Show projection assumptions"
          >
            ?
          </button>
        </div>

        {showAssumptionHelp ? (
          <p className="mt-2 text-xs text-brand-green-dark">
            We assume UGX 3 million per month in contributions and a 13% blended annual return across
            your portfolio. Real returns will vary.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-paper-3 bg-white p-4">
        <div className="mb-2 flex items-center justify-between text-sm text-ink-2">
          <span>Progress toward {formatUGX(goal.total_target_ugx)}</span>
          <span>{result.pct_of_goal}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-paper-2">
          <div
            className="h-3 rounded-full bg-brand-green transition-all duration-1000 ease-in-out"
            style={{ width: `${animatedPct}%` }}
          />
        </div>
      </section>

      {result.on_track ? (
        <section className="rounded-2xl border border-paper-3 bg-brand-green-light p-4">
          <h2 className="font-syne text-xl font-semibold text-brand-green-dark">You are on track</h2>
          <p className="mt-1 text-sm text-brand-green-dark">
            At current contribution levels you may exceed your target. Consider increasing your passive
            income allocation.
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-paper-3 bg-brand-red-light p-4">
          <h2 className="font-syne text-xl font-semibold text-brand-red-dark">Gap to close</h2>
          <p className="mt-1 text-sm text-brand-red-dark">
            You need an extra {formatUGXShort(result.gap)} to hit your goal. Options: increase monthly
            contributions, extend your timeframe, or choose higher-return investments.
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-paper-3 bg-white p-4">
        <h2 className="font-syne text-xl font-semibold text-ink">Suggested allocation</h2>
        <div className="mt-3 grid gap-3">
          {suggestedAllocation.map((item) => (
            <div key={item.name} className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span
                  className="mt-1 inline-flex h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <p className="text-sm font-medium text-ink">{item.name}</p>
                  <p className="text-xs text-ink-3">{item.description}</p>
                </div>
              </div>
              <p className="font-syne text-lg font-semibold text-ink">{item.percentage}%</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-paper-3 bg-brand-amber-light p-4 text-sm text-brand-amber-dark">
        These projections are illustrative estimates based on historical averages. Contributions and
        returns are assumed, not guaranteed. Actual results may be significantly higher or lower. This is
        not financial advice - always consult a CMA-registered investment advisor before committing any
        funds.
      </section>

      <section className="grid gap-3">
        <Button onClick={openClaudePlan}>Ask Claude to help me plan this -&gt;</Button>
        <Link href="/invest/options" className="text-sm text-ink-2 underline underline-offset-4">
          &larr; Back to options
        </Link>
      </section>
    </div>
  )
}
