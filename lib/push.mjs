// Web push reaches the browser vendor's push service. Only those hosts are ever contacted, so a forged
// subscription can't make the server POST to an internal address.
const PUSH_HOSTS = ['fcm.googleapis.com', 'push.services.mozilla.com', 'push.apple.com', 'notify.windows.com']

/** @param {string} endpoint */
export function isPushEndpoint(endpoint) {
  let url
  try { url = new URL(endpoint) } catch { return false }
  return url.protocol === 'https:' && PUSH_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))
}

/**
 * The morning reminder for one person, or null when there's nothing worth a notification.
 * @param {{ dueTasks: number, exams: { title: string, days: number }[], cardsDue: number }} p
 */
export function reminderText({ dueTasks, exams, cardsDue }) {
  const parts = []
  for (const e of exams.slice(0, 2)) parts.push(`${e.title} ${e.days <= 0 ? 'today' : e.days === 1 ? 'tomorrow' : `in ${e.days} days`}`)
  if (dueTasks) parts.push(`${dueTasks} ${dueTasks === 1 ? 'task' : 'tasks'} due today`)
  if (cardsDue) parts.push(`${cardsDue} ${cardsDue === 1 ? 'flashcard' : 'flashcards'} to review`)
  if (!parts.length) return null
  return { title: exams.length ? 'Exam coming up' : 'Your study day', body: parts.join(' · '), url: exams.length ? '/exams' : dueTasks ? '/task' : '/flashcards' }
}
