'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/utils/supabase/server'

export type Result = { error?: string } | undefined
const text = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim()

export async function addExam(fd: FormData): Promise<Result> {
  const title = text(fd, 'title')
  const exam_at = text(fd, 'exam_at')
  if (!title) return { error: 'Name the exam.' }
  if (title.length > 120) return { error: 'Keep the name under 120 characters.' }
  if (!exam_at || Number.isNaN(Date.parse(exam_at))) return { error: 'Pick the date and time.' }
  const { supabase, uid } = await requireUser()
  const { error } = await supabase.from('exams').insert({
    user_id: uid,
    title,
    exam_at,
    location: text(fd, 'location').slice(0, 120) || null,
    subject_id: text(fd, 'subject_id') || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/exams')
  revalidatePath('/dashboard')
  revalidatePath('/subjects', 'layout')
}

export async function deleteExam(id: string): Promise<Result> {
  const { supabase, uid } = await requireUser()
  const { error } = await supabase.from('exams').delete().eq('id', id).eq('user_id', uid)
  if (error) return { error: error.message }
  revalidatePath('/exams')
  revalidatePath('/dashboard')
  revalidatePath('/subjects', 'layout')
}
