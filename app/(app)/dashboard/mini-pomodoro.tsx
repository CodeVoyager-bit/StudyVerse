'use client'

import Link from 'next/link'
import { PlayIcon, PauseIcon, ArrowUpRightIcon } from '@phosphor-icons/react/dist/ssr'
import { Rings } from '@/app/components/motion'
import { usePomodoro, formatTime, PHASE_LABEL } from '@/lib/use-pomodoro'
import { logSession } from '@/app/(app)/pomodoro/actions'
import { celebrate } from '@/lib/celebrate'

export default function MiniPomodoro() {
  const t = usePomodoro((phase, minutes) => {
    if (phase !== 'work') return
    logSession(minutes, 'work')
    celebrate(undefined, true)
  })
  return (
    <section className={`card h-full flex flex-col ${t.phase === 'work' ? 'bg-pink' : 'bg-mint'}`} aria-labelledby="mini-focus">
      <div className="flex items-center justify-between">
        <h2 id="mini-focus" className="section-title">Focus timer</h2>
        <Link href="/pomodoro" className="btn btn-sm">Open<ArrowUpRightIcon size={14} weight="bold" aria-hidden="true" /></Link>
      </div>
      <div className="flex-1 flex items-center gap-6 mt-4">
        <div className="rounded-full bg-surface border-2 border-ink">
          <Rings size={120} stroke={11} instant rings={[{ value: t.secondsLeft / t.total, className: 'stroke-accent', label: 'Time left' }]}>
            <span className="font-mono text-xl font-bold tabular-nums">{formatTime(t.secondsLeft)}</span>
          </Rings>
        </div>
        <div className="flex flex-col gap-3">
          <p className="font-bold">{PHASE_LABEL[t.phase]}{t.running ? ', running' : ''}</p>
          {t.running ? (
            <button type="button" className="btn" onClick={t.pause}><PauseIcon size={18} weight="fill" aria-hidden="true" />Pause</button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={t.start}><PlayIcon size={18} weight="fill" aria-hidden="true" />Start</button>
          )}
        </div>
      </div>
    </section>
  )
}
