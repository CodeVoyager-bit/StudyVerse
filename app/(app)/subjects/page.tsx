import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BooksIcon } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/utils/supabase/server'
import { getSubjects } from '@/utils/data'
import { attendanceStats } from '@/lib/attendance.mjs'
import { CAT_TONE } from '@/lib/categories'
import type { AttendanceRecord } from '@/types/db'
import { SubjectForm } from './subject-forms'

export const metadata = { title: 'Subjects' }

export default async function SubjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/subjects')

  const [subjects, att, res, tasks] = await Promise.all([
    getSubjects(supabase, user.id),
    supabase.from('attendance').select('subject_id, status').eq('user_id', user.id),
    supabase.from('resources').select('subject_id').eq('user_id', user.id).is('group_id', null).not('subject_id', 'is', null),
    supabase.from('tasks').select('subject_id').eq('user_id', user.id).eq('completed', false).not('subject_id', 'is', null),
  ])
  const count = (rows: { subject_id: string | null }[] | null, id: string) => (rows ?? []).filter((r) => r.subject_id === id).length
  const attendance = (att.data ?? []) as Pick<AttendanceRecord, 'subject_id' | 'status'>[]

  return (
    <div className="page">
      <header className="mb-6">
        <h1 className="page-title"><span className="hl" style={{ '--hl': 'var(--color-mint)' } as React.CSSProperties}>Subjects</span></h1>
        <p className="page-sub">Each subject keeps its videos, tasks, notes, attendance and exams together.</p>
      </header>

      <div className="card mb-8 max-w-[640px]"><SubjectForm /></div>

      {subjects.length === 0 ? (
        <div className="card flex flex-col items-center text-center gap-3 py-12">
          <span className="sticker size-20 text-4xl bg-mint rotate-6 wiggle" aria-hidden="true">📚</span>
          <p className="text-xl font-extrabold mt-2">No subjects yet</p>
          <p className="text-muted font-medium max-w-[44ch]">Add the subjects you study this semester. Everything else can then be filed under one.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s, i) => {
            const stats = attendanceStats(attendance.filter((a) => a.subject_id === s.id), s.attendance_target)
            const low = stats.percent !== null && stats.percent < s.attendance_target
            return (
              <Link key={s.id} href={`/subjects/${s.id}`} className={`card card-link rise flex flex-col gap-3 ${CAT_TONE[s.color] ?? ''}`} style={{ '--i': i } as React.CSSProperties}>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-xl font-extrabold leading-tight break-words">{s.name}</h2>
                  <BooksIcon size={26} weight="duotone" aria-hidden="true" className="shrink-0" />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-auto">
                  <span className="chip bg-surface">{count(res.data, s.id)} in library</span>
                  <span className="chip bg-surface">{count(tasks.data, s.id)} tasks open</span>
                  {stats.percent !== null && (
                    <span className={`chip ${low ? 'chip-danger' : 'chip-success'}`}>{Math.round(stats.percent)}% attended</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
