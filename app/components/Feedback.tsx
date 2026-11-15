'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CheckCircleIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react/dist/ssr'

type Ask = { title: string; body?: string; confirmLabel?: string; danger?: boolean }
type Tone = 'ok' | 'error' | 'info'
type Toast = { id: number; text: string; tone: Tone }
type Feedback = { confirm: (ask: Ask) => Promise<boolean>; toast: (text: string, tone?: Tone) => void }

const Ctx = createContext<Feedback | null>(null)

/** In-app confirm dialog and toasts, replacing the browser's own confirm() and alert() boxes. */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const resolver = useRef<((ok: boolean) => void) | null>(null)
  const nextId = useRef(0)
  const [ask, setAsk] = useState<Ask | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  const confirm = useCallback((a: Ask) => new Promise<boolean>((resolve) => {
    resolver.current?.(false)
    resolver.current = resolve
    setAsk(a)
  }), [])

  // Native <dialog>: focus moves inside, Esc closes, and the page behind can't be clicked.
  useEffect(() => {
    if (ask && dialog.current && !dialog.current.open) dialog.current.showModal()
  }, [ask])

  const settle = (ok: boolean) => {
    resolver.current?.(ok)
    resolver.current = null
    if (dialog.current?.open) dialog.current.close()
    setAsk(null)
  }

  const toast = useCallback((text: string, tone: Tone = 'ok') => {
    const id = ++nextId.current
    setToasts((t) => [...t.slice(-2), { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 6000 : 3500)
  }, [])

  const value = useMemo(() => ({ confirm, toast }), [confirm, toast])

  return (
    <Ctx.Provider value={value}>
      {children}
      <dialog
        ref={dialog}
        onClose={() => settle(false)}
        onClick={(e) => e.target === dialog.current && settle(false)}
        aria-labelledby="confirm-title"
        className="m-auto w-[calc(100%-2rem)] max-w-[420px] rounded-[20px] border-2 border-ink bg-surface p-0 text-ink shadow-[6px_6px_0_var(--color-edge)] backdrop:bg-ink/45"
      >
        {ask && (
          <div className="rise p-6 flex flex-col gap-4">
            <h2 id="confirm-title" className="text-xl font-extrabold leading-tight break-words">{ask.title}</h2>
            {ask.body && <p className="font-medium text-muted">{ask.body}</p>}
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <button type="button" className="btn btn-ghost" onClick={() => settle(false)} autoFocus>Cancel</button>
              <button type="button" className={`btn ${ask.danger ? 'bg-danger text-white hover:!bg-danger' : 'btn-primary'}`} onClick={() => settle(true)}>
                {ask.confirmLabel ?? 'OK'}
              </button>
            </div>
          </div>
        )}
      </dialog>
      <div className="fixed z-[70] left-1/2 -translate-x-1/2 bottom-24 lg:bottom-6 flex flex-col items-center gap-2 w-[calc(100%-2rem)] max-w-[440px] pointer-events-none" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`rise pointer-events-auto flex items-center gap-2.5 w-full rounded-[14px] border-2 border-ink px-4 py-3 font-bold shadow-[4px_4px_0_var(--color-edge)] ${t.tone === 'error' ? 'bg-danger-soft text-danger' : t.tone === 'info' ? 'bg-sky' : 'bg-mint'}`}>
            {t.tone === 'error' ? <WarningCircleIcon size={20} weight="fill" className="shrink-0" aria-hidden="true" /> : <CheckCircleIcon size={20} weight="fill" className="shrink-0" aria-hidden="true" />}
            <span className="flex-1 break-words">{t.text}</span>
            <button type="button" onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))} className="shrink-0 opacity-70 hover:opacity-100" aria-label="Dismiss">
              <XIcon size={16} weight="bold" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useFeedback() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useFeedback needs <FeedbackProvider>')
  return ctx
}
