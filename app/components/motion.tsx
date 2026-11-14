'use client'

import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import Link from 'next/link'
import { MotionConfig, animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'

/** Every Motion animation in the app follows the OS "reduce motion" setting. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}

export const SPRING = { type: 'spring', stiffness: 420, damping: 30 } as const
export const BOUNCY = { type: 'spring', stiffness: 300, damping: 14 } as const

/** Counts to `value` (from 0 on mount, then from the previous value), writing straight to the DOM. */
export function CountUp({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const from = useRef(0)
  const reduce = useReducedMotion()
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const show = (v: number) => { el.textContent = v.toFixed(decimals) + suffix }
    const start = from.current
    from.current = value
    if (reduce) return show(value)
    const controls = animate(start, value, { duration: 1.1, ease: [0.16, 1, 0.3, 1], onUpdate: show })
    return () => controls.stop()
  }, [value, decimals, suffix, reduce])
  return <span ref={ref} className="tabular-nums">{value.toFixed(decimals) + suffix}</span>
}

type Ring = { value: number; className: string; label: string }

/**
 * Concentric progress rings, outermost first. `value` is 0..1.
 * The ring motif is the app's signature: the logo, the focus timer and the daily summary all use it.
 */
export function Rings({
  rings,
  size = 160,
  stroke = 12,
  gap = 4,
  instant = false,
  fluid = false,
  children,
}: {
  rings: Ring[]
  size?: number
  stroke?: number
  gap?: number
  instant?: boolean
  /** Shrink to fit narrow containers (phones) instead of holding `size` px. */
  fluid?: boolean
  children?: ReactNode
}) {
  const reduce = useReducedMotion()
  return (
    <div className={`relative shrink-0 ${fluid ? 'w-full aspect-square' : ''}`} style={fluid ? { maxWidth: size } : { width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90 size-full" aria-hidden="true">
        {rings.map((r, i) => {
          const radius = size / 2 - stroke / 2 - i * (stroke + gap)
          const value = Math.max(0, Math.min(1, r.value))
          return (
            <g key={r.label}>
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke + 4} className="stroke-ink" />
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-surface" />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={stroke}
                strokeLinecap="round"
                className={r.className}
                initial={instant || reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: value, opacity: value > 0 ? 1 : 0 }}
                transition={instant ? { duration: 0.3, ease: 'linear' } : { duration: 1.2, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              />
            </g>
          )
        })}
      </svg>
      {children && <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>}
    </div>
  )
}

/** Segmented control with a sliding pill. Items are links (navigation) or buttons (local state). */
export function Segmented({
  id,
  items,
  active,
  label,
}: {
  id: string
  label: string
  active: string
  items: { key: string; label: ReactNode; href?: string; onSelect?: () => void; ariaLabel?: string }[]
}) {
  return (
    <div className="seg isolate" role="group" aria-label={label}>
      {items.map((item) => {
        const on = item.key === active
        const pill = on && <motion.span layoutId={`seg-${id}`} className="seg-pill" transition={SPRING} />
        return item.href ? (
          <Link key={item.key} href={item.href} className="seg-item" aria-current={on ? 'page' : undefined} aria-label={item.ariaLabel} scroll={false}>
            {pill}{item.label}
          </Link>
        ) : (
          <button key={item.key} type="button" className="seg-item" aria-pressed={on} aria-label={item.ariaLabel} onClick={item.onSelect}>
            {pill}{item.label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * A sticker you can fling around. Decorative only (aria-hidden), so dragging is play, never a required action.
 * It bobs gently on its own; reduced motion keeps it still.
 */
export function Sticker({
  children, className = '', rotate = 0, delay = 0, bounds, size = 64, tone = 'bg-surface',
}: {
  children: ReactNode; className?: string; rotate?: number; delay?: number; bounds?: RefObject<HTMLElement | null>; size?: number; tone?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      aria-hidden="true"
      drag
      dragConstraints={bounds}
      dragElastic={0.5}
      dragTransition={{ bounceStiffness: 300, bounceDamping: 12 }}
      whileDrag={{ scale: 1.18, rotate: rotate + 12, zIndex: 30 }}
      whileHover={{ scale: 1.1, rotate: rotate - 8 }}
      initial={reduce ? false : { scale: 0, rotate: rotate - 50 }}
      animate={{ scale: 1, rotate }}
      transition={{ ...BOUNCY, delay }}
      className={`absolute pointer-events-auto cursor-grab active:cursor-grabbing select-none touch-none ${className}`}
    >
      <motion.div
        className={`sticker ${tone}`}
        style={{ width: size, height: size, fontSize: size * 0.5 }}
        animate={reduce ? undefined : { y: [0, -7, 0] }}
        transition={{ duration: 2.8 + delay * 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

/** Card that tilts toward the pointer. Pointer position lives in motion values, never React state. */
export function TiltCard({ children, className = '', max = 8 }: { children: ReactNode; className?: string; max?: number }) {
  const reduce = useReducedMotion()
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 250, damping: 18 })
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 250, damping: 18 })
  return (
    <motion.div
      className={className}
      style={reduce ? undefined : { rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return
        const r = e.currentTarget.getBoundingClientRect()
        px.set((e.clientX - r.left) / r.width)
        py.set((e.clientY - r.top) / r.height)
      }}
      onPointerLeave={() => { px.set(0.5); py.set(0.5) }}
    >
      {children}
    </motion.div>
  )
}
