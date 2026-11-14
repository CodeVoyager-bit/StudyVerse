'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import {
  SquaresFourIcon, ListChecksIcon, NotePencilIcon, TimerIcon, CalendarDotsIcon, GraduationCapIcon, QuotesIcon, SignOutIcon,
} from '@phosphor-icons/react/dist/ssr'
import { supabase } from '@/utils/supabase/client'
import { BOUNCY } from './motion'
import Logo from './Logo'

const links = [
  { href: '/dashboard', label: 'Today', Icon: SquaresFourIcon },
  { href: '/task', label: 'Tasks', Icon: ListChecksIcon },
  { href: '/note', label: 'Notes', Icon: NotePencilIcon },
  { href: '/pomodoro', label: 'Focus', Icon: TimerIcon },
  { href: '/planner', label: 'Planner', Icon: CalendarDotsIcon },
  { href: '/gpa', label: 'CGPA', Icon: GraduationCapIcon },
  { href: '/quotes', label: 'Quotes', Icon: QuotesIcon },
]
const tabLinks = links.slice(0, 5) // a tab bar holds five; CGPA and Quotes are linked from Today

export default function Sidebar({ name }: { name: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-dvh p-4">
        <div className="card flex flex-col flex-1 p-4">
          <div className="px-1 mb-6 mt-1"><Logo href="/dashboard" /></div>
          <nav className="flex flex-col gap-1" aria-label="Primary">
            {links.map(({ href, label, Icon }) => {
              const on = isActive(href)
              return (
                <Link key={href} href={href} className="nav-item isolate" aria-current={on ? 'page' : undefined}>
                  {on && <motion.span layoutId="nav-pill" transition={BOUNCY} className="absolute inset-0 -z-10 rounded-[12px] bg-yellow border-2 border-ink shadow-[var(--shadow-sm)]" />}
                  <Icon size={20} weight={on ? 'fill' : 'bold'} aria-hidden="true" />
                  {label}
                </Link>
              )
            })}
          </nav>
          <div className="mt-auto flex items-center gap-2.5 rounded-[12px] border-2 border-ink bg-raised p-2">
            <span className="grid place-items-center size-9 rounded-full bg-pink border-2 border-ink text-sm font-extrabold uppercase" aria-hidden="true">{name.slice(0, 1)}</span>
            <span className="flex-1 min-w-0 truncate text-sm font-bold">{name}</span>
            <button type="button" onClick={signOut} className="btn btn-ghost btn-icon btn-sm" aria-label="Sign out"><SignOutIcon size={18} weight="bold" aria-hidden="true" /></button>
          </div>
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-16 bg-surface border-b-2 border-ink">
        <Logo href="/dashboard" />
        <button type="button" onClick={signOut} className="btn btn-sm" aria-label="Sign out"><SignOutIcon size={18} weight="bold" aria-hidden="true" /></button>
      </header>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-5 gap-1 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-surface border-t-2 border-ink" aria-label="Primary">
        {tabLinks.map(({ href, label, Icon }) => {
          const on = isActive(href)
          return (
            <Link key={href} href={href} className="relative isolate flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-bold" aria-current={on ? 'page' : undefined}>
              {on && <motion.span layoutId="tab-pill" transition={BOUNCY} className="absolute inset-0 -z-10 rounded-[12px] bg-yellow border-2 border-ink" />}
              <Icon size={22} weight={on ? 'fill' : 'bold'} aria-hidden="true" />{label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
