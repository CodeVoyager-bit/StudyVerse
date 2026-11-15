import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import type { StudyGroup, GroupMember, GroupMessage, GroupSession, Resource } from '@/types/db'
import Room, { type BoardRow } from './room'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data } = await supabase.from('study_groups').select('name').eq('id', (await params).id).maybeSingle()
  return { title: data?.name ?? 'Study group' }
}

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/groups/${id}`)

  // RLS returns the group only to its members, so this doubles as the membership check.
  const { data: group } = await supabase.from('study_groups').select('*').eq('id', id).maybeSingle<StudyGroup>()
  if (!group) notFound()

  const [members, messages, session, resources, board] = await Promise.all([
    supabase.from('group_members').select('*').eq('group_id', id).order('joined_at'),
    supabase.from('group_messages').select('*').eq('group_id', id).order('created_at', { ascending: false }).limit(80),
    supabase.from('group_sessions').select('*').eq('group_id', id).maybeSingle<GroupSession>(),
    supabase.from('resources').select('*').eq('group_id', id).order('created_at', { ascending: false }),
    supabase.rpc('group_focus_week', { gid: id }),
  ])
  const h = await headers()
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`

  return (
    <Room
      group={group}
      me={user.id}
      initialMembers={(members.data ?? []) as GroupMember[]}
      initialMessages={((messages.data ?? []) as GroupMessage[]).reverse()}
      initialSession={session.data ?? { group_id: id, phase: 'work', minutes: 25, ends_at: null, paused_seconds: null, started_by: null, updated_at: '' }}
      resources={(resources.data ?? []) as Resource[]}
      initialBoard={(board.data ?? []) as BoardRow[]}
      inviteUrl={`${origin}/groups/join?code=${group.invite_code}`}
    />
  )
}
