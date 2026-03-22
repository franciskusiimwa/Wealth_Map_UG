import { createAdminClient } from '@/lib/supabase/admin'
import type { Trend } from '@/types'

interface MacroUpsertInput {
  key: string
  label: string
  value: number
  period: string
  trend: Trend
  staleAfterDays: number
}

/**
 * Upserts a macro indicator row into Supabase.
 * @param input Macro indicator payload.
 * @returns Promise resolving when write completes.
 */
export async function upsertMacroIndicator(input: MacroUpsertInput): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('wm_macro_indicators').upsert(
    {
      key: input.key,
      label: input.label,
      value: input.value,
      period: input.period,
      trend: input.trend,
      stale_after_days: input.staleAfterDays,
      last_updated: new Date().toISOString()
    },
    { onConflict: 'key' }
  )

  if (error) {
    throw new Error('Failed to persist macro indicator')
  }
}

/**
 * Returns the latest stored value for a macro indicator key.
 * @param key Macro indicator key.
 * @returns Last saved numeric value or null when not found.
 */
export async function getPreviousMacroValue(key: string): Promise<number | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('wm_macro_indicators').select('value').eq('key', key).maybeSingle()

  if (error || !data || typeof data.value !== 'number') {
    return null
  }

  return data.value
}

/**
 * Derives trend direction from previous and current values.
 * @param previous Previous stored value.
 * @param current Current computed value.
 * @returns Trend classification.
 */
export function deriveTrend(previous: number | null, current: number): Trend {
  if (previous === null) {
    return 'stable'
  }

  const delta = current - previous
  if (Math.abs(delta) < 0.0001) {
    return 'stable'
  }

  return delta > 0 ? 'rising' : 'falling'
}
