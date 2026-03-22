import { createClient } from '@/lib/supabase/server'
import { OptionsClient } from '@/components/invest/OptionsClient'
import type { InvestmentProduct, UserGoal } from '@/types'

/**
 * Investment options listing page.
 * @returns Server-fetched product options and saved goal context.
 */
export default async function InvestmentOptionsPage() {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  const { data: productsData } = await supabase
    .from('wm_investment_products')
    .select(
      'id, name, category, return_min, return_max, return_display, min_investment_ugx, risk_level, horizon_min_years, horizon_max_years, description, projection_note, last_updated, stale_after_days, source_url, expert_note, is_featured, is_active'
    )
    .eq('is_active', true)
    .order('is_featured', { ascending: false, nullsFirst: false })
    .order('risk_level', { ascending: true })

  let goal: UserGoal | null = null

  if (user) {
    const { data: goalData } = await supabase
      .from('wm_user_goals')
      .select('id, user_id, total_target_ugx, timeframe_years, passive_income_pct')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    goal = goalData as UserGoal | null
  }

  const products = (productsData ?? []) as InvestmentProduct[]

  return (
    <section className="pt-6">
      <OptionsClient products={products} goal={goal} />
    </section>
  )
}

