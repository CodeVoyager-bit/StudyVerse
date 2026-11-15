import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isPushEndpoint, reminderText } from './push.mjs'

test('only real push services are accepted', () => {
  assert.ok(isPushEndpoint('https://fcm.googleapis.com/fcm/send/abc'))
  assert.ok(isPushEndpoint('https://web.push.apple.com/QK'))
  assert.ok(isPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/x'))
  assert.ok(!isPushEndpoint('http://fcm.googleapis.com/x'))
  assert.ok(!isPushEndpoint('https://169.254.169.254/latest'))
  assert.ok(!isPushEndpoint('https://evilpush.apple.com.attacker.io/x'))
  assert.ok(!isPushEndpoint('https://notpush.apple.com/x'))
  assert.ok(!isPushEndpoint('nope'))
})

test('reminder text', () => {
  assert.equal(reminderText({ dueTasks: 0, exams: [], cardsDue: 0 }), null)
  assert.deepEqual(reminderText({ dueTasks: 2, exams: [{ title: 'DBMS', days: 1 }], cardsDue: 1 }), {
    title: 'Exam coming up',
    body: 'DBMS tomorrow · 2 tasks due today · 1 flashcard to review',
    url: '/exams',
  })
  assert.equal(reminderText({ dueTasks: 1, exams: [], cardsDue: 0 }).url, '/task')
})
