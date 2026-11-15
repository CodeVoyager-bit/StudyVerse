'use client'

import { useState } from 'react'
import { PlusIcon, SignInIcon } from '@phosphor-icons/react/dist/ssr'
import SubmitButton from '@/app/components/SubmitButton'
import { createGroup, joinGroup } from './actions'

function NameField({ id, defaultName }: { id: string; defaultName: string }) {
  return (
    <div>
      <label htmlFor={id} className="label">Your name in the group</label>
      <input id={id} name="display_name" type="text" defaultValue={defaultName} maxLength={40} className="form-control" autoComplete="nickname" required />
    </div>
  )
}

export function CreateGroupForm({ defaultName }: { defaultName: string }) {
  const [error, setError] = useState('')
  return (
    <form action={async (fd) => setError((await createGroup(fd))?.error ?? '')} className="card flex flex-col gap-3">
      <h2 className="text-xl font-extrabold">Start a group</h2>
      {error && <p className="alert-error" role="alert">{error}</p>}
      <div>
        <label htmlFor="g-name" className="label">Group name</label>
        <input id="g-name" name="name" type="text" placeholder="DBMS crew…" maxLength={60} className="form-control" autoComplete="off" required />
      </div>
      <div>
        <label htmlFor="g-desc" className="label">What you study together <span className="font-normal text-faint">(optional)</span></label>
        <input id="g-desc" name="description" type="text" placeholder="Mid-sem prep, Tue and Thu evenings" maxLength={280} className="form-control" autoComplete="off" />
      </div>
      <NameField id="g-me" defaultName={defaultName} />
      <SubmitButton className="btn btn-primary self-start"><PlusIcon size={16} weight="bold" aria-hidden="true" />Create group</SubmitButton>
    </form>
  )
}

export function JoinGroupForm({ defaultName, code = '' }: { defaultName: string; code?: string }) {
  const [error, setError] = useState('')
  return (
    <form action={async (fd) => setError((await joinGroup(fd))?.error ?? '')} className="card bg-sky flex flex-col gap-3">
      <h2 className="text-xl font-extrabold">Join with a code</h2>
      {error && <p className="alert-error" role="alert">{error}</p>}
      <div>
        <label htmlFor="j-code" className="label">Invite code</label>
        <input id="j-code" name="code" type="text" defaultValue={code} placeholder="3F9A1C2B" maxLength={12} className="form-control font-mono uppercase tracking-widest" autoComplete="off" autoCapitalize="characters" spellCheck={false} required />
      </div>
      <NameField id="j-me" defaultName={defaultName} />
      <SubmitButton className="btn self-start"><SignInIcon size={16} weight="bold" aria-hidden="true" />Join group</SubmitButton>
    </form>
  )
}
