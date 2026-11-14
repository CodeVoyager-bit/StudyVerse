/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set on the project.
 * With no secret configured (local dev, or before you add it) the job is allowed: it only reads row counts.
 * @param {string | null} authHeader
 * @param {string | undefined} secret
 */
export function cronAuthorized(authHeader, secret) {
  if (!secret) return true
  return authHeader === `Bearer ${secret}`
}
