import webpush from 'web-push'
import { isPushEndpoint } from '@/lib/push.mjs'

export type PushRow = { endpoint: string; p256dh: string; auth: string; user_id?: string }
export type PushPayload = { title: string; body: string; url?: string; tag?: string }

export const pushConfigured = () => !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)

let ready = false

/** Sends to each subscription; returns the endpoints the push service says are gone, so callers can delete them. */
export async function sendPush(subs: PushRow[], payload: PushPayload) {
  if (!ready) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'https://studyverse.app', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!)
    ready = true
  }
  const valid = subs.filter((s) => isPushEndpoint(s.endpoint))
  const results = await Promise.allSettled(
    valid.map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 12 * 3600 })),
  )
  const gone = valid.filter((_, i) => {
    const r = results[i]
    return r.status === 'rejected' && [404, 410].includes((r.reason as { statusCode?: number })?.statusCode ?? 0)
  })
  return { sent: results.filter((r) => r.status === 'fulfilled').length, gone: gone.map((s) => s.endpoint) }
}
