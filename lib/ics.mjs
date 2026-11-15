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
 * @param {{ hours?: number, trigger?: string, remind?: (title: string) => string, weekly?: boolean }} [opts]
 *   defaults suit exams (2 hours, reminder a day before); group sessions pass their own
 */
export function examsToIcs(exams, now = new Date(), { hours = 2, trigger = '-P1D', remind = (t) => `${t} is tomorrow`, weekly = false } = {}) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//StudyVerse//Exams//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']
  for (const e of exams) {
    const start = new Date(e.exam_at)
    const end = new Date(start.getTime() + hours * 3_600_000)
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.id}@studyverse`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(e.title)}`,
      ...(e.location ? [`LOCATION:${esc(e.location)}`] : []),
      ...(weekly ? ['RRULE:FREQ=WEEKLY'] : []),
      'BEGIN:VALARM', `TRIGGER:${trigger}`, 'ACTION:DISPLAY', `DESCRIPTION:${esc(remind(e.title))}`, 'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}
