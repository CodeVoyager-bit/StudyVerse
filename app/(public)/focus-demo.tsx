'use client'

import { PlayIcon, PauseIcon, ArrowCounterClockwiseIcon, ArrowBendLeftDownIcon } from '@phosphor-icons/react/dist/ssr'
import { Rings } from '@/app/components/motion'
import { usePomodoro, formatTime, PHASE_LABEL } from '@/lib/use-pomodoro'
import { celebrate } from '@/lib/celebrate'

// The real focus timer, not a mock-up. Visitors can run it before signing up; nothing is saved.
export default function FocusDemo() {
  const t = usePomodoro((phase) => { if (phase === 'work') celebrate(undefined, true) })
  const tone = t.phase === 'work' ? 'bg-pink' : 'bg-mint'
  return (
    <div className="relative">
      <p className="hand absolute -top-12 left-2 text-2xl -rotate-6 flex items-end gap-1" aria-hidden="true">
        try me! <ArrowBendLeftDownIcon size={26} weight="bold" className="translate-y-3" />
      </p>
      <div className="card tape rotate-2 p-7 sm:p-8 flex flex-col items-center gap-6 shadow-[var(--shadow-pop)]" style={{ '--tape': 'var(--color-yellow)' } as React.CSSProperties}>
        <div className="flex w-full items-center justify-between">
          <h2 className="section-title">Focus timer</h2>
          <span className={`chip ${tone}`}>{PHASE_LABEL[t.phase]}</span>
        </div>
        <div className="relative grid place-items-center">
          <div className={`blob absolute size-[188px] border-[3px] border-ink ${tone}`} style={{ animationPlayState: t.running ? 'running' : 'paused' }} aria-hidden="true" />
          <Rings size={230} stroke={14} instant rings={[{ value: t.secondsLeft / t.total, className: 'stroke-accent', label: 'Time left' }]}>
            <span className="relative font-mono text-5xl font-bold tracking-tight tabular-nums">{formatTime(t.secondsLeft)}</span>
          </Rings>
        </div>
        <div className="flex items-center gap-3">
          {t.running ? (
            <button type="button" className="btn btn-lg w-40" onClick={t.pause}><PauseIcon size={20} weight="fill" aria-hidden="true" />Pause</button>
          ) : (
            <button type="button" className="btn btn-primary btn-lg w-40" onClick={t.start}><PlayIcon size={20} weight="fill" aria-hidden="true" />Start</button>
          )}
          <button type="button" className="btn btn-icon" onClick={t.reset} aria-label="Reset timer"><ArrowCounterClockwiseIcon size={20} weight="bold" aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  )
}
