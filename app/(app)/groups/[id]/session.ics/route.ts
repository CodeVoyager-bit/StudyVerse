import { createClient } from '@/utils/supabase/server'
import { examsToIcs } from '@/lib/ics.mjs'
import { nextSession } from '@/lib/schedule.mjs'

// The group's planned session as a calendar event (weekly if it repeats), with a reminder 15 minutes before.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: group } = await supabase.from('study_groups').select('id, name, next_session_at, session_weekly').eq('id', id).maybeSingle()
  const at = group && nextSession(group.next_session_at, group.session_weekly, Date.now())
  if (!group || !at) return new Response('No session planned', { status: 404 })
  const ics = examsToIcs(
    [{ id: `${group.id}-session`, title: `${group.name} study session`, exam_at: at, location: `StudyVerse: open the group to join` }],
    new Date(),
    { hours: 1, trigger: '-PT15M', remind: (t: string) => `${t} starts in 15 minutes`, weekly: group.session_weekly },
  )
  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="study-session.ics"',
      'Cache-Control': 'private, no-store',
    },
  })
}
