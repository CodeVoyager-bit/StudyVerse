'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/utils/supabase/server'
import { CATEGORIES } from '@/lib/categories'

export type Result = { error?: string } | undefined

const int = (fd: FormData, key: string) => Number.parseInt(String(fd.get(key) ?? ''), 10)

export async function addBlock(fd: FormData): Promise<Result> {
  const weekday = int(fd, 'weekday')
  const start_min = int(fd, 'start_min')
  const end_min = int(fd, 'end_min')
  const subject = String(fd.get('subject') ?? '').trim()
  const color = String(fd.get('color') ?? 'blue')
  if (!subject) return { error: 'Give the block a subject.' }
  if (!(weekday >= 0 && weekday <= 6)) return { error: 'Pick a day.' }
  if (!(start_min >= 0 && end_min <= 1440 && end_min > start_min)) return { error: 'End time must be after start time.' }
  if (!(CATEGORIES as readonly string[]).includes(color)) return { error: 'Pick a colour.' }

  const { supabase, uid } = await requireUser()
  const { error } = await supabase.from('planner_blocks').insert({ user_id: uid, weekday, start_min, end_min, subject, color })
  if (error) return { error: error.message }
  revalidatePath('/planner')
  revalidatePath('/dashboard')
}

export async function deleteBlock(id: string): Promise<Result> {
  const { supabase, uid } = await requireUser()
  const { error } = await supabase.from('planner_blocks').delete().eq('id', id).eq('user_id', uid)
  if (error) return { error: error.message }
  revalidatePath('/planner')
  revalidatePath('/dashboard')
}
