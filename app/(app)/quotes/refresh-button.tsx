'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { ShuffleIcon } from '@phosphor-icons/react/dist/ssr'

// The page picks a random quote on the server; refreshing re-runs that render.
export default function RefreshButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <button type="button" className="btn btn-primary btn-lg" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
      <ShuffleIcon size={20} weight="bold" className={pending ? 'animate-spin' : ''} aria-hidden="true" />{pending ? 'Shuffling…' : 'Another quote'}
    </button>
  )
}
