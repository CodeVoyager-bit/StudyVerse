import { createClient } from '@/utils/supabase/server'
import { examsToIcs } from '@/lib/ics.mjs'

// Downloads every upcoming exam as one calendar file (Google Calendar, Apple Calendar and Outlook all import it).
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Sign in first', { status: 401 })
  const { data } = await supabase.from('exams').select('id, title, exam_at, location').eq('user_id', user.id).gte('exam_at', new Date().toISOString())
  return new Response(examsToIcs(data ?? []), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="studyverse-exams.ics"',
      'Cache-Control': 'private, no-store',
    },
  })
}
