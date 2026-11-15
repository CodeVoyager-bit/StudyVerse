'use client'

import { useState, useTransition } from 'react'
import { useFeedback } from '@/app/components/Feedback'
import { useRouter } from 'next/navigation'
import { PlusIcon, TrashIcon, LinkSimpleIcon, CopyIcon, CheckIcon } from '@phosphor-icons/react/dist/ssr'
import type { Subject } from '@/types/db'
import SubmitButton from '@/app/components/SubmitButton'
import { CATEGORIES, CAT_TONE } from '@/lib/categories'
import { addSubject, updateSubject, deleteSubject, setSharing } from './actions'

/** Create a subject, or edit one when `subject` is given. */
export function SubjectForm({ subject, onDone }: { subject?: Subject; onDone?: () => void }) {
  const [error, setError] = useState('')
  const id = subject?.id ?? 'new'
  const submit = async (fd: FormData) => {
    const res = subject ? await updateSubject(subject.id, fd) : await addSubject(fd)
    if (res?.error) return setError(res.error)
    setError('')
    onDone?.()
  }
  return (
    <form action={submit} className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
      {error && <p className="alert-error sm:col-span-2" role="alert">{error}</p>}
      <div>
        <label htmlFor={`sub-name-${id}`} className="label">Subject</label>
        <input id={`sub-name-${id}`} name="name" type="text" placeholder="Database systems…" defaultValue={subject?.name} className="form-control" maxLength={60} autoComplete="off" required />
      </div>
      <div>
        <label htmlFor={`sub-target-${id}`} className="label">Attendance goal</label>
        <div className="relative w-28">
          <input id={`sub-target-${id}`} name="attendance_target" type="number" min={1} max={100} defaultValue={subject?.attendance_target ?? 75} className="form-control pr-8" required />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-muted pointer-events-none" aria-hidden="true">%</span>
        </div>
      </div>
      <fieldset className="sm:col-span-2">
        <legend className="label">Colour</legend>
        <div className="flex gap-1.5 h-10 items-center">
          {CATEGORIES.map((c) => (
            <label key={c} className="relative cursor-pointer">
              <input type="radio" name="color" value={c} defaultChecked={(subject?.color ?? 'blue') === c} className="peer sr-only" />
              <span className="sr-only">{c}</span>
              <span aria-hidden="true" className={`block size-8 rounded-full border-2 border-ink ${CAT_TONE[c]} transition-transform peer-checked:scale-110 peer-checked:shadow-[var(--shadow-sm)] peer-checked:-translate-y-0.5 peer-focus-visible:outline-3 peer-focus-visible:outline-accent peer-focus-visible:outline-offset-2`} />
            </label>
          ))}
        </div>
      </fieldset>
      <div className="sm:col-span-2 flex gap-2">
        <SubmitButton className="btn btn-primary">{subject ? 'Save changes' : <><PlusIcon size={16} weight="bold" aria-hidden="true" />Add subject</>}</SubmitButton>
        {onDone && subject && <button type="button" className="btn btn-ghost" onClick={onDone}>Cancel</button>}
      </div>
    </form>
  )
}

export function EditSubject({ subject }: { subject: Subject }) {
  const [open, setOpen] = useState(false)
  return open ? (
    <div className="card mt-4"><SubjectForm subject={subject} onDone={() => setOpen(false)} /></div>
  ) : (
    <button type="button" className="btn btn-sm" onClick={() => setOpen(true)}>Edit subject</button>
  )
}

export function DeleteSubject({ subject }: { subject: Subject }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const { confirm, toast } = useFeedback()
  const remove = async () => {
    if (!(await confirm({ title: `Delete "${subject.name}"?`, body: 'Its attendance goes too. Tasks, notes and library items stay, just without a subject.', confirmLabel: 'Delete subject', danger: true }))) return
    startTransition(async () => {
      const res = await deleteSubject(subject.id)
      if (res?.error) return toast(res.error, 'error')
      toast(`Deleted ${subject.name}`)
      router.push('/subjects')
    })
  }
  return (
    <button type="button" className="btn btn-sm btn-danger" onClick={remove} disabled={pending}>
      <TrashIcon size={15} weight="bold" aria-hidden="true" />Delete
    </button>
  )
}

/** Public read-only link to this subject's library, for sharing a playlist of lectures with classmates. */
export function ShareSubject({ subject, origin }: { subject: Subject; origin: string }) {
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const link = subject.share_token ? `${origin}/share/${subject.share_token}` : ''
  const toggle = () => startTransition(async () => { await setSharing(subject.id, !subject.share_token) })
  const copy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  return (
    <div className="card bg-sky flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold flex items-center gap-2"><LinkSimpleIcon size={20} weight="bold" aria-hidden="true" />Share this library</h2>
          <p className="text-sm font-medium">Anyone with the link sees the videos and links here. Nothing else.</p>
        </div>
        <button type="button" role="switch" aria-checked={!!subject.share_token} aria-label="Public share link" onClick={toggle} disabled={pending}
          className={`relative shrink-0 w-14 h-8 rounded-full border-2 border-ink transition-colors ${subject.share_token ? 'bg-mint' : 'bg-surface'}`}>
          <span className={`absolute top-0.5 size-6 rounded-full border-2 border-ink bg-surface transition-[left] ${subject.share_token ? 'left-[1.6rem]' : 'left-0.5'}`} />
        </button>
      </div>
      {link && (
        <div className="flex gap-2">
          <input readOnly value={link} className="form-control text-sm font-mono" aria-label="Share link" onFocus={(e) => e.currentTarget.select()} />
          <button type="button" className="btn btn-icon shrink-0" onClick={copy} aria-label={copied ? 'Copied' : 'Copy link'}>
            {copied ? <CheckIcon size={16} weight="bold" aria-hidden="true" /> : <CopyIcon size={16} weight="bold" aria-hidden="true" />}
          </button>
        </div>
      )}
    </div>
  )
}
