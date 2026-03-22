interface ProgressBarProps {
  value: number
}

/**
 * Visual progress bar for completion or plan tracking.
 * @param props Numeric value from 0 to 100.
 * @returns Progress bar element.
 */
export function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="h-3 w-full rounded-full bg-paper-2">
      <div className="h-3 rounded-full bg-brand-green" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}
