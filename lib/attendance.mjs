/**
 * Attendance for one subject. Cancelled classes don't count either way.
 * canMiss: classes you can still skip and stay at or above the target.
 * mustAttend: classes in a row you need to attend to get back up to the target.
 * @param {{ status: 'present' | 'absent' | 'cancelled' }[]} records
 * @param {number} target percent, e.g. 75
 */
export function attendanceStats(records, target = 75) {
  const present = records.filter((r) => r.status === 'present').length
  const absent = records.filter((r) => r.status === 'absent').length
  const total = present + absent
  const t = Math.min(Math.max(target, 1), 100) / 100
  const percent = total ? (present / total) * 100 : null
  const canMiss = total ? Math.max(0, Math.floor(present / t - total + 1e-9)) : 0
  const mustAttend = t === 1 ? (absent ? Infinity : 0) : Math.max(0, Math.ceil((t * total - present) / (1 - t) - 1e-9))
  return { present, absent, total, percent, canMiss, mustAttend }
}
