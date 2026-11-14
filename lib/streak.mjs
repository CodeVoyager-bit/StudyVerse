const day = (d) => d.toISOString().slice(0, 10)

/**
 * Consecutive days (UTC) with at least one entry, counted back from today.
 * A missing entry for today doesn't break the streak yet; a missing yesterday does.
 * @param {string[]} isoDates
 * @param {Date} [today]
 * @returns {number}
 */
export function streakDays(isoDates, today = new Date()) {
  const days = new Set(isoDates.map((d) => d.slice(0, 10)))
  const cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  if (!days.has(day(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1)
  let count = 0
  while (days.has(day(cursor))) {
    count++
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return count
}
