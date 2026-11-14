'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import Logo from './Logo'

export default function TopNav() {
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSignedIn(!!session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session))
    return () => subscription.unsubscribe()
  }, [])

  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <div className="max-w-[1140px] mx-auto h-16 px-4 flex items-center justify-between gap-3 bg-surface border-2 border-ink rounded-[20px] shadow-[var(--shadow-card)]">
        <Logo />
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Link href="/dashboard" className="btn btn-primary btn-sm">Open StudyVerse</Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link href="/register" className="btn btn-primary btn-sm">Get started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
