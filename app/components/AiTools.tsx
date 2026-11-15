'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { SparkleIcon, CardsIcon, XIcon, FloppyDiskIcon } from '@phosphor-icons/react/dist/ssr'
import type { Subject } from '@/types/db'
import { summarise, makeFlashcards } from '@/app/(app)/ai/actions'
import { addNote } from '@/app/(app)/note/actions'
import SubjectSelect from './SubjectSelect'

type Source = { noteId: string } | { text: string; subjectId?: string | null }

function useAi() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<{ summary: string; title: string } | null>(null)
  const [cards, setCards] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)

  const run = (task: 'summary' | 'cards', source: Source) => startTransition(async () => {
    setError('')
    setSaved(false)
    if (task === 'summary') {
      const res = await summarise(source)
      if ('error' in res) return setError(res.error)
      setSummary(res)
    } else {
      const res = await makeFlashcards(source)
      if ('error' in res) return setError(res.error)
      setCards(res.count)
    }
  })
  const save = (subjectId?: string | null) => summary && startTransition(async () => {
    const fd = new FormData()
    fd.set('title', summary.title)
    fd.set('content', summary.summary)
    fd.set('tags', 'summary')
    if (subjectId) fd.set('subject_id', subjectId)
    const res = await addNote(fd)
    if (res?.error) return setError(res.error)
    setSaved(true)
  })
  const clear = () => { setSummary(null); setCards(null); setError('') }
  return { pending, error, summary, cards, saved, run, save, clear }
}

function Results({ ai, canSave, subjectId }: { ai: ReturnType<typeof useAi>; canSave: boolean; subjectId?: string | null }) {
  return (
    <>
      {ai.pending && <p className="text-sm font-bold" role="status">Thinking it over…</p>}
      {ai.error && <p className="alert-error" role="alert">{ai.error}</p>}
      {ai.cards !== null && (
        <p className="text-sm font-bold" role="status">
          Added {ai.cards} flashcards. <Link href="/flashcards" className="underline">Review them</Link>
        </p>
      )}
      {ai.summary && (
        <div className="rounded-[12px] border-2 border-ink bg-surface p-4 flex flex-col gap-3">
          <div className="md text-[0.92rem] font-medium break-words"><ReactMarkdown>{ai.summary.summary}</ReactMarkdown></div>
          <div className="flex flex-wrap gap-2">
            {canSave && (
              <button type="button" className="btn btn-sm" onClick={() => ai.save(subjectId)} disabled={ai.pending || ai.saved}>
                <FloppyDiskIcon size={14} weight="bold" aria-hidden="true" />{ai.saved ? 'Saved to Notes' : 'Save as a note'}
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={ai.clear}><XIcon size={14} weight="bold" aria-hidden="true" />Close</button>
          </div>
        </div>
      )}
    </>
  )
}

/** Summarise / make flashcards buttons on a note card. */
export function NoteAiTools({ noteId, subjectId }: { noteId: string; subjectId?: string | null }) {
  const ai = useAi()
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className="btn btn-sm bg-surface" onClick={() => ai.run('summary', { noteId })} disabled={ai.pending}><SparkleIcon size={14} weight="fill" aria-hidden="true" />Summarise</button>
        <button type="button" className="btn btn-sm bg-surface" onClick={() => ai.run('cards', { noteId })} disabled={ai.pending}><CardsIcon size={14} weight="fill" aria-hidden="true" />Make flashcards</button>
      </div>
      <Results ai={ai} canSave subjectId={subjectId} />
    </div>
  )
}

/** Paste a lecture transcript (YouTube: … then Show transcript) or any text, and get a summary or flashcards. */
export function PasteAiPanel({ subjects }: { subjects: Subject[] }) {
  const ai = useAi()
  const [text, setText] = useState('')
  const [subjectId, setSubjectId] = useState('')
  return (
    <section className="card bg-yellow flex flex-col gap-3" aria-labelledby="ai-h">
      <h2 id="ai-h" className="text-lg font-extrabold flex items-center gap-2"><SparkleIcon size={20} weight="fill" aria-hidden="true" />Study helper</h2>
      <p className="text-sm font-medium">Paste a lecture transcript or any reading. On YouTube, open the video’s description and press Show transcript to copy it.</p>
      <label htmlFor="ai-text" className="sr-only">Text to study</label>
      <textarea id="ai-text" value={text} onChange={(e) => setText(e.target.value)} rows={5} className="form-control" placeholder="Paste the transcript here…" />
      {subjects.length > 0 && (
        <div onChange={(e) => setSubjectId((e.target as HTMLSelectElement).value)}>
          <SubjectSelect subjects={subjects} id="ai-subject" name="ai_subject" />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={() => ai.run('summary', { text })} disabled={ai.pending || !text.trim()}><SparkleIcon size={16} weight="fill" aria-hidden="true" />Summarise</button>
        <button type="button" className="btn" onClick={() => ai.run('cards', { text, subjectId })} disabled={ai.pending || !text.trim()}><CardsIcon size={16} weight="fill" aria-hidden="true" />Make flashcards</button>
      </div>
      <Results ai={ai} canSave subjectId={subjectId} />
    </section>
  )
}
