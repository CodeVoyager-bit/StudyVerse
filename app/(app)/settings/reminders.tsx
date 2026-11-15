'use client'

import { useEffect, useState, useSyncExternalStore, useTransition } from 'react'
import { BellRingingIcon, BellSlashIcon, PaperPlaneTiltIcon, DownloadSimpleIcon } from '@phosphor-icons/react/dist/ssr'
import { savePushSubscription, removePushSubscription, sendTestPush } from './actions'

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
const noop = () => () => {}
const keyBytes = (b64: string) => {
  const raw = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export function Reminders() {
  const supported = useSyncExternalStore(noop, () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window, () => true)
  const [on, setOn] = useState<boolean | null>(null)
  const [msg, setMsg] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.getRegistration().then((r) => r?.pushManager.getSubscription()).then((s) => setOn(!!s)).catch(() => setOn(false))
  }, [])

  const enable = () => startTransition(async () => {
    setMsg('')
    if ((await Notification.requestPermission()) !== 'granted') return setMsg('Notifications are blocked. Allow them for this site in your browser settings, then try again.')
    try {
      await navigator.serviceWorker.register('/sw.js')
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(KEY) })
      const res = await savePushSubscription(sub.toJSON())
      if (res?.error) return setMsg(res.error)
      setOn(true)
    } catch {
      setMsg('This browser couldn’t turn on push. On iPhone, add StudyVerse to your Home Screen first.')
    }
  })
  const disable = () => startTransition(async () => {
    const sub = await (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription()
    if (sub) {
      await removePushSubscription(sub.endpoint)
      await sub.unsubscribe()
    }
    setOn(false)
    setMsg('')
  })
  const test = () => startTransition(async () => {
    const res = await sendTestPush()
    setMsg(res?.error ?? 'Sent. It should pop up in a few seconds.')
  })

  if (!KEY) return <p className="font-medium text-muted">Reminders aren’t set up on this server yet.</p>
  if (!supported) return <p className="font-medium text-muted">This browser can’t show push notifications. On iPhone, add StudyVerse to your Home Screen and open it from there.</p>

  return (
    <div className="flex flex-col gap-3">
      <p className="font-medium">A short nudge each morning when an exam is close, a task is due or flashcards are waiting. Nothing on quiet days.</p>
      <div className="flex flex-wrap gap-2">
        {on ? (
          <>
            <button type="button" className="btn" onClick={disable} disabled={pending}><BellSlashIcon size={16} weight="bold" aria-hidden="true" />Turn off</button>
            <button type="button" className="btn btn-primary" onClick={test} disabled={pending}><PaperPlaneTiltIcon size={16} weight="bold" aria-hidden="true" />Send a test</button>
          </>
        ) : (
          <button type="button" className="btn btn-primary" onClick={enable} disabled={pending || on === null}><BellRingingIcon size={16} weight="bold" aria-hidden="true" />Turn on reminders</button>
        )}
      </div>
      {msg && <p className="text-sm font-bold" role="status">{msg}</p>}
    </div>
  )
}

type InstallPrompt = Event & { prompt: () => Promise<void> }

export function Install() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null)
  const installed = useSyncExternalStore(noop, () => window.matchMedia('(display-mode: standalone)').matches, () => false)
  useEffect(() => {
    const grab = (e: Event) => { e.preventDefault(); setPrompt(e as InstallPrompt) }
    window.addEventListener('beforeinstallprompt', grab)
    return () => window.removeEventListener('beforeinstallprompt', grab)
  }, [])

  if (installed) return <p className="font-bold">Installed. You’re using the app.</p>
  return (
    <div className="flex flex-col gap-3">
      <p className="font-medium">Put StudyVerse on your home screen. It opens full screen like an app and can send reminders.</p>
      {prompt ? (
        <button type="button" className="btn btn-primary self-start" onClick={() => prompt.prompt().then(() => setPrompt(null))}><DownloadSimpleIcon size={16} weight="bold" aria-hidden="true" />Install app</button>
      ) : (
        <ul className="text-sm font-medium list-disc pl-5 flex flex-col gap-1">
          <li><b>iPhone / iPad:</b> open in Safari, tap Share, then Add to Home Screen.</li>
          <li><b>Android / Chrome:</b> open the browser menu and choose Install app.</li>
        </ul>
      )}
    </div>
  )
}
