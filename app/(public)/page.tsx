import Link from 'next/link'
import type { CSSProperties } from 'react'
import { ArrowRightIcon, StarFourIcon } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/utils/supabase/server'
import { Rings, TiltCard } from '@/app/components/motion'
import Logo from '@/app/components/Logo'
import FocusDemo from './focus-demo'
import StickerLayer from './sticker-layer'
import DemoChecklist from './demo-checklist'

const HERO_STICKERS = [
  { emoji: '📚', className: 'left-[3%] top-[8%] hidden md:block', rotate: -14, delay: 0.5, size: 76, tone: 'bg-yellow' },
  { emoji: '⏰', className: 'right-[4%] top-[4%]', rotate: 12, delay: 0.7, size: 64, tone: 'bg-pink' },
  { emoji: '✏️', className: 'left-[44%] bottom-[6%] hidden lg:block', rotate: 18, delay: 0.9, size: 60, tone: 'bg-sky' },
  { emoji: '🧠', className: 'left-[30%] top-[3%] hidden lg:block', rotate: -8, delay: 1.1, size: 58, tone: 'bg-mint' },
  { emoji: '🎯', className: 'right-[2%] bottom-[10%] hidden md:block', rotate: 10, delay: 1.3, size: 66, tone: 'bg-orange' },
  { emoji: '⭐', className: 'left-[6%] bottom-[4%]', rotate: -20, delay: 1.5, size: 54, tone: 'bg-surface' },
]
const HEADLINE = [
  { text: 'Plan it.', tone: 'bg-yellow', r: '-2deg' },
  { text: 'Focus.', tone: 'bg-pink', r: '1.5deg' },
  { text: 'Ace it.', tone: 'bg-mint', r: '-1deg' },
]
const BAND = ['Plan it', 'Focus', 'Take notes', 'Track your CGPA', 'Beat the deadline', 'Ace it']
const tilt = (deg: number) => ({ transform: `rotate(${deg}deg)` }) as CSSProperties

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const cta = user
    ? <Link href="/dashboard" className="btn btn-primary btn-lg">Open StudyVerse<ArrowRightIcon size={20} weight="bold" aria-hidden="true" /></Link>
    : <Link href="/register" className="btn btn-primary btn-lg">Get started<ArrowRightIcon size={20} weight="bold" aria-hidden="true" /></Link>

  return (
    <>
      <section className="relative">
        <div className="relative max-w-[1140px] mx-auto px-5 pt-16 pb-24 lg:pt-20 grid gap-20 lg:gap-12 lg:grid-cols-[1.15fr_1fr] items-center pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
          <div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[1.1]">
              {HEADLINE.map((w, i) => (
                <span key={w.text} className={`pop inline-block whitespace-nowrap px-3 mr-2 mb-2 rounded-[14px] border-[3px] border-ink shadow-[var(--shadow-card)] ${w.tone}`} style={{ '--r': w.r, '--i': i } as CSSProperties}>
                  {w.text}
                </span>
              ))}
            </h1>
            <p className="rise text-lg sm:text-xl font-medium text-muted mt-6 max-w-[44ch]" style={{ '--i': 6 } as CSSProperties}>
              Tasks, notes, a focus timer, a weekly planner and your CGPA, all in one place built for students.
            </p>
            <div className="rise flex flex-wrap gap-4 mt-9" style={{ '--i': 8 } as CSSProperties}>
              {cta}
              {!user && <Link href="/login" className="btn btn-lg">Log in</Link>}
            </div>
          </div>
          <div className="rise pointer-events-auto lg:pl-6" style={{ '--i': 5 } as CSSProperties}><FocusDemo /></div>
        </div>
        <div className="absolute inset-0 z-20 pointer-events-none"><StickerLayer stickers={HERO_STICKERS} /></div>
      </section>

      <div className="marquee overflow-hidden -rotate-2 scale-[1.04] bg-yellow border-y-[3px] border-ink py-3" aria-label={BAND.join(', ')}>
        <div className="marquee-track" aria-hidden="true">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {BAND.map((b) => (
                <span key={b} className="flex items-center gap-6 px-6 text-2xl sm:text-3xl font-extrabold tracking-tight whitespace-nowrap">
                  {b}<StarFourIcon size={26} weight="fill" className="text-pink" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="max-w-[1140px] mx-auto px-5 pt-24 pb-20" aria-labelledby="features">
        <h2 id="features" className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-12 max-w-[18ch]">
          The whole semester, on <span className="hl">one page</span>.
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
          <TiltCard className="sm:col-span-2 lg:col-span-4">
            <article className="card h-full bg-yellow p-7">
              <span className="sticker size-14 text-3xl bg-surface -rotate-6" aria-hidden="true">✅</span>
              <h3 className="text-3xl mt-5">Tick things off</h3>
              <p className="font-medium mt-1.5 max-w-[42ch]">Due dates, priorities and quick filters. Go on, tick one.</p>
              <DemoChecklist />
            </article>
          </TiltCard>
          <TiltCard className="lg:col-span-2 lg:row-span-2">
            <article className="card h-full bg-pink p-7 flex flex-col justify-between gap-6">
              <div className="grid place-items-center pt-2">
                <Rings size={170} stroke={14} rings={[{ value: 0.72, className: 'stroke-accent', label: 'Focus' }, { value: 0.45, className: 'stroke-mint', label: 'Tasks' }]}>
                  <span className="text-5xl" aria-hidden="true">⏰</span>
                </Rings>
              </div>
              <div>
                <h3 className="text-3xl">Focus that counts</h3>
                <p className="font-medium mt-1.5">Every session you finish adds to your streak and your weekly chart.</p>
              </div>
            </article>
          </TiltCard>
          <TiltCard className="lg:col-span-2">
            <article className="card tape h-full p-7 bg-surface" style={tilt(-1.5)}>
              <span className="sticker size-12 text-2xl bg-sky rotate-6" aria-hidden="true">📝</span>
              <h3 className="text-2xl mt-4">Notes that stick</h3>
              <p className="text-muted font-medium mt-1">Markdown, tags and search for every class.</p>
            </article>
          </TiltCard>
          <TiltCard className="lg:col-span-2">
            <article className="card h-full p-7 bg-sky" style={tilt(1)}>
              <span className="sticker size-12 text-2xl bg-surface -rotate-6" aria-hidden="true">🗓️</span>
              <h3 className="text-2xl mt-4">See your whole week</h3>
              <p className="font-medium mt-1">Block out study time from Monday to Sunday.</p>
            </article>
          </TiltCard>
          <TiltCard className="sm:col-span-1 lg:col-span-3">
            <article className="card h-full p-7 bg-mint relative overflow-hidden">
              <span className="sticker size-14 text-3xl bg-surface rotate-12" aria-hidden="true">🎓</span>
              <h3 className="text-3xl mt-5">Your CGPA, worked out</h3>
              <p className="font-medium mt-1.5 max-w-[34ch]">Credit-weighted, saved per semester, on a 10-point or 4.0 scale.</p>
            </article>
          </TiltCard>
          <TiltCard className="sm:col-span-1 lg:col-span-3">
            <article className="card h-full p-7 bg-orange flex flex-col justify-between gap-6">
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">“The secret of getting ahead is getting started.”</p>
              <p className="font-bold">Mark Twain, in today’s quote</p>
            </article>
          </TiltCard>
        </div>
      </section>

      <section className="relative max-w-[1140px] mx-auto px-5 pb-24">
        <div className="card tape -rotate-1 bg-surface p-8 sm:p-12 flex flex-col sm:flex-row sm:items-center justify-between gap-8 shadow-[var(--shadow-pop)]" style={{ '--tape': 'var(--color-pink)' } as CSSProperties}>
          <div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Start with <span className="hl" style={{ '--hl': 'var(--color-mint)' } as CSSProperties}>today</span>.</h2>
            <p className="text-lg text-muted font-medium mt-2">Make an account and run your first focus session.</p>
          </div>
          {cta}
        </div>
      </section>

      <footer className="border-t-2 border-ink bg-surface">
        <div className="max-w-[1140px] mx-auto px-5 py-8 flex flex-wrap items-center justify-between gap-4 font-bold">
          <Logo />
          <p className="hand text-2xl">made for students, with snacks 🍪</p>
        </div>
      </footer>
    </>
  )
}
