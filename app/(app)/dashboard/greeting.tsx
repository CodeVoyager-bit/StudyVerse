'use client'

import { useSyncExternalStore } from 'react'
import { localHour, localDateLabel } from '@/lib/time'

const noop = () => () => {}
const hourWord = () => {
  const h = localHour()
  return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

// Time-of-day text comes from the viewer's clock, not the server's.
export default function Greeting({ name }: { name: string }) {
  const word = useSyncExternalStore(noop, hourWord, () => 'Hello')
  const date = useSyncExternalStore(noop, localDateLabel, () => '')
  return (
    <div>
      <p className="hand text-2xl -rotate-2 origin-left" suppressHydrationWarning>{date}</p>
      <h1 className="page-title mt-1">
        {word}, <span className="hl">{name}</span> <span className="wiggle origin-[70%_70%]" aria-hidden="true">👋</span>
      </h1>
    </div>
  )
}
