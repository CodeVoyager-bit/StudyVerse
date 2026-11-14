import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cronAuthorized } from './cron-auth.mjs'

test('with a secret set, only the matching Bearer token passes', () => {
  assert.equal(cronAuthorized('Bearer s3cret', 's3cret'), true)
  assert.equal(cronAuthorized('Bearer wrong', 's3cret'), false)
  assert.equal(cronAuthorized(null, 's3cret'), false)
  assert.equal(cronAuthorized('s3cret', 's3cret'), false)
})

test('with no secret configured, the job is allowed', () => {
  assert.equal(cronAuthorized(null, undefined), true)
})
