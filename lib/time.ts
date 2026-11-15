// Clock reads live here so React's purity lint stays quiet in components.
// Server-side "today"/"week" use UTC; that's a few hours off for users far from UTC. ponytail: good enough until a tz cookie exists.
export const nowIso = () => new Date().toISOString()
export const dayNumber = () => Math.floor(Date.now() / 86_400_000)
export const isPast = (iso: string | null | undefined) => !!iso && new Date(iso).getTime() < Date.now()
export const inHoursIso = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString()
export const daysAgoIso = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
export const localHour = () => new Date().getHours()
export const localDateLabel = () =>
  new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

/** 0 = Monday … 6 = Sunday (UTC). */
export const utcWeekday = (d = new Date()) => (d.getUTCDay() + 6) % 7
/** 0 = Monday … 6 = Sunday (viewer's local time). */
export const localWeekday = () => (new Date().getDay() + 6) % 7
export const localMinutes = () => {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

const utcMidnight = (offsetDays = 0) => {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + offsetDays))
}
export const startOfUtcDayIso = () => utcMidnight().toISOString()
export const endOfUtcDayIso = () => utcMidnight(1).toISOString()
export const startOfUtcWeekIso = () => utcMidnight(-utcWeekday()).toISOString()

export const fmtMinutes = (m: number) => (m < 60 ? `${m}m` : m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m / 60}h`)
export const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
/** Whole days from now until `iso` (0 = later today, negative = past), in the viewer's local calendar. */
export const daysUntil = (iso: string) => {
  const d = new Date(iso)
  const today = new Date()
  return Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86_400_000)
}
