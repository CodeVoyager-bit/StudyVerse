import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isCallLink, callLabel } from './call.mjs'

test('accepts real meeting links only', () => {
  assert.ok(isCallLink('https://meet.google.com/abc-defg-hij'))
  assert.ok(isCallLink('https://us02web.zoom.us/j/123?pwd=x'))
  assert.ok(isCallLink('https://meet.jit.si/studyverse-abc'))
  assert.ok(!isCallLink('http://meet.google.com/abc'))
  assert.ok(!isCallLink('https://meet.google.com.evil.io/x'))
  assert.ok(!isCallLink('javascript:alert(1)'))
  assert.ok(!isCallLink('https://meet.google.com/a b'))
})

test('labels', () => {
  assert.equal(callLabel('https://meet.google.com/abc-defg-hij'), 'Join Google Meet')
  assert.equal(callLabel('https://us02web.zoom.us/j/1'), 'Join Zoom')
  assert.equal(callLabel('https://meet.jit.si/x'), 'Join Jitsi call')
})
