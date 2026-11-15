'use client'

import { useState, useTransition } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CheckIcon, XIcon, EyeIcon } from '@phosphor-icons/react/dist/ssr'
import type { Flashcard } from '@/types/db'
import { celebrate } from '@/lib/celebrate'
import { BOUNCY } from '@/app/components/motion'
import { reviewCard } from './actions'

/** Retrieval practice: try to recall the answer before flipping, then say honestly whether you got it. */
export default function ReviewDeck({ cards }: { cards: Flashcard[] }) {
  // Snapshot the due cards so the deck doesn't reshuffle as answers revalidate the page.
  const [deck] = useState(cards)
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [right, setRight] = useState(0)
  const [, startTransition] = useTransition()
  const card = deck[i]

  const answer = (correct: boolean) => {
    startTransition(async () => { await reviewCard(card.id, correct) })
    if (correct) setRight((n) => n + 1)
    setFlipped(false)
    setI((n) => n + 1)
    if (i + 1 === deck.length) celebrate(undefined, true)
  }

  if (deck.length === 0) {
    return (
      <div className="card bg-mint flex flex-col items-center text-center gap-2 py-10">
        <span className="text-5xl" aria-hidden="true">🌱</span>
        <p className="text-xl font-extrabold">Nothing due right now</p>
        <p className="font-medium">Cards come back right before you&apos;d forget them. Check in later.</p>
      </div>
    )
  }
  if (!card) {
    return (
      <div className="card bg-yellow flex flex-col items-center text-center gap-2 py-10" role="status">
        <span className="text-5xl" aria-hidden="true">🎉</span>
        <p className="text-2xl font-extrabold">Session done</p>
        <p className="font-bold">{right} of {deck.length} remembered. The misses come back in 10 minutes.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between font-bold text-sm">
        <span>Card {i + 1} of {deck.length}</span>
        <span className="chip">Box {card.box}</span>
      </div>
      <div className="h-2.5 rounded-full border-2 border-ink bg-surface overflow-hidden" aria-hidden="true">
        <div className="h-full bg-accent transition-[width]" style={{ width: `${(i / deck.length) * 100}%` }} />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${card.id}-${flipped}`}
          initial={{ rotateY: -90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: 90, opacity: 0, transition: { duration: 0.12 } }}
          transition={BOUNCY}
          className={`card min-h-56 flex flex-col justify-center text-center gap-3 p-8 ${flipped ? 'bg-sky' : 'bg-yellow'}`}
        >
          <p className="hand text-xl">{flipped ? 'Answer' : 'Question'}</p>
          <p className="text-xl sm:text-2xl font-extrabold whitespace-pre-wrap break-words" aria-live="polite">{flipped ? card.back : card.front}</p>
        </motion.div>
      </AnimatePresence>
      {flipped ? (
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="btn btn-lg bg-pink" onClick={() => answer(false)}><XIcon size={18} weight="bold" aria-hidden="true" />Missed it</button>
          <button type="button" className="btn btn-lg bg-mint" onClick={() => answer(true)}><CheckIcon size={18} weight="bold" aria-hidden="true" />Got it</button>
        </div>
      ) : (
        <button type="button" className="btn btn-lg btn-primary" onClick={() => setFlipped(true)} autoFocus><EyeIcon size={18} weight="bold" aria-hidden="true" />Show answer</button>
      )}
    </div>
  )
}
