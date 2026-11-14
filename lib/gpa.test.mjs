import { test } from 'node:test'
import assert from 'node:assert/strict'
import { gpa } from './gpa.mjs'

test('credit-weighted, not a plain average of grades', () => {
  assert.equal(gpa([{ credits: 4, grade: 'O' }, { credits: 1, grade: 'F' }]), 8) // (4*10 + 1*0) / 5
})

test('blank rows ignored; empty input is null', () => {
  assert.equal(gpa([{ credits: '', grade: '' }, { credits: '3', grade: 'A' }]), 8.5)
  assert.equal(gpa([]), null)
})

test('4.0 scale uses its own table and ignores grades from the other scale', () => {
  assert.equal(gpa([{ credits: 3, grade: 'A' }, { credits: 1, grade: 'B' }], '4'), 3.75) // (12 + 3) / 4
  assert.equal(gpa([{ credits: 3, grade: 'O' }], '4'), null)
})
