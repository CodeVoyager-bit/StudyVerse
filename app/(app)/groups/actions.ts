'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/utils/supabase/server'

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
  const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId)
  if (error) return { error: error.message }
  revalidatePath(`/groups/${groupId}`)
}

export async function updateGroup(groupId: string, fd: FormData): Promise<Result> {
  const groupName = text(fd, 'name')
  const goalHours = Number(text(fd, 'goal_hours'))
  if (!groupName || groupName.length > 60) return { error: 'The name needs 1 to 60 characters.' }
  if (!(goalHours >= 1 && goalHours <= 160)) return { error: 'Set a weekly goal between 1 and 160 hours.' }
  const { supabase, uid } = await requireUser()
  const { error } = await supabase
    .from('study_groups')
    .update({ name: groupName, description: text(fd, 'description').slice(0, 280) || null, weekly_goal_minutes: Math.round(goalHours * 60) })
    .eq('id', groupId)
    .eq('owner_id', uid)
  if (error) return { error: error.message }
  revalidatePath(`/groups/${groupId}`)
  revalidatePath('/groups')
}
