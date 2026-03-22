import type { FreshnessStatus } from '@/types'

interface FreshnessIndicatorProps {
  status: FreshnessStatus
}

/**
 * Badge indicating freshness state for market data.
 * @param props Freshness status value.
 * @returns Color-coded freshness badge.
 */
export function FreshnessIndicator({ status }: FreshnessIndicatorProps) {
  const label =
    status === 'current' ? 'Current data' : status === 'stale' ? 'Stale data' : 'Very stale data'

  const classes =
    status === 'current'
      ? 'bg-brand-green-light text-brand-green-dark'
      : status === 'stale'
        ? 'bg-brand-amber-light text-brand-amber-dark'
        : 'bg-brand-red-light text-brand-red-dark'

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs ${classes}`}>{label}</span>
}
