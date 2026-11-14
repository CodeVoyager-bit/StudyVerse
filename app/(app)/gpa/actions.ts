'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/utils/supabase/server'
import { SCALES } from '@/lib/gpa.mjs'
import type { Course } from '@/types/db'

export async function saveGpa(scale: string, semesters: Course[][]) {
  if (!(scale in SCALES)) return { error: 'Unknown grade scale.' }
  const clean = semesters
    .slice(0, 20)
    .map((sem) => sem.slice(0, 30).map((c) => ({ credits: String(c.credits ?? ''), grade: String(c.grade ?? '') })))
  const { supabase, uid } = await requireUser()
  const { error } = await supabase
    .from('gpa_profiles')
    .upsert({ user_id: uid, scale, semesters: clean, updated_at: new Date().toISOString() })
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
}
