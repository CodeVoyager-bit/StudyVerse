'use client'

import type { MouseEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CheckIcon } from '@phosphor-icons/react/dist/ssr'
import { BOUNCY } from './motion'
import { celebrate, originOf } from '@/lib/celebrate'

/** Round checkbox that pops a little confetti from itself when something gets done. Its tap area extends to 44px. */
export default function CheckButton({ done, onToggle, title }: { done: boolean; onToggle: () => void; title: string }) {
  const click = (e: MouseEvent<HTMLButtonElement>) => {
    if (!done) celebrate(originOf(e.currentTarget))
    onToggle()
  }
  return (
    <motion.button
      type="button"
      onClick={click}
      whileTap={{ scale: 0.8 }}
      aria-pressed={done}
      aria-label={done ? `Mark "${title}" as not done` : `Mark "${title}" as done`}
      className={`relative mt-0.5 grid place-items-center size-7 shrink-0 rounded-full border-[2.5px] border-ink transition-colors before:absolute before:-inset-2 before:content-[''] ${done ? 'bg-mint' : 'bg-surface hover:bg-yellow'}`}
    >
      <AnimatePresence initial={false}>
        {done && (
          <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={BOUNCY}>
            <CheckIcon size={15} weight="bold" aria-hidden="true" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
