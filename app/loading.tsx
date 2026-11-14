import type { CSSProperties } from 'react'

// Skeleton in the shape of a typical page, plus three bouncing dots so the wait feels alive.
export default function Loading() {
  return (
    <div className="page" aria-busy="true" aria-label="Loading…">
      <div className="flex gap-2 mb-6" aria-hidden="true">
        {['bg-yellow', 'bg-pink', 'bg-mint'].map((c, i) => (
          <span key={c} className={`size-4 rounded-full border-2 border-ink ${c} animate-bounce`} style={{ animationDelay: `${i * 120}ms` } as CSSProperties} />
        ))}
      </div>
      <div className="skeleton h-10 w-64 mb-8" />
      <div className="skeleton h-48 w-full mb-6 rounded-[20px]" />
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="skeleton h-32 rounded-[20px]" />
        <div className="skeleton h-32 rounded-[20px]" />
        <div className="skeleton h-32 rounded-[20px]" />
      </div>
    </div>
  )
}
