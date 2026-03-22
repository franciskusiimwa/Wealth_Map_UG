'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGoal } from '@/hooks/useGoal'
import { Button } from '@/components/ui/Button'
import { formatUGX, formatUGXShort, formatUGXWords } from '@/lib/utils/formatCurrency'

/**
 * Investment goal setup page.
 * @returns Interactive goal setter with sliders and inline confirmation panel.
 */
export default function InvestPage() {
  const router = useRouter()
  const {
    totalTargetUgx,
    timeframeYears,
    passiveIncomePct,
    monthlyContributionUgx,
    passiveTargetUgx,
    activeTargetUgx,
    annualTargetUgx,
    setTotalTargetUgx,
    setTimeframeYears,
    setPassiveIncomePct,
    setMonthlyContributionUgx,
    getAmountFromSliderValue,
    getSliderValueFromAmount,
    saveGoal,
    status,
    errorMessage
  } = useGoal()

  const [showConfirmation, setShowConfirmation] = useState(false)

  const targetSliderValue = getSliderValueFromAmount(totalTargetUgx)
  const monthlySavingsNeeded = Math.round(totalTargetUgx / (Math.max(1, timeframeYears) * 12))
  const hasMovedAnySlider =
    totalTargetUgx !== 1_000_000_000 || timeframeYears !== 10 || passiveIncomePct !== 30

  const affordabilityMessage = useMemo(() => {
    if (monthlySavingsNeeded > 10_000_000) {
      return {
        text: "This is an ambitious goal. We'll show you what's realistic.",
        className: 'bg-brand-amber-light text-brand-amber-dark'
      }
    }

    return {
      text: 'These numbers look achievable.',
      className: 'bg-brand-green-light text-brand-green-dark'
    }
  }, [monthlySavingsNeeded])

  /**
   * Shows the inline confirmation panel.
   */
  function openConfirmation() {
    setShowConfirmation(true)
  }

  /**
   * Saves the goal then routes user to investment options.
   * @returns Promise that resolves after save and navigation.
   */
  async function confirmAndContinue() {
    const result = await saveGoal()
    if (result.success) {
      router.push('/invest/options')
    }
  }

  return (
    <section className="pt-6">
      <h1 className="font-syne text-3xl font-bold text-ink">Set your goal</h1>

      <div className="mt-4 rounded-2xl border border-paper-3 bg-paper-2 p-5">
        <p className="font-syne text-3xl font-bold text-ink">{formatUGXWords(totalTargetUgx)}</p>
        <p className="mt-1 text-sm text-ink-3">your target</p>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <p className="text-sm font-medium text-ink">Target amount</p>
          <input
            className="goal-slider mt-2 h-8 w-full accent-brand-green"
            type="range"
            min={1}
            max={100}
            step={1}
            value={targetSliderValue}
            onChange={(event) => {
              const amount = getAmountFromSliderValue(Number(event.target.value))
              setTotalTargetUgx(amount)
              setMonthlyContributionUgx(Math.round(amount / (Math.max(1, timeframeYears) * 12)))
            }}
          />
          <p className="mt-2 text-sm text-ink">{formatUGX(totalTargetUgx)}</p>
          <div className="mt-1 flex items-center justify-between text-xs text-ink-3">
            <span>50M</span>
            <span>2.5B</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-ink">Timeframe</p>
          <input
            className="goal-slider mt-2 h-8 w-full accent-brand-green"
            type="range"
            min={2}
            max={30}
            step={1}
            value={timeframeYears}
            onChange={(event) => {
              const years = Number(event.target.value)
              setTimeframeYears(years)
              setMonthlyContributionUgx(Math.round(totalTargetUgx / (Math.max(1, years) * 12)))
            }}
          />
          <p className="mt-2 text-sm text-ink">{timeframeYears} years</p>
          <div className="mt-1 flex items-center justify-between text-xs text-ink-3">
            <span>2 yrs</span>
            <span>30 yrs</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-ink">Passive income share</p>
          <input
            className="goal-slider mt-2 h-8 w-full accent-brand-green"
            type="range"
            min={0}
            max={100}
            step={5}
            value={passiveIncomePct}
            onChange={(event) => setPassiveIncomePct(Number(event.target.value))}
          />
          <p className="mt-2 text-sm text-ink">{passiveIncomePct}%</p>
          <div className="mt-1 flex items-center justify-between text-xs text-ink-3">
            <span>None</span>
            <span>All of it</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-paper-3 bg-white p-3">
          <p className="text-xs text-ink-3">Passive target</p>
          <p className="mt-1 font-syne text-lg font-semibold text-brand-green">
            {formatUGXShort(passiveTargetUgx)}
          </p>
        </div>
        <div className="rounded-xl border border-paper-3 bg-white p-3">
          <p className="text-xs text-ink-3">Active income</p>
          <p className="mt-1 font-syne text-lg font-semibold text-ink">{formatUGXShort(activeTargetUgx)}</p>
        </div>
        <div className="rounded-xl border border-paper-3 bg-white p-3">
          <p className="text-xs text-ink-3">Per year</p>
          <p className="mt-1 font-syne text-lg font-semibold text-ink">{formatUGXShort(annualTargetUgx)}/yr</p>
        </div>
      </div>

      <div className="mt-6">
        <Button onClick={openConfirmation}>See investment options -&gt;</Button>
        {status === 'error' && errorMessage ? (
          <p className="mt-2 text-sm text-brand-amber-dark">{errorMessage}</p>
        ) : null}
      </div>

      {showConfirmation ? (
        <div className="mt-4 rounded-2xl border border-paper-3 bg-white p-4 ring-1 ring-paper-3">
          {!hasMovedAnySlider ? (
            <p className="mb-3 rounded-xl bg-paper-2 px-3 py-2 text-sm text-ink-2">
              You&apos;re using our default goal. That&apos;s fine - you can change it any time.
            </p>
          ) : null}

          <div className="space-y-2 text-sm text-ink">
            <div className="flex items-center justify-between">
              <span className="text-ink-3">Target</span>
              <span>{formatUGX(totalTargetUgx)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-3">Timeframe</span>
              <span>{timeframeYears} years</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-3">Passive share</span>
              <span>{passiveIncomePct}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-3">Monthly savings needed</span>
              <span>{formatUGX(monthlySavingsNeeded)}</span>
            </div>
          </div>

          <p className={`mt-3 rounded-xl px-3 py-2 text-sm ${affordabilityMessage.className}`}>
            {affordabilityMessage.text}
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button onClick={confirmAndContinue} disabled={status === 'loading'}>
              Yes, show me options -&gt;
            </Button>
            <Button variant="ghost" onClick={() => setShowConfirmation(false)}>
              &lt;- Adjust my goal
            </Button>
          </div>

          <p className="mt-3 text-xs text-ink-3">Your current monthly estimate: {formatUGX(monthlyContributionUgx)}</p>
        </div>
      ) : null}
    </section>
  )
}

