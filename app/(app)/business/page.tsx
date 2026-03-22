'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'
import { StepIndicator } from '@/components/ui/StepIndicator'
import { useBusinessIntake } from '@/hooks/useBusinessIntake'

/**
 * Business intake page for multi-step onboarding.
 * @returns Four-step business intake flow with validation and submit actions.
 */
export default function BusinessPage() {
  const intake = useBusinessIntake()
  const [shakeSector, setShakeSector] = useState(false)

  useEffect(() => {
    if (!intake.fieldErrors.sector) {
      return
    }
    setShakeSector(true)
    const timeoutId = window.setTimeout(() => setShakeSector(false), 450)
    return () => window.clearTimeout(timeoutId)
  }, [intake.fieldErrors.sector])

  const isLoading = intake.status === 'loading'

  const sectorRows = [
    ['Agriculture', 'Food & beverages', 'Retail & trade', 'Tech & digital'],
    ['Education', 'Health', 'Real estate', 'Transport & logistics']
  ]

  const capitalOptions = [
    { label: 'Under UGX 5M', value: 'under-5m' },
    { label: 'UGX 5M - 20M', value: '5m-20m' },
    { label: 'UGX 20M - 100M', value: '20m-100m' },
    { label: 'Over UGX 100M', value: 'over-100m' }
  ]

  const concernOptions = [
    { label: 'Finding my first customers', key: 'customers' },
    { label: 'Managing cash flow month to month', key: 'cashflow' },
    { label: 'Too much competition already', key: 'competition' },
    { label: 'Not enough starting capital', key: 'capital' },
    { label: 'Hiring and managing staff', key: 'staff' },
    { label: 'Navigating URA, URSB, regulations', key: 'regulatory' }
  ]

  const revenueOptions = [
    { label: 'Under UGX 20M', value: 'under-20m' },
    { label: 'UGX 20M - 60M', value: '20m-60m' },
    { label: 'UGX 60M - 200M', value: '60m-200m' },
    { label: 'Over UGX 200M', value: 'over-200m' }
  ]

  return (
    <section className="pt-6">
      <StepIndicator currentStep={intake.currentStep} totalSteps={4} />

      <div className={`mt-5 space-y-5 ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>
        {intake.currentStep === 0 ? (
          <div className="space-y-4">
            <div>
              <h1 className="font-syne text-3xl font-bold text-ink">Let&apos;s build your business model</h1>
              <p className="mt-1 text-sm text-ink-2">
                Four quick questions, then we generate your canvas. Takes about 2 minutes.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm text-ink-2">Your name (optional)</label>
              <input
                className="h-11 w-full rounded-xl border-2 border-paper-3 bg-paper-2 px-4 py-3 text-base outline-none focus:border-brand-green"
                placeholder="e.g. Sarah Nakato"
                value={intake.name}
                onChange={(event) => intake.setName(event.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-ink-2">Your background in a sentence</label>
              <textarea
                className="w-full rounded-xl border-2 border-paper-3 bg-paper-2 px-4 py-3 text-base outline-none focus:border-brand-green"
                placeholder="e.g. 5 years in accounting, some retail trading experience..."
                value={intake.background}
                onChange={(event) => intake.setBackground(event.target.value)}
                rows={3}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-ink-2">Starting capital available</label>
              <div className="flex flex-wrap gap-2">
                {capitalOptions.map((option) => (
                  <Pill
                    key={option.value}
                    label={option.label}
                    selected={intake.capitalRange === option.value}
                    onClick={() => intake.setCapitalRange(option.value)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {intake.currentStep === 1 ? (
          <div className="space-y-4">
            <div>
              <h1 className="font-syne text-3xl font-bold text-ink">What sector?</h1>
              <p className="mt-1 text-sm text-ink-2">Pick the one that excites you most.</p>
            </div>

            <div>
              <div className={`grid gap-2 ${shakeSector ? 'shake-x' : ''}`}>
                {sectorRows.map((row, rowIndex) => (
                  <div key={`row-${rowIndex}`} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {row.map((option) => (
                      <Pill
                        key={option}
                        label={option}
                        selected={intake.sector === option}
                        onClick={() => intake.setSector(option)}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {intake.fieldErrors.sector ? (
                <p className="mt-2 rounded-xl bg-brand-amber-light px-3 py-2 text-sm text-brand-amber-dark">
                  Pick a sector to continue - it helps us give you Uganda-specific advice.
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm text-ink-2">Describe your idea (1-2 sentences)</label>
              <textarea
                className={`w-full rounded-xl border-2 bg-paper-2 px-4 py-3 text-base outline-none focus:border-brand-green ${
                  intake.fieldErrors.idea ? 'border-brand-red-dark' : 'border-paper-3'
                }`}
                placeholder="e.g. A mobile-first grocery delivery service targeting middle-income families in Kampala..."
                value={intake.idea}
                onChange={(event) => intake.setIdea(event.target.value)}
                rows={4}
              />

              {intake.fieldErrors.idea ? (
                <p className="mt-2 text-sm text-brand-red-dark">
                  Give us a sentence or two - even a rough idea is enough to work with.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {intake.currentStep === 2 ? (
          <div className="space-y-4">
            <div>
              <h1 className="font-syne text-3xl font-bold text-ink">What&apos;s your biggest worry?</h1>
              <p className="mt-1 text-sm text-ink-2">Be honest - this shapes the advice we give you.</p>
            </div>

            <div className="grid gap-2">
              {concernOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => intake.setConcernKey(option.key)}
                  className={`min-h-11 w-full rounded-xl border px-4 py-3 text-left text-sm ${
                    intake.concernKey === option.key
                      ? 'border-brand-green bg-brand-green-light font-medium text-brand-green-dark'
                      : 'border-paper-3 bg-white text-ink-3'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {intake.fieldErrors.concernKey ? (
              <p className="rounded-xl bg-brand-amber-light px-3 py-2 text-sm text-brand-amber-dark">
                Tell us your biggest concern - it shapes the advice you get.
              </p>
            ) : null}
          </div>
        ) : null}

        {intake.currentStep === 3 ? (
          <div className="space-y-4">
            <div>
              <h1 className="font-syne text-3xl font-bold text-ink">Almost there</h1>
              <p className="mt-1 text-sm text-ink-2">
                One last thing - what does success look like for you?
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm text-ink-2">Year 1 revenue goal</label>
              <div className="flex flex-wrap gap-2">
                {revenueOptions.map((option) => (
                  <Pill
                    key={option.value}
                    label={option.label}
                    selected={intake.revenueRange === option.value}
                    onClick={() => intake.setRevenueRange(option.value)}
                  />
                ))}
              </div>

              {intake.fieldErrors.revenueRange ? (
                <p className="mt-2 rounded-xl bg-brand-amber-light px-3 py-2 text-sm text-brand-amber-dark">
                  Pick a revenue goal to finish.
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm text-ink-2">Anything else we should know? (optional)</label>
              <textarea
                className="w-full rounded-xl border-2 border-paper-3 bg-paper-2 px-4 py-3 text-base outline-none focus:border-brand-green"
                placeholder="Extra context, constraints, or goals..."
                value={intake.extra}
                onChange={(event) => intake.setExtra(event.target.value)}
                rows={4}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="rounded-xl border border-paper-3 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="loading-dot h-2 w-2 rounded-full bg-brand-green" />
              <span className="loading-dot h-2 w-2 rounded-full bg-brand-green" style={{ animationDelay: '0.2s' }} />
              <span className="loading-dot h-2 w-2 rounded-full bg-brand-green" style={{ animationDelay: '0.4s' }} />
            </div>
            <p className="mt-2 text-sm text-ink-2">Building your canvas for the Ugandan market...</p>
          </div>
        ) : null}

        {intake.status === 'error' && intake.errorMessage ? (
          <p className="mt-3 text-sm text-brand-red-dark">{intake.errorMessage}</p>
        ) : null}

        {!isLoading ? (
          <div className="mt-3">
            {intake.currentStep === 0 ? (
              <Button onClick={intake.goNext}>Next -&gt;</Button>
            ) : intake.currentStep < 3 ? (
              <div className="flex gap-3">
                <Button variant="ghost" className="w-1/2" onClick={intake.goPrev}>
                  &larr; Back
                </Button>
                <Button className="w-1/2" onClick={intake.goNext}>
                  Next -&gt;
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button variant="ghost" className="w-1/2" onClick={intake.goPrev}>
                  &larr; Back
                </Button>
                <Button className="w-1/2 bg-brand-amber text-white" onClick={intake.submit}>
                  Generate my canvas -&gt;
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}

