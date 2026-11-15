'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/utils/supabase/server'
import { CATEGORIES } from '@/lib/categories'

export type Result = { error?: string } | undefined

const text = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim()

function refresh(id?: string) {
  revalidatePath('/subjects')
  if (id) revalidatePath(`/subjects/${id}`)
  revalidatePath('/resources')
  revalidatePath('/attendance')
}

function parse(fd: FormData) {
  const name = text(fd, 'name')
  const color = text(fd, 'color') || 'blue'
  const target = Number.parseInt(text(fd, 'attendance_target') || '75', 10)
  if (!name) return { error: 'Give the subject a name.' }
  if (name.length > 60) return { error: 'Keep the name under 60 characters.' }
  if (!(CATEGORIES as readonly string[]).includes(color)) return { error: 'Pick one of the colours.' }
  if (!(target >= 1 && target <= 100)) return { error: 'The attendance target is a percentage from 1 to 100.' }
  return { fields: { name, color, attendance_target: target } }
}

export async function addSubject(fd: FormData): Promise<Result> {
  const p = parse(fd)
  if ('error' in p) return p
  const { supabase, uid } = await requireUser()
  const { error } = await supabase.from('subjects').insert({ ...p.fields, user_id: uid })
  if (error) return { error: error.message }
  refresh()
}

export async function updateSubject(id: string, fd: FormData): Promise<Result> {
  const p = parse(fd)
  if ('error' in p) return p
  const { supabase, uid } = await requireUser()
  const { error } = await supabase.from('subjects').update(p.fields).eq('id', id).eq('user_id', uid)
  if (error) return { error: error.message }
  refresh(id)
}

export async function deleteSubject(id: string): Promise<Result> {
  const { supabase, uid } = await requireUser()
  const { error } = await supabase.from('subjects').delete().eq('id', id).eq('user_id', uid)
  if (error) return { error: error.message }
  refresh()
}

/** Turning sharing on creates an unguessable link token; turning it off deletes the token, so old links stop working. */
export async function setSharing(id: string, on: boolean): Promise<Result> {
  const { supabase, uid } = await requireUser()
  const share_token = on ? crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8) : null
  const { error } = await supabase.from('subjects').update({ share_token }).eq('id', id).eq('user_id', uid)
  if (error) return { error: error.message }
  refresh(id)
}
