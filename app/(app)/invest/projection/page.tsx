import { createClient } from '@/lib/supabase/server'
import { ProjectionClient } from '@/components/invest/ProjectionClient'
import type { UserGoal } from '@/types'

/**
 * Projection page for outcomes and allocation guidance.
 * @returns Projection flow with server-fetched goal context.
 */
export default async function ProjectionPage() {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  let goal: UserGoal | null = null

  if (user) {
    const { data } = await supabase
      .from('wm_user_goals')
      .select('id, user_id, total_target_ugx, timeframe_years, passive_income_pct')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    goal = (data as UserGoal | null) ?? null
  }

  return <ProjectionClient goal={goal} />
}

