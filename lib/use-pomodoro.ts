import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

export type Phase = 'work' | 'short' | 'long'
export type Settings = { work: number; short: number; long: number; every: number; goal: number; autoStart: boolean; sound: boolean }
export const DEFAULT_SETTINGS: Settings = { work: 25, short: 5, long: 15, every: 4, goal: 120, autoStart: false, sound: true }
export const PHASE_LABEL: Record<Phase, string> = { work: 'Work', short: 'Short break', long: 'Long break' }

type TimerState = { phase: Phase; endsAt: number | null; paused: number | null; doneWork: number }
const IDLE: TimerState = { phase: 'work', endsAt: null, paused: null, doneWork: 0 }

// Tiny persisted store: the timer survives navigation and reloads, and the dashboard widget shares it with the page.
function persisted<T extends object>(key: string, fallback: T) {
  let cache: T | null = null
  const listeners = new Set<() => void>()
  return {
    fallback,
    subscribe: (cb: () => void) => {
      listeners.add(cb)
      return () => { listeners.delete(cb) }
    },
    get: (): T => {
      if (!cache) {
        try { cache = { ...fallback, ...JSON.parse(localStorage.getItem(key) ?? '{}') } } catch { cache = fallback }
      }
      return cache ?? fallback
    },
    set: (next: T) => {
      cache = next
      try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
      listeners.forEach((l) => l())
    },
  }
}
const settingsStore = persisted<Settings>('pomodoro-settings', DEFAULT_SETTINGS)
const timerStore = persisted<TimerState>('pomodoro-timer', IDLE)

export const formatTime = (secs: number) =>
  `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`

// Three short beeps from the Web Audio API; no audio file needed.
function chime() {
  try {
    const ctx = new AudioContext()
    for (const t of [0, 0.22, 0.44]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 880
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.18)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.2)
    }
  } catch {}
}

/** Timer settings alone, for widgets that only need the daily goal. */
export const useSettings = () => useSyncExternalStore(settingsStore.subscribe, settingsStore.get, () => settingsStore.fallback)

export function usePomodoro(onComplete?: (phase: Phase, minutes: number) => void) {
  const settings = useSyncExternalStore(settingsStore.subscribe, settingsStore.get, () => settingsStore.fallback)
  const timer = useSyncExternalStore(timerStore.subscribe, timerStore.get, () => timerStore.fallback)
  const [now, setNow] = useState(0)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete })

  const minutesFor = (p: Phase) => ({ work: settings.work, short: settings.short, long: settings.long })[p]
  const running = timer.endsAt !== null
  const idleSecs = timer.paused ?? minutesFor(timer.phase) * 60
  const secondsLeft = running && now ? Math.max(0, Math.round((timer.endsAt! - now) / 1000)) : idleSecs

  // Clock-derived countdown: immune to background-tab throttling. The phase change happens in the interval callback.
  useEffect(() => {
    if (!running) return
    const mins = (p: Phase) => ({ work: settings.work, short: settings.short, long: settings.long })[p]
    const complete = (cur: TimerState) => {
      const doneWork = cur.phase === 'work' ? cur.doneWork + 1 : cur.doneWork
      const next: Phase = cur.phase === 'work' ? (doneWork % settings.every === 0 ? 'long' : 'short') : 'work'
      timerStore.set({ phase: next, doneWork, paused: null, endsAt: settings.autoStart ? Date.now() + mins(next) * 60_000 : null })
      if (settings.sound) chime()
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(`${PHASE_LABEL[cur.phase]} done`, { body: `Next up: ${PHASE_LABEL[next].toLowerCase()}` })
      }
      onCompleteRef.current?.(cur.phase, mins(cur.phase))
    }
    const tick = () => {
      const t = Date.now()
      setNow(t)
      const cur = timerStore.get()
      if (cur.endsAt !== null && cur.endsAt - t <= 0) complete(cur)
    }
    const raf = requestAnimationFrame(tick)
    const id = setInterval(tick, 250)
    return () => { cancelAnimationFrame(raf); clearInterval(id) }
  }, [running, settings])

  useEffect(() => {
    if (!running) return
    document.title = `${formatTime(secondsLeft)} · ${PHASE_LABEL[timer.phase]}`
    return () => { document.title = 'StudyVerse' }
  }, [running, secondsLeft, timer.phase])

  const start = () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission()
    timerStore.set({ ...timer, paused: null, endsAt: Date.now() + secondsLeft * 1000 })
  }
  const pause = () => timerStore.set({ ...timer, endsAt: null, paused: secondsLeft })
  const reset = () => timerStore.set(IDLE)
  const setPhase = (phase: Phase) => { if (!running) timerStore.set({ ...timer, phase, endsAt: null, paused: null }) }
  const skip = () => {
    const next: Phase = timer.phase === 'work' ? 'short' : 'work'
    timerStore.set({ ...timer, phase: next, endsAt: null, paused: null })
  }

  const total = minutesFor(timer.phase) * 60
  return { phase: timer.phase, secondsLeft, total, running, doneWork: timer.doneWork, settings, saveSettings: settingsStore.set, start, pause, reset, skip, setPhase }
}
