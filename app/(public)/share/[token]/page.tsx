import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import type { Resource } from '@/types/db'
import ResourceCard from '@/app/components/ResourceCard'

type Shared = { name: string; color: string; resources: Pick<Resource, 'title' | 'url' | 'kind' | 'author' | 'thumbnail_url'>[] }

async function load(token: string) {
  const supabase = await createClient()
  const { data } = await supabase.rpc('shared_subject', { p_token: token })
  return data as Shared | null
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const shared = await load((await params).token)
  return { title: shared ? `${shared.name} library` : 'Shared library', robots: { index: false } }
}

// Read-only view of a subject library someone chose to share. The token is the only key.
export default async function SharedLibraryPage({ params }: { params: Promise<{ token: string }> }) {
  const shared = await load((await params).token)
  if (!shared) notFound()

  return (
    <div className="page">
      <header className="mb-8">
        <p className="hand text-2xl">A classmate shared their library</p>
        <h1 className="page-title break-words"><span className="hl">{shared.name}</span></h1>
        <p className="page-sub">{shared.resources.length} {shared.resources.length === 1 ? 'video or link' : 'videos and links'}, picked for this subject.</p>
      </header>
      {shared.resources.length === 0 ? (
        <p className="font-bold text-muted">Nothing here yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {shared.resources.map((r, i) => (
            <ResourceCard key={i} resource={{ ...r, id: String(i), user_id: '', subject_id: null, group_id: null, watched: false, created_at: '' }} canEdit={false} />
          ))}
        </div>
      )}
      <div className="card bg-yellow mt-10 flex flex-wrap items-center justify-between gap-4">
        <p className="font-extrabold text-lg">Keep your own library, tasks and study groups in StudyVerse.</p>
        <Link href="/register" className="btn btn-primary">Start free</Link>
      </div>
    </div>
  )
}
