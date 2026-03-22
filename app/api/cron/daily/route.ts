import { NextResponse } from 'next/server'
import { scrapeMarkdown } from '@/lib/firecrawl/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchBoUBondData } from '@/lib/data/bonds'
import { fetchUGXRate } from '@/lib/data/forex'
import { upsertMacroIndicator } from '@/lib/data/macro'
import { mapRefreshError } from '@/lib/utils/errorMapping'
import type { ApiResponse } from '@/types/api'

const USE_MARKET_URL = 'https://www.use.or.ug/content/market-statistics'

function parseNumericToken(token: string): number | null {
  const cleaned = token.replace(/,/g, '').trim()
  const parsed = Number.parseFloat(cleaned)
  if (!Number.isFinite(parsed)) {
    return null
  }
  return parsed
}

function extractUsePrices(markdown: string): number[] {
  const lines = markdown.split('\n').map((line) => line.trim())

  const priceCandidates: number[] = []

  for (const line of lines) {
    const looksLikeMarketRow = /\||counter|equity|close|price|last/i.test(line)
    if (!looksLikeMarketRow || /%/.test(line)) {
      continue
    }

    const numericMatches = Array.from(line.matchAll(/\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/g)).map((match) => match[0])

    for (const numericText of numericMatches) {
      const value = parseNumericToken(numericText)
      if (value === null) {
        continue
      }

      // USE equities commonly sit in UGX integer/decimal price bands; filter out obvious noise.
      if (value >= 50 && value <= 500000) {
        priceCandidates.push(value)
      }
    }
  }

  return priceCandidates
}

function deriveReturnRangeFromPrices(prices: number[]): { min: number; max: number } {
  if (prices.length < 2) {
    throw new Error('USE_PRICE_PARSE_FAILED')
  }

  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length
  const variance = prices.reduce((sum, price) => sum + (price - mean) ** 2, 0) / prices.length
  const volatility = Math.sqrt(variance) / mean

  const min = Math.max(0.03, Math.min(0.25, 0.1 - volatility * 0.3))
  const max = Math.max(min + 0.01, Math.min(0.4, 0.16 + volatility * 1.2))

  return { min, max }
}

async function refreshEquityReturns(): Promise<number> {
  const markdown = await scrapeMarkdown(USE_MARKET_URL)
  if (!markdown.trim()) {
    throw new Error('USE_SCRAPE_FAILED')
  }

  const prices = extractUsePrices(markdown)
  const range = deriveReturnRangeFromPrices(prices)
  const supabase = createAdminClient()

  const { data: equities, error: fetchError } = await supabase
    .from('wm_investment_products')
    .select('id')
    .eq('category', 'equity')

  if (fetchError) {
    throw new Error('USE_EQUITY_QUERY_FAILED')
  }

  const rows = equities ?? []
  if (rows.length === 0) {
    return 0
  }

  for (const row of rows) {
    const { error: updateError } = await supabase
      .from('wm_investment_products')
      .update({
        return_min: range.min,
        return_max: range.max,
        return_display: `${Math.round(range.min * 100)}-${Math.round(range.max * 100)}%`,
        last_updated: new Date().toISOString()
      })
      .eq('id', row.id)

    if (updateError) {
      throw new Error(`USE_EQUITY_UPDATE_FAILED:${row.id}`)
    }
  }

  return rows.length
}

/**
 * Daily cron endpoint for refreshing macro and bond data.
 * @param request Incoming HTTP request.
 * @returns Typed API result for cron execution.
 */
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'CRON_SECRET is not configured.', code: 'CONFIGURATION_ERROR' },
      { status: 500 }
    )
  }

  const auth = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (auth !== expected) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Unauthorized cron request.', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  try {
    const updated: string[] = []
    const errors: string[] = []

    const steps = [
      async () => {
        const forex = await fetchUGXRate()
        await upsertMacroIndicator({
          key: forex.key,
          label: forex.label,
          value: forex.value,
          period: forex.period,
          trend: forex.trend,
          staleAfterDays: forex.stale_after_days
        })
        updated.push('macro:ugx-usd')
      },
      async () => {
        const bonds = await fetchBoUBondData()
        await upsertMacroIndicator({
          key: bonds.key,
          label: bonds.label,
          value: bonds.value,
          period: bonds.period,
          trend: bonds.trend,
          staleAfterDays: bonds.stale_after_days
        })
        updated.push('macro:bou-bond-yield')
      },
      async () => {
        const equityCount = await refreshEquityReturns()
        updated.push(`equity_returns:${equityCount}`)
      }
    ]

    const settled = await Promise.allSettled(steps.map((step) => step()))
    settled.forEach((result, index) => {
      if (result.status === 'rejected') {
        errors.push(`step-${index + 1}:${result.reason instanceof Error ? result.reason.message : 'UNKNOWN_ERROR'}`)
      }
    })

    console.log(JSON.stringify({ timestamp: new Date().toISOString(), updated, errors }))

    return NextResponse.json({
      success: true,
      summary: { updated, errors }
    })
  } catch (error: unknown) {
    const mapped = mapRefreshError(error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: mapped.message, code: mapped.code },
      { status: mapped.status }
    )
  }
}
