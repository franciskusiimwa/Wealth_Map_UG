import { NextResponse } from 'next/server'
import { fetchUGXRate } from '@/lib/data/forex'
import { upsertMacroIndicator } from '@/lib/data/macro'
import type { ApiResponse } from '@/types/api'

/**
 * GET API route for forex data refresh/fetch.
 * @returns Typed API response containing forex data.
 */
export async function GET() {
  try {
    const data = await fetchUGXRate()
    await upsertMacroIndicator({
      key: data.key,
      label: data.label,
      value: data.value,
      period: data.period,
      trend: data.trend,
      staleAfterDays: data.stale_after_days
    })

    return NextResponse.json<ApiResponse<typeof data>>({ success: true, data })
  } catch (_error: unknown) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Could not fetch forex data.', code: 'FOREX_FETCH_FAILED' },
      { status: 500 }
    )
  }
}
