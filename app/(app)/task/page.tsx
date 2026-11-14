import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import type { Task } from '@/types/db'
import { nowIso, inHoursIso } from '@/lib/time'
import { Segmented } from '@/app/components/motion'
import TaskList from './task-list'

export const metadata = { title: 'Tasks' }

const FILTERS = [
  { key: 'all', label: 'All', empty: 'No tasks yet' },
  { key: 'soon', label: 'Due soon', empty: 'Nothing due in the next 24 hours' },
  { key: 'overdue', label: 'Overdue', empty: 'Nothing overdue. Nice.' },
  { key: 'done', label: 'Done', empty: 'Nothing finished yet' },
]

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter: raw } = await searchParams
  const filter = FILTERS.find((f) => f.key === raw) ?? FILTERS[0]
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/task')

  let query = supabase.from('tasks').select('*').eq('user_id', user.id)
  if (filter.key === 'soon') query = query.eq('completed', false).lte('due_date', inHoursIso(24))
  else if (filter.key === 'overdue') query = query.eq('completed', false).lt('due_date', nowIso())
  else if (filter.key === 'done') query = query.eq('completed', true)

  const { data, error } = await query
    .order('completed')
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  const tasks = (data ?? []) as Task[]
  const open = tasks.filter((t) => !t.completed).length

  return (
    <div className="page max-w-[820px]">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title"><span className="hl">Tasks</span></h1>
          <p className="page-sub">{open === 0 ? 'All clear. Nice.' : `${open} to go. You got this.`}</p>
        </div>
        <Segmented
          id="task-filter"
          label="Filter tasks"
          active={filter.key}
          items={FILTERS.map((f) => ({ key: f.key, label: f.label, href: f.key === 'all' ? '/task' : `/task?filter=${f.key}` }))}
        />
      </header>
      <TaskList key={filter.key} tasks={tasks} emptyText={filter.empty} />
    </div>
  )
}
