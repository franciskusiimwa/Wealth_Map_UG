'use client'

import type { BusinessCanvas } from '@/types'

interface CanvasOutputProps {
  canvas: BusinessCanvas
  metadata: {
    sector: string
    generatedAt: string
  }
}

function SectionCard({
  label,
  children,
  className = ''
}: Readonly<{ label: string; children: any; className?: string }>) {
  return (
    <article className={`rounded-2xl border border-paper-3 bg-white p-5 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">{label}</p>
      <div className="mt-3">{children}</div>
    </article>
  )
}

function TagCloud({ tags, itemClassName }: Readonly<{ tags: string[]; itemClassName: string }>) {
  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li key={tag} className={`rounded-full px-3 py-2 text-sm ${itemClassName}`}>
          {tag}
        </li>
      ))}
    </ul>
  )
}

/**
 * Renders generated business canvas with sectioned layout and next actions.
 * @param props Canvas and generation metadata.
 * @returns Canvas result view.
 */
export function CanvasOutput({ canvas, metadata }: CanvasOutputProps) {
  const generatedLabel = !Number.isNaN(new Date(metadata.generatedAt).getTime())
    ? new Date(metadata.generatedAt).toLocaleString('en-UG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : metadata.generatedAt

  const claudePrompt = `Let's go deeper on my business canvas for ${metadata.sector} in Uganda. I want to stress-test the revenue model and understand who my real competitors are in the current market.`
  const claudeUrl = `https://claude.ai/new?q=${encodeURIComponent(claudePrompt)}`

  return (
    <section className="pb-8 pt-4">
      <header className="mb-5">
        <p className="text-xs uppercase tracking-wide text-ink-3">Generated {generatedLabel}</p>
        <h1 className="mt-1 font-syne text-3xl font-bold text-ink md:text-4xl">Your business canvas</h1>
        <p className="mt-2 text-sm text-ink-2">A starting framework — challenge it, refine it, make it yours.</p>
      </header>

      <div id="printable-canvas" className="space-y-4 print-canvas">
        <SectionCard label="Value proposition">
          <p className="text-lg leading-relaxed text-ink">{canvas.value_proposition}</p>
        </SectionCard>

        <SectionCard label="Target customers">
          <p className="text-base leading-relaxed text-ink-2">{canvas.target_customers}</p>
        </SectionCard>

        <SectionCard label="Revenue streams">
          <TagCloud
            tags={canvas.revenue_streams}
            itemClassName="bg-brand-amber-light font-medium text-brand-amber-dark"
          />
        </SectionCard>

        <div className="grid gap-4 md:grid-cols-2">
          <SectionCard label="Key activities">
            <TagCloud tags={canvas.key_activities} itemClassName="bg-paper-2 text-ink-2" />
          </SectionCard>

          <SectionCard label="Key resources">
            <TagCloud tags={canvas.key_resources} itemClassName="bg-paper-2 text-ink-2" />
          </SectionCard>
        </div>

        <SectionCard label="Cost structure">
          <TagCloud tags={canvas.cost_structure} itemClassName="bg-paper-2 text-ink-2" />
        </SectionCard>

        <SectionCard label="Uganda market context" className="border-l-4 border-l-brand-amber">
          <p className="text-sm leading-relaxed text-ink-2">{canvas.ugandan_context}</p>
        </SectionCard>

        <div className="grid gap-4 md:grid-cols-2">
          <SectionCard label="Quick wins">
            <TagCloud
              tags={canvas.quick_wins}
              itemClassName="bg-brand-green-light font-medium text-brand-green-dark"
            />
          </SectionCard>

          <SectionCard label="Key risks">
            <TagCloud tags={canvas.key_risks} itemClassName="bg-brand-red-light font-medium text-brand-red-dark" />
          </SectionCard>
        </div>

        <SectionCard label="First 30 days">
          <ol className="space-y-3">
            {canvas.first_30_days.map((action, index) => (
              <li key={action} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-green text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="flex-1 text-sm leading-relaxed text-ink-2">{action}</p>
              </li>
            ))}
          </ol>
        </SectionCard>

        <article className="rounded-2xl border border-paper-3 border-l-4 border-l-brand-amber bg-paper-2 p-5">
          <p className="text-sm leading-relaxed text-ink-2">
            This canvas is AI-generated for planning and education only. It does not constitute business,
            financial, or legal advice. Validate all assumptions with real market research before investing.
          </p>
        </article>
      </div>

      <div className="mt-6 flex flex-col gap-3 print:hidden md:flex-row">
        <a
          href={claudeUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-green px-6 font-syne text-base font-semibold text-white transition active:opacity-80"
        >
          Refine with Claude →
        </a>

        <button
          type="button"
          onClick={() => {
            // MVP approach: browser print for PDF export. Replace with generated PDF service in a later iteration.
            window.print()
          }}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-paper-3 bg-transparent px-6 text-base font-semibold text-ink transition active:opacity-80"
        >
          Download as PDF
        </button>

        <a
          href="/business"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-paper-3 bg-transparent px-6 text-base font-semibold text-ink transition active:opacity-80"
        >
          Start a new canvas
        </a>
      </div>
    </section>
  )
}
