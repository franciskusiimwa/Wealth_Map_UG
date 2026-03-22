import { NextResponse } from 'next/server'
import { fetchUgandaCPI } from '@/lib/data/cpi'
import { upsertMacroIndicator } from '@/lib/data/macro'
import { mapRefreshError } from '@/lib/utils/errorMapping'
import type { ApiResponse } from '@/types/api'

/**
 * GET API route for CPI data refresh/fetch.
 * @returns Typed API response containing CPI data.
 */
export async function GET() {
  try {
    const data = await fetchUgandaCPI()
    await upsertMacroIndicator({
      key: data.key,
      label: data.label,
      value: data.value,
      period: data.period,
      trend: data.trend,
      staleAfterDays: data.stale_after_days
    })

    return NextResponse.json<ApiResponse<typeof data>>({ success: true, data })
  } catch (error: unknown) {
    const mapped = mapRefreshError(error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: mapped.message, code: mapped.code },
      { status: mapped.status }
    )
  }
}
