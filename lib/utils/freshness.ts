import type { FreshnessStatus } from '@/types'

/**
 * Computes freshness status for a dated record.
 * @param lastUpdated ISO timestamp for the latest successful refresh.
 * @param staleAfterDays Number of days after which data is considered stale.
 * @returns FreshnessStatus value for UI and logic decisions.
 */
export function getFreshnessStatus(lastUpdated: string, staleAfterDays: number): FreshnessStatus {
  const updatedAtMs = new Date(lastUpdated).getTime()
  const safeStaleAfterDays = Math.max(1, Math.round(staleAfterDays))

  if (Number.isNaN(updatedAtMs)) {
    return 'very_stale'
  }

  const ageDays = (Date.now() - updatedAtMs) / (1000 * 60 * 60 * 24)

  if (ageDays > safeStaleAfterDays * 2) {
    return 'very_stale'
  }
  if (ageDays > safeStaleAfterDays) {
    return 'stale'
  }
  return 'current'
}

/**
 * Returns a human-friendly label for freshness status.
 * @param status Freshness status value.
 * @returns Display label for UI copy.
 */
export function getFreshnessLabel(status: FreshnessStatus): string {
  if (status === 'current') {
    return 'Current'
  }
  if (status === 'stale') {
    return 'Needs refresh soon'
  }
  return 'Out of date'
}

/**
 * Returns Tailwind classes for freshness badge colors.
 * @param status Freshness status value.
 * @returns Tailwind utility class string.
 */
export function getFreshnessColor(status: FreshnessStatus): string {
  if (status === 'current') {
    return 'bg-brand-green-light text-brand-green-dark'
  }
  if (status === 'stale') {
    return 'bg-brand-amber-light text-brand-amber-dark'
  }
  return 'bg-brand-red-light text-brand-red-dark'
}
