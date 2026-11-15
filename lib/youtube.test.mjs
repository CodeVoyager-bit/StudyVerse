import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseYouTube, embedUrl } from './youtube.mjs'

test('recognises the common video link shapes', () => {
  for (const u of [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ?si=abc',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=42',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
  ]) assert.deepEqual(parseYouTube(u), { kind: 'video', id: 'dQw4w9WgXcQ' }, u)
})

test('playlists, video-in-playlist, and non-YouTube links', () => {
  assert.deepEqual(parseYouTube('https://www.youtube.com/playlist?list=PL123'), { kind: 'playlist', id: 'PL123' })
  assert.deepEqual(parseYouTube('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL9'), { kind: 'video', id: 'dQw4w9WgXcQ', list: 'PL9' })
  assert.equal(parseYouTube('https://vimeo.com/123'), null)
  assert.equal(parseYouTube('not a url'), null)
  assert.equal(parseYouTube('https://www.youtube.com/watch?v=short'), null)
})

test('embed URLs use the no-cookie domain', () => {
  assert.equal(embedUrl({ kind: 'video', id: 'dQw4w9WgXcQ' }), 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0')
  assert.match(embedUrl({ kind: 'playlist', id: 'PL1' }), /videoseries\?list=PL1/)
})
