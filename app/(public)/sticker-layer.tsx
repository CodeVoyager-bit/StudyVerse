'use client'

import { useRef } from 'react'
import { Sticker } from '@/app/components/motion'

type S = { emoji: string; className: string; rotate: number; delay: number; size?: number; tone: string }

/** Throwable stickers scattered over a section. They stay inside it and never block clicks around them. */
export default function StickerLayer({ stickers }: { stickers: S[] }) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div ref={ref} className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {stickers.map((s) => (
        <Sticker key={s.emoji + s.className} bounds={ref} className={s.className} rotate={s.rotate} delay={s.delay} size={s.size} tone={s.tone}>
          {s.emoji}
        </Sticker>
      ))}
    </div>
  )
}
