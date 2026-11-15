'use server'

import { requireUser } from '@/utils/supabase/server'
import { pushConfigured, sendPush, type PushRow } from '@/utils/push'
import { isPushEndpoint } from '@/lib/push.mjs'

export type Result = { error?: string; sent?: number } | undefined
type Sub = { endpoint?: string; keys?: { p256dh?: string; auth?: string } }

export async function savePushSubscription(sub: Sub): Promise<Result> {
  if (!sub.endpoint || !isPushEndpoint(sub.endpoint) || !sub.keys?.p256dh || !sub.keys.auth) return { error: 'This browser gave an unusable push subscription.' }
  const { supabase, uid } = await requireUser()
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ endpoint: sub.endpoint, user_id: uid, p256dh: sub.keys.p256dh, auth: sub.keys.auth }, { onConflict: 'endpoint' })
  if (error) return { error: error.message }
}

export async function removePushSubscription(endpoint: string): Promise<Result> {
  const { supabase, uid } = await requireUser()
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', uid)
  if (error) return { error: error.message }
}

export async function sendTestPush(): Promise<Result> {
  if (!pushConfigured()) return { error: 'Push keys are not set on the server yet.' }
  const { supabase, uid } = await requireUser()
  const { data } = await supabase.from('push_subscriptions').select('endpoint, p256dh, auth').eq('user_id', uid)
  if (!data?.length) return { error: 'Turn reminders on first.' }
  const r = await sendPush(data as PushRow[], { title: 'StudyVerse', body: 'Reminders are on. You’ll get a nudge each morning when something is due.', url: '/settings', tag: 'test' })
  if (r.gone.length) await supabase.from('push_subscriptions').delete().in('endpoint', r.gone).eq('user_id', uid)
  return r.sent ? { sent: r.sent } : { error: 'The push service refused it. Try turning reminders off and on again.' }
}
