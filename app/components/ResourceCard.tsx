'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { PlayIcon, ArrowSquareOutIcon, TrashIcon, FilePdfIcon, LinkSimpleIcon, XIcon } from '@phosphor-icons/react/dist/ssr'
import type { Resource, Subject } from '@/types/db'
import CheckButton from './CheckButton'
import { parseYouTube, embedUrl } from '@/lib/youtube.mjs'
import { CAT_TONE } from '@/lib/categories'
import { setWatched, deleteResource } from '@/app/(app)/resources/actions'

/** A saved video, playlist, PDF or link. Videos play inline in a privacy-friendly embed. */
export default function ResourceCard({ resource, subject, canEdit, extra }: {
  resource: Resource
  subject?: Subject
  canEdit: boolean
  extra?: React.ReactNode
}) {
  const [playing, setPlaying] = useState(false)
  const [watched, setLocalWatched] = useState(resource.watched)
  const [, startTransition] = useTransition()
  const yt = resource.kind === 'video' || resource.kind === 'playlist' ? parseYouTube(resource.url) : null

  const toggleWatched = () => {
    setLocalWatched(!watched)
    startTransition(async () => { await setWatched(resource.id, !watched) })
  }
  const remove = () => {
    if (!confirm(`Remove "${resource.title}" from the library?`)) return
    startTransition(async () => { await deleteResource(resource.id, resource.group_id) })
  }

  return (
    <article className="card p-0 overflow-hidden flex flex-col">
      {yt ? (
        playing ? (
          <div className="relative aspect-video bg-ink">
            <iframe
              src={`${embedUrl(yt)}&autoplay=1`}
              title={resource.title}
              className="absolute inset-0 size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button type="button" onClick={() => setPlaying(false)} className="absolute top-2 right-2 btn btn-sm btn-icon" aria-label="Close player">
              <XIcon size={16} weight="bold" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group relative block aspect-video bg-raised border-b-2 border-ink" aria-label={`Play ${resource.title}`}>
            {resource.thumbnail_url && (
              <Image src={resource.thumbnail_url} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
            )}
            <span className="absolute inset-0 grid place-items-center">
              <span className="sticker size-14 bg-pink transition-transform group-hover:scale-110"><PlayIcon size={24} weight="fill" aria-hidden="true" /></span>
            </span>
            {resource.kind === 'playlist' && <span className="absolute bottom-2 left-2 chip">Playlist</span>}
          </button>
        )
      ) : (
        <div className="grid place-items-center aspect-[3/1] bg-raised border-b-2 border-ink">
          {resource.kind === 'pdf' ? <FilePdfIcon size={40} weight="duotone" aria-hidden="true" /> : <LinkSimpleIcon size={40} weight="duotone" aria-hidden="true" />}
        </div>
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start gap-3">
          {canEdit && !resource.group_id && <CheckButton done={watched} onToggle={toggleWatched} title={resource.title} />}
          <div className="min-w-0 flex-1">
            <a href={resource.url} target="_blank" rel="noopener noreferrer" className={`font-extrabold leading-snug break-words hover:underline ${watched ? 'text-faint line-through' : ''}`}>
              {resource.title}<ArrowSquareOutIcon size={14} weight="bold" className="inline ml-1 -mt-0.5" aria-label="(opens in a new tab)" />
            </a>
            {resource.author && <p className="text-sm text-muted font-medium truncate">{resource.author}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-auto pt-1">
          {subject && <span className={`chip ${CAT_TONE[subject.color] ?? ''}`}>{subject.name}</span>}
          {extra}
          {canEdit && (
            <button type="button" onClick={remove} className="btn btn-danger btn-icon btn-sm ml-auto" aria-label={`Remove "${resource.title}"`}>
              <TrashIcon size={15} weight="bold" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
