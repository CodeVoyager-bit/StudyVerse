const WEEK = 7 * 86_400_000
const GRACE = 2 * 3_600_000 // a session stays "current" for two hours after it starts

/**
 * When a group's planned session next happens. Weekly sessions roll forward a week at a time;
 * a one-off session disappears two hours after it started.
 * @param {string | null | undefined} iso
 * @param {boolean} weekly
 * @param {number} now ms
 * @returns {string | null}
 */
export function nextSession(iso, weekly, now) {
  if (!iso) return null
  let at = Date.parse(iso)
  if (Number.isNaN(at)) return null
  if (at + GRACE >= now) return new Date(at).toISOString()
  if (!weekly) return null
  at += Math.ceil((now - GRACE - at) / WEEK) * WEEK
  return new Date(at).toISOString()
}
