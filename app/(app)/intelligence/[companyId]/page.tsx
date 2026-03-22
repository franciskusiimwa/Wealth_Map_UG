import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { IntelligenceCard } from '@/components/intelligence/IntelligenceCard'
import { createClient } from '@/lib/supabase/server'
import type { CompanyIntelligence, InvestmentProduct } from '@/types'
import type { ApiResponse } from '@/types/api'

const INTELLIGENCE_SELECT =
  'id, product_id, company_name, verdict, verdict_label, score_financial, score_leadership, score_culture, score_market, overall_confidence, claude_read, signals, sources, generated_at, next_refresh'

function getBaseUrl(): string {
  const headersList = headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000'
  const proto = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

/**
 * Company intelligence brief page.
 * @returns Intelligence summary and scoring.
 */
export default async function IntelligencePage({ params }: { params: { companyId: string } }) {
  const supabase = createClient()
  const productId = params.companyId

  const { data: product, error: productError } = await supabase
    .from('wm_investment_products')
    .select(
      'id, name, category, return_min, return_max, return_display, min_investment_ugx, risk_level, horizon_min_years, horizon_max_years, description, projection_note, last_updated, stale_after_days, source_url, expert_note, is_featured, is_active'
    )
    .eq('id', productId)
    .maybeSingle()

  if (productError || !product) {
    notFound()
  }

  let { data: intelligence } = await supabase
      .from('wm_company_intelligence')
      .select(INTELLIGENCE_SELECT)
      .eq('product_id', productId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

  if (!intelligence) {
    const response = await fetch(`${getBaseUrl()}/api/intelligence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
      cache: 'no-store'
    })

    if (response.ok) {
      const json = (await response.json()) as ApiResponse<CompanyIntelligence>
      if (json.success) {
        intelligence = json.data
      }
    }
  }

  if (!intelligence) {
    notFound()
  }

  return <IntelligenceCard intelligence={intelligence as CompanyIntelligence} product={product as InvestmentProduct} />
}
