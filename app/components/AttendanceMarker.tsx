'use client'

import { useState, useTransition } from 'react'
import { CheckIcon, XIcon, ProhibitIcon, ArrowCounterClockwiseIcon } from '@phosphor-icons/react/dist/ssr'
import { markAttendance, undoAttendance } from '@/app/(app)/attendance/actions'

type Stats = { present: number; absent: number; total: number; percent: number | null; canMiss: number; mustAttend: number }

const today = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

/** Tap present / absent / cancelled for a class; shows how many you can still skip, or must attend to recover. */
export default function AttendanceMarker({ subjectId, stats, target, lastId }: { subjectId: string; stats: Stats; target: number; lastId?: string }) {
  const [date, setDate] = useState(today)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const mark = (status: 'present' | 'absent' | 'cancelled') =>
    startTransition(async () => {
      const res = await markAttendance(subjectId, status, date)
      setError(res?.error ?? '')
    })
  const undo = () => lastId && startTransition(async () => { await undoAttendance(lastId, subjectId) })

  const low = stats.percent !== null && stats.percent < target
  const verdict =
    stats.total === 0 ? 'No classes marked yet.'
      : low ? (Number.isFinite(stats.mustAttend) ? `Attend the next ${stats.mustAttend} ${stats.mustAttend === 1 ? 'class' : 'classes'} to get back to ${target}%.` : `A ${target}% goal can't be reached after a miss.`)
        : stats.canMiss > 0 ? `You can miss ${stats.canMiss} more and stay at ${target}%.` : `Right on ${target}%. Don't miss the next one.`

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-3">
        <p className={`text-4xl font-extrabold tabular-nums leading-none ${low ? 'text-danger' : ''}`}>
          {stats.percent === null ? '--' : `${Math.round(stats.percent)}%`}
        </p>
        <p className="text-sm font-bold text-muted pb-0.5">{stats.present} of {stats.total} attended, goal {target}%</p>
      </div>
      <p className={`text-sm font-bold ${low ? 'text-danger' : ''}`} aria-live="polite">{verdict}</p>
      {error && <p className="alert-error" role="alert">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`att-date-${subjectId}`}>Class date</label>
        <input id={`att-date-${subjectId}`} type="date" value={date} onChange={(e) => setDate(e.target.value)} className="form-control w-auto h-[2.1rem] py-0 text-sm" />
        <button type="button" className="btn btn-sm bg-mint" onClick={() => mark('present')} disabled={pending}><CheckIcon size={14} weight="bold" aria-hidden="true" />Present</button>
        <button type="button" className="btn btn-sm bg-pink" onClick={() => mark('absent')} disabled={pending}><XIcon size={14} weight="bold" aria-hidden="true" />Absent</button>
        <button type="button" className="btn btn-sm" onClick={() => mark('cancelled')} disabled={pending} title="Class didn't happen. Doesn't count either way."><ProhibitIcon size={14} weight="bold" aria-hidden="true" />Cancelled</button>
        {lastId && <button type="button" className="btn btn-ghost btn-sm" onClick={undo} disabled={pending}><ArrowCounterClockwiseIcon size={14} weight="bold" aria-hidden="true" />Undo last</button>}
      </div>
    </div>
  )
}
