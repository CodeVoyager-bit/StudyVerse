import type { ReactNode } from 'react'
import { Mark } from './Logo'

/** Shared frame for the login, register and password pages: a taped card with a couple of stickers. */
export default function AuthCard({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="min-h-[calc(100dvh-5rem)] grid place-items-center px-5 py-12">
      <div className="relative w-full max-w-[420px] rise">
        <span aria-hidden="true" className="sticker absolute -top-6 -right-5 size-14 bg-pink text-2xl rotate-12 z-10">✏️</span>
        <span aria-hidden="true" className="sticker absolute -bottom-6 -left-6 size-12 bg-mint text-xl -rotate-12 z-10">⭐</span>
        <div className="card tape p-6 sm:p-8 shadow-[var(--shadow-pop)]">
          <div className="mb-6 flex flex-col items-center text-center gap-3">
            <Mark size={44} />
            <h1 className="text-3xl font-extrabold">{title}</h1>
            {sub && <p className="text-muted font-medium max-w-[32ch]">{sub}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-5 text-sm font-bold text-faint" aria-hidden="true">
      <span className="flex-1 h-0.5 bg-ink/15 rounded" />or<span className="flex-1 h-0.5 bg-ink/15 rounded" />
    </div>
  )
}
