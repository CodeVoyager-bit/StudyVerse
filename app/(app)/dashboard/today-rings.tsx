'use client'

import { CountUp, Rings } from '@/app/components/motion'
import { useSettings } from '@/lib/use-pomodoro'
import { fmtMinutes } from '@/lib/time'

/** The day at a glance: focus minutes against the daily goal, and today's due tasks done. */
export default function TodayRings({ focus, due, done }: { focus: number; due: number; done: number }) {
  const { goal } = useSettings()
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
      <Rings
        size={176}
        stroke={16}
        gap={6}
        rings={[
          { value: focus / goal, className: 'stroke-accent', label: 'Focus' },
          { value: due ? done / due : 0, className: 'stroke-mint', label: 'Due today' },
        ]}
      >
        <span className="text-3xl" aria-hidden="true">{focus >= goal ? '🏆' : '⚡'}</span>
      </Rings>
      <dl className="grid gap-5 w-full sm:w-auto">
        <div>
          <dt className="flex items-center gap-2 font-bold"><span className="size-3.5 rounded-full bg-accent border-2 border-ink" aria-hidden="true" />Focus</dt>
          <dd className="mt-0.5"><span className="text-4xl font-extrabold tracking-tight"><CountUp value={focus} /></span><span className="text-muted font-bold"> min of your {fmtMinutes(goal)} goal</span></dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 font-bold"><span className="size-3.5 rounded-full bg-mint border-2 border-ink" aria-hidden="true" />Due today</dt>
          <dd className="mt-0.5">
            {due ? (
              <><span className="text-4xl font-extrabold tracking-tight"><CountUp value={done} /></span><span className="text-muted font-bold"> of {due} done</span></>
            ) : (
              <span className="text-muted font-bold">Nothing due today. Enjoy it.</span>
            )}
          </dd>
        </div>
      </dl>
    </div>
  )
}
