'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/utils/supabase/server'

export type Result = { error?: string } | undefined
const STATUSES = ['present', 'absent', 'cancelled'] as const
type Status = (typeof STATUSES)[number]

function refresh(subjectId: string) {
  revalidatePath('/attendance')
  revalidatePath('/subjects')
  revalidatePath(`/subjects/${subjectId}`)
  revalidatePath('/dashboard')
}

export async function markAttendance(subjectId: string, status: Status, classDate: string): Promise<Result> {
  if (!STATUSES.includes(status)) return { error: 'Unknown status.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(classDate)) return { error: 'Pick a date.' }
  const { supabase, uid } = await requireUser()
  const { error } = await supabase.from('attendance').insert({ user_id: uid, subject_id: subjectId, status, class_date: classDate })
  if (error) return { error: error.message }
  refresh(subjectId)
}

export async function undoAttendance(id: string, subjectId: string): Promise<Result> {
  const { supabase, uid } = await requireUser()
  const { error } = await supabase.from('attendance').delete().eq('id', id).eq('user_id', uid)
  if (error) return { error: error.message }
  refresh(subjectId)
}
