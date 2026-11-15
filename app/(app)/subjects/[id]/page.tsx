import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeftIcon, CalendarCheckIcon, ExamIcon, NoteIcon, CheckSquareIcon, FilmStripIcon } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/utils/supabase/server'
import type { Subject, Resource, Task, Note, AttendanceRecord, Exam } from '@/types/db'
import { attendanceStats } from '@/lib/attendance.mjs'
import { CAT_TONE } from '@/lib/categories'
import ResourceCard from '@/app/components/ResourceCard'
import AddResourceForm from '@/app/components/AddResourceForm'
import AttendanceMarker from '@/app/components/AttendanceMarker'
import { EditSubject, DeleteSubject, ShareSubject } from '../subject-forms'
import SubjectTasks from './subject-tasks'

export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/subjects/${id}`)

  const { data: subject } = await supabase.from('subjects').select('*').eq('id', id).eq('user_id', user.id).maybeSingle<Subject>()
  if (!subject) notFound()

  const [res, tasks, notes, att, exams] = await Promise.all([
    supabase.from('resources').select('*').eq('subject_id', id).is('group_id', null).order('created_at', { ascending: false }),
    supabase.from('tasks').select('*').eq('subject_id', id).eq('completed', false).order('due_date', { ascending: true, nullsFirst: false }),
    supabase.from('notes').select('id, title, updated_at').eq('subject_id', id).order('updated_at', { ascending: false }).limit(8),
    supabase.from('attendance').select('*').eq('subject_id', id).order('created_at', { ascending: false }),
    supabase.from('exams').select('*').eq('subject_id', id).gte('exam_at', new Date().toISOString()).order('exam_at'),
  ])
  const resources = (res.data ?? []) as Resource[]
  const records = (att.data ?? []) as AttendanceRecord[]
  const stats = attendanceStats(records, subject.attendance_target)
  const h = await headers()
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`

  return (
    <div className="page">
      <Link href="/subjects" className="btn btn-ghost btn-sm mb-3 -ml-2"><ArrowLeftIcon size={15} weight="bold" aria-hidden="true" />All subjects</Link>
      <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span className={`chip mb-2 ${CAT_TONE[subject.color] ?? ''}`}>Subject</span>
          <h1 className="page-title break-words">{subject.name}</h1>
        </div>
        <div className="flex gap-2"><EditSubject subject={subject} /><DeleteSubject subject={subject} /></div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
        <section aria-labelledby="lib-h" className="flex flex-col gap-4 min-w-0">
          <h2 id="lib-h" className="text-2xl font-extrabold flex items-center gap-2"><FilmStripIcon size={24} weight="fill" aria-hidden="true" />Library</h2>
          <div className="card"><AddResourceForm subjectId={subject.id} /></div>
          {resources.length === 0 ? (
            <p className="font-medium text-muted">Paste a lecture playlist or a tutorial and it lands here.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {resources.map((r) => <ResourceCard key={r.id} resource={r} canEdit />)}
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-5">
          <section className="card" aria-labelledby="att-h">
            <h2 id="att-h" className="text-lg font-extrabold flex items-center gap-2 mb-2"><CalendarCheckIcon size={20} weight="fill" aria-hidden="true" />Attendance</h2>
            <AttendanceMarker subjectId={subject.id} stats={stats} target={subject.attendance_target} lastId={records[0]?.id} />
          </section>

          <section className="card" aria-labelledby="ex-h">
            <h2 id="ex-h" className="text-lg font-extrabold flex items-center gap-2 mb-2"><ExamIcon size={20} weight="fill" aria-hidden="true" />Upcoming exams</h2>
            {(exams.data ?? []).length === 0 ? (
              <p className="text-sm font-medium text-muted">None. <Link href="/exams" className="underline font-bold">Add one</Link></p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {(exams.data as Exam[]).map((e) => (
                  <li key={e.id} className="flex justify-between gap-2 text-sm font-bold">
                    <span className="truncate">{e.title}</span>
                    <span className="font-mono shrink-0" suppressHydrationWarning>{new Date(e.exam_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card" aria-labelledby="tk-h">
            <h2 id="tk-h" className="text-lg font-extrabold flex items-center gap-2"><CheckSquareIcon size={20} weight="fill" aria-hidden="true" />Open tasks</h2>
            {(tasks.data ?? []).length === 0 ? (
              <p className="text-sm font-medium text-muted mt-2">Nothing open. Pick this subject when you add a task.</p>
            ) : (
              <SubjectTasks tasks={tasks.data as Task[]} />
            )}
          </section>

          <section className="card" aria-labelledby="nt-h">
            <h2 id="nt-h" className="text-lg font-extrabold flex items-center gap-2 mb-2"><NoteIcon size={20} weight="fill" aria-hidden="true" />Notes</h2>
            {(notes.data ?? []).length === 0 ? (
              <p className="text-sm font-medium text-muted">No notes filed here yet.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {(notes.data as Pick<Note, 'id' | 'title'>[]).map((n) => (
                  <li key={n.id}><Link href={`/note?q=${encodeURIComponent(n.title)}`} className="font-bold hover:underline break-words">{n.title}</Link></li>
                ))}
              </ul>
            )}
          </section>

          <ShareSubject subject={subject} origin={origin} />
        </aside>
      </div>
    </div>
  )
}
