interface ScoreGridProps {
  financial: number
  leadership: number
  culture: number
  market: number
}

function getScoreColor(value: number): string {
  if (value >= 7.5) {
    return 'text-brand-green'
  }

  if (value >= 5) {
    return 'text-brand-amber'
  }

  return 'text-brand-red-dark'
}

/**
 * Displays intelligence scores in a responsive 2x2 / 4-column grid.
 * @param props Category scores from 0 to 10.
 * @returns Score tiles.
 */
export function ScoreGrid({ financial, leadership, culture, market }: ScoreGridProps) {
  const items = [
    ['Financial', financial],
    ['Leadership', leadership],
    ['Culture', culture],
    ['Market', market]
  ] as const

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-paper-3 bg-white p-3">
          <p className="text-xs text-ink-3">{label}</p>
          <p className={`font-syne text-xl font-semibold ${getScoreColor(value)}`}>
            {(Math.round(value * 10) / 10).toFixed(1)}/10
          </p>
        </div>
      ))}
    </div>
  )
}
