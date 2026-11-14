'use client'

import { PlayIcon, PauseIcon, ArrowCounterClockwiseIcon, SkipForwardIcon, GearSixIcon } from '@phosphor-icons/react/dist/ssr'
import { Rings, Segmented } from '@/app/components/motion'
import { usePomodoro, formatTime, PHASE_LABEL, type Phase, type Settings } from '@/lib/use-pomodoro'
import { logSession } from './actions'
import { celebrate } from '@/lib/celebrate'

const PHASES: Phase[] = ['work', 'short', 'long']

export default function PomodoroPage() {
  const t = usePomodoro((phase, minutes) => {
    if (phase !== 'work') return
    logSession(minutes, 'work')
    celebrate(undefined, true)
  })
  const tone = t.phase === 'work' ? 'bg-pink' : t.phase === 'short' ? 'bg-mint' : 'bg-sky'
  const set = (patch: Partial<Settings>) => t.saveSettings({ ...t.settings, ...patch })
  const num = (key: 'work' | 'short' | 'long' | 'every' | 'goal', max: number) => ({
    id: `set-${key}`,
    name: key,
    type: 'number' as const,
    inputMode: 'numeric' as const,
    min: 1,
    max,
    value: t.settings[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set({ [key]: Math.min(max, Math.max(1, Number(e.target.value) || 1)) }),
    className: 'form-control',
  })
  const inCycle = t.doneWork % t.settings.every

  return (
    <div className="page max-w-[760px]">
      <header className="mb-6">
        <h1 className="page-title"><span className="hl" style={{ '--hl': 'var(--color-pink)' } as React.CSSProperties}>Focus</span> time</h1>
        <p className="page-sub">Work in focused blocks. Every finished work session counts toward your streak.</p>
      </header>

      <section className="card flex flex-col items-center gap-8 sm:gap-9 py-8 sm:py-10" aria-label="Timer">
        <Segmented
          id="phase"
          label="Timer phase"
          active={t.phase}
          items={PHASES.map((p) => ({ key: p, label: PHASE_LABEL[p], onSelect: () => t.setPhase(p) }))}
        />

        <div className="relative grid place-items-center w-full max-w-[300px] aspect-square">
          <div className={`blob absolute w-[79%] aspect-square border-[3px] border-ink ${tone}`} style={{ animationPlayState: t.running ? 'running' : 'paused' }} aria-hidden="true" />
          <Rings size={300} stroke={18} fluid instant rings={[{ value: t.secondsLeft / t.total, className: 'stroke-accent', label: 'Time left' }]}>
            <span className="relative font-mono text-5xl sm:text-6xl font-bold tracking-tight tabular-nums" role="timer" aria-live="off">{formatTime(t.secondsLeft)}</span>
            <span className="relative text-sm font-bold mt-1">{t.running ? `${PHASE_LABEL[t.phase]} in progress` : 'Paused'}</span>
          </Rings>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <button type="button" className="btn btn-icon btn-lg !px-0 w-[3.4rem]" onClick={t.reset} aria-label="Reset timer"><ArrowCounterClockwiseIcon size={22} weight="bold" aria-hidden="true" /></button>
          {t.running ? (
            <button type="button" className="btn btn-lg w-36 sm:w-44" onClick={t.pause}><PauseIcon size={20} weight="fill" aria-hidden="true" />Pause</button>
          ) : (
            <button type="button" className="btn btn-primary btn-lg w-36 sm:w-44" onClick={t.start}><PlayIcon size={20} weight="fill" aria-hidden="true" />Start</button>
          )}
          <button type="button" className="btn btn-icon btn-lg !px-0 w-[3.4rem]" onClick={t.skip} aria-label="Skip to next phase"><SkipForwardIcon size={22} weight="fill" aria-hidden="true" /></button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: t.settings.every }, (_, i) => (
              <span key={i} className={`size-4 rounded-full border-2 border-ink transition-colors ${i < inCycle ? 'bg-pink' : 'bg-surface'}`} />
            ))}
          </div>
          <p className="text-sm font-bold text-muted">{inCycle} of {t.settings.every} sessions before a long break</p>
        </div>
      </section>

      <details className="card mt-5 group">
        <summary className="flex items-center gap-2 cursor-pointer font-medium list-none [&::-webkit-details-marker]:hidden">
          <GearSixIcon size={20} weight="bold" aria-hidden="true" />Timer settings
          <span className="ml-auto text-sm text-muted group-open:hidden">{t.settings.work} / {t.settings.short} / {t.settings.long} min</span>
        </summary>
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 gap-4 mt-5">
          <div><label htmlFor="set-work" className="label">Work (min)</label><input {...num('work', 180)} /></div>
          <div><label htmlFor="set-short" className="label">Short break (min)</label><input {...num('short', 60)} /></div>
          <div><label htmlFor="set-long" className="label">Long break (min)</label><input {...num('long', 90)} /></div>
          <div><label htmlFor="set-every" className="label">Long break every</label><input {...num('every', 12)} /></div>
          <div><label htmlFor="set-goal" className="label">Daily goal (min)</label><input {...num('goal', 960)} /></div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 mt-5 text-sm">
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="autoStart" className="size-4" checked={t.settings.autoStart} onChange={(e) => set({ autoStart: e.target.checked })} />Start the next phase on its own</label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="sound" className="size-4" checked={t.settings.sound} onChange={(e) => set({ sound: e.target.checked })} />Chime when a phase ends</label>
        </div>
      </details>
    </div>
  )
}
