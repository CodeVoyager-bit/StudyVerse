import { test } from 'node:test'
import assert from 'node:assert/strict'
import { examsToIcs } from './ics.mjs'

test('one exam becomes one event with a day-before reminder', () => {
  const ics = examsToIcs([{ id: 'e1', title: 'DBMS, mid-sem', exam_at: '2026-12-01T04:30:00Z', location: 'Hall B' }], new Date('2026-11-15T00:00:00Z'))
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/)
  assert.match(ics, /DTSTART:20261201T043000Z\r\n/)
  assert.match(ics, /DTEND:20261201T063000Z\r\n/)
  assert.match(ics, /SUMMARY:DBMS\\, mid-sem\r\n/)
  assert.match(ics, /TRIGGER:-P1D/)
  assert.match(ics, /END:VCALENDAR\r\n$/)
})

test('long lines are folded under 75 characters', () => {
  const ics = examsToIcs([{ id: 'e2', title: 'x'.repeat(120), exam_at: '2026-12-01T04:30:00Z' }])
  for (const line of ics.split('\r\n')) assert.ok(line.length <= 75, line)
})
