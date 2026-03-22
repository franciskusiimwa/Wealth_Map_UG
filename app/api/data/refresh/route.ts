import { NextResponse } from 'next/server'
import { fetchBoUBondData } from '@/lib/data/bonds'
import { fetchUGXRate } from '@/lib/data/forex'
import { fetchUgandaCPI } from '@/lib/data/cpi'
import { upsertMacroIndicator } from '@/lib/data/macro'
import { generateCompanyIntelligence } from '@/lib/claude/intelligence'
import { createAdminClient } from '@/lib/supabase/admin'
import { mapRefreshError } from '@/lib/utils/errorMapping'
import type { ApiResponse } from '@/types/api'
import type { InvestmentProduct } from '@/types'

interface RefreshRequestBody {
  type?: 'bonds' | 'forex' | 'cpi' | 'intelligence'
  productId?: string
}

const PRODUCT_SELECT =
  'id, name, category, return_min, return_max, return_display, min_investment_ugx, risk_level, horizon_min_years, horizon_max_years, description, projection_note, last_updated, stale_after_days, source_url, expert_note, is_featured, is_active'

/**
 * Manual secure refresh endpoint for targeted data and intelligence updates.
 * @param request Incoming HTTP request.
 * @returns Refresh summary.
 */
export async function POST(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'CRON_SECRET is not configured.', code: 'CONFIGURATION_ERROR' },
      { status: 500 }
    )
  }

  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Unauthorized refresh request.', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  const payload = (await request.json()) as RefreshRequestBody
  if (!payload.type) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Missing required field: type.', code: 'BAD_REQUEST' },
      { status: 400 }
    )
  }

  try {
    const supabase = createAdminClient()

    if (payload.type === 'bonds') {
      const bonds = await fetchBoUBondData()
      await upsertMacroIndicator({
        key: bonds.key,
        label: bonds.label,
        value: bonds.value,
        period: bonds.period,
        trend: bonds.trend,
        staleAfterDays: bonds.stale_after_days
      })

      return NextResponse.json<ApiResponse<{ refreshed: string }>>({
        success: true,
        data: { refreshed: 'bonds' }
      })
    }

    if (payload.type === 'forex') {
      const forex = await fetchUGXRate()
      await upsertMacroIndicator({
        key: forex.key,
        label: forex.label,
        value: forex.value,
        period: forex.period,
        trend: forex.trend,
        staleAfterDays: forex.stale_after_days
      })

      return NextResponse.json<ApiResponse<{ refreshed: string }>>({
        success: true,
        data: { refreshed: 'forex' }
      })
    }

    if (payload.type === 'cpi') {
      const cpi = await fetchUgandaCPI()
      await upsertMacroIndicator({
        key: cpi.key,
        label: cpi.label,
        value: cpi.value,
        period: cpi.period,
        trend: cpi.trend,
        staleAfterDays: cpi.stale_after_days
      })

      return NextResponse.json<ApiResponse<{ refreshed: string }>>({
        success: true,
        data: { refreshed: 'cpi' }
      })
    }

    if (payload.type === 'intelligence') {
      if (!payload.productId?.trim()) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'productId is required for intelligence refresh.', code: 'BAD_REQUEST' },
          { status: 400 }
        )
      }

      const { data: product, error: productError } = await supabase
        .from('wm_investment_products')
        .select(PRODUCT_SELECT)
        .eq('id', payload.productId)
        .maybeSingle()

      if (productError || !product) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Investment product not found.', code: 'PRODUCT_NOT_FOUND' },
          { status: 404 }
        )
      }

      const generated = await generateCompanyIntelligence(product as InvestmentProduct)
      const nowIso = new Date().toISOString()
      const nextRefresh = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      const intelligencePayload = {
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
        next_refresh: nextRefresh
      }

      const { data: existing } = await supabase
        .from('wm_company_intelligence')
        .select('id')
        .eq('product_id', payload.productId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from('wm_company_intelligence')
          .update(intelligencePayload)
          .eq('id', existing.id)

        if (updateError) {
          throw new Error('INTELLIGENCE_UPDATE_FAILED')
        }
      } else {
        const { error: insertError } = await supabase.from('wm_company_intelligence').insert(intelligencePayload)

        if (insertError) {
          throw new Error('INTELLIGENCE_INSERT_FAILED')
        }
      }

      return NextResponse.json<ApiResponse<{ refreshed: string; productId: string }>>({
        success: true,
        data: { refreshed: 'intelligence', productId: payload.productId }
      })
    }

    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Unsupported refresh type.', code: 'BAD_REQUEST' },
      { status: 400 }
    )
  } catch (error: unknown) {
    const mapped = mapRefreshError(error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: mapped.message, code: mapped.code },
      { status: mapped.status }
    )
  }
}
