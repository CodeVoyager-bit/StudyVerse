'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/utils/supabase/server'

export async function logSession(minutes: number, kind: 'work' | 'break') {
  if (!Number.isInteger(minutes) || minutes <= 0 || minutes > 600) return { error: 'Invalid session length.' }
  const { supabase, uid } = await requireUser()
  const { error } = await supabase.from('pomodoro_sessions').insert({
    user_id: uid,
    minutes,
    kind,
    started_at: new Date(Date.now() - minutes * 60_000).toISOString(),
  })
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
}
