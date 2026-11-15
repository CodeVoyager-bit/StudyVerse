'use client'

import { useState, useSyncExternalStore } from 'react'
import { useFeedback } from '@/app/components/Feedback'
import { PlusIcon, CalendarDotsIcon, PlayCircleIcon } from '@phosphor-icons/react/dist/ssr'
import type { PlannerBlock, Subject, Resource } from '@/types/db'
import SubmitButton from '@/app/components/SubmitButton'
import { CATEGORIES, CAT_TONE } from '@/lib/categories'
import { hhmm, localMinutes, localWeekday } from '@/lib/time'
import { addBlock, deleteBlock } from './actions'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const FIRST_HOUR = 6
const LAST_HOUR = 23
const ROW_PX = 44 // one hour
const toMin = (v: string) => {
  const [h, m] = v.split(':').map(Number)
  return h * 60 + (m || 0)
}

// The viewer's clock, refreshed once a minute, for the "now" line and today's column.
const everyMinute = (cb: () => void) => {
  const id = setInterval(cb, 60_000)
  return () => clearInterval(id)
}

export default function WeekGrid({ blocks, subjects = [], resources = [] }: { blocks: PlannerBlock[]; subjects?: Subject[]; resources?: Resource[] }) {
  const [error, setError] = useState('')
  const now = useSyncExternalStore(everyMinute, localMinutes, () => -1)
  const today = useSyncExternalStore(everyMinute, localWeekday, () => -1)
  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i)
  const nowTop = ((now - FIRST_HOUR * 60) / 60) * ROW_PX
  const showNow = now >= FIRST_HOUR * 60 && now <= (LAST_HOUR + 1) * 60

  const submit = async (fd: FormData) => {
    fd.set('start_min', String(toMin(String(fd.get('start')))))
    fd.set('end_min', String(toMin(String(fd.get('end')))))
    // Typing one of your subjects links the block to it.
    const typed = String(fd.get('subject')).trim().toLowerCase()
    const match = subjects.find((s) => s.name.toLowerCase() === typed)
    if (subjects.length) fd.set('subject_id', match?.id ?? '')
    const res = await addBlock(fd)
    setError(res?.error ?? '')
  }
  const { confirm } = useFeedback()
  const remove = async (b: PlannerBlock) => {
    if (await confirm({ title: `Remove "${b.subject}"?`, body: `${DAYS_LONG[b.weekday]}, ${hhmm(b.start_min)} to ${hhmm(b.end_min)}`, confirmLabel: 'Remove', danger: true })) deleteBlock(b.id)
  }

  return (
    <div className="flex flex-col gap-5">
      <form action={submit} className="card grid gap-3 grid-cols-2 md:grid-cols-4 xl:grid-cols-[1.4fr_auto_auto_auto_auto_auto] items-end">
        {error && <p className="alert-error col-span-2 md:col-span-4 xl:col-span-6" role="alert">{error}</p>}
        <div className="col-span-2 md:col-span-4 xl:col-span-1">
          <label htmlFor="pl-subject" className="label">Subject</label>
          <input id="pl-subject" name="subject" type="text" placeholder="Maths revision…" className="form-control" autoComplete="off" list="pl-subjects" required />
          <datalist id="pl-subjects">{subjects.map((s) => <option key={s.id} value={s.name} />)}</datalist>
        </div>
        {resources.length > 0 && (
          <div className="col-span-2 md:col-span-4 xl:col-span-6 xl:order-last">
            <label htmlFor="pl-res" className="label">Watch during it <span className="font-normal text-faint">(optional)</span></label>
            <select id="pl-res" name="resource_id" defaultValue="" className="form-control">
              <option value="">Nothing from the library</option>
              {resources.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>
        )}
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="pl-day" className="label">Day</label>
          <select id="pl-day" name="weekday" defaultValue={Math.max(0, today)} className="form-control">
            {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="pl-start" className="label">Start</label>
          <input id="pl-start" name="start" type="time" defaultValue="18:00" step={900} className="form-control" required />
        </div>
        <div>
          <label htmlFor="pl-end" className="label">End</label>
          <input id="pl-end" name="end" type="time" defaultValue="19:00" step={900} className="form-control" required />
        </div>
        <fieldset className="col-span-2 xl:col-span-1">
          <legend className="label">Colour</legend>
          <div className="flex gap-1.5 h-10 items-center">
            {CATEGORIES.map((c, i) => (
              <label key={c} className="relative cursor-pointer">
                <input type="radio" name="color" value={c} defaultChecked={i === 0} className="peer sr-only" />
                <span className="sr-only">{c}</span>
                <span aria-hidden="true" className={`block size-8 rounded-full border-2 border-ink ${CAT_TONE[c]} transition-transform peer-checked:scale-110 peer-checked:shadow-[var(--shadow-sm)] peer-checked:-translate-y-0.5 peer-focus-visible:outline-3 peer-focus-visible:outline-accent peer-focus-visible:outline-offset-2`} />
              </label>
            ))}
          </div>
        </fieldset>
        <div className="col-span-2 xl:col-span-1 flex md:justify-end"><SubmitButton className="btn btn-primary w-full md:w-auto"><PlusIcon size={16} weight="bold" aria-hidden="true" />Add block</SubmitButton></div>
      </form>

      {/* Phones: a day-by-day agenda instead of a seven-column grid that would need sideways scrolling. */}
      <ol className="md:hidden flex flex-col gap-4">
        {DAYS.map((d, dayIdx) => {
          const dayBlocks = blocks.filter((b) => b.weekday === dayIdx)
          return (
            <li key={d} className={`card p-4 ${dayIdx === today ? 'bg-yellow' : ''}`}>
              <h3 className="font-extrabold flex items-center justify-between">
                {DAYS_LONG[dayIdx]}
                {dayIdx === today && <span className="chip bg-surface">Today</span>}
              </h3>
              {dayBlocks.length === 0 ? (
                <p className="text-sm font-medium mt-1 text-muted">Nothing planned.</p>
              ) : (
                <ul className="flex flex-col gap-2 mt-3">
                  {dayBlocks.map((b) => (
                    <li key={b.id} className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => remove(b)}
                        className={`w-full flex items-center gap-3 text-left rounded-[12px] border-2 border-ink px-3 py-2.5 shadow-[var(--shadow-sm)] ${CAT_TONE[b.color] ?? CAT_TONE.slate}`}
                        aria-label={`${b.subject}, ${DAYS_LONG[dayIdx]} ${hhmm(b.start_min)} to ${hhmm(b.end_min)}. Remove`}
                      >
                        <span className="font-mono text-xs font-bold tabular-nums shrink-0">{hhmm(b.start_min)}-{hhmm(b.end_min)}</span>
                        <span className="font-extrabold min-w-0 truncate">{b.subject}</span>
                      </button>
                      <BlockResource resource={resources.find((r) => r.id === b.resource_id)} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ol>

      <div className="card p-0 overflow-x-auto overscroll-x-contain hidden md:block">
        <div className="min-w-[760px] grid grid-cols-[56px_repeat(7,1fr)]">
          <div className="border-b-2 border-ink" />
          {DAYS.map((d, i) => (
            <div key={d} className="py-3 text-center border-b-2 border-l border-ink border-l-line">
              <span className={`inline-flex items-center justify-center h-8 px-3 rounded-full text-sm font-extrabold ${i === today ? 'bg-yellow border-2 border-ink' : ''}`}>{d}</span>
            </div>
          ))}

          <div>
            {hours.map((h) => (
              <div key={h} className="text-[11px] font-mono text-faint text-right pr-2 -mt-2 tabular-nums" style={{ height: ROW_PX }}>{String(h).padStart(2, '0')}:00</div>
            ))}
          </div>
          {DAYS.map((d, dayIdx) => (
            <div key={d} className={`relative border-l border-line ${dayIdx === today ? 'bg-yellow/15' : ''}`}>
              {hours.map((h) => <div key={h} className="border-t border-line/70" style={{ height: ROW_PX }} />)}
              {blocks.filter((b) => b.weekday === dayIdx).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => remove(b)}
                  className={`absolute inset-x-1 rounded-[10px] border-2 border-ink px-2 py-1.5 text-left overflow-hidden shadow-[var(--shadow-sm)] transition-transform hover:-rotate-2 hover:scale-[1.04] ${CAT_TONE[b.color] ?? CAT_TONE.slate}`}
                  style={{ top: ((b.start_min - FIRST_HOUR * 60) / 60) * ROW_PX + 2, height: ((b.end_min - b.start_min) / 60) * ROW_PX - 4 }}
                  aria-label={`${b.subject}, ${DAYS[dayIdx]} ${hhmm(b.start_min)} to ${hhmm(b.end_min)}. Remove`}
                >
                  <span className="block text-xs font-extrabold leading-tight truncate">{b.subject}</span>
                  <span className="block text-[11px] font-mono opacity-80 tabular-nums">{hhmm(b.start_min)}-{hhmm(b.end_min)}</span>
                  {b.resource_id && <PlayCircleIcon size={14} weight="fill" className="absolute right-1 bottom-1" aria-hidden="true" />}
                </button>
              ))}
              {dayIdx === today && showNow && (
                <div className="absolute inset-x-0 z-10 pointer-events-none flex items-center" style={{ top: nowTop }} aria-hidden="true">
                  <span className="size-3 -ml-1.5 rounded-full bg-danger border-2 border-ink" />
                  <span className="flex-1 h-0.5 bg-danger" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {blocks.length === 0 ? (
        <p className="flex items-center gap-2 font-bold text-muted"><CalendarDotsIcon size={20} weight="fill" aria-hidden="true" />Your week is empty. Add a block above to see it here.</p>
      ) : (
        <p className="hidden md:block text-sm font-medium text-faint">Showing {String(FIRST_HOUR).padStart(2, '0')}:00 to {LAST_HOUR}:00. Click a block to remove it.</p>
      )}

      {/* Desktop: what to watch in each block, since the blocks themselves are too small for links. */}
      {blocks.some((b) => b.resource_id) && (
        <div className="hidden md:block card">
          <h2 className="text-lg font-extrabold mb-3">Lined up to watch</h2>
          <ul className="flex flex-col gap-2">
            {blocks.filter((b) => b.resource_id).map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-2 text-sm font-bold">
                <span className="font-mono tabular-nums">{DAYS[b.weekday]} {hhmm(b.start_min)}</span>
                <span>{b.subject}</span>
                <BlockResource resource={resources.find((r) => r.id === b.resource_id)} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function BlockResource({ resource }: { resource?: Resource }) {
  if (!resource) return null
  return (
    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="chip hover:bg-yellow self-start max-w-full">
      <PlayCircleIcon size={13} weight="fill" aria-hidden="true" /><span className="truncate">{resource.title}</span>
    </a>
  )
}
