'use client'

import { useState } from 'react'
import { FilmSlateIcon, XIcon } from '@phosphor-icons/react/dist/ssr'
import type { Resource } from '@/types/db'
import { parseYouTube, embedUrl } from '@/lib/youtube.mjs'

/** A lecture or playlist next to the timer: pick one from the library or paste any YouTube link. */
export default function StudyVideo({ resources }: { resources: Resource[] }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const yt = url ? parseYouTube(url) : null

  const choose = (raw: string) => {
    if (raw && !parseYouTube(raw)) return setError('That isn’t a YouTube video or playlist link.')
    setError('')
    setUrl(raw)
  }

  return (
    <section className="card mt-5 flex flex-col gap-3" aria-labelledby="sv-h">
      <h2 id="sv-h" className="text-lg font-extrabold flex items-center gap-2"><FilmSlateIcon size={20} weight="fill" aria-hidden="true" />Study with a video</h2>
      {yt ? (
        <>
          <div className="relative aspect-video rounded-[12px] border-2 border-ink overflow-hidden bg-ink">
            <iframe src={embedUrl(yt)} title="Study video" className="absolute inset-0 size-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
          <button type="button" className="btn btn-sm self-start" onClick={() => setUrl('')}><XIcon size={14} weight="bold" aria-hidden="true" />Close video</button>
        </>
      ) : (
        <form className="grid gap-3 sm:grid-cols-[1fr_auto] items-end" onSubmit={(e) => { e.preventDefault(); choose(String(new FormData(e.currentTarget).get('url') ?? '').trim()) }}>
          {resources.length > 0 && (
            <div className="sm:col-span-2">
              <label htmlFor="sv-pick" className="label">From your library</label>
              <select id="sv-pick" className="form-control" defaultValue="" onChange={(e) => choose(e.target.value)}>
                <option value="">Pick a video…</option>
                {resources.map((r) => <option key={r.id} value={r.url}>{r.title}</option>)}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="sv-url" className="label">{resources.length ? 'Or paste a link' : 'YouTube link'}</label>
            <input id="sv-url" name="url" type="url" inputMode="url" placeholder="https://youtube.com/watch?v=…" className="form-control" autoComplete="off" required />
          </div>
          <button type="submit" className="btn">Play</button>
          {error && <p className="alert-error sm:col-span-2" role="alert">{error}</p>}
        </form>
      )}
    </section>
  )
}
