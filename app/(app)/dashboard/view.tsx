import Link from 'next/link'
import type { CSSProperties } from 'react'
import { ArrowRightIcon, PlusIcon } from '@phosphor-icons/react/dist/ssr'
import type { Task, Quote, Note, PlannerBlock } from '@/types/db'
import { fmtMinutes, hhmm } from '@/lib/time'
import { CountUp } from '@/app/components/motion'
import { CAT_TONE } from '@/lib/categories'
import Greeting from './greeting'
import TodayRings from './today-rings'
import MiniPomodoro from './mini-pomodoro'
import WeekChart from './week-chart'
import UpNext from './up-next'

const delay = (i: number) => ({ '--i': i }) as CSSProperties
// Markdown symbols read as noise in a two-line preview.
const plain = (md: string) => md.replace(/^\s*(#{1,6}|[-+*>]|\d+\.)\s+/gm, '').replace(/[*_`~]/g, '')
const NOTE_TONES = ['bg-yellow', 'bg-pink', 'bg-mint']
const NOTE_TILT = ['-1.5deg', '1deg', '-0.5deg']

export type DashboardData = {
  name: string
  focusToday: number
  dueToday: { completed: boolean }[]
  open: Task[]
  streak: number
  overdueCount: number
  cgpa: number | null
  week: number[]
  today: number
  blocks: PlannerBlock[]
  quote: Quote | null
  notes: Note[]
}

/** Pure view of the Today screen; page.tsx does the fetching. */
export default function DashboardView({ name, focusToday, dueToday, open, streak, overdueCount, cgpa, week, today, blocks, quote, notes }: DashboardData) {
  return (
    <div className="page">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <Greeting name={name} />
        <Link href="/task" className="btn btn-primary btn-lg"><PlusIcon size={18} weight="bold" aria-hidden="true" />New task</Link>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-12">
        <section className="card md:col-span-2 xl:col-span-7 rise" style={delay(0)} aria-labelledby="today">
          <h2 id="today" className="section-title mb-5">Today so far</h2>
          <TodayRings focus={focusToday} due={dueToday.length} done={dueToday.filter((t) => t.completed).length} />
        </section>

        <div className="xl:col-span-5 rise" style={delay(1)}><MiniPomodoro /></div>

        <div className="xl:col-span-5 grid grid-cols-1 gap-6">
          <div className="card bg-orange flex items-center gap-4 rise" style={delay(2)}>
            <span className="sticker size-14 text-3xl bg-surface" aria-hidden="true"><span className="wiggle">🔥</span></span>
            <div><p className="font-bold">Focus streak</p><p className="text-3xl font-extrabold tracking-tight"><CountUp value={streak} /> {streak === 1 ? 'day' : 'days'}</p></div>
          </div>
          <Link href="/task?filter=overdue" className={`card card-link flex items-center gap-4 rise ${overdueCount ? 'bg-danger-soft' : 'bg-surface'}`} style={delay(3)}>
            <span className="sticker size-14 text-3xl bg-surface" aria-hidden="true">{overdueCount ? '⏳' : '😎'}</span>
            <div><p className="font-bold">Overdue</p><p className="text-3xl font-extrabold tracking-tight"><CountUp value={overdueCount} /> {overdueCount === 1 ? 'task' : 'tasks'}</p></div>
          </Link>
          <Link href="/gpa" className="card card-link bg-mint flex items-center gap-4 rise" style={delay(4)}>
            <span className="sticker size-14 text-3xl bg-surface" aria-hidden="true">🎓</span>
            <div><p className="font-bold">CGPA</p><p className="text-3xl font-extrabold tracking-tight">{cgpa === null ? <span className="text-lg">Not saved yet</span> : <CountUp value={cgpa} decimals={2} />}</p></div>
          </Link>
        </div>

        <section className="card md:col-span-2 xl:col-span-7 rise" style={delay(5)} aria-labelledby="up-next">
          <div className="flex items-center justify-between mb-2">
            <h2 id="up-next" className="section-title">Up next</h2>
            <Link href="/task" className="btn btn-sm">All tasks<ArrowRightIcon size={14} weight="bold" aria-hidden="true" /></Link>
          </div>
          <UpNext tasks={open} />
        </section>

        <section className="card bg-sky xl:col-span-5 rise" style={delay(6)} aria-labelledby="week">
          <div className="flex items-baseline justify-between mb-4">
            <h2 id="week" className="section-title">Focus this week</h2>
            <span className="font-extrabold tabular-nums">{fmtMinutes(week.reduce((a, b) => a + b, 0))}</span>
          </div>
          <WeekChart minutes={week} todayIndex={today} />
        </section>

        <section className="card xl:col-span-4 rise" style={delay(7)} aria-labelledby="plan">
          <div className="flex items-center justify-between mb-3">
            <h2 id="plan" className="section-title">Today&apos;s plan</h2>
            <Link href="/planner" className="btn btn-sm">Planner<ArrowRightIcon size={14} weight="bold" aria-hidden="true" /></Link>
          </div>
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center text-center gap-2 py-5 font-bold text-muted">
              <span className="text-3xl" aria-hidden="true">🗓️</span>No study blocks today.
            </div>
          ) : (
            <ol className="flex flex-col gap-2">
              {blocks.map((b) => (
                <li key={b.id} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 text-xs font-mono font-bold tabular-nums">{hhmm(b.start_min)}</span>
                  <span className={`flex-1 min-w-0 truncate rounded-[10px] border-2 border-ink px-3 py-2 text-sm font-bold ${CAT_TONE[b.color] ?? CAT_TONE.slate}`}>{b.subject}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="card tape bg-yellow md:col-span-2 xl:col-span-3 flex flex-col justify-between gap-4 rise rotate-1" style={{ ...delay(8), '--tape': 'var(--color-pink)' } as CSSProperties} aria-label="Quote of the day">
          {quote ? (
            <>
              <p className="text-xl font-extrabold tracking-tight leading-snug pt-2">“{quote.text}”</p>
              {quote.author && <p className="hand text-2xl">{quote.author}</p>}
            </>
          ) : (
            <p className="font-bold">Quotes will show up here.</p>
          )}
        </section>

        <section className="md:col-span-2 xl:col-span-12 rise" style={delay(9)} aria-labelledby="recent-notes">
          <div className="flex items-center justify-between mb-5 mt-2">
            <h2 id="recent-notes" className="section-title text-xl">Recent notes</h2>
            <Link href="/note" className="btn btn-sm">All notes<ArrowRightIcon size={14} weight="bold" aria-hidden="true" /></Link>
          </div>
          {notes.length === 0 ? (
            <Link href="/note" className="card card-link flex items-center gap-3 font-bold">
              <span className="text-2xl" aria-hidden="true">📝</span>Write your first note
            </Link>
          ) : (
            <div className="grid gap-6 sm:grid-cols-3">
              {notes.map((n, i) => (
                <Link key={n.id} href="/note" className={`card card-link tape block min-w-0 rotate-(--r) hover:rotate-0 ${NOTE_TONES[i % 3]}`} style={{ '--r': NOTE_TILT[i % 3] } as CSSProperties}>
                  <p className="font-extrabold truncate pt-1">{n.title}</p>
                  <p className="text-sm font-medium line-clamp-2 mt-1 break-words">{plain(n.content)}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
