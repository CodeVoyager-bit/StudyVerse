import type { CSSProperties } from 'react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Seven chunky bars of focus minutes, Monday first. Pure CSS: bars spring up on first paint.
export default function WeekChart({ minutes, todayIndex }: { minutes: number[]; todayIndex: number }) {
  const max = Math.max(60, ...minutes)
  const summary = DAYS.map((d, i) => `${d} ${minutes[i]} minutes`).join(', ')
  return (
    <div role="img" aria-label={`Focus minutes this week: ${summary}`}>
      <div className="flex items-end gap-2.5 h-32">
        {minutes.map((m, i) => (
          <div key={i} className="flex-1 h-full flex items-end" title={`${DAYS[i]}: ${m} min`}>
            <div
              className={`grow w-full rounded-[8px] border-2 border-ink ${i === todayIndex ? 'bg-yellow' : m ? 'bg-surface' : 'bg-transparent border-dashed'}`}
              style={{ height: `${Math.max(8, (m / max) * 100)}%`, '--i': i } as CSSProperties}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2.5 mt-2 text-xs font-extrabold" aria-hidden="true">
        {DAYS.map((d, i) => <span key={d} className={`flex-1 text-center ${i === todayIndex ? 'underline decoration-2 underline-offset-4' : ''}`}>{d.slice(0, 1)}</span>)}
      </div>
    </div>
  )
}
