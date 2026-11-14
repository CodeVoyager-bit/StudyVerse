'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { GoogleLogoIcon } from '@phosphor-icons/react/dist/ssr'
import { supabase } from '@/utils/supabase/client'
import { authMessage } from '@/lib/auth-errors'

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

type GoogleIdentity = {
  initialize: (options: { client_id: string; nonce: string; ux_mode: 'popup'; callback: (r: { credential: string }) => void }) => void
  renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void
}
declare global {
  interface Window { google?: { accounts: { id: GoogleIdentity } } }
}

const nextPath = (fallback: string) => new URLSearchParams(window.location.search).get('next') || fallback

// Google signs its ID token with the hash of this nonce and Supabase checks the raw value,
// so a token lifted from somewhere else can't be replayed into this app.
async function makeNonce() {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  const hashed = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
  return { raw, hashed }
}

/**
 * Google's own sign-in button. It runs on our page, so Google names this site in its dialog
 * instead of the Supabase project address; the ID token is then handed to Supabase.
 * Without NEXT_PUBLIC_GOOGLE_CLIENT_ID it falls back to the redirect flow below.
 */
export default function GoogleButton({ next = '/dashboard' }: { next?: string }) {
  return CLIENT_ID ? <GoogleIdentityButton clientId={CLIENT_ID} next={next} /> : <RedirectGoogleButton next={next} />
}

function GoogleIdentityButton({ clientId, next }: { clientId: string; next: string }) {
  const slot = useRef<HTMLDivElement>(null)
  const [scriptReady, setScriptReady] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const google = window.google
    if (!scriptReady || !google || !slot.current) return
    let cancelled = false
    makeNonce().then(({ raw, hashed }) => {
      if (cancelled || !slot.current) return
      google.accounts.id.initialize({
        client_id: clientId,
        nonce: hashed,
        ux_mode: 'popup',
        callback: async ({ credential }) => {
          setPending(true)
          setError('')
          const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: credential, nonce: raw })
          if (error) {
            setPending(false)
            return setError(authMessage(error, 'Try email and password instead.'))
          }
          router.replace(nextPath(next))
          router.refresh()
        },
      })
      google.accounts.id.renderButton(slot.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        logo_alignment: 'center',
        width: Math.max(200, Math.min(400, slot.current.offsetWidth)),
      })
    })
    return () => { cancelled = true }
  }, [scriptReady, clientId, next, router])

  return (
    <div>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      {/* Placeholder with the button's size until Google draws its own, so nothing jumps. */}
      <div ref={slot} className="min-h-11 w-full grid place-items-center" aria-busy={!scriptReady}>
        <span className="btn w-full pointer-events-none opacity-70" aria-hidden="true">
          <GoogleLogoIcon size={18} weight="bold" />Continue with Google
        </span>
      </div>
      {pending && <p className="text-sm font-bold text-center mt-3" role="status">Signing you in…</p>}
      {error && <p className="alert-error mt-3" role="alert">{error}</p>}
    </div>
  )
}

// Supabase publishes which sign-in providers are switched on. Checking first means a disabled Google
// provider shows a clear message here instead of a raw JSON error page from Supabase.
async function googleEnabled() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
  })
  const settings = await res.json()
  return settings?.external?.google === true
}

function RedirectGoogleButton({ next }: { next: string }) {
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
