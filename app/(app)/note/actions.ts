'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/utils/supabase/server'

export type Result = { error?: string } | undefined

const text = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim()
const tags = (fd: FormData) =>
  [...new Set(text(fd, 'tags').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 10)

function parse(fd: FormData) {
  const fields = { title: text(fd, 'title'), content: text(fd, 'content'), tags: tags(fd) }
  if (!fields.title || !fields.content) return { error: 'Title and content are required.' }
  return { fields }
}

async function run(
  mutate: (ctx: Awaited<ReturnType<typeof requireUser>>) => PromiseLike<{ error: { message: string } | null }>,
): Promise<Result> {
  const { error } = await mutate(await requireUser())
  if (error) return { error: error.message }
  revalidatePath('/note')
  revalidatePath('/dashboard')
}

export async function addNote(fd: FormData): Promise<Result> {
  const p = parse(fd)
  if ('error' in p) return p
  return run(({ supabase, uid }) => supabase.from('notes').insert({ ...p.fields, user_id: uid }))
}

export async function updateNote(id: string, fd: FormData): Promise<Result> {
  const p = parse(fd)
  if ('error' in p) return p
  return run(({ supabase, uid }) =>
    supabase.from('notes').update({ ...p.fields, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', uid),
  )
}

export async function deleteNote(id: string): Promise<Result> {
  return run(({ supabase, uid }) => supabase.from('notes').delete().eq('id', id).eq('user_id', uid))
}
