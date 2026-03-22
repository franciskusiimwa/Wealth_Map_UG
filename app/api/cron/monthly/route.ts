import { NextResponse } from 'next/server'
import { fetchUgandaCPI } from '@/lib/data/cpi'
import { upsertMacroIndicator } from '@/lib/data/macro'
import { generateCompanyIntelligence } from '@/lib/claude/intelligence'
import { createAdminClient } from '@/lib/supabase/admin'
import { mapRefreshError } from '@/lib/utils/errorMapping'
import type { ApiResponse } from '@/types/api'
import type { InvestmentProduct } from '@/types'

const PRODUCT_SELECT =
  'id, name, category, return_min, return_max, return_display, min_investment_ugx, risk_level, horizon_min_years, horizon_max_years, description, projection_note, last_updated, stale_after_days, source_url, expert_note, is_featured, is_active'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * Monthly cron endpoint for CPI and intelligence refresh orchestration.
 * @param request Incoming HTTP request.
 * @returns Summary of monthly refresh operations.
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

  const updated: string[] = []
  const errors: string[] = []
  const skipped: string[] = []

  try {
    const supabase = createAdminClient()
    const nowIso = new Date().toISOString()

    try {
      const cpi = await fetchUgandaCPI()
      await upsertMacroIndicator({
        key: cpi.key,
        label: cpi.label,
        value: cpi.value,
        period: cpi.period,
        trend: cpi.trend,
        staleAfterDays: cpi.stale_after_days
      })
      updated.push('macro:ug-cpi')
    } catch (error: unknown) {
      errors.push(`macro:ug-cpi:${error instanceof Error ? error.message : 'CPI_SCRAPE_FAILED'}`)
    }

    const { data: activeProducts, error: productError } = await supabase
      .from('wm_investment_products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)

    if (productError) {
      throw new Error('ACTIVE_PRODUCTS_QUERY_FAILED')
    }

    const products = (activeProducts ?? []) as InvestmentProduct[]

    for (const product of products) {
      const { data: latestRecord, error: latestError } = await supabase
        .from('wm_company_intelligence')
        .select('id, next_refresh')
        .eq('product_id', product.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (latestError) {
        errors.push(`intelligence:${product.id}:NEXT_REFRESH_QUERY_FAILED`)
        continue
      }

      const isDue = !latestRecord || !latestRecord.next_refresh || latestRecord.next_refresh <= nowIso
      if (!isDue) {
        skipped.push(`intelligence:${product.id}:NOT_DUE`)
        continue
      }

      try {
        const generated = await generateCompanyIntelligence(product)
        const payload = {
          product_id: generated.product_id,
          company_name: generated.company_name,
          verdict: generated.verdict,
          verdict_label: generated.verdict_label,
          score_financial: generated.score_financial,
          score_leadership: generated.score_leadership,
          score_culture: generated.score_culture,
          score_market: generated.score_market,
          overall_confidence: generated.overall_confidence,
          claude_read: generated.claude_read,
          signals: generated.signals,
          sources: generated.sources,
          generated_at: nowIso,
          next_refresh: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }

        if (latestRecord?.id) {
          const { error: updateError } = await supabase
            .from('wm_company_intelligence')
            .update(payload)
            .eq('id', latestRecord.id)

          if (updateError) {
            throw new Error('INTELLIGENCE_UPDATE_FAILED')
          }

          updated.push(`intelligence:${product.id}:updated`)
        } else {
          const { error: insertError } = await supabase.from('wm_company_intelligence').insert(payload)

          if (insertError) {
            throw new Error('INTELLIGENCE_INSERT_FAILED')
          }

          updated.push(`intelligence:${product.id}:created`)
        }
      } catch (error: unknown) {
        errors.push(`intelligence:${product.id}:${error instanceof Error ? error.message : 'INTELLIGENCE_FAILED'}`)
      }

      await sleep(2000)
    }

    return NextResponse.json({
      success: true,
      summary: { updated, errors, skipped }
    })
  } catch (error: unknown) {
    const mapped = mapRefreshError(error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: mapped.message, code: mapped.code },
      { status: mapped.status }
    )
  }
}
