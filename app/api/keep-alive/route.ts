import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cronAuthorized } from '@/lib/cron-auth.mjs'

// Called daily by Vercel Cron (see vercel.json). Supabase pauses free projects after about a week of
// low database activity; three tiny reads a day keep it awake. They only count rows, nothing is written.
export async function GET(request: Request) {
  if (!cronAuthorized(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  })
  const results = await Promise.all(
    ['quotes', 'tasks', 'notes'].map((table) => supabase.from(table).select('*', { count: 'exact', head: true })),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return NextResponse.json({ ok: false, error: failed.error.message }, { status: 502 })

  return NextResponse.json({ ok: true, queries: results.length, at: new Date().toISOString() })
}
