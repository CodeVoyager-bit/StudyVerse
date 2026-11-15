'use client'

import { useState, useTransition } from 'react'
import { PlusIcon, TrashIcon, MapPinIcon, CalendarPlusIcon } from '@phosphor-icons/react/dist/ssr'
import type { Exam, Subject } from '@/types/db'
import SubmitButton from '@/app/components/SubmitButton'
import SubjectSelect from '@/app/components/SubjectSelect'
import { CAT_TONE } from '@/lib/categories'
import { daysUntil } from '@/lib/time'
import { addExam, deleteExam } from './actions'

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
const TONES = ['bg-pink', 'bg-yellow', 'bg-mint', 'bg-sky', 'bg-orange']

export default function ExamBoard({ exams, subjects }: { exams: Exam[]; subjects: Subject[] }) {
  const [error, setError] = useState('')
  const [, startTransition] = useTransition()
  const bySubject = new Map(subjects.map((s) => [s.id, s]))

  const submit = async (fd: FormData) => {
    const local = fd.get('exam_at')
    if (local) fd.set('exam_at', new Date(String(local)).toISOString())
    const res = await addExam(fd)
    setError(res?.error ?? '')
  }
  const remove = (e: Exam) => confirm(`Delete "${e.title}"?`) && startTransition(async () => { await deleteExam(e.id) })

  return (
    <div className="flex flex-col gap-6">
      <form action={submit} className="card grid gap-3 sm:grid-cols-2">
        {error && <p className="alert-error sm:col-span-2" role="alert">{error}</p>}
        <div>
          <label htmlFor="ex-title" className="label">Exam</label>
          <input id="ex-title" name="title" type="text" placeholder="DBMS mid-sem…" className="form-control" maxLength={120} autoComplete="off" required />
        </div>
        <div>
          <label htmlFor="ex-at" className="label">When</label>
          <input id="ex-at" name="exam_at" type="datetime-local" className="form-control" required />
        </div>
        <div>
          <label htmlFor="ex-loc" className="label">Where <span className="font-normal text-faint">(optional)</span></label>
          <input id="ex-loc" name="location" type="text" placeholder="Room 204…" className="form-control" maxLength={120} autoComplete="off" />
        </div>
        <SubjectSelect subjects={subjects} id="ex-subject" />
        <SubmitButton className="btn btn-primary sm:col-span-2 justify-self-start"><PlusIcon size={16} weight="bold" aria-hidden="true" />Add exam</SubmitButton>
      </form>

      {exams.length === 0 ? (
        <div className="card flex flex-col items-center text-center gap-3 py-12">
          <span className="sticker size-20 text-4xl bg-pink rotate-6 wiggle" aria-hidden="true">⏰</span>
          <p className="text-xl font-extrabold mt-2">No exams coming up</p>
          <p className="text-muted font-medium">Add one and it counts down here, and on your Today page.</p>
        </div>
      ) : (
        <>
          <a href="/exams/calendar.ics" className="btn self-start" download><CalendarPlusIcon size={16} weight="bold" aria-hidden="true" />Add all to my calendar (.ics)</a>
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((e, i) => {
              const days = daysUntil(e.exam_at)
              const subject = e.subject_id ? bySubject.get(e.subject_id) : undefined
              return (
                <li key={e.id} className={`card rise flex flex-col gap-2 ${TONES[i % TONES.length]}`} style={{ '--i': i } as React.CSSProperties}>
                  <p className="font-mono text-sm font-bold" suppressHydrationWarning>{when(e.exam_at)}</p>
                  <h2 className="text-xl font-extrabold leading-tight break-words">{e.title}</h2>
                  <p className="flex items-baseline gap-2" suppressHydrationWarning>
                    <span className="text-5xl font-extrabold tabular-nums leading-none">{days <= 0 ? '!' : days}</span>
                    <span className="hand text-2xl">{days < 0 ? 'started' : days === 0 ? 'today, good luck' : days === 1 ? 'day to go' : 'days to go'}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-1">
                    {subject && <span className={`chip ${CAT_TONE[subject.color] ?? ''}`}>{subject.name}</span>}
                    {e.location && <span className="chip bg-surface"><MapPinIcon size={12} weight="fill" aria-hidden="true" />{e.location}</span>}
                    <button type="button" onClick={() => remove(e)} className="btn btn-danger btn-icon btn-sm ml-auto" aria-label={`Delete "${e.title}"`}>
                      <TrashIcon size={15} weight="bold" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ol>
        </>
      )}
    </div>
  )
}
