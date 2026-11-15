import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { pushConfigured, sendPush, type PushRow } from '@/utils/push'
import { reminderText } from '@/lib/push.mjs'

// Daily push (vercel.json cron): exams in the next 3 days, tasks due in the next 24 hours, flashcards due.
// Unlike keep-alive this sends notifications, so it refuses to run without CRON_SECRET.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 })
  const admin = createAdminClient()
  if (!admin || !pushConfigured()) return NextResponse.json({ ok: false, error: 'Push or SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 })

  const { data: subs, error } = await admin.from('push_subscriptions').select('endpoint, p256dh, auth, user_id')
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  const users = [...new Set((subs ?? []).map((s) => s.user_id as string))]
  if (!users.length) return NextResponse.json({ ok: true, users: 0 })

  const now = Date.now()
  const iso = (ms: number) => new Date(ms).toISOString()
  // ponytail: one query per table for everyone; page these once there are thousands of subscribers.
  const [tasks, exams, cards] = await Promise.all([
    admin.from('tasks').select('user_id').in('user_id', users).eq('completed', false).gte('due_date', iso(now)).lt('due_date', iso(now + 86_400_000)),
    admin.from('exams').select('user_id, title, exam_at').in('user_id', users).gte('exam_at', iso(now)).lt('exam_at', iso(now + 3 * 86_400_000)).order('exam_at'),
    admin.from('flashcards').select('user_id').in('user_id', users).lte('due_at', iso(now)),
  ])

  let sent = 0
  const gone: string[] = []
  for (const uid of users) {
    const msg = reminderText({
      dueTasks: (tasks.data ?? []).filter((t) => t.user_id === uid).length,
      exams: (exams.data ?? []).filter((e) => e.user_id === uid).map((e) => ({ title: e.title, days: Math.floor((Date.parse(e.exam_at) - now) / 86_400_000) })),
      cardsDue: (cards.data ?? []).filter((c) => c.user_id === uid).length,
    })
    if (!msg) continue
    const r = await sendPush((subs as PushRow[]).filter((s) => s.user_id === uid), { ...msg, tag: 'daily' })
    sent += r.sent
    gone.push(...r.gone)
  }
  if (gone.length) await admin.from('push_subscriptions').delete().in('endpoint', gone)
  return NextResponse.json({ ok: true, users: users.length, sent, removed: gone.length })
}
