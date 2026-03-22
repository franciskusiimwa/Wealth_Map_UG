import { NextResponse } from 'next/server'
import { generateCompanyIntelligence } from '@/lib/claude/intelligence'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ApiResponse } from '@/types/api'
import type { CompanyIntelligence, InvestmentProduct } from '@/types'

interface IntelligenceRequestBody {
  productId?: string
}

const INTELLIGENCE_SELECT =
  'id, product_id, company_name, verdict, verdict_label, score_financial, score_leadership, score_culture, score_market, overall_confidence, claude_read, signals, sources, generated_at, next_refresh'

function toRecentThresholdIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

/**
 * POST API route for company intelligence brief generation.
 * @param request Incoming JSON request.
 * @returns Typed API response with intelligence brief.
 */
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const payload = (await request.json()) as IntelligenceRequestBody

    if (!payload.productId?.trim()) {
      return NextResponse.json<ApiResponse<CompanyIntelligence>>(
        { success: false, error: 'Missing required field: productId.', code: 'BAD_REQUEST' },
        { status: 400 }
      )
    }

    const { data: product, error: productError } = await supabase
      .from('wm_investment_products')
      .select(
        'id, name, category, return_min, return_max, return_display, min_investment_ugx, risk_level, horizon_min_years, horizon_max_years, description, projection_note, last_updated, stale_after_days, source_url, expert_note, is_featured, is_active'
      )
      .eq('id', payload.productId)
      .maybeSingle()

    if (productError || !product) {
      return NextResponse.json<ApiResponse<CompanyIntelligence>>(
        { success: false, error: 'Investment product not found.', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      )
    }

    const recentThreshold = toRecentThresholdIso(30)
    const { data: recentBrief } = await supabase
      .from('wm_company_intelligence')
      .select(INTELLIGENCE_SELECT)
      .eq('product_id', payload.productId)
      .gte('generated_at', recentThreshold)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (recentBrief) {
      return NextResponse.json<ApiResponse<CompanyIntelligence>>({
        success: true,
        data: recentBrief as CompanyIntelligence
      })
    }

    const generated = await generateCompanyIntelligence(product as InvestmentProduct)

    const nextRefresh = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()

    const nowIso = new Date().toISOString()
    const payloadForDb = {
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
      next_refresh: nextRefresh,
      generated_at: nowIso
    }

    const { data: existingByProduct } = await supabase
      .from('wm_company_intelligence')
      .select('id')
      .eq('product_id', payload.productId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let persisted: CompanyIntelligence | null = null

    if (existingByProduct?.id) {
      const { data: updated, error: updateError } = await supabase
        .from('wm_company_intelligence')
        .update(payloadForDb)
        .eq('id', existingByProduct.id)
        .select(INTELLIGENCE_SELECT)
        .single()

      if (updateError || !updated) {
        throw new Error('Intelligence update failed')
      }

      persisted = updated as CompanyIntelligence
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('wm_company_intelligence')
        .insert(payloadForDb)
        .select(INTELLIGENCE_SELECT)
        .single()

      if (insertError || !inserted) {
        throw new Error('Intelligence insert failed')
      }

      persisted = inserted as CompanyIntelligence
    }

    return NextResponse.json<ApiResponse<CompanyIntelligence>>({ success: true, data: persisted })
  } catch (_error: unknown) {
    return NextResponse.json<ApiResponse<CompanyIntelligence>>(
      {
        success: false,
        error: 'Could not generate company intelligence at the moment.',
        code: 'INTELLIGENCE_GENERATION_FAILED'
      },
      { status: 500 }
    )
  }
}
