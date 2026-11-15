'use client'

import type { Task } from '@/types/db'
import { TaskRow, useTaskMutations } from '../../task/task-list'

export default function SubjectTasks({ tasks }: { tasks: Task[] }) {
  const { items, toggle } = useTaskMutations(tasks)
  return (
    <ul className="divide-y-2 divide-dashed divide-line-strong">
      {items.map((t) => <li key={t.id}><TaskRow task={t} onToggle={() => toggle(t)} compact /></li>)}
    </ul>
  )
}
