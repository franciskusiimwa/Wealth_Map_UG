export type RiskLevel = 'low' | 'low_medium' | 'medium' | 'high'
export type ProductCategory = 'bond' | 'unit_trust' | 'insurance' | 'equity'
export type Verdict = 'strong' | 'moderate' | 'caution' | 'avoid'
export type Trend = 'rising' | 'stable' | 'falling'
export type FreshnessStatus = 'current' | 'stale' | 'very_stale'

export interface InvestmentProduct {
  id: string
  name: string
  category: ProductCategory
  return_min: number
  return_max: number
  return_display: string
  min_investment_ugx: number
  risk_level: RiskLevel
  horizon_min_years?: number
  horizon_max_years?: number
  description: string
  projection_note?: string
  last_updated: string
  stale_after_days: number
  source_url?: string
  expert_note?: string
  is_featured: boolean
  is_active: boolean
  freshness?: FreshnessStatus
}

export interface MacroIndicator {
  key: string
  label: string
  value: number
  period: string
  trend: Trend
  last_updated: string
  stale_after_days: number
  freshness?: FreshnessStatus
}

export interface IntelligenceSignal {
  type: 'positive' | 'negative' | 'neutral'
  text: string
  source: string
  confidence: 'high' | 'medium' | 'low'
}

export interface CompanyIntelligence {
  id: string
  product_id: string
  company_name: string
  verdict: Verdict
  verdict_label: string
  score_financial: number
  score_leadership: number
  score_culture: number
  score_market: number
  overall_confidence: number
  claude_read: string
  signals: IntelligenceSignal[]
  sources: string[]
  generated_at: string
  next_refresh: string
}

export interface UserGoal {
  id: string
  user_id: string
  total_target_ugx: number
  timeframe_years: number
  passive_income_pct: number
}

export interface BusinessCanvas {
  value_proposition: string
  target_customers: string
  revenue_streams: string[]
  key_activities: string[]
  key_resources: string[]
  cost_structure: string[]
  ugandan_context: string
  quick_wins: string[]
  key_risks: string[]
  first_30_days: string[]
}

export interface ProjectionResult {
  projected_total: number
  passive_projected: number
  annual_contribution_needed: number
  monthly_contribution_needed: number
  gap: number
  on_track: boolean
  pct_of_goal: number
  allocation: AllocationItem[]
}

export interface AllocationItem {
  name: string
  percentage: number
  description: string
  color: string
}
