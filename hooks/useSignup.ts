'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type AuthStatus = 'idle' | 'loading' | 'success' | 'error'

/**
 * Manages signup form state and submit lifecycle.
 * @returns Signup form values, state setters, and submit handler.
 */
export function useSignup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<AuthStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  /**
   * Submits signup data to Supabase auth after client-side validation.
   * @param event Form submit event.
   * @returns Promise resolving after signup attempt.
   */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    setStatus('loading')
    setErrorMessage('')

    if (password.length < 8) {
      setStatus('error')
      setErrorMessage('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setStatus('error')
      setErrorMessage('Passwords do not match. Please check and try again.')
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setStatus('error')
      setErrorMessage('We could not create your account right now. Please try again.')
      return
    }

    setStatus('success')
    setErrorMessage('')
  }

  return {
    email,
    password,
    setEmail,
    setPassword,
    handleSubmit,
    status,
    errorMessage,
    confirmPassword,
    setConfirmPassword,
    submitted
  }
}
