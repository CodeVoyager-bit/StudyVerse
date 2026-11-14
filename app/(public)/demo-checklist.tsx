'use client'

import { useState } from 'react'
import CheckButton from '@/app/components/CheckButton'

// A real, working checklist (local only) so visitors can feel what ticking a task off is like.
const ITEMS = ['Read chapter 4', 'Finish the lab report', 'Revise for the quiz']

export default function DemoChecklist() {
  const [done, setDone] = useState<boolean[]>([true, false, false])
  return (
    <ul className="flex flex-col gap-2 mt-5 max-w-sm">
      {ITEMS.map((item, i) => (
        <li key={item} className="flex items-center gap-3 bg-surface border-2 border-ink rounded-[12px] px-3 py-2 shadow-[var(--shadow-sm)]">
          <CheckButton done={done[i]} title={item} onToggle={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))} />
          <span className={`font-bold transition-colors ${done[i] ? 'line-through text-faint' : ''}`}>{item}</span>
        </li>
      ))}
    </ul>
  )
}
