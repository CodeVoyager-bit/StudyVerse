// Calendar export (RFC 5545) for exams, with a reminder the day before.
const pad = (n) => String(n).padStart(2, '0')
const stamp = (d) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1')
// Lines longer than 75 characters are folded with a leading space, as the format requires.
const fold = (line) => line.match(/.{1,74}/g).join('\r\n ')

/**
 * @param {{ id: string, title: string, exam_at: string, location?: string | null }[]} exams
 * @param {Date} [now]
 */
export function examsToIcs(exams, now = new Date()) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//StudyVerse//Exams//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']
  for (const e of exams) {
    const start = new Date(e.exam_at)
    const end = new Date(start.getTime() + 2 * 3_600_000)
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.id}@studyverse`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(e.title)}`,
      ...(e.location ? [`LOCATION:${esc(e.location)}`] : []),
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${esc(e.title)} is tomorrow`, 'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}
