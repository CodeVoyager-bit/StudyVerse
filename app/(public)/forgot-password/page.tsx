'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { supabase } from '@/utils/supabase/client'
import AuthCard from '@/app/components/AuthCard'
import { authMessage } from '@/lib/auth-errors'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/reset-password` })
    setSubmitting(false)
    if (error) setError(authMessage(error, 'Try again in a minute.'))
    else setSent(true)
  }

  return (
    <AuthCard title="Reset your password" sub={sent ? undefined : 'We’ll email you a link to choose a new one.'}>
      {sent ? (
        <p className="text-muted text-center">If an account exists for <strong className="text-ink font-semibold">{email}</strong>, the reset link is on its way. Open it on this device.</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="alert-error" role="alert">{error}</p>}
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input type="email" id="email" name="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" spellCheck={false} placeholder="you@college.edu…" required />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={submitting}>{submitting ? 'Sending…' : 'Send reset link'}</button>
        </form>
      )}
      <p className="text-center text-sm mt-5"><Link href="/login" className="muted-link">Back to log in</Link></p>
    </AuthCard>
  )
}
