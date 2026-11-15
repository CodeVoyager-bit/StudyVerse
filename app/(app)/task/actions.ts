'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/utils/supabase/server'
import { linkFields } from '@/utils/data'

export type Result = { error?: string } | undefined

const text = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim()

const PRIORITIES = ['low', 'medium', 'high'] as const
type Priority = (typeof PRIORITIES)[number]

function parse(fd: FormData) {
  const title = text(fd, 'title')
  const due_date = text(fd, 'due_date') || null
  const priority = text(fd, 'priority') as Priority
  if (!title) return { error: 'Title is required.' }
  if (due_date && Number.isNaN(Date.parse(due_date))) return { error: 'Invalid due date.' }
  return {
    fields: {
      title,
      description: text(fd, 'description') || null,
      due_date,
      priority: PRIORITIES.includes(priority) ? priority : 'medium',
      ...linkFields(fd),
    },
  }
}

// Every mutation is scoped to the signed-in user (RLS enforces this too) and re-renders /task.
async function run(
  mutate: (ctx: Awaited<ReturnType<typeof requireUser>>) => PromiseLike<{ error: { message: string } | null }>,
): Promise<Result> {
  const { error } = await mutate(await requireUser())
  if (error) return { error: error.message }
  revalidatePath('/task')
  revalidatePath('/dashboard')
  revalidatePath('/subjects', 'layout')
}

export async function addTask(fd: FormData): Promise<Result> {
  const p = parse(fd)
  if ('error' in p) return p
  return run(({ supabase, uid }) => supabase.from('tasks').insert({ ...p.fields, user_id: uid, completed: false }))
}

export async function updateTask(id: string, fd: FormData): Promise<Result> {
  const p = parse(fd)
  if ('error' in p) return p
  return run(({ supabase, uid }) => supabase.from('tasks').update(p.fields).eq('id', id).eq('user_id', uid))
}

export async function toggleTask(id: string, completed: boolean): Promise<Result> {
  return run(({ supabase, uid }) => supabase.from('tasks').update({ completed }).eq('id', id).eq('user_id', uid))
}

export async function deleteTask(id: string): Promise<Result> {
  return run(({ supabase, uid }) => supabase.from('tasks').delete().eq('id', id).eq('user_id', uid))
}
