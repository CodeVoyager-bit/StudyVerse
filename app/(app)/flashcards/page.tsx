import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getSubjects } from '@/utils/data'
import { nowIso } from '@/lib/time'
import type { Flashcard } from '@/types/db'
import ReviewDeck from './review-deck'
import CardManager from './card-manager'

export const metadata = { title: 'Flashcards' }

export default async function FlashcardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/flashcards')

  const [subjects, { data }] = await Promise.all([
    getSubjects(supabase, user.id),
    supabase.from('flashcards').select('*').eq('user_id', user.id).order('due_at'),
  ])
  const cards = (data ?? []) as Flashcard[]
  const now = nowIso()
  const due = cards.filter((c) => Date.parse(c.due_at) <= Date.parse(now)).slice(0, 30)

  return (
    <div className="page">
      <header className="mb-6">
        <h1 className="page-title"><span className="hl">Flashcards</span></h1>
        <p className="page-sub">{cards.length ? `${due.length} due now, ${cards.length} in total.` : 'Testing yourself beats rereading. Make a few cards.'}</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] items-start">
        <section aria-label="Review"><ReviewDeck cards={due} /></section>
        <CardManager cards={cards} subjects={subjects} />
      </div>
    </div>
  )
}
