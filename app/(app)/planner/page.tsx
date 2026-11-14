import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import type { PlannerBlock } from '@/types/db'
import WeekGrid from './week-grid'

export const metadata = { title: 'Planner' }

export default async function PlannerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/planner')

  const { data, error } = await supabase.from('planner_blocks').select('*').eq('user_id', user.id).order('start_min')
  if (error) throw new Error(`${error.message}. Run supabase/migrations/0002_v2.sql first.`)
  const blocks = (data ?? []) as PlannerBlock[]
  const hours = blocks.reduce((sum, b) => sum + (b.end_min - b.start_min), 0) / 60

  return (
    <div className="page max-w-[1200px]">
      <header className="mb-6">
        <h1 className="page-title">Your <span className="hl" style={{ '--hl': 'var(--color-sky)' } as React.CSSProperties}>week</span></h1>
        <p className="page-sub">{blocks.length ? `${hours % 1 ? hours.toFixed(1) : hours} hours of study planned this week` : 'Block out your study week.'}</p>
      </header>
      <WeekGrid blocks={blocks} />
    </div>
  )
}
