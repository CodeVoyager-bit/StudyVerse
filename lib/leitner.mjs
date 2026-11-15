/**
 * Leitner-box spaced review. A right answer moves the card up a box and pushes the next review further out;
 * a wrong answer sends it back to box 1, due again in ten minutes.
 * Box intervals: 10 min, 1 day, 3 days, 7 days, 14 days, 30 days.
 */
export const BOX_MINUTES = [10, 1440, 4320, 10080, 20160, 43200]

/**
 * @param {number} box current box, 1-6
 * @param {boolean} correct
 * @param {Date} [now]
 */
export function review(box, correct, now = new Date()) {
  const next = correct ? Math.min(Math.max(box, 1) + 1, 6) : 1
  return { box: next, due_at: new Date(now.getTime() + BOX_MINUTES[next - 1] * 60_000).toISOString() }
}
