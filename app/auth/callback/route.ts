import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Landing for Google sign-in, sign-up confirmation and password-reset links: swaps the one-time code for a
// session cookie, then continues to `next`. The code only works in the browser that started the flow.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`)
  }
  return NextResponse.redirect(`${origin}/login?error=link`)
}
