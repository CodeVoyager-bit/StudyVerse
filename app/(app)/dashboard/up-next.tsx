'use client'

import { AnimatePresence, motion } from 'motion/react'
import type { Task } from '@/types/db'
import { SPRING } from '@/app/components/motion'
import { TaskRow, useTaskMutations } from '@/app/(app)/task/task-list'

// Ticking a task off here removes it from the list with a short exit; the server catches up behind it.
export default function UpNext({ tasks }: { tasks: Task[] }) {
  const { items, toggle } = useTaskMutations(tasks)
  const open = items.filter((t) => !t.completed)
  if (open.length === 0) return <p className="font-bold text-muted py-6 text-center"><span className="text-2xl mr-2" aria-hidden="true">🎉</span>All done. Add a task when something comes up.</p>
  return (
    <ul className="divide-y-2 divide-dashed divide-line-strong -my-1">
      <AnimatePresence initial={false} mode="popLayout">
        {open.map((t) => (
          <motion.li key={t.id} layout="position" exit={{ opacity: 0, x: 12, transition: { duration: 0.2 } }} transition={SPRING}>
            <TaskRow task={t} onToggle={() => toggle(t)} compact />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}
