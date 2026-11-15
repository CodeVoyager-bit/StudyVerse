import { test } from 'node:test'
import assert from 'node:assert/strict'
import { review } from './leitner.mjs'

const now = new Date('2026-11-15T10:00:00Z')

test('right answers climb boxes and push reviews out', () => {
  assert.deepEqual(review(1, true, now), { box: 2, due_at: '2026-11-16T10:00:00.000Z' })
  assert.deepEqual(review(5, true, now), { box: 6, due_at: '2026-12-15T10:00:00.000Z' })
  assert.equal(review(6, true, now).box, 6)
})

test('a wrong answer goes back to box 1, due in ten minutes', () => {
  assert.deepEqual(review(4, false, now), { box: 1, due_at: '2026-11-15T10:10:00.000Z' })
})
