/** Turns Supabase auth errors into something a person can act on. */
export function authMessage(error: { name?: string; message: string }, fallbackHint = 'Try again.') {
  if (error.name === 'AuthRetryableFetchError' || /failed to fetch|network|load failed/i.test(error.message)) {
    return 'Couldn’t reach the StudyVerse server. Check your internet connection and try again in a minute.'
  }
  return `${error.message.replace(/\.$/, '')}. ${fallbackHint}`
}
