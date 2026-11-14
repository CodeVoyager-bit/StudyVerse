'use client'

import { useOptimistic, useState, useTransition } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { AnimatePresence, motion } from 'motion/react'
import { PencilSimpleIcon, TrashIcon, PlusIcon, EyeIcon, PencilLineIcon } from '@phosphor-icons/react/dist/ssr'
import type { Note } from '@/types/db'
import SubmitButton from '@/app/components/SubmitButton'
import { SPRING } from '@/app/components/motion'
import { addNote, updateNote, deleteNote, type Result } from './actions'

type Action = (fd: FormData) => Promise<Result>

// Each note gets a stable sticky-note colour, tilt and tape from its id.
const STICKY = ['bg-yellow', 'bg-pink', 'bg-mint', 'bg-sky', 'bg-orange']
const TAPE = ['var(--color-sky)', 'var(--color-yellow)', 'var(--color-pink)', 'var(--color-mint)']
const TILT = ['-2deg', '1.5deg', '-1deg', '2deg', '0.5deg']
const hash = (id: string) => [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)

function NoteForm({ note, action, onDone }: { note?: Note; action: Action; onDone: () => void }) {
  const [error, setError] = useState('')
  const [content, setContent] = useState(note?.content ?? '')
  const [preview, setPreview] = useState(false)
  const id = note?.id ?? 'new'

  const submit = async (fd: FormData) => {
    fd.set('content', content)
    const res = await action(fd)
    if (res?.error) return setError(res.error)
    setError('')
    onDone()
  }

  return (
    <form action={submit} className="flex flex-col gap-3">
      {error && <p className="alert-error" role="alert">{error}</p>}
      <div>
        <label htmlFor={`title-${id}`} className="label">Title</label>
        <input id={`title-${id}`} name="title" type="text" placeholder="Unit 2: normalisation…" defaultValue={note?.title} className="form-control" autoComplete="off" autoFocus={!note} required />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={`content-${id}`} className="label mb-0">Note <span className="font-normal text-faint">(markdown works)</span></label>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPreview((p) => !p)} aria-pressed={preview}>
            {preview ? <><PencilLineIcon size={14} aria-hidden="true" />Write</> : <><EyeIcon size={14} aria-hidden="true" />Preview</>}
          </button>
        </div>
        {preview ? (
          <div className="md form-control h-auto min-h-[9rem] py-2.5 text-sm">{content ? <ReactMarkdown>{content}</ReactMarkdown> : <span className="text-faint">Nothing to preview yet.</span>}</div>
        ) : (
          <textarea id={`content-${id}`} name="content" placeholder="Write it down while it's fresh…" value={content} onChange={(e) => setContent(e.target.value)} className="form-control" rows={6} required />
        )}
      </div>
      <div>
        <label htmlFor={`tags-${id}`} className="label">Tags <span className="font-normal text-faint">(comma separated)</span></label>
        <input id={`tags-${id}`} name="tags" type="text" placeholder="dbms, unit 2…" defaultValue={note?.tags?.join(', ')} className="form-control" autoComplete="off" />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn btn-ghost" onClick={onDone}>Cancel</button>
        <SubmitButton className="btn btn-primary">{note ? 'Save changes' : 'Add note'}</SubmitButton>
      </div>
    </form>
  )
}

function NoteCard({ note, onDelete }: { note: Note; onDelete: () => void }) {
  const [editing, setEditing] = useState(false)
  if (editing) return <div className="card"><NoteForm note={note} action={updateNote.bind(null, note.id)} onDone={() => setEditing(false)} /></div>

  const h = hash(note.id)
  return (
    <article
      className={`card card-link tape group flex flex-col gap-3 rotate-(--r) hover:rotate-0 ${STICKY[h % STICKY.length]}`}
      style={{ '--r': TILT[h % TILT.length], '--tape': TAPE[h % TAPE.length] } as React.CSSProperties}
    >
      <h3 className="text-lg font-extrabold break-words pt-1">{note.title}</h3>
      <div className="md text-[0.92rem] font-medium max-h-56 overflow-hidden break-words [mask-image:linear-gradient(to_bottom,black_75%,transparent)]">
        <ReactMarkdown>{note.content}</ReactMarkdown>
      </div>
      {note.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {note.tags.map((t) => <Link key={t} href={`/note?tag=${encodeURIComponent(t)}`} className="chip hover:bg-ink hover:text-surface transition-colors">#{t}</Link>)}
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t-2 border-dashed border-ink/25">
        <p className="text-xs font-bold" suppressHydrationWarning>{new Date(note.updated_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        <div className="flex gap-1 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
          <button type="button" className="btn btn-icon btn-sm" onClick={() => setEditing(true)} aria-label={`Edit "${note.title}"`}><PencilSimpleIcon size={16} aria-hidden="true" /></button>
          <button type="button" className="btn btn-danger btn-icon btn-sm" onClick={onDelete} aria-label={`Delete "${note.title}"`}><TrashIcon size={16} aria-hidden="true" /></button>
        </div>
      </div>
    </article>
  )
}

export default function NoteList({ notes, filtered }: { notes: Note[]; filtered: boolean }) {
  const [items, removeOptimistic] = useOptimistic(notes, (state, id: string) => state.filter((n) => n.id !== id))
  const [, startTransition] = useTransition()
  const [composing, setComposing] = useState(false)

  const remove = (n: Note) => {
    if (!confirm(`Delete "${n.title}"? This can't be undone.`)) return
    startTransition(async () => {
      removeOptimistic(n.id)
      await deleteNote(n.id)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {composing ? (
        <div className="card max-w-[680px]"><NoteForm action={addNote} onDone={() => setComposing(false)} /></div>
      ) : (
        <button type="button" onClick={() => setComposing(true)} className="card card-link flex items-center gap-3 text-left font-bold py-3.5 max-w-[680px]">
          <span className="grid place-items-center size-8 rounded-full bg-pink border-2 border-ink"><PlusIcon size={16} weight="bold" aria-hidden="true" /></span>
          Write a note…
        </button>
      )}

      {items.length === 0 ? (
        <div className="card flex flex-col items-center text-center gap-3 py-12">
          <span className="sticker size-20 text-4xl bg-pink rotate-6 wiggle" aria-hidden="true">{filtered ? '🔍' : '📝'}</span>
          <p className="text-xl font-extrabold mt-2">{filtered ? 'No notes match that' : 'No notes yet'}</p>
          <p className="text-muted font-medium">{filtered ? 'Try another word or clear the tag.' : 'Class summaries, formulas, reminders. They live here.'}</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 xl:columns-3 gap-6 pt-3">
          <AnimatePresence initial={false}>
            {items.map((note) => (
              <motion.div
                key={note.id}
                className="break-inside-avoid mb-8"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                transition={SPRING}
              >
                <NoteCard note={note} onDelete={() => remove(note)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
