'use client'

import { useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/utils/supabase/client'
import AuthCard, { OrDivider } from '@/app/components/AuthCard'
import GoogleButton from '@/app/components/GoogleButton'
import PasswordInput from '@/app/components/PasswordInput'
import { authMessage } from '@/lib/auth-errors'

// The confirmation email links back to whichever site you signed up on (localhost in dev, the live URL in prod),
// through /auth/callback, which signs you in. Supabase only honours it if it's in Auth > URL Configuration > Redirect URLs.
const confirmRedirect = () => `${window.location.origin}/auth/callback?next=/dashboard`

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [confirmTouched, setConfirmTouched] = useState(false)
  const confirmRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [resend, setResend] = useState<'idle' | 'sending' | 'sent' | string>('idle')
  const router = useRouter()

  const mismatch = confirm.length > 0 && confirm !== password
  const showMismatch = mismatch && confirmTouched

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (confirm !== password) {
      setConfirmTouched(true)
      confirmRef.current?.querySelector('input')?.focus()
      return
    }
    setSubmitting(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username }, emailRedirectTo: confirmRedirect() },
    })
    setSubmitting(false)
    if (error) return setError(authMessage(error, 'Fix that and try again.'))
    // Supabase answers "success" for an email that's already registered but returns no identities.
    if (data.user && data.user.identities?.length === 0) return setError('That email already has an account. Log in instead, or reset your password.')
    // With email confirmation switched off in Supabase you're signed in straight away.
    if (data.session) {
      router.replace('/dashboard')
      router.refresh()
      return
    }
    setDone(true)
  }

  const sendAgain = async () => {
    setResend('sending')
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: confirmRedirect() } })
    setResend(error ? `${error.message}. Wait a minute and try again.` : 'sent')
  }

  if (done) {
    return (
      <AuthCard title="Check your inbox">
        <div className="flex flex-col items-center text-center gap-4">
          <span className="sticker size-16 text-3xl bg-yellow -rotate-6 wiggle" aria-hidden="true">💌</span>
          <p className="font-medium text-muted">
            We sent a confirmation link to <strong className="text-ink font-extrabold break-all">{email}</strong>. Open it on this device and it’ll sign you straight in.
          </p>
          <p className="text-sm text-faint font-medium">It comes from Supabase Auth, so check spam too.</p>
          <button type="button" className="btn w-full" onClick={sendAgain} disabled={resend === 'sending' || resend === 'sent'}>
            {resend === 'sending' ? 'Sending…' : resend === 'sent' ? 'Sent again' : 'Send it again'}
          </button>
          {resend !== 'idle' && resend !== 'sending' && resend !== 'sent' && <p className="alert-error w-full" role="alert">{resend}</p>}
          <p className="sr-only" role="status" aria-live="polite">{resend === 'sent' ? 'Confirmation email sent again.' : ''}</p>
          <Link href="/login" className="muted-link text-sm">Already confirmed? Log in</Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Create your account" sub="Free, and it takes under a minute.">
      <GoogleButton />
      <OrDivider />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="alert-error" role="alert">{error}</p>}
        <div>
          <label htmlFor="username" className="label">Username</label>
          <input type="text" id="username" name="nickname" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="nickname" spellCheck={false} placeholder="krish…" required />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input type="email" id="email" name="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" spellCheck={false} placeholder="you@college.edu…" required />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <PasswordInput id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={6} describedBy="pw-hint" />
          <p id="pw-hint" className="text-xs text-faint font-medium mt-1.5">At least 6 characters.</p>
        </div>
        <div ref={confirmRef}>
          <label htmlFor="confirm-password" className="label">Confirm password</label>
          <PasswordInput
            id="confirm-password"
            name="confirm-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => setConfirmTouched(true)}
            autoComplete="new-password"
            minLength={6}
            describedBy="confirm-hint"
            invalid={showMismatch}
          />
          <p id="confirm-hint" className={`text-xs font-bold mt-1.5 ${showMismatch ? 'text-danger' : confirm && !mismatch ? 'text-success' : 'text-faint font-medium'}`} aria-live="polite">
            {showMismatch ? 'Passwords don’t match yet.' : confirm && !mismatch ? 'Passwords match.' : 'Type it once more.'}
          </p>
        </div>
        <button type="submit" className="btn btn-primary w-full mt-1" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="text-center text-muted text-sm font-medium mt-5">Already have an account? <Link href="/login" className="muted-link">Log in</Link></p>
    </AuthCard>
  )
}
