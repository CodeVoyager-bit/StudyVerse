'use client'

import { useRef, useState, useTransition } from 'react'
import { PlusIcon, TrashIcon } from '@phosphor-icons/react/dist/ssr'
import type { Flashcard, Subject } from '@/types/db'
import SubmitButton from '@/app/components/SubmitButton'
import SubjectSelect from '@/app/components/SubjectSelect'
import { CAT_TONE } from '@/lib/categories'
import { addCard, deleteCard } from './actions'

export default function CardManager({ cards, subjects }: { cards: Flashcard[]; subjects: Subject[] }) {
  const [error, setError] = useState('')
  const form = useRef<HTMLFormElement>(null)
  const [, startTransition] = useTransition()
  const bySubject = new Map(subjects.map((s) => [s.id, s]))

  const submit = async (fd: FormData) => {
    const res = await addCard(fd)
    if (res?.error) return setError(res.error)
    setError('')
    form.current?.reset()
    form.current?.querySelector<HTMLTextAreaElement>('textarea')?.focus()
  }
  const remove = (c: Flashcard) => confirm('Delete this card?') && startTransition(async () => { await deleteCard(c.id) })

  return (
    <div className="flex flex-col gap-5">
      <form ref={form} action={submit} className="card flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">New card</h2>
        {error && <p className="alert-error" role="alert">{error}</p>}
        <div>
          <label htmlFor="fc-front" className="label">Question</label>
          <textarea id="fc-front" name="front" rows={2} maxLength={500} placeholder="What does 3NF remove?" className="form-control" required />
        </div>
        <div>
          <label htmlFor="fc-back" className="label">Answer</label>
          <textarea id="fc-back" name="back" rows={3} maxLength={2000} placeholder="Transitive dependencies on the key…" className="form-control" required />
        </div>
        {subjects.length > 0 && <SubjectSelect subjects={subjects} id="fc-subject" />}
        <SubmitButton className="btn btn-primary self-start"><PlusIcon size={16} weight="bold" aria-hidden="true" />Add card</SubmitButton>
      </form>

      {cards.length > 0 && (
        <details className="card">
          <summary className="font-extrabold cursor-pointer">All cards ({cards.length})</summary>
          <ul className="mt-3 divide-y-2 divide-dashed divide-line-strong">
            {cards.map((c) => {
              const s = c.subject_id ? bySubject.get(c.subject_id) : undefined
              return (
                <li key={c.id} className="py-2.5 flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold break-words">{c.front}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="chip">Box {c.box}</span>
                      {s && <span className={`chip ${CAT_TONE[s.color] ?? ''}`}>{s.name}</span>}
                    </div>
                  </div>
                  <button type="button" onClick={() => remove(c)} className="btn btn-ghost btn-danger btn-icon btn-sm" aria-label="Delete card">
                    <TrashIcon size={15} aria-hidden="true" />
                  </button>
                </li>
              )
            })}
          </ul>
        </details>
      )}
    </div>
  )
}
