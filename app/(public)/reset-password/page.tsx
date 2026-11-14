'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/utils/supabase/client'
import AuthCard from '@/app/components/AuthCard'
import PasswordInput from '@/app/components/PasswordInput'
import { authMessage } from '@/lib/auth-errors'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (confirm !== password) return setError('Passwords don’t match. Type the same password in both boxes.')
    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (error) return setError(authMessage(error, 'Open the reset link from your email first.'))
    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <AuthCard title="Choose a new password">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="alert-error" role="alert">{error}</p>}
        <div>
          <label htmlFor="password" className="label">New password</label>
          <PasswordInput id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={6} />
        </div>
        <div>
          <label htmlFor="confirm-password" className="label">Confirm new password</label>
          <PasswordInput id="confirm-password" name="confirm-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" minLength={6} invalid={confirm.length > 0 && confirm !== password} />
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>{submitting ? 'Saving…' : 'Save password'}</button>
      </form>
      <p className="text-center text-sm mt-5"><Link href="/login" className="muted-link">Back to log in</Link></p>
    </AuthCard>
  )
}
