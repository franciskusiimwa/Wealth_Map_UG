'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ApiResponse } from '@/types/api'
import type { BusinessCanvas } from '@/types'

interface CanvasCreateResponse {
  canvasId: string
  canvas: BusinessCanvas
}

type Step = 0 | 1 | 2 | 3
type IntakeStatus = 'idle' | 'loading' | 'success' | 'error'

interface IntakeFieldErrors {
  [key: string]: string
}

interface ValidateResult {
  valid: boolean
  fieldErrors: Record<string, string>
}

/**
 * Manages multi-step business intake state, validation, and submission.
 * @returns Intake state values and navigation/submit actions.
 */
export function useBusinessIntake() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>(0)
  const [name, setName] = useState('')
  const [background, setBackground] = useState('')
  const [capitalRange, setCapitalRange] = useState('')
  const [sector, setSector] = useState('')
  const [idea, setIdea] = useState('')
  const [concernKey, setConcernKey] = useState('')
  const [revenueRange, setRevenueRange] = useState('')
  const [extra, setExtra] = useState('')
  const [status, setStatus] = useState<IntakeStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<IntakeFieldErrors>({})

  /**
   * Validates a given step and returns field-level errors.
   * @param step Step index to validate.
   * @returns Validation result with errors keyed by field name.
   */
  function validateStep(step: number): ValidateResult {
    const errors: IntakeFieldErrors = {}

    if (step === 1) {
      if (!sector.trim()) {
        errors.sector = 'Pick a sector to continue'
      }
      if (idea.trim().length < 15) {
        errors.idea = 'Give us a bit more detail - even a rough idea works'
      }
    }

    if (step === 2 && !concernKey.trim()) {
      errors.concernKey = 'Tell us your biggest concern - it shapes the advice you get'
    }

    if (step === 3 && !revenueRange.trim()) {
      errors.revenueRange = 'Pick a revenue goal to finish'
    }

    return { valid: Object.keys(errors).length === 0, fieldErrors: errors }
  }

  /**
   * Moves to the next step after validating current step fields.
   */
  function goNext() {
    const validation = validateStep(currentStep)
    if (!validation.valid) {
      setFieldErrors(validation.fieldErrors)
      return
    }

    setFieldErrors({})
    setCurrentStep((previous) => Math.min(3, previous + 1) as Step)
  }

  /**
   * Moves one step back without running validation.
   */
  function goPrev() {
    setFieldErrors({})
    setCurrentStep((previous) => Math.max(0, previous - 1) as Step)
  }

  /**
   * Submits intake payload to canvas API and routes to result page.
   * @returns Promise that resolves after submit and navigation.
   */
  async function submit() {
    const validation = validateStep(3)
    if (!validation.valid) {
      setFieldErrors(validation.fieldErrors)
      return
    }

    setStatus('loading')
    setErrorMessage('')
    setFieldErrors({})

    try {
      const response = await fetch('/api/canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          background,
          capitalRange,
          sector,
          idea,
          concernKey,
          revenueRange,
          extra
        })
      })

      const result = (await response.json()) as ApiResponse<CanvasCreateResponse>
      if (!result.success) {
        throw new Error(result.error)
      }

      setStatus('success')
      router.push(`/business/canvas?canvasId=${encodeURIComponent(result.data.canvasId)}`)
    } catch (_error: unknown) {
      setStatus('error')
      setErrorMessage('We could not generate your canvas just now. Please try again.')
    }
  }

  return {
    currentStep,
    name,
    background,
    capitalRange,
    sector,
    idea,
    concernKey,
    revenueRange,
    extra,
    status,
    errorMessage,
    fieldErrors,
    setName,
    setBackground,
    setCapitalRange,
    setSector,
    setIdea,
    setConcernKey,
    setRevenueRange,
    setExtra,
    goNext,
    goPrev,
    submit,
    validateStep
  }
}
