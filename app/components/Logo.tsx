import Link from 'next/link'

/** Sticker-style mark: a yellow disc with an orbiting dot, outlined in ink. */
export function Mark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <circle cx="16" cy="16" r="14" fill="var(--color-yellow)" stroke="var(--color-ink)" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="7.5" fill="none" stroke="var(--color-ink)" strokeWidth="2.5" />
      <circle cx="23.5" cy="10" r="3.2" fill="var(--color-pink)" stroke="var(--color-ink)" strokeWidth="2" />
    </svg>
  )
}

export default function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2 min-h-11 text-xl font-extrabold tracking-tight" translate="no">
      <span className="transition-transform duration-300 group-hover:rotate-[20deg] group-hover:scale-110"><Mark /></span>
      StudyVerse
    </Link>
  )
}
