interface InlineNudgeProps {
  message: string
  type: 'amber' | 'green'
}

/**
 * Reusable inline nudge message for contextual guidance.
 * @param props Nudge text and visual type.
 * @returns Styled inline banner component.
 */
export function InlineNudge({ message, type }: InlineNudgeProps) {
  const toneClass =
    type === 'amber' ? 'bg-brand-amber-light text-brand-amber-dark' : 'bg-brand-green-light text-brand-green-dark'

  return <p className={`rounded-xl px-3 py-2 text-sm ${toneClass}`}>{message}</p>
}
