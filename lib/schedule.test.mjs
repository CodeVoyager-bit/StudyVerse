import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nextSession } from './schedule.mjs'

const now = Date.parse('2026-11-20T12:00:00Z')

test('future one-off stays as is', () => {
  assert.equal(nextSession('2026-11-21T14:00:00Z', false, now), '2026-11-21T14:00:00.000Z')
})
test('session that started an hour ago is still current', () => {
  assert.equal(nextSession('2026-11-20T11:00:00Z', false, now), '2026-11-20T11:00:00.000Z')
})
test('old one-off is gone', () => {
  assert.equal(nextSession('2026-11-10T14:00:00Z', false, now), null)
})
test('weekly rolls forward to the next week', () => {
  assert.equal(nextSession('2026-11-03T14:00:00Z', true, now), '2026-11-24T14:00:00.000Z')
  assert.equal(nextSession('2026-11-13T11:00:00Z', true, now), '2026-11-20T11:00:00.000Z')
})
test('nothing set', () => {
  assert.equal(nextSession(null, true, now), null)
})
