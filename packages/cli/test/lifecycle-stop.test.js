import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { saveState, loadState } from '../src/state.js'
import { stop, resolveRoxyStopConfig } from '../src/commands/lifecycle.js'

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
