'use client'

import { useRef, useState } from 'react'
import { PlusIcon } from '@phosphor-icons/react/dist/ssr'
import type { Subject } from '@/types/db'
import SubmitButton from './SubmitButton'
import SubjectSelect from './SubjectSelect'
import { addResource } from '@/app/(app)/resources/actions'

/** Paste a link; YouTube links fill in their own title, channel and thumbnail. */
export default function AddResourceForm({ subjects = [], subjectId, groupId, onAdded }: {
  subjects?: Subject[]
  subjectId?: string
  groupId?: string
  onAdded?: (id: string) => void
}) {
  const [error, setError] = useState('')
  const form = useRef<HTMLFormElement>(null)
  const id = groupId ?? subjectId ?? 'lib'

  const submit = async (fd: FormData) => {
    const res = await addResource(fd)
    if (res?.error) return setError(res.error)
    setError('')
    form.current?.reset()
    if (res?.id) onAdded?.(res.id)
  }

  return (
    <form ref={form} action={submit} className="flex flex-col gap-3">
      {error && <p className="alert-error" role="alert">{error}</p>}
      {groupId && <input type="hidden" name="group_id" value={groupId} />}
      {subjectId && <input type="hidden" name="subject_id" value={subjectId} />}
      <div>
        <label htmlFor={`res-url-${id}`} className="label">Link</label>
        <input id={`res-url-${id}`} name="url" type="url" inputMode="url" placeholder="https://youtube.com/watch?v=…" className="form-control" autoComplete="off" required />
        <p className="text-xs text-faint font-medium mt-1.5">YouTube videos and playlists fill in their own title.</p>
      </div>
      <div className={`grid gap-3 ${!subjectId && !groupId ? 'sm:grid-cols-2' : ''}`}>
        <div>
          <label htmlFor={`res-title-${id}`} className="label">Title <span className="font-normal text-faint">(optional)</span></label>
          <input id={`res-title-${id}`} name="title" type="text" placeholder="Normalisation explained…" className="form-control" autoComplete="off" maxLength={200} />
        </div>
        {!subjectId && !groupId && <SubjectSelect subjects={subjects} id={`res-subject-${id}`} />}
      </div>
      <SubmitButton className="btn btn-primary self-start"><PlusIcon size={16} weight="bold" aria-hidden="true" />Save to library</SubmitButton>
    </form>
  )
}
