import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRoxyStartHint, quoteShell } from '../src/commands/lifecycle.js'

test('quoteShell keeps simple tokens unchanged', () => {
  assert.equal(quoteShell('http://127.0.0.1:50000'), 'http://127.0.0.1:50000')
  assert.equal(quoteShell('abc-123_DEF'), 'abc-123_DEF')
})

test('quoteShell quotes complex values', () => {
  assert.equal(quoteShell('token with space'), "'token with space'")
})

test('buildRoxyStartHint builds copy-pasteable command', () => {
  assert.equal(
    buildRoxyStartHint('http://127.0.0.1:50000', 'secret-token', 7, 'dir-123'),
    'browsecraft start --type roxy --roxy-api http://127.0.0.1:50000 --roxy-token secret-token --roxy-workspace-id 7 --roxy-window-id dir-123'
  )
})

test('buildRoxyStartHint omits optional fields when missing', () => {
  assert.equal(
    buildRoxyStartHint('http://127.0.0.1:50000', '', null, 'dir-123'),
    'browsecraft start --type roxy --roxy-api http://127.0.0.1:50000 --roxy-window-id dir-123'
  )
})
