'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

const MIN_TARGET_UGX = 50_000_000
const MAX_TARGET_UGX = 2_500_000_000

interface SaveGoalResult {
  success: boolean
  error?: string
}

/**
 * Manages goal-setting state, derived targets, and persistence for investment onboarding.
 * @returns Goal state, derived values, mapping helpers, and save function.
 */
export function useGoal() {
  const [status, setStatus] = useState<AsyncStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [totalTargetUgx, setTotalTargetUgx] = useState<number>(1_000_000_000)
  const [timeframeYears, setTimeframeYears] = useState<number>(10)
  const [passiveIncomePct, setPassiveIncomePct] = useState<number>(30)
  const [monthlyContributionUgx, setMonthlyContributionUgx] = useState<number>(3_000_000)

  const passiveTargetUgx = useMemo(
    () => Math.round(totalTargetUgx * (passiveIncomePct / 100)),
    [passiveIncomePct, totalTargetUgx]
  )

  const activeTargetUgx = useMemo(
    () => Math.max(0, Math.round(totalTargetUgx - passiveTargetUgx)),
    [passiveTargetUgx, totalTargetUgx]
  )

  const annualTargetUgx = useMemo(
    () => Math.max(0, Math.round(totalTargetUgx / Math.max(1, timeframeYears))),
    [timeframeYears, totalTargetUgx]
  )

  /**
   * Maps slider values from 1-100 to logarithmic goal amounts.
   * @param value Slider value between 1 and 100.
   * @returns Goal amount in UGX between 50,000,000 and 2,500,000,000.
   */
  function getAmountFromSliderValue(value: number): number {
    const safeValue = Math.min(100, Math.max(1, Math.round(value)))
    const progress = (safeValue - 1) / 99
    const amount = MIN_TARGET_UGX * Math.pow(MAX_TARGET_UGX / MIN_TARGET_UGX, progress)
    return Math.round(amount)
  }

  /**
   * Maps a goal amount back to the slider's 1-100 scale.
   * @param amount Goal amount in UGX.
   * @returns Slider value between 1 and 100.
   */
  function getSliderValueFromAmount(amount: number): number {
    const safeAmount = Math.min(MAX_TARGET_UGX, Math.max(MIN_TARGET_UGX, Math.round(amount)))
    const progress = Math.log(safeAmount / MIN_TARGET_UGX) / Math.log(MAX_TARGET_UGX / MIN_TARGET_UGX)
    return Math.round(progress * 99 + 1)
  }

  /**
   * Persists the user's goal by upserting into wm_user_goals.
   * @returns Result indicating whether save completed successfully.
   */
  async function saveGoal(): Promise<SaveGoalResult> {
    setStatus('loading')
    setErrorMessage('')

    try {
      const supabase = createClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        setStatus('error')
        setErrorMessage('Please sign in to save your goal.')
        return { success: false, error: 'UNAUTHORIZED' }
      }

      const payload = {
        user_id: user.id,
        total_target_ugx: Math.round(totalTargetUgx),
        timeframe_years: Math.round(timeframeYears),
        passive_income_pct: Math.round(passiveIncomePct),
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase.from('wm_user_goals').upsert(payload, { onConflict: 'user_id' })

      if (error) {
        setStatus('error')
        setErrorMessage('We could not save your goal right now. Please try again.')
        return { success: false, error: error.message }
      }

      setStatus('success')
      return { success: true }
    } catch (_error: unknown) {
      setStatus('error')
      setErrorMessage('We could not save your goal right now. Please try again.')
      return { success: false, error: 'SAVE_FAILED' }
    }
  }

  return {
    totalTargetUgx,
    timeframeYears,
    passiveIncomePct,
    monthlyContributionUgx,
    passiveTargetUgx,
    activeTargetUgx,
    annualTargetUgx,
    setTotalTargetUgx,
    setTimeframeYears,
    setPassiveIncomePct,
    setMonthlyContributionUgx,
    getAmountFromSliderValue,
    getSliderValueFromAmount,
    saveGoal,
    status,
    errorMessage
  }
}

