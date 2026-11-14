'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'

export default function SubmitButton({ children, className = 'btn btn-primary' }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={className} disabled={pending}>
      {children}
    </button>
  )
}
