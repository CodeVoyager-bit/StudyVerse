'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { PencilSimpleIcon, TrashIcon, PlusIcon, ClockIcon, FlagIcon, PlayCircleIcon } from '@phosphor-icons/react/dist/ssr'
import CheckButton from '@/app/components/CheckButton'
import type { Task, Priority, Subject, Resource } from '@/types/db'
import SubmitButton from '@/app/components/SubmitButton'
import SubjectSelect from '@/app/components/SubjectSelect'
import { CAT_TONE } from '@/lib/categories'
import { SPRING } from '@/app/components/motion'
import { isPast } from '@/lib/time'
import { addTask, updateTask, toggleTask, deleteTask, type Result } from './actions'

type Action = (fd: FormData) => Promise<Result>

const PRIORITY: Record<Priority, { label: string; chip: string }> = {
  high: { label: 'High', chip: 'chip chip-danger' },
  medium: { label: 'Medium', chip: 'chip chip-warning' },
  low: { label: 'Low', chip: 'chip' },
}

// ISO timestamp -> value for <input type="datetime-local"> in the viewer's local time
const toLocalInput = (iso: string | null | undefined) =>
  iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''
const fmtDue = (iso: string) => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

/** The user's subjects and library, for the optional pickers and the chips on each task. */
export type Links = { subjects: Subject[]; resources: Resource[] }
const NO_LINKS: Links = { subjects: [], resources: [] }

export function TaskRow({ task, onToggle, onEdit, onDelete, compact = false, links = NO_LINKS }: {
  task: Task
  onToggle: () => void
  onEdit?: () => void
  onDelete?: () => void
  compact?: boolean
  links?: Links
}) {
  const overdue = !task.completed && isPast(task.due_date)
  const p = PRIORITY[task.priority ?? 'medium']
  const subject = links.subjects.find((s) => s.id === task.subject_id)
  const resource = links.resources.find((r) => r.id === task.resource_id)
  return (
    <div className="group flex items-start gap-3 py-3">
      <CheckButton done={task.completed} onToggle={onToggle} title={task.title} />
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-[1.02rem] break-words transition-colors ${task.completed ? 'text-faint line-through decoration-2' : ''}`}>{task.title}</p>
        {!compact && task.description && <p className="text-sm text-muted mt-0.5 line-clamp-2 break-words">{task.description}</p>}
        {(task.due_date || !compact) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {task.due_date && (
              <span className={overdue ? 'chip chip-danger' : 'chip'} suppressHydrationWarning>
                <ClockIcon size={12} weight="bold" aria-hidden="true" />{overdue ? 'Overdue, ' : ''}{fmtDue(task.due_date)}
              </span>
            )}
            {!compact && <span className={p.chip}><FlagIcon size={12} weight="fill" aria-hidden="true" />{p.label}</span>}
            {subject && <span className={`chip ${CAT_TONE[subject.color] ?? ''}`}>{subject.name}</span>}
            {resource && (
              <a href={resource.url} target="_blank" rel="noopener noreferrer" className="chip hover:bg-yellow max-w-[16rem]">
                <PlayCircleIcon size={13} weight="fill" aria-hidden="true" /><span className="truncate">{resource.title}</span>
              </a>
            )}
          </div>
        )}
      </div>
      {compact && <span className={`${p.chip} mt-0.5`}><FlagIcon size={12} weight="fill" aria-hidden="true" />{p.label}</span>}
      {(onEdit || onDelete) && (
        <div className="flex gap-1 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
          {onEdit && <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onEdit} aria-label={`Edit "${task.title}"`}><PencilSimpleIcon size={16} aria-hidden="true" /></button>}
          {onDelete && <button type="button" className="btn btn-ghost btn-danger btn-icon btn-sm" onClick={onDelete} aria-label={`Delete "${task.title}"`}><TrashIcon size={16} aria-hidden="true" /></button>}
        </div>
      )}
    </div>
  )
}

function TaskForm({ task, action, onDone, autoFocus, links }: { task?: Task; action: Action; onDone: () => void; autoFocus?: boolean; links: Links }) {
  const [error, setError] = useState('')
  const id = task?.id ?? 'new'

  const submit = async (fd: FormData) => {
    const local = fd.get('due_date')
    if (local) fd.set('due_date', new Date(String(local)).toISOString()) // local -> UTC before it leaves the browser
    const res = await action(fd)
    if (res?.error) return setError(res.error)
    setError('')
    onDone()
  }

  return (
    <form action={submit} className="flex flex-col gap-3 py-3">
      {error && <p className="alert-error" role="alert">{error}</p>}
      <div>
        <label htmlFor={`title-${id}`} className="label">Task</label>
        <input id={`title-${id}`} name="title" type="text" placeholder="Finish the DBMS assignment…" defaultValue={task?.title} className="form-control" autoComplete="off" autoFocus={autoFocus} required />
      </div>
      <div>
        <label htmlFor={`desc-${id}`} className="label">Details <span className="font-normal text-faint">(optional)</span></label>
        <textarea id={`desc-${id}`} name="description" placeholder="Chapters 3 and 4, submit on the portal…" defaultValue={task?.description ?? ''} className="form-control" rows={2} autoComplete="off" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={`due-${id}`} className="label">Due</label>
          <input id={`due-${id}`} name="due_date" type="datetime-local" defaultValue={toLocalInput(task?.due_date)} className="form-control" />
        </div>
        <div>
          <label htmlFor={`prio-${id}`} className="label">Priority</label>
          <select id={`prio-${id}`} name="priority" defaultValue={task?.priority ?? 'medium'} className="form-control">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        {links.subjects.length > 0 && <SubjectSelect subjects={links.subjects} id={`subj-${id}`} defaultValue={task?.subject_id} />}
        {links.resources.length > 0 && (
          <div>
            <label htmlFor={`res-${id}`} className="label">Watch or read <span className="font-normal text-faint">(optional)</span></label>
            <select id={`res-${id}`} name="resource_id" defaultValue={task?.resource_id ?? ''} className="form-control">
              <option value="">Nothing from the library</option>
              {links.resources.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3 pt-1">
        <button type="button" className="btn btn-ghost" onClick={onDone}>Cancel</button>
        <SubmitButton className="btn btn-primary">{task ? 'Save changes' : 'Add task'}</SubmitButton>
      </div>
    </form>
  )
}

type Change = { id: string; patch?: Partial<Task>; remove?: boolean }

/** Optimistic toggle/delete so the list reacts on tap; the server action catches up in the background. */
export function useTaskMutations(tasks: Task[]) {
  const [items, apply] = useOptimistic(tasks, (state, c: Change) =>
    c.remove ? state.filter((t) => t.id !== c.id) : state.map((t) => (t.id === c.id ? { ...t, ...c.patch } : t)),
  )
  const [, startTransition] = useTransition()
  const toggle = (t: Task) =>
    startTransition(async () => {
      apply({ id: t.id, patch: { completed: !t.completed } })
      await toggleTask(t.id, !t.completed)
    })
  const remove = (t: Task) => {
    if (!confirm(`Delete "${t.title}"? This can't be undone.`)) return
    startTransition(async () => {
      apply({ id: t.id, remove: true })
      await deleteTask(t.id)
    })
  }
  return { items, toggle, remove }
}

export default function TaskList({ tasks, emptyText, links = NO_LINKS }: { tasks: Task[]; emptyText: string; links?: Links }) {
  const { items, toggle, remove } = useTaskMutations(tasks)
  const [editing, setEditing] = useState<string | null>(null)
  const [composing, setComposing] = useState(false)
  const sorted = [...items].sort((a, b) => Number(a.completed) - Number(b.completed))

  return (
    <div className="flex flex-col gap-4">
      {composing ? (
        <div className="card py-1"><TaskForm action={addTask} onDone={() => setComposing(false)} autoFocus links={links} /></div>
      ) : (
        <button type="button" onClick={() => setComposing(true)} className="card card-link flex items-center gap-3 text-left font-bold py-3.5">
          <span className="grid place-items-center size-8 rounded-full bg-yellow border-2 border-ink"><PlusIcon size={16} weight="bold" aria-hidden="true" /></span>
          Add a task…
        </button>
      )}

      {sorted.length === 0 ? (
        <div className="card flex flex-col items-center text-center gap-3 py-12 bg-surface">
          <span className="sticker size-20 text-4xl bg-yellow -rotate-6 wiggle" aria-hidden="true">🎉</span>
          <p className="text-xl font-extrabold mt-2">{emptyText}</p>
          <p className="text-muted font-medium">Tasks you add show up here, soonest first.</p>
        </div>
      ) : (
        <ul className="card py-0 px-4 divide-y-2 divide-dashed divide-line-strong">
          <AnimatePresence initial={false} mode="popLayout">
            {sorted.map((t) => (
              <motion.li
                key={t.id}
                layout="position"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
                transition={SPRING}
              >
                {editing === t.id ? (
                  <TaskForm task={t} action={updateTask.bind(null, t.id)} onDone={() => setEditing(null)} links={links} />
                ) : (
                  <TaskRow task={t} onToggle={() => toggle(t)} onEdit={() => setEditing(t.id)} onDelete={() => remove(t)} links={links} />
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
