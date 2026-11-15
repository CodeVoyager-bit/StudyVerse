'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/utils/supabase/client'
import AuthCard, { OrDivider } from '@/app/components/AuthCard'
import GoogleButton from '@/app/components/GoogleButton'
import PasswordInput from '@/app/components/PasswordInput'
import { authMessage } from '@/lib/auth-errors'

// Where to go after login: `?next=/task` (set by proxy.ts) or Today.
// Only same-site paths, so a crafted link can't bounce someone to another website after they log in.
const nextPath = () => {
  const next = new URLSearchParams(window.location.search).get('next') ?? ''
  return next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/dashboard'
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) return router.replace(nextPath())
      if (new URLSearchParams(window.location.search).get('error') === 'link') setError('That link couldn’t sign you in. If you just confirmed your email, log in below. Otherwise ask for a new link.')
    })
  }, [router])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (error) return setError(authMessage(error, 'Check your details and try again.'))
    router.replace(nextPath())
    router.refresh()
  }

  return (
    <AuthCard title="Welcome back" sub="Log in to pick up where you left off.">
      <GoogleButton />
      <OrDivider />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="alert-error" role="alert">{error}</p>}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input type="email" id="email" name="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" spellCheck={false} placeholder="you@college.edu…" required />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="label">Password</label>
            <Link href="/forgot-password" className="muted-link text-xs">Forgot password?</Link>
          </div>
          <PasswordInput id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        <button type="submit" className="btn btn-primary w-full mt-1" disabled={submitting}>{submitting ? 'Logging in…' : 'Log in'}</button>
      </form>
      <p className="text-center text-muted text-sm mt-5">New here? <Link href="/register" className="muted-link">Create an account</Link></p>
    </AuthCard>
  )
}
