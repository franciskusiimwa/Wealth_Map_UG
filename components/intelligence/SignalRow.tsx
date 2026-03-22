import type { IntelligenceSignal } from '@/types'

interface SignalRowProps {
  signal: IntelligenceSignal
}

function signalDotColor(type: IntelligenceSignal['type']): string {
  if (type === 'positive') {
    return 'bg-brand-green'
  }

  if (type === 'negative') {
    return 'bg-brand-red-dark'
  }

  return 'bg-brand-amber'
}

function confidenceTone(confidence: IntelligenceSignal['confidence']): string {
  if (confidence === 'high') {
    return 'bg-brand-green-light text-brand-green-dark'
  }

  if (confidence === 'medium') {
    return 'bg-brand-amber-light text-brand-amber-dark'
  }

  return 'bg-paper-2 text-ink-2'
}

/**
 * Signal row rendering tone, statement, and source reference.
 * @param props Signal object to render.
 * @returns Single signal line item.
 */
export function SignalRow({ signal }: SignalRowProps) {
  return (
    <div className="rounded-xl border border-paper-3 bg-white p-3">
      <div className="flex items-start gap-3">
        <span className={`mt-1 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ${signalDotColor(signal.type)}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">{signal.text}</p>
          <p className="mt-1 text-xs text-ink-3">{signal.source}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${confidenceTone(signal.confidence)}`}>
          {signal.confidence}
        </span>
      </div>
    </div>
  )
}
