import { test } from 'node:test'
import assert from 'node:assert/strict'
import { attendanceStats } from './attendance.mjs'

const rec = (p, a, c = 0) => [
  ...Array(p).fill({ status: 'present' }),
  ...Array(a).fill({ status: 'absent' }),
  ...Array(c).fill({ status: 'cancelled' }),
]

test('exactly on target: nothing to spare, nothing owed', () => {
  assert.deepEqual(attendanceStats(rec(30, 10, 3), 75), { present: 30, absent: 10, total: 40, percent: 75, canMiss: 0, mustAttend: 0 })
})

test('above target: how many more you can miss', () => {
  assert.equal(attendanceStats(rec(30, 5), 75).canMiss, 5) // 30 / 40 = 75%
})

test('below target: how many in a row you must attend', () => {
  const s = attendanceStats(rec(20, 10), 75)
  assert.equal(s.mustAttend, 10) // 30 / 40 = 75%
  assert.equal(s.canMiss, 0)
})

test('no classes yet', () => {
  assert.deepEqual(attendanceStats([], 75), { present: 0, absent: 0, total: 0, percent: null, canMiss: 0, mustAttend: 0 })
})
