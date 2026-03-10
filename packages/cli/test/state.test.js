import test from 'node:test'
import assert from 'node:assert/strict'
import { getStatePath } from '../src/state.js'

test('getStatePath defaults to state.json', () => {
  delete process.env.BROWSECRAFT_SESSION
  assert.match(getStatePath(false), /state\.json$/)
  assert.match(getStatePath(true), /state\.json$/)
})

test('getStatePath uses session suffix', () => {
  process.env.BROWSECRAFT_SESSION = 'sales-team'
  assert.match(getStatePath(false), /state-sales-team\.json$/)
  assert.match(getStatePath(true), /state-sales-team\.json$/)
  delete process.env.BROWSECRAFT_SESSION
})
