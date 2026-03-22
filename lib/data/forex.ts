import { getPreviousMacroValue, deriveTrend } from '@/lib/data/macro'
import type { MacroIndicator } from '@/types'

interface ExchangeRateApiResponse {
  result?: string
  rates?: Record<string, number>
}

/**
 * Fetches UGX per USD using the free ExchangeRate-API endpoint.
 * @returns Macro indicator for UGX/USD.
 */
export async function fetchUGXRate(): Promise<MacroIndicator> {
  const response = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('FOREX_FETCH_FAILED')
  }

  const payload = (await response.json()) as ExchangeRateApiResponse
  const ugxValue = payload.rates?.UGX

  if (typeof ugxValue !== 'number' || !Number.isFinite(ugxValue)) {
    throw new Error('FOREX_FETCH_FAILED')
  }

  const previous = await getPreviousMacroValue('ugx-usd')

  return {
    key: 'ugx-usd',
    label: 'UGX per 1 USD',
    value: ugxValue,
    period: new Date().toISOString().slice(0, 7),
    trend: deriveTrend(previous, ugxValue),
    last_updated: new Date().toISOString(),
    stale_after_days: 7
  }
}
