'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/utils/supabase/server'
import { parseYouTube } from '@/lib/youtube.mjs'
import type { ResourceKind } from '@/types/db'

export type Result = { error?: string; id?: string } | undefined

const text = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim()

type YouTubeMeta = { title?: string; author_name?: string; thumbnail_url?: string }

// Title, channel and thumbnail from YouTube's public oEmbed endpoint (no API key). Only YouTube is ever fetched,
// never the user's arbitrary URL, so the server can't be pointed at internal addresses.
async function youtubeMeta(url: string): Promise<YouTubeMeta | null> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(5000),
    })
    return res.ok ? ((await res.json()) as YouTubeMeta) : null
  } catch {
    return null
  }
}

function refresh(groupId?: string | null) {
  revalidatePath('/resources')
  revalidatePath('/subjects', 'layout')
  revalidatePath('/pomodoro')
  if (groupId) revalidatePath(`/groups/${groupId}`)
}

export async function addResource(fd: FormData): Promise<Result> {
  const raw = text(fd, 'url')
  let title = text(fd, 'title')
  const subject_id = text(fd, 'subject_id') || null
  const group_id = text(fd, 'group_id') || null

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { error: 'That doesn’t look like a link. Paste the full address, starting with https://' }
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { error: 'Only web links (http or https) can be saved.' }

  const yt = parseYouTube(raw)
  const kind: ResourceKind = yt ? yt.kind : /\.pdf$/i.test(url.pathname) ? 'pdf' : 'link'
  let author: string | null = null
  let thumbnail_url: string | null = null
  if (yt) {
    const meta = await youtubeMeta(raw)
    if (meta) {
      title ||= meta.title ?? ''
      author = meta.author_name ?? null
      thumbnail_url = meta.thumbnail_url && new URL(meta.thumbnail_url).hostname === 'i.ytimg.com' ? meta.thumbnail_url : null
    }
  }
  title = (title || url.hostname.replace(/^www\./, '')).slice(0, 200)

  const { supabase, uid } = await requireUser()
  const { data, error } = await supabase
    .from('resources')
    .insert({ user_id: uid, subject_id, group_id, kind, url: url.toString(), title, author, thumbnail_url })
    .select('id')
    .single()
  if (error) return { error: error.message }
  refresh(group_id)
  return { id: data.id }
}

export async function setWatched(id: string, watched: boolean): Promise<Result> {
  const { supabase, uid } = await requireUser()
  const { error } = await supabase.from('resources').update({ watched }).eq('id', id).eq('user_id', uid)
  if (error) return { error: error.message }
  refresh()
}

export async function deleteResource(id: string, groupId?: string | null): Promise<Result> {
  const { supabase, uid } = await requireUser()
  const { error } = await supabase.from('resources').delete().eq('id', id).eq('user_id', uid)
  if (error) return { error: error.message }
  refresh(groupId)
}
