'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ScoreGrid } from '@/components/intelligence/ScoreGrid'
import { SignalRow } from '@/components/intelligence/SignalRow'
import type { CompanyIntelligence, InvestmentProduct, Verdict } from '@/types'

interface IntelligenceCardProps {
  intelligence: CompanyIntelligence
  product: InvestmentProduct
}

function verdictTone(verdict: Verdict): string {
  if (verdict === 'strong') {
    return 'bg-brand-green-light text-brand-green-dark'
  }

  if (verdict === 'avoid') {
    return 'bg-brand-red-light text-brand-red-dark'
  }

  return 'bg-brand-amber-light text-brand-amber-dark'
}

function formatDate(value: string): string {
  if (Number.isNaN(new Date(value).getTime())) {
    return 'Unknown date'
  }

  return new Date(value).toLocaleDateString('en-UG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
}

/**
 * Displays generated intelligence analysis for a selected investment product.
 * @param props Intelligence brief and selected product.
 * @returns Intelligence display card.
 */
export function IntelligenceCard({ intelligence, product }: IntelligenceCardProps) {
  const [expanded, setExpanded] = useState(false)
  const paragraphs = useMemo(() => splitParagraphs(intelligence.claude_read), [intelligence.claude_read])

  const visibleParagraph = paragraphs[0] ?? intelligence.claude_read
  const hiddenParagraphs = paragraphs.slice(1)
  const showToggle = hiddenParagraphs.length > 0

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-syne text-2xl font-medium text-ink">{intelligence.company_name}</h1>
            <p className="mt-1 text-sm text-ink-3">{product.category.replace('_', ' ')}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${verdictTone(intelligence.verdict)}`}>
            {intelligence.verdict_label}
          </span>
        </div>

        <div className="mt-4">
          <ScoreGrid
            financial={intelligence.score_financial}
            leadership={intelligence.score_leadership}
            culture={intelligence.score_culture}
            market={intelligence.score_market}
          />
        </div>

        <section className="mt-5 rounded-xl border border-paper-3 bg-paper p-4">
          <h2 className="font-syne text-lg font-semibold text-ink">Claude&apos;s read</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{visibleParagraph}</p>

          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
          >
            <div className="overflow-hidden">
              <div className="space-y-3 pt-3">
                {hiddenParagraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-relaxed text-ink-2">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {showToggle ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-3 text-sm font-semibold text-brand-green"
            >
              {expanded ? 'Read less' : 'Read more'}
            </button>
          ) : null}
        </section>

        <section className="mt-5">
          <h2 className="font-syne text-lg font-semibold text-ink">Signals</h2>
          <div className="mt-3 grid gap-2">
            {intelligence.signals.map((signal, index) => (
              <SignalRow key={`${signal.text}-${index}`} signal={signal} />
            ))}
          </div>
        </section>

        <section className="mt-5">
          <h2 className="font-syne text-lg font-semibold text-ink">Sources</h2>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
            {intelligence.sources.map((source, index) => (
              <span
                key={`${source}-${index}`}
                className="whitespace-nowrap rounded-full border border-paper-3 bg-paper-2 px-3 py-1 text-xs text-ink-2"
              >
                {source}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-5 border-t border-paper-3 pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-3">Overall confidence</p>
          <ProgressBar value={Math.round(intelligence.overall_confidence * 100)} />
          <p className="mt-2 text-xs text-ink-3">
            Updated {formatDate(intelligence.generated_at)} · Next refresh {formatDate(intelligence.next_refresh)}
          </p>
        </section>
      </Card>

      <article className="rounded-2xl border border-paper-3 border-l-4 border-l-brand-amber bg-paper-2 p-5">
        <p className="text-sm leading-relaxed text-ink-2">
          This canvas is AI-generated for planning and education only. It does not constitute business,
          financial, or legal advice. Validate all assumptions with real market research before investing.
        </p>
      </article>
    </div>
  )
}
