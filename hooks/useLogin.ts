'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AuthStatus = 'idle' | 'loading' | 'success' | 'error'

/**
 * Manages login form state and submit lifecycle.
 * @returns Login form values, state setters, and submit handler.
 */
export function useLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<AuthStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  /**
   * Submits login credentials to Supabase auth.
   * @param event Form submit event.
   * @returns Promise resolving after auth attempt.
   */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setStatus('error')
      setErrorMessage(error.message || "We couldn't sign you in. Check your email and password and try again.")
      return
    }

    setStatus('success')
    router.push('/invest')
  }

  return { email, password, setEmail, setPassword, handleSubmit, status, errorMessage }
}
