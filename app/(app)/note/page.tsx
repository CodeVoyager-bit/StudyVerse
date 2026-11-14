import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/utils/supabase/server'
import type { Note } from '@/types/db'
import NoteList from './note-list'

export const metadata = { title: 'Notes' }

export default async function NotesPage({ searchParams }: { searchParams: Promise<{ q?: string; tag?: string }> }) {
  const params = await searchParams
  const q = (params.q ?? '').replace(/[,()%]/g, ' ').trim() // keep PostgREST's or() syntax intact
  const tag = (params.tag ?? '').trim().toLowerCase()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/note')

  let query = supabase.from('notes').select('*').eq('user_id', user.id)
  if (q) query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`)
  if (tag) query = query.contains('tags', [tag])

  const [{ data, error }, tagRows] = await Promise.all([
    query.order('updated_at', { ascending: false }),
    supabase.from('notes').select('tags').eq('user_id', user.id),
  ])
  if (error) throw new Error(error.message)
  const allTags = [...new Set(((tagRows.data ?? []) as { tags: string[] | null }[]).flatMap((r) => r.tags ?? []))].sort()
  const notes = (data ?? []) as Note[]

  return (
    <div className="page">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title"><span className="hl" style={{ '--hl': 'var(--color-pink)' } as React.CSSProperties}>Notes</span></h1>
          <p className="page-sub">{notes.length} {notes.length === 1 ? 'note' : 'notes'}{tag ? ` tagged #${tag}` : ''}{q ? ` matching “${q}”` : ''}</p>
        </div>
        <form className="relative w-full sm:w-72" role="search">
          {tag && <input type="hidden" name="tag" value={tag} />}
          <MagnifyingGlassIcon size={18} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" aria-hidden="true" />
          <input name="q" type="search" defaultValue={q} placeholder="Search notes…" className="form-control pl-10" aria-label="Search notes" autoComplete="off" />
        </form>
      </header>

      {allTags.length > 0 && (
        <nav className="flex flex-wrap gap-1.5 mb-6" aria-label="Filter by tag">
          {allTags.map((t) => (
            <Link key={t} href={t === tag ? '/note' : `/note?tag=${encodeURIComponent(t)}`} className={`chip ${t === tag ? 'bg-yellow' : 'hover:bg-yellow'} transition-colors`} aria-current={t === tag ? 'page' : undefined}>
              #{t}{t === tag && <XIcon size={11} weight="bold" aria-label="Clear tag" />}
            </Link>
          ))}
        </nav>
      )}

      <NoteList key={`${q}|${tag}`} notes={notes} filtered={!!(q || tag)} />
    </div>
  )
}
