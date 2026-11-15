import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getSubjects } from '@/utils/data'
import { daysAgoIso } from '@/lib/time'
import type { Exam } from '@/types/db'
import ExamBoard from './exam-board'

export const metadata = { title: 'Exams' }

export default async function ExamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/exams')

  const [subjects, { data }] = await Promise.all([
    getSubjects(supabase, user.id),
    // Keep exams from the last day visible so one that's in progress doesn't vanish.
    supabase.from('exams').select('*').eq('user_id', user.id).gte('exam_at', daysAgoIso(1)).order('exam_at'),
  ])
  const exams = (data ?? []) as Exam[]

  return (
    <div className="page">
      <header className="mb-6">
        <h1 className="page-title"><span className="hl" style={{ '--hl': 'var(--color-pink)' } as React.CSSProperties}>Exams</span></h1>
        <p className="page-sub">{exams.length ? `${exams.length} coming up. One day at a time.` : 'Countdowns for every exam, with calendar reminders.'}</p>
      </header>
      <ExamBoard exams={exams} subjects={subjects} />
    </div>
  )
}
