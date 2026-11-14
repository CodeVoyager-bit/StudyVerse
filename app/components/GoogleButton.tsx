'use client'

import { useState } from 'react'
import { GoogleLogoIcon } from '@phosphor-icons/react/dist/ssr'
import { supabase } from '@/utils/supabase/client'
import { authMessage } from '@/lib/auth-errors'

// Supabase publishes which sign-in providers are switched on. Checking first means a disabled Google
// provider shows a clear message here instead of a raw JSON error page from Supabase.
async function googleEnabled() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
  })
  const settings = await res.json()
  return settings?.external?.google === true
}

export default function GoogleButton({ next = '/dashboard' }: { next?: string }) {
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const signIn = async () => {
    setError('')
    setPending(true)
    try {
      if (!(await googleEnabled())) {
        setPending(false)
        return setError('Google sign-in isn’t switched on for StudyVerse yet. Use email and password for now.')
      }
    } catch {
      setPending(false)
      return setError(authMessage({ message: 'Failed to fetch' }))
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    if (error) {
      setError(authMessage(error, 'Try email and password instead.'))
      setPending(false)
    }
  }

  return (
    <div>
      <button type="button" className="btn w-full" onClick={signIn} disabled={pending}>
        <GoogleLogoIcon size={18} weight="bold" aria-hidden="true" />
        {pending ? 'Opening Google…' : 'Continue with Google'}
      </button>
      {error && <p className="alert-error mt-3" role="alert">{error}</p>}
    </div>
  )
}
