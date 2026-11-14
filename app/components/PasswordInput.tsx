'use client'

import { useState, type ChangeEvent } from 'react'
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react/dist/ssr'

/** Password field with a show/hide toggle. The toggle never submits the form and keeps focus in place. */
export default function PasswordInput({
  id, name, value, onChange, autoComplete, minLength, describedBy, invalid = false, onBlur,
}: {
  id: string
  name: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  autoComplete: 'current-password' | 'new-password'
  minLength?: number
  describedBy?: string
  invalid?: boolean
  onBlur?: () => void
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        id={id}
        name={name}
        className={`form-control pr-12 ${invalid ? '!border-danger' : ''}`}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
        autoCapitalize="none"
        spellCheck={false}
        minLength={minLength}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        required
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        onMouseDown={(e) => e.preventDefault()}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        aria-controls={id}
        className="absolute right-1 top-1/2 -translate-y-1/2 grid place-items-center size-10 rounded-[10px] text-ink hover:bg-yellow transition-colors"
      >
        {visible ? <EyeSlashIcon size={20} weight="bold" aria-hidden="true" /> : <EyeIcon size={20} weight="bold" aria-hidden="true" />}
      </button>
    </div>
  )
}
