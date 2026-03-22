import type { AllocationItem, ProjectionResult } from '@/types'

/**
 * Returns Wealthmap UG's default 4-bucket allocation model.
 * @returns Array of AllocationItem percentages summing to 100.
 */
export function getDefaultAllocation(): AllocationItem[] {
  return [
    {
      name: 'Uganda Treasury Bonds',
      percentage: 40,
      description: 'Stability base with relatively predictable income.',
      color: '#0F6E56'
    },
    {
      name: 'Unit Trusts',
      percentage: 25,
      description: 'Diversified growth managed by professional fund managers.',
      color: '#BA7517'
    },
    {
      name: 'Insurance Savings',
      percentage: 20,
      description: 'Disciplined long-term savings with added protection features.',
      color: '#085041'
    },
    {
      name: 'USE Equities',
      percentage: 15,
      description: 'Higher-growth exposure to listed East African companies.',
      color: '#633806'
    }
  ]
}

/**
 * Calculates wealth projection using monthly contributions and annual compounding.
 * @param totalTargetUgx Wealth goal target amount in UGX.
 * @param timeframeYears Investment timeline in years.
 * @param passiveIncomePct Desired passive-income share as a percentage.
 * @param monthlyContributionUgx Planned monthly contribution amount in UGX.
 * @param blendedReturnRate Blended annual return rate as decimal (for example, 0.13 for 13%).
 * @returns ProjectionResult with rounded whole-number outputs.
 */
export function calculateProjection(
  totalTargetUgx: number,
  timeframeYears: number,
  passiveIncomePct: number,
  monthlyContributionUgx: number,
  blendedReturnRate: number
): ProjectionResult {
  const allocation = getDefaultAllocation()
  const safeTarget = Math.max(0, Math.round(totalTargetUgx))
  const safeYears = Math.max(1, Math.round(timeframeYears))
  const safePassivePct = Math.min(100, Math.max(0, Math.round(passiveIncomePct)))
  const safeMonthlyContribution = Math.max(0, Math.round(monthlyContributionUgx))
  const safeRate = Math.max(-0.99, blendedReturnRate)

  const months = safeYears * 12
  const monthlyRate = safeRate / 12

  let projectedTotalRaw = 0

  if (Math.abs(monthlyRate) < 0.0000001) {
    projectedTotalRaw = safeMonthlyContribution * months
  } else {
    projectedTotalRaw =
      safeMonthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
  }

  const projectedTotal = Math.round(projectedTotalRaw)
  const passiveProjected = Math.round(projectedTotal * (safePassivePct / 100))
  const annualContributionNeeded = Math.round((safeTarget - projectedTotal) / safeYears)
  const monthlyContributionNeeded = Math.round(annualContributionNeeded / 12)
  const gap = Math.round(Math.max(0, safeTarget - projectedTotal))
  const pctOfGoal = safeTarget === 0 ? 100 : Math.round((projectedTotal / safeTarget) * 100)

  return {
    projected_total: projectedTotal,
    passive_projected: passiveProjected,
    annual_contribution_needed: Math.max(0, annualContributionNeeded),
    monthly_contribution_needed: Math.max(0, monthlyContributionNeeded),
    gap,
    on_track: projectedTotal >= safeTarget,
    pct_of_goal: Math.max(0, pctOfGoal),
    allocation
  }
}
