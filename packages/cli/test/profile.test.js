import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { getChromeProfileDir, resolveChromeDataDir, resolveChromeDataDirInfo } from '../src/commands/lifecycle.js'

const fakePath = { join: path.join, resolve: path.resolve }
const fakeOs = { homedir: () => '/tmp/browsecraft-home' }

test('getChromeProfileDir returns null for empty profile', () => {
  assert.equal(getChromeProfileDir('', fakePath, fakeOs), null)
  assert.equal(getChromeProfileDir('   ', fakePath, fakeOs), null)
})

test('getChromeProfileDir normalizes profile names', () => {
  assert.equal(
    getChromeProfileDir('sales-team', fakePath, fakeOs),
    '/tmp/browsecraft-home/.browsecraft/user-data/profile-sales-team'
  )

  assert.equal(
    getChromeProfileDir('lead gen/2026', fakePath, fakeOs),
    '/tmp/browsecraft-home/.browsecraft/user-data/profile-lead_gen_2026'
  )
})

test('resolveChromeDataDir prefers explicit profile dir', () => {
  assert.equal(
    resolveChromeDataDir({ 'profile-dir': './tmp/browser-a', profile: 'sales' }, fakePath, fakeOs),
    path.resolve('./tmp/browser-a')
  )
})

test('resolveChromeDataDir falls back to named profile', () => {
  assert.equal(
    resolveChromeDataDir({ profile: 'sales' }, fakePath, fakeOs),
    '/tmp/browsecraft-home/.browsecraft/user-data/profile-sales'
  )
})

test('resolveChromeDataDirInfo marks named profiles as persistent', () => {
  assert.deepEqual(
    resolveChromeDataDirInfo({ profile: 'sales' }, fakePath, fakeOs, 9555),
    {
      dataDir: '/tmp/browsecraft-home/.browsecraft/user-data/profile-sales',
      transientProfile: false,
    }
  )
})

test('resolveChromeDataDirInfo marks default generated profiles as transient', () => {
  assert.deepEqual(
    resolveChromeDataDirInfo({}, fakePath, fakeOs, 9555),
    {
      dataDir: '/tmp/browsecraft-home/.browsecraft/user-data/profile-9555',
      transientProfile: true,
    }
  )
})
