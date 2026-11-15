import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import type { Task, Quote, Note, PomodoroSession, PlannerBlock, GpaProfile, Exam } from '@/types/db'
import { nowIso, dayNumber, daysAgoIso, utcWeekday, startOfUtcDayIso, endOfUtcDayIso, startOfUtcWeekIso } from '@/lib/time'
import { streakDays } from '@/lib/streak.mjs'
import { gpa } from '@/lib/gpa.mjs'
import DashboardView from './view'

export const metadata = { title: 'Today' }

// Tolerates tables that don't exist yet (before 0002_v2.sql runs): an error just means "no rows".
const rows = async <T,>(q: PromiseLike<{ data: unknown }>) => ((await q).data ?? []) as T[]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard')
  const uid = user.id
  const meta = user.user_metadata ?? {}
  const name = meta.username || meta.full_name?.split(' ')[0] || meta.name?.split(' ')[0] || user.email?.split('@')[0] || 'there'
  const today = utcWeekday()

  const [open, overdue, dueToday, quotes, sessions, blocks, notes, profile, exams, cardsDue] = await Promise.all([
    rows<Task>(supabase.from('tasks').select('*').eq('user_id', uid).eq('completed', false).order('due_date', { ascending: true, nullsFirst: false }).limit(6)),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('completed', false).lt('due_date', nowIso()),
    rows<Pick<Task, 'completed'>>(supabase.from('tasks').select('completed').eq('user_id', uid).gte('due_date', startOfUtcDayIso()).lt('due_date', endOfUtcDayIso())),
    rows<Quote>(supabase.from('quotes').select('*').eq('category', 'study').order('text')),
    rows<PomodoroSession>(supabase.from('pomodoro_sessions').select('*').eq('user_id', uid).eq('kind', 'work').gte('started_at', daysAgoIso(60))),
    rows<PlannerBlock>(supabase.from('planner_blocks').select('*').eq('user_id', uid).eq('weekday', today).order('start_min')),
    rows<Note>(supabase.from('notes').select('*').eq('user_id', uid).order('updated_at', { ascending: false }).limit(3)),
    supabase.from('gpa_profiles').select('*').eq('user_id', uid).maybeSingle(),
    rows<Exam>(supabase.from('exams').select('*').eq('user_id', uid).gte('exam_at', nowIso()).order('exam_at').limit(1)),
    supabase.from('flashcards').select('id', { count: 'exact', head: true }).eq('user_id', uid).lte('due_at', nowIso()),
  ])

  const dayStart = startOfUtcDayIso()
  const weekStart = startOfUtcWeekIso()
  const week = Array<number>(7).fill(0)
  for (const s of sessions) if (s.started_at >= weekStart) week[utcWeekday(new Date(s.started_at))] += s.minutes
  const gp = (profile.data ?? null) as GpaProfile | null

  return (
    <DashboardView
      name={name}
      focusToday={sessions.filter((s) => s.started_at >= dayStart).reduce((sum, s) => sum + s.minutes, 0)}
      dueToday={dueToday}
      open={open}
      streak={streakDays(sessions.map((s) => s.started_at))}
      overdueCount={overdue.count ?? 0}
      cgpa={gp ? gpa(gp.semesters.flat(), gp.scale) : null}
      week={week}
      today={today}
      blocks={blocks}
      quote={quotes.length ? quotes[dayNumber() % quotes.length] : null}
      notes={notes}
      nextExam={exams[0] ?? null}
      cardsDue={cardsDue.count ?? 0}
    />
  )
}
