import type { CSSProperties } from 'react'
import { createClient } from '@/utils/supabase/server'
import type { Quote } from '@/types/db'
import { randomIndex } from '@/lib/random'
import RefreshButton from './refresh-button'

export const metadata = { title: 'Quotes' }

export default async function QuotesPage() {
  const supabase = await createClient()
  const { count } = await supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('category', 'study')
  const i = randomIndex(count ?? 0)
  const { data } = count
    ? await supabase.from('quotes').select('*').eq('category', 'study').range(i, i).maybeSingle()
    : { data: null }
  const quote = data as Quote | null

  return (
    <div className="page grid place-items-center min-h-[78dvh]">
      {quote ? (
        <div className="relative w-full max-w-[760px]">
          <span aria-hidden="true" className="sticker absolute -top-7 -left-4 size-16 text-3xl bg-pink -rotate-12 z-10">💡</span>
          <figure key={quote.id} className="rise card tape bg-yellow -rotate-1 p-8 sm:p-12 shadow-[var(--shadow-pop)]" style={{ '--tape': 'var(--color-sky)' } as CSSProperties}>
            <blockquote className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.15]">“{quote.text}”</blockquote>
            {quote.author && <figcaption className="hand text-3xl mt-6">{quote.author}</figcaption>}
          </figure>
          <div className="flex justify-center mt-10"><RefreshButton /></div>
        </div>
      ) : (
        <p className="font-bold text-muted">No quotes yet. Run the first migration to add some.</p>
      )}
    </div>
  )
}
