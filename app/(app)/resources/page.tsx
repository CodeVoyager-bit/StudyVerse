import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getSubjects, getMyResources } from '@/utils/data'
import ResourceCard from '@/app/components/ResourceCard'
import AddResourceForm from '@/app/components/AddResourceForm'

export const metadata = { title: 'Library' }

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ subject?: string; show?: string }> }) {
  const { subject: subjectFilter, show } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/resources')

  const [subjects, all] = await Promise.all([getSubjects(supabase, user.id), getMyResources(supabase, user.id)])
  const bySubject = new Map(subjects.map((s) => [s.id, s]))
  let resources = subjectFilter ? all.filter((r) => r.subject_id === subjectFilter) : all
  if (show === 'unwatched') resources = resources.filter((r) => !r.watched)
  const unwatched = all.filter((r) => !r.watched).length
  const q = (params: Record<string, string | undefined>) => {
    const u = new URLSearchParams(Object.entries({ subject: subjectFilter, show, ...params }).filter(([, v]) => v) as [string, string][])
    return u.size ? `/resources?${u}` : '/resources'
  }

  return (
    <div className="page">
      <header className="mb-6">
        <h1 className="page-title">Your <span className="hl" style={{ '--hl': 'var(--color-sky)' } as React.CSSProperties}>library</span></h1>
        <p className="page-sub">{all.length ? `${all.length} saved, ${unwatched} still to watch or read.` : 'Tutorials, lectures, PDFs and links, sorted by subject.'}</p>
      </header>

      <div className="card mb-6 max-w-[720px]"><AddResourceForm subjects={subjects} /></div>

      {all.length > 0 && (
        <nav className="flex flex-wrap gap-2 mb-6" aria-label="Filter library">
          <Link href={q({ subject: undefined })} className={`chip ${!subjectFilter ? 'bg-yellow' : 'hover:bg-yellow'}`} aria-current={!subjectFilter ? 'page' : undefined}>All subjects</Link>
          {subjects.map((s) => (
            <Link key={s.id} href={q({ subject: s.id })} className={`chip ${subjectFilter === s.id ? 'bg-yellow' : 'hover:bg-yellow'}`} aria-current={subjectFilter === s.id ? 'page' : undefined}>{s.name}</Link>
          ))}
          <Link href={q({ show: show === 'unwatched' ? undefined : 'unwatched' })} className={`chip ml-auto ${show === 'unwatched' ? 'bg-ink text-surface' : 'hover:bg-yellow'}`} aria-pressed={show === 'unwatched'}>Not done yet</Link>
        </nav>
      )}

      {resources.length === 0 ? (
        <div className="card flex flex-col items-center text-center gap-3 py-12">
          <span className="sticker size-20 text-4xl bg-sky -rotate-6 wiggle" aria-hidden="true">🎬</span>
          <p className="text-xl font-extrabold mt-2">{all.length ? 'Nothing matches that filter' : 'Your library is empty'}</p>
          <p className="text-muted font-medium max-w-[42ch]">Paste a YouTube lecture or any study link above. It shows up here, ready to play.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {resources.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              subject={r.subject_id ? bySubject.get(r.subject_id) : undefined}
              canEdit
            />
          ))}
        </div>
      )}
    </div>
  )
}
