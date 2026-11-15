import type { SupabaseClient } from '@supabase/supabase-js'
import type { Subject, Resource } from '@/types/db'

// Small shared reads used by several pages. Errors (e.g. before migration 0003 runs) just mean "nothing yet".
export async function getSubjects(supabase: SupabaseClient, uid: string) {
  const { data } = await supabase.from('subjects').select('*').eq('user_id', uid).order('name')
  return (data ?? []) as Subject[]
}

/**
 * subject_id / resource_id from a form, only for the pickers the form actually rendered. Forms show the pickers only
 * once the user has subjects or library items, so saving still works on a database that hasn't run migration 0003.
 */
export function linkFields(fd: FormData) {
  const out: { subject_id?: string | null; resource_id?: string | null } = {}
  for (const key of ['subject_id', 'resource_id'] as const) {
    if (fd.has(key)) out[key] = String(fd.get(key)).trim() || null
  }
  return out
}

export async function getMyResources(supabase: SupabaseClient, uid: string) {
  const { data } = await supabase.from('resources').select('*').eq('user_id', uid).is('group_id', null).order('created_at', { ascending: false })
  return (data ?? []) as Resource[]
}
