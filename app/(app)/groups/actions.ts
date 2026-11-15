'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { pushConfigured, sendPush, type PushRow } from '@/utils/push'

export type Result = { error?: string } | undefined
const text = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim()

function name(fd: FormData) {
  const n = text(fd, 'display_name')
  if (!n) return { error: 'Pick the name your group will see.' }
  if (n.length > 40) return { error: 'Keep your name under 40 characters.' }
  return { name: n }
}

export async function createGroup(fd: FormData): Promise<Result> {
  const groupName = text(fd, 'name')
  const description = text(fd, 'description')
  if (!groupName) return { error: 'Name the group.' }
  if (groupName.length > 60) return { error: 'Keep the group name under 60 characters.' }
  if (description.length > 280) return { error: 'Keep the description under 280 characters.' }
  const n = name(fd)
  if ('error' in n) return n
  const { supabase } = await requireUser()
  const { data, error } = await supabase.rpc('create_group', { p_name: groupName, p_description: description, p_display_name: n.name })
  if (error) return { error: error.message }
  revalidatePath('/groups')
  redirect(`/groups/${data}`)
}

export async function joinGroup(fd: FormData): Promise<Result> {
  const code = text(fd, 'code').toUpperCase()
  if (!/^[A-Z0-9]{6,12}$/.test(code)) return { error: 'Invite codes are 8 letters and numbers, like 3F9A1C2B.' }
  const n = name(fd)
  if ('error' in n) return n
  const { supabase } = await requireUser()
  const { data, error } = await supabase.rpc('join_group', { p_code: code, p_display_name: n.name })
  if (error) return { error: error.message }
  revalidatePath('/groups')
  redirect(`/groups/${data}`)
}

export async function leaveGroup(groupId: string): Promise<Result> {
  const { supabase, uid } = await requireUser()
  const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', uid).neq('role', 'owner')
  if (error) return { error: error.message }
  revalidatePath('/groups')
  redirect('/groups')
}

export async function deleteGroup(groupId: string): Promise<Result> {
  const { supabase, uid } = await requireUser()
  const { error } = await supabase.from('study_groups').delete().eq('id', groupId).eq('owner_id', uid)
  if (error) return { error: error.message }
  revalidatePath('/groups')
  redirect('/groups')
}

export async function removeMember(groupId: string, userId: string): Promise<Result> {
  const { supabase, uid } = await requireUser()
  if (userId === uid) return { error: 'Owners delete the group instead of leaving it.' }
  // RLS lets only the owner delete someone else's row; zero rows back means this user isn't the owner.
  const { data, error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId).select('user_id')
  if (error) return { error: error.message }
  if (!data?.length) return { error: 'Only the group owner can remove members.' }
  revalidatePath(`/groups/${groupId}`)
}

export async function updateGroup(groupId: string, fd: FormData): Promise<Result> {
  const groupName = text(fd, 'name')
  const goalHours = Number(text(fd, 'goal_hours'))
  const next = text(fd, 'next_session_at')
  if (!groupName || groupName.length > 60) return { error: 'The name needs 1 to 60 characters.' }
  if (!(goalHours >= 1 && goalHours <= 160)) return { error: 'Set a weekly goal between 1 and 160 hours.' }
  if (next && Number.isNaN(Date.parse(next))) return { error: 'Pick a date and time for the next session.' }
  const { supabase, uid } = await requireUser()
  const { error } = await supabase
    .from('study_groups')
    .update({
      name: groupName,
      description: text(fd, 'description').slice(0, 280) || null,
      weekly_goal_minutes: Math.round(goalHours * 60),
      next_session_at: next || null,
      session_weekly: !!next && fd.get('session_weekly') === 'on',
    })
    .eq('id', groupId)
    .eq('owner_id', uid)
  if (error) return { error: error.message }
  revalidatePath(`/groups/${groupId}`)
  revalidatePath('/groups')
}

const NUDGE_EVERY_MS = 15 * 60_000
const AWAY_MS = 70_000

/**
 * "Focus is starting" push to members who aren't in the room and have reminders on.
 * At most one per group every 15 minutes; the server stamps nudged_at, which members can't write.
 */
export async function nudgeGroup(groupId: string, minutes: number): Promise<{ sent?: number }> {
  const { supabase, uid } = await requireUser()
  const { data: group } = await supabase.from('study_groups').select('name').eq('id', groupId).maybeSingle()
  const admin = createAdminClient()
  if (!group || !admin || !pushConfigured()) return {}

  const now = Date.now()
  const { data: claimed } = await admin
    .from('group_sessions')
    .update({ nudged_at: new Date(now).toISOString() })
    .eq('group_id', groupId)
    .or(`nudged_at.is.null,nudged_at.lt.${new Date(now - NUDGE_EVERY_MS).toISOString()}`)
    .select('group_id')
  if (!claimed?.length) return {}

  const { data: members } = await admin.from('group_members').select('user_id, display_name, last_seen').eq('group_id', groupId)
  const me = members?.find((m) => m.user_id === uid)
  const away = (members ?? []).filter((m) => m.user_id !== uid && (!m.last_seen || now - Date.parse(m.last_seen) > AWAY_MS)).map((m) => m.user_id)
  if (!away.length) return { sent: 0 }
  const { data: subs } = await admin.from('push_subscriptions').select('endpoint, p256dh, auth, user_id').in('user_id', away)
  const r = await sendPush((subs ?? []) as PushRow[], {
    title: group.name,
    body: `${me?.display_name ?? 'Someone'} started a ${Math.round(minutes)} min group focus. Join in.`,
    url: `/groups/${groupId}`,
    tag: `group-${groupId}`,
  })
  if (r.gone.length) await admin.from('push_subscriptions').delete().in('endpoint', r.gone)
  return { sent: r.sent }
}
