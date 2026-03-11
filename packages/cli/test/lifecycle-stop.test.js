import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { saveState, loadState } from '../src/state.js'
import { stop, resolveRoxyStopConfig, terminateManagedProcess, cleanupTransientProfile, inspectProfiles } from '../src/commands/lifecycle.js'

test('resolveRoxyStopConfig prefers state api and window identity', () => {
  process.env.ROXY_API = 'http://127.0.0.1:59999'
  process.env.ROXY_TOKEN = 'env-token'

  const config = resolveRoxyStopConfig({
    roxyApi: 'http://127.0.0.1:50000',
    roxyWorkspaceId: 42,
    roxyWindowId: 'dir-123',
  }, {})

  assert.deepEqual(config, {
    apiBase: 'http://127.0.0.1:50000',
    apiToken: 'env-token',
    workspaceId: 42,
    dirId: 'dir-123',
  })
})

test('stop closes roxy window via api and clears local state', async () => {
  const previousCwd = process.cwd()
  const previousSession = process.env.BROWSECRAFT_SESSION
  const previousFetch = global.fetch
  const previousLog = console.log
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'browsecraft-stop-roxy-'))
  const logs = []
  const requests = []

  process.env.BROWSECRAFT_SESSION = 'stop-roxy-test'
  process.chdir(tempDir)
  console.log = (message) => logs.push(message)
  global.fetch = async (url, options = {}) => {
    requests.push({ url, options })
    return {
      async json() {
        return { code: 0, data: {} }
      },
    }
  }

  try {
    await saveState({
      cdpEndpoint: 'ws://127.0.0.1:9222/devtools/browser/test',
      browserType: 'roxy',
      owner: 'browsecraft',
      roxyApi: 'http://127.0.0.1:50000',
      roxyWorkspaceId: 43629,
      roxyWindowId: 'dir-123',
    }, true)

    await stop([], { local: true })

    assert.equal(requests.length, 1)
    assert.equal(requests[0].url, 'http://127.0.0.1:50000/browser/close')
    assert.equal(requests[0].options.method, 'POST')
    assert.deepEqual(JSON.parse(requests[0].options.body), {
      workspaceId: 43629,
      dirId: 'dir-123',
    })
    assert.equal(await loadState(true), null)
    assert.deepEqual(logs, ['RoxyBrowser window closed (dir-123)'])
  } finally {
    console.log = previousLog
    global.fetch = previousFetch
    process.chdir(previousCwd)
    if (previousSession === undefined) delete process.env.BROWSECRAFT_SESSION
    else process.env.BROWSECRAFT_SESSION = previousSession
    await fs.rm(tempDir, { recursive: true, force: true })
  }
})

test('terminateManagedProcess sends SIGTERM then exits when process disappears', async () => {
  const calls = []
  let probeCount = 0

  const killFn = (pid, signal) => {
    calls.push([pid, signal])

    if (signal === 0) {
      probeCount += 1
      if (probeCount >= 2) {
        const error = new Error('no such process')
        error.code = 'ESRCH'
        throw error
      }
    }
  }

  await terminateManagedProcess(12345, killFn)

  assert.deepEqual(calls, [
    [12345, 'SIGTERM'],
    [12345, 0],
    [12345, 0],
  ])
})

test('terminateManagedProcess escalates to SIGKILL when process stays alive', async () => {
  const calls = []

  const killFn = (pid, signal) => {
    calls.push([pid, signal])
  }

  await terminateManagedProcess(222, killFn)

  assert.equal(calls[0][1], 'SIGTERM')
  assert.equal(calls.at(-1)[1], 'SIGKILL')
  assert.equal(calls.filter(([, signal]) => signal === 0).length, 12)
})

test('cleanupTransientProfile removes only transient directories', async () => {
  const removed = []

  await cleanupTransientProfile({
    dataDir: '/tmp/browsecraft-home/.browsecraft/user-data/profile-9555',
    transientProfile: true,
  }, async (target) => removed.push(target))

  await cleanupTransientProfile({
    dataDir: '/tmp/browsecraft-home/.browsecraft/user-data/profile-sales',
    transientProfile: false,
  }, async (target) => removed.push(target))

  assert.deepEqual(removed, ['/tmp/browsecraft-home/.browsecraft/user-data/profile-9555'])
})

test('inspectProfiles separates transient and named profiles', async () => {
  const previousCwd = process.cwd()
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'browsecraft-profiles-'))
  const userDataDir = path.join(tempDir, '.browsecraft', 'user-data')

  try {
    process.chdir(tempDir)
    await fs.mkdir(path.join(userDataDir, 'profile-9222'), { recursive: true })
    await fs.mkdir(path.join(userDataDir, 'profile-sales'), { recursive: true })
    await fs.mkdir(path.join(userDataDir, 'profile-marketing'), { recursive: true })

    const report = await inspectProfiles(true)

    assert.equal(report.total, 3)
    assert.equal(report.transientCount, 1)
    assert.equal(report.namedCount, 2)
  } finally {
    process.chdir(previousCwd)
    await fs.rm(tempDir, { recursive: true, force: true })
  }
})
