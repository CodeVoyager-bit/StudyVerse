/**
 * Recognise YouTube video and playlist links in their common shapes
 * (watch?v=, youtu.be/, /shorts/, /embed/, /live/, /playlist?list=). Anything else returns null.
 * @param {string} raw
 * @returns {{ kind: 'video', id: string, list?: string } | { kind: 'playlist', id: string } | null}
 */
export function parseYouTube(raw) {
  let url
  try { url = new URL(raw) } catch { return null }
  const host = url.hostname.replace(/^(www|m)\./, '')
  const list = url.searchParams.get('list') || undefined
  let id = null
  if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0]
  else if (['youtube.com', 'music.youtube.com', 'youtube-nocookie.com'].includes(host)) {
    if (url.pathname === '/watch') id = url.searchParams.get('v')
    else id = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/)?.[1] ?? null
  } else return null
  if (id && /^[\w-]{11}$/.test(id)) return list ? { kind: 'video', id, list } : { kind: 'video', id }
  if (list) return { kind: 'playlist', id: list }
  return null
}

/** Privacy-friendly embed URL (no cookies until the viewer presses play). */
export function embedUrl(yt) {
  return yt.kind === 'video'
    ? `https://www.youtube-nocookie.com/embed/${yt.id}?rel=0`
    : `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(yt.id)}&rel=0`
}
