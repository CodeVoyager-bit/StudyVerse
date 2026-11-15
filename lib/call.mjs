// Meeting links a group can share as its call. Mirrors the check constraint in migration 0004.
const CALL_RE = /^https:\/\/(meet\.google\.com|meet\.jit\.si|([a-z0-9-]+\.)?zoom\.us|teams\.microsoft\.com|teams\.live\.com|discord\.gg|discord\.com)\/\S*$/i

/** @param {string} url */
export function isCallLink(url) {
  return url.length <= 300 && CALL_RE.test(url)
}

/** Button label for a call link, e.g. "Join Google Meet". @param {string} url */
export function callLabel(url) {
  const host = new URL(url).hostname
  if (host === 'meet.google.com') return 'Join Google Meet'
  if (host.endsWith('zoom.us')) return 'Join Zoom'
  if (host.startsWith('teams.')) return 'Join Teams'
  if (host.startsWith('discord')) return 'Join Discord'
  return 'Join Jitsi call'
}
