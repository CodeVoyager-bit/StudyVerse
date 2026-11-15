import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getMyResources } from '@/utils/data'
import Timer from './timer'
import StudyVideo from './study-video'

export const metadata = { title: 'Focus' }

export default async function FocusPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/pomodoro')
  const videos = (await getMyResources(supabase, user.id)).filter((r) => r.kind === 'video' || r.kind === 'playlist')
  return <Timer video={<StudyVideo resources={videos} />} />
}
