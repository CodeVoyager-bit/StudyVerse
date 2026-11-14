import { test } from 'node:test'
import assert from 'node:assert/strict'
import { streakDays } from './streak.mjs'

const today = new Date('2026-10-01T12:00:00Z')

test('counts consecutive days back from today', () => {
  assert.equal(streakDays(['2026-10-01T08:00:00Z', '2026-09-30T20:00:00Z', '2026-09-29T09:00:00Z'], today), 3)
})

test('today missing keeps the streak; a gap ends it', () => {
  assert.equal(streakDays(['2026-09-30T20:00:00Z', '2026-09-29T09:00:00Z'], today), 2)
  assert.equal(streakDays(['2026-09-30T20:00:00Z', '2026-09-28T09:00:00Z'], today), 1)
  assert.equal(streakDays([], today), 0)
})
